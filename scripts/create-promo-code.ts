/**
 * Stripe promo code minter.
 *
 * Mints ad-hoc Stripe promotion codes scoped to one or more products. Covers:
 *   - Single-recipient gifts        (--max-redemptions 1, the default)
 *   - Campaign drops                (--max-redemptions N for N > 1)
 *   - Single-product scoping        (--product <id>)
 *   - Multi-product codes           (--product <id> --product <id2>)
 *   - Snapshotted "all-of-catalog"  (--product all, with a printed warning that
 *                                    the coupon is pinned to today's catalog)
 *
 * --- USAGE ------------------------------------------------------------------
 *
 *   npm run promo -- --percent 100 --product <id> --note "Sarah at Acme"
 *
 *   See create-promo-code-live.ts for the live wrapper.
 *
 * --- WHAT IT CREATES --------------------------------------------------------
 *
 *   For each unique (percent, sorted-product-set) it ensures a single
 *   product-scoped coupon exists (idempotent), e.g.:
 *
 *     ${siteSlug}_promo_100_intro
 *     ${siteSlug}_promo_50_intro-advanced
 *
 *   Then mints a fresh promotion code with a random 8-char string pointing to
 *   the chosen coupon. Coupon is reused across promo codes sharing the same
 *   (percent, product-set); each promo code has its own max_redemptions/expiry.
 */

import Stripe from "stripe";
import { config } from "dotenv";
import { parseArgs } from "node:util";
import { randomInt } from "node:crypto";
import { SITE } from "../src/config/site";

config({ path: ".env.local" });

const USAGE = `
Usage:
  npm run promo      -- --percent <50|100> --product <id> [--product <id>...] \\
                        [--max-redemptions <N>] [--note "<text>"] [--expires-days <N>]
  npm run promo:live -- --percent <50|100> --product <id> [--product <id>...] \\
                        [--max-redemptions <N>] [--note "<text>"] [--expires-days <N>]

Required:
  --percent           Discount percent. Must be exactly 50 or 100.
  --product           Session id (matches src/config/sessions.ts) or the special
                      token "all". Repeatable. "all" expands to every currently-
                      active product at mint time with a printed snapshot
                      warning. Cannot combine "all" with explicit ids.

Optional:
  --max-redemptions   Integer 1-10000. Default 1 (single-use gift).
  --note              Free-text label stored in promo code metadata.
                      Max 500 chars (Stripe metadata value limit).
  --expires-days      Integer >= 1. Code expires N x 24h from creation (UTC).
                      Default: no expiry.
`.trim();

function die(message: string): never {
  console.error(`\n${message}\n\n${USAGE}\n`);
  process.exit(1);
}

let parsed;
try {
  parsed = parseArgs({
    options: {
      percent: { type: "string" },
      product: { type: "string", multiple: true },
      "max-redemptions": { type: "string" },
      note: { type: "string" },
      "expires-days": { type: "string" },
    },
    strict: true,
  });
} catch (err) {
  die(err instanceof Error ? err.message : "Failed to parse arguments.");
}

const percentRaw = parsed.values.percent;
if (percentRaw !== "50" && percentRaw !== "100") {
  die("--percent is required and must be exactly 50 or 100.");
}
const percent = Number(percentRaw) as 50 | 100;

const productRaw = parsed.values.product as string[] | undefined;
if (!productRaw || productRaw.length === 0) {
  die("--product is required (at least one). Pass --product <id> or --product all.");
}
const productKeysRequested = Array.from(new Set(productRaw));
const usedAllExpansion = productKeysRequested.includes("all");
if (usedAllExpansion && productKeysRequested.length > 1) {
  die('Cannot combine "all" with explicit product ids.');
}

let maxRedemptions = 1;
const maxRedemptionsRaw = parsed.values["max-redemptions"];
if (maxRedemptionsRaw !== undefined) {
  if (!/^\d+$/.test(maxRedemptionsRaw)) die("--max-redemptions must be a positive integer.");
  const n = Number(maxRedemptionsRaw);
  if (n < 1 || n > 10000) die("--max-redemptions must be between 1 and 10000.");
  maxRedemptions = n;
}

let expiresAt: number | undefined;
let expiresDays: number | undefined;
const expiresDaysRaw = parsed.values["expires-days"];
if (expiresDaysRaw !== undefined) {
  if (!/^\d+$/.test(expiresDaysRaw)) die("--expires-days must be a positive integer.");
  const days = Number(expiresDaysRaw);
  if (days < 1) die("--expires-days must be >= 1.");
  expiresAt = Math.floor(Date.now() / 1000) + days * 86400;
  expiresDays = days;
}

const note = parsed.values.note ?? "";
if (note.length > 500) die("--note must be <= 500 characters (Stripe metadata value limit).");

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error("Missing STRIPE_SECRET_KEY. Add it to .env.local at the repo root.");
  process.exit(1);
}

const mode = /^(sk|rk)_live_/.test(secretKey)
  ? "LIVE"
  : /^(sk|rk)_test_/.test(secretKey)
  ? "SANDBOX"
  : "UNKNOWN";

if (mode === "UNKNOWN") {
  console.error("STRIPE_SECRET_KEY prefix is neither (sk|rk)_test_ nor (sk|rk)_live_; refusing to run.");
  process.exit(1);
}

const stripe = new Stripe(secretKey);

const HARD_CAP = 100;

type CatalogEntry = { key: string; id: string; name: string };

async function loadCatalog(): Promise<Map<string, CatalogEntry>> {
  // Stripe's search wildcard doesn't match metadata field existence, so list
  // active products and filter client-side. For our catalog size (<100) this
  // is a single page.
  const allActive = await stripe.products
    .list({ active: true, limit: 100 })
    .autoPagingToArray({ limit: HARD_CAP });

  const products = allActive.filter(
    (p) => p.metadata.site_slug === SITE.siteSlug && p.metadata.session_key,
  );

  if (products.length === 0) {
    console.error(
      `No active products with metadata.site_slug='${SITE.siteSlug}' found.\n` +
        "Run `npm run setup:stripe` first to create the catalog.",
    );
    process.exit(1);
  }
  if (allActive.length >= HARD_CAP) {
    console.error(
      `Refusing to proceed: found >=${HARD_CAP} active products. Verify catalog state ` +
        `and raise HARD_CAP in create-promo-code.ts if intentional.`,
    );
    process.exit(1);
  }

  const map = new Map<string, CatalogEntry>();
  for (const p of products) {
    const key = p.metadata.session_key;
    if (!key) continue;
    if (map.has(key)) {
      console.error(`Catalog bug: multiple active products share session_key="${key}": ${map.get(key)!.id}, ${p.id}`);
      process.exit(1);
    }
    map.set(key, { key, id: p.id, name: p.name });
  }
  return map;
}

function couponIdFor(percent: 50 | 100, products: CatalogEntry[]): string {
  const keys = products.map((p) => p.key).slice().sort().join("-");
  return `${SITE.siteSlug}_promo_${percent}_${keys}`;
}

async function ensureProductCoupon(
  percent: 50 | 100,
  products: CatalogEntry[],
  couponId: string,
): Promise<void> {
  // Retrieve path with integrity check: defends against archived-and-replaced
  // products, manual dashboard edits, or environment drift that would leave
  // applies_to pointing at stale product IDs.
  try {
    const existing = await stripe.coupons.retrieve(couponId, { expand: ["applies_to"] });
    const existingIds = (existing.applies_to?.products ?? []).slice().sort();
    const expectedIds = products.map((p) => p.id).slice().sort();
    const mismatch =
      existingIds.length !== expectedIds.length ||
      existingIds.some((id, i) => id !== expectedIds[i]);
    if (mismatch) {
      console.error(
        `Coupon ${couponId} exists but applies_to does not match current products.\n` +
          `  Existing: ${existingIds.join(", ") || "(none)"}\n` +
          `  Expected: ${expectedIds.join(", ")}\n` +
          `Likely cause: a product was archived and replaced with a new ID. ` +
          `Rotate by appending _v2 to couponIdFor() for this run, then re-issue codes.`,
      );
      process.exit(1);
    }
    return;
  } catch (err: unknown) {
    if (!(err instanceof Stripe.errors.StripeInvalidRequestError) || err.code !== "resource_missing") {
      throw err;
    }
  }

  // Stripe caps coupon name at 40 chars. Fall back to count-only label for
  // large product sets. The dashboard name is cosmetic — coupon id + metadata
  // are authoritative.
  const keysJoined = products.map((p) => p.key).slice().sort().join(", ");
  const fullName = `${percent}% off (${keysJoined})`;
  const name = fullName.length <= 40 ? fullName : `${percent}% off (${products.length} products)`;

  await stripe.coupons.create({
    id: couponId,
    name,
    percent_off: percent,
    duration: "once",
    applies_to: { products: products.map((p) => p.id) },
    metadata: {
      site_slug: SITE.siteSlug,
      product_keys: keysJoined.replace(/, /g, ","),
    },
  });
  console.log(`  + coupon created — ${couponId}`);
}

// Uppercase alphanumeric minus ambiguous 0,O,1,I. 32^8 ≈ 1.1e12 — collisions negligible.
const CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) code += CODE_CHARSET[randomInt(0, CODE_CHARSET.length)];
  return code;
}

async function createPromoCodeWithRetry(couponId: string): Promise<Stripe.PromotionCode> {
  const MAX_ATTEMPTS = 3;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const code = generateCode();
    try {
      return await stripe.promotionCodes.create({
        promotion: { type: "coupon", coupon: couponId },
        code,
        max_redemptions: maxRedemptions,
        expires_at: expiresAt,
        metadata: {
          kind: "promo",
          note,
          site_slug: SITE.siteSlug,
          created_by: process.env.USER ?? "unknown",
        },
      });
    } catch (err: unknown) {
      lastErr = err;
      const isCollision =
        err instanceof Stripe.errors.StripeInvalidRequestError && err.code === "code_already_exists";
      if (!isCollision) throw err;
    }
  }
  console.error(`\nFailed to create promo code after ${MAX_ATTEMPTS} collision retries.`);
  console.error(lastErr);
  process.exit(1);
}

async function main(): Promise<void> {
  console.log(`\n${SITE.siteName} — promo code minter`);
  console.log(`Mode: ${mode}\n`);

  if (mode === "LIVE") {
    console.warn("⚠  Running against LIVE Stripe. Press Ctrl+C in the next 5 seconds to abort.\n");
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  const catalog = await loadCatalog();

  let products: CatalogEntry[];
  if (usedAllExpansion) {
    products = Array.from(catalog.values()).sort((a, b) => a.key.localeCompare(b.key));
  } else {
    products = [];
    for (const key of productKeysRequested) {
      const entry = catalog.get(key);
      if (!entry) {
        const available = Array.from(catalog.keys()).sort().join(", ");
        die(`Unknown product id "${key}". Available: ${available}.`);
      }
      products.push(entry);
    }
    products.sort((a, b) => a.key.localeCompare(b.key));
  }

  const couponId = couponIdFor(percent, products);
  await ensureProductCoupon(percent, products, couponId);

  if (usedAllExpansion) {
    console.log(`\n⚠  Note: coupon ${couponId} is pinned to product IDs:`);
    for (const p of products) console.log(`     ${p.id} (${p.name})`);
    console.log(
      `   New products added later will NOT be eligible. To cover a newly-added\n` +
        `   product, mint a fresh code with --product <new_id> or rotate the coupon\n` +
        `   ID to _v2 in couponIdFor() and re-issue.`,
    );
  }

  const promo = await createPromoCodeWithRetry(couponId);

  const usageLabel = maxRedemptions === 1 ? "single use" : `up to ${maxRedemptions} uses`;
  const expiresLabel = expiresDays
    ? `expires in ${expiresDays} ${expiresDays === 1 ? "day" : "days"}`
    : "no expiry";
  const redeemUrl =
    mode === "LIVE"
      ? `https://${SITE.productionDomain}/coaching`
      : SITE.stagingDomain
        ? `https://${SITE.stagingDomain}/coaching`
        : "your staging URL";

  console.log(`\nPromo code created (${mode}):`);
  console.log(`  ${promo.code} — ${percent}% off, ${usageLabel}, ${expiresLabel}`);
  console.log(`  Applies to: ${products.map((p) => p.name).join(", ")}`);
  if (note) console.log(`  Note: "${note}"`);
  console.log(`  Redeem at: ${redeemUrl}\n`);
}

main().catch((err) => {
  console.error("\nPromo code creation failed:");
  console.error(err);
  process.exit(1);
});
