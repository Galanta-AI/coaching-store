/**
 * Stripe catalog bootstrap — provisions Products and Prices from
 * src/config/sessions.ts. Idempotent: safe to re-run.
 *
 * --- USAGE ------------------------------------------------------------------
 *
 *   # Sandbox: STRIPE_SECRET_KEY=sk_test_… (or rk_test_…) in .env.local, then:
 *   #   npm run setup:stripe
 *   #
 *   # Live: see scripts/setup-stripe-live.ts — loads .env.live (gitignored)
 *   # and refuses non-(sk|rk)_live keys before handing off to this file.
 *
 * --- WHAT IT CREATES --------------------------------------------------------
 *
 *   One Product + one Price per entry in SESSION_TYPES.
 *
 *   Lookup keys: ${siteSlug}_${session.id}  (e.g. coaching-store_intro)
 *   Metadata:    site_slug, session_key (used for safe re-discovery on re-run)
 *
 * --- IDEMPOTENCY ------------------------------------------------------------
 *
 *   Products are looked up by metadata search (site_slug + session_key + active).
 *   Prices are looked up by lookup_key + active.
 *   Re-running creates only what's missing. Archived items are ignored — a
 *   re-run after manual archival creates fresh records rather than un-archiving.
 *
 * --- ROLLING BACK -----------------------------------------------------------
 *
 *   Stripe does not allow deletion of products that have ever been used; archive
 *   them via the dashboard. Archived items are inert and won't be matched here.
 */

import Stripe from "stripe";
import { config } from "dotenv";
import { SESSION_TYPES, priceLookupKey, type SessionType } from "../src/config/sessions";
import { SITE } from "../src/config/site";

config({ path: ".env.local" });

// Add codes here when you want them to stop working. The deactivation pass
// below sets `active: false` on any matching active promotion code. Idempotent:
// no-op on already-inactive or never-existed codes.
const DEPRECATED_PROMO_CODES: readonly string[] = [];

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

async function ensureProduct(session: SessionType): Promise<Stripe.Product> {
  const existing = await stripe.products.search({
    query: `metadata['site_slug']:'${SITE.siteSlug}' AND metadata['session_key']:'${session.id}' AND active:'true'`,
  });

  if (existing.data.length > 0) {
    console.log(`  ✓ product exists  — ${session.name}`);
    return existing.data[0];
  }

  const created = await stripe.products.create({
    name: session.name,
    description: session.body,
    metadata: {
      site_slug: SITE.siteSlug,
      session_key: session.id,
    },
  });

  console.log(`  + product created — ${session.name}`);
  return created;
}

async function ensurePrice(
  stripeProduct: Stripe.Product,
  session: SessionType,
): Promise<Stripe.Price> {
  const lookupKey = priceLookupKey(session.id);
  const amountCents = session.priceUsd * 100;

  const existing = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });

  if (existing.data.length > 0) {
    console.log(`    ✓ price exists    — ${lookupKey} ($${session.priceUsd})`);
    return existing.data[0];
  }

  const price = await stripe.prices.create({
    product: stripeProduct.id,
    currency: "usd",
    unit_amount: amountCents,
    lookup_key: lookupKey,
    nickname: `${session.name} — ${session.durationMinutes} min`,
    metadata: {
      site_slug: SITE.siteSlug,
      session_key: session.id,
      duration_minutes: String(session.durationMinutes),
    },
  });

  console.log(`    + price created   — ${lookupKey} ($${session.priceUsd})`);
  return price;
}

async function deactivateDeprecated(): Promise<void> {
  for (const code of DEPRECATED_PROMO_CODES) {
    // active: true is essential. Promo code strings aren't globally unique
    // across Stripe history — a list without it can return a stale inactive
    // entry while a different active code with the same string is still live.
    const existing = await stripe.promotionCodes.list({ code, active: true, limit: 1 });
    if (existing.data.length > 0) {
      await stripe.promotionCodes.update(existing.data[0].id, { active: false });
      console.log(`  - deactivated     — ${code}`);
    } else {
      console.log(`  ✓ already inactive or never existed — ${code}`);
    }
  }
}

async function main(): Promise<void> {
  console.log(`\n${SITE.siteName} — Stripe catalog bootstrap`);
  console.log(`Mode: ${mode}\n`);

  if (mode === "LIVE") {
    console.warn("⚠  Running against LIVE Stripe. Press Ctrl+C in the next 5 seconds to abort.\n");
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  if (DEPRECATED_PROMO_CODES.length > 0) {
    console.log(`Deprecated promo codes:`);
    await deactivateDeprecated();
    console.log("");
  }

  console.log(`Products and prices:`);
  for (const session of SESSION_TYPES) {
    const product = await ensureProduct(session);
    await ensurePrice(product, session);
  }

  console.log(`\nDone. Lookup keys (referenced by src/app/api/checkout/route.ts):`);
  for (const session of SESSION_TYPES) {
    console.log(`  ${priceLookupKey(session.id)}  →  $${session.priceUsd} / ${session.durationMinutes} min  (${session.name})`);
  }
  console.log("");
}

main().catch((err) => {
  console.error("\nSetup failed:");
  console.error(err);
  process.exit(1);
});
