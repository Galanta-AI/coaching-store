/**
 * Safe wrapper around setup-stripe-webhook.ts for LIVE Stripe.
 *
 * Loads .env.live (gitignored), refuses non-live keys, and defaults
 * STRIPE_WEBHOOK_URL to https://${productionDomain}/api/stripe/webhook from
 * src/config/site.ts.
 *
 * Usage:
 *   1) Ensure .env.live contains STRIPE_SECRET_KEY=sk_live_… (or rk_live_…)
 *   2) npm run setup:stripe:webhook:live
 *
 * Override the URL only if you know what you're doing:
 *   STRIPE_WEBHOOK_URL=https://custom-domain/api/stripe/webhook \
 *     npm run setup:stripe:webhook:live
 */

import { config } from "dotenv";
import path from "node:path";
import { SITE } from "../src/config/site";

const envLivePath = path.resolve(process.cwd(), ".env.live");
const result = config({ path: envLivePath });

if (result.error) {
  console.error(
    `Could not load .env.live at ${envLivePath}.\n` +
      `Create it with a single line:\n` +
      `  STRIPE_SECRET_KEY=sk_live_…    (or rk_live_…)\n`
  );
  process.exit(1);
}

const key = process.env.STRIPE_SECRET_KEY;
if (!key || !/^(sk|rk)_live_/.test(key)) {
  console.error(
    "Refusing to run: .env.live must contain a Stripe LIVE key ((sk|rk)_live_…).\n" +
      "For sandbox runs use `npm run setup:stripe:webhook` (with STRIPE_WEBHOOK_URL set)."
  );
  process.exit(1);
}

if (!process.env.STRIPE_WEBHOOK_URL) {
  process.env.STRIPE_WEBHOOK_URL = `https://${SITE.productionDomain}/api/stripe/webhook`;
}

void import("./setup-stripe-webhook");
