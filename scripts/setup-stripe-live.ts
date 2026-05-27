/**
 * Safe wrapper around setup-stripe.ts that loads STRIPE_SECRET_KEY from a
 * gitignored .env.live file at the repo root, not .env.local.
 *
 * Why: rotating .env.local between sandbox and live keys is unsafe — one
 * forgotten "restore" step means local dev hits live Stripe. This wrapper
 * keeps .env.local pinned to sandbox and isolates the live key in its own
 * file that's only read when this script is invoked explicitly.
 *
 * Usage:
 *   1) Create .env.live at the repo root with a single line:
 *        STRIPE_SECRET_KEY=sk_live_…    (or rk_live_…)
 *   2) Run:
 *        npm run setup:stripe:live
 */

import { config } from "dotenv";
import path from "node:path";

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
      "For sandbox/test runs use `npm run setup:stripe` instead."
  );
  process.exit(1);
}

void import("./setup-stripe");
