/**
 * Stripe webhook endpoint bootstrap.
 *
 * Idempotent: lists existing webhook endpoints, matches on normalized URL, and
 * either confirms-or-creates exactly one endpoint subscribed to
 * `checkout.session.completed`.
 *
 * Stripe returns the signing secret ONLY on the create response — there is no
 * way to retrieve it later. This script prints the secret + the exact `vercel
 * env add` command to inject it into production. Capture it from the output;
 * rerunning will not re-yield it.
 *
 * --- USAGE ------------------------------------------------------------------
 *
 *   # For local development, the simplest path is the Stripe CLI:
 *   #   stripe listen --forward-to localhost:3000/api/stripe/webhook
 *   # Copy the printed whsec_… into .env.local as STRIPE_WEBHOOK_SECRET.
 *   #
 *   # For production / staging hosted webhooks, use this script:
 *   STRIPE_WEBHOOK_URL=https://your-domain.com/api/stripe/webhook \
 *     npm run setup:stripe:webhook
 *   #
 *   # Live wrapper (defaults the URL from src/config/site.ts):
 *   npm run setup:stripe:webhook:live
 *   #
 *   # If the existing endpoint has the wrong event set, rerun with
 *   # --update-events to fix in place (preserves the existing signing secret):
 *   ... --update-events
 */

import Stripe from "stripe";
import { config } from "dotenv";
import { SITE } from "../src/config/site";

config({ path: ".env.local" });

const EXPECTED_EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  "checkout.session.completed",
];
const WEBHOOK_DESCRIPTION = `${SITE.siteName} checkout completions`;

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error("Missing STRIPE_SECRET_KEY. Add it to .env.local (or use the live wrapper).");
  process.exit(1);
}

const webhookUrl = process.env.STRIPE_WEBHOOK_URL;
if (!webhookUrl) {
  console.error(
    "Missing STRIPE_WEBHOOK_URL. Set the full https URL of the webhook receiver, e.g.:\n" +
      `  STRIPE_WEBHOOK_URL=https://${SITE.stagingDomain ?? SITE.productionDomain}/api/stripe/webhook`
  );
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

const vercelEnvTarget = mode === "LIVE" ? "production" : "preview";
const updateEvents = process.argv.includes("--update-events");
const stripe = new Stripe(secretKey);

function normalizeUrl(url: string): string {
  return url.toLowerCase().replace(/\/+$/, "");
}

function sameEventSet(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((v, i) => v === sortedB[i]);
}

async function main(): Promise<void> {
  console.log(`\n${SITE.siteName} — Stripe webhook bootstrap`);
  console.log(`Mode: ${mode}`);
  console.log(`Target URL: ${webhookUrl}\n`);

  if (mode === "LIVE") {
    console.warn("⚠  Running against LIVE Stripe. Press Ctrl+C in the next 5 seconds to abort.\n");
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  const targetNormalized = normalizeUrl(webhookUrl!);
  const existing = await stripe.webhookEndpoints.list({ limit: 100 });
  const match = existing.data.find((ep) => normalizeUrl(ep.url) === targetNormalized);

  if (match) {
    if (sameEventSet(match.enabled_events, EXPECTED_EVENTS)) {
      console.log(`  ✓ webhook exists — ${match.id}`);
      console.log(`    URL: ${match.url}`);
      console.log(`    Events: ${match.enabled_events.join(", ")}`);
      console.log(
        `\nNothing to do. (Stripe does not allow re-retrieving the signing secret;\n` +
          `if you need to rotate it, delete the endpoint in the Stripe dashboard and rerun.)\n`
      );
      return;
    }

    console.log(`  ! webhook exists but events mismatch — ${match.id}`);
    console.log(`    Current events: ${match.enabled_events.join(", ") || "(none)"}`);
    console.log(`    Expected events: ${EXPECTED_EVENTS.join(", ")}`);

    if (!updateEvents) {
      console.error(
        `\nRefusing to update without confirmation. Either:\n` +
          `  • Rerun with --update-events to call stripe.webhookEndpoints.update\n` +
          `    (preserves the existing signing secret; no env var change needed)\n` +
          `  • Or delete the endpoint in the Stripe dashboard and rerun this script\n` +
          `    (creates a new endpoint with a new secret; requires env var update)\n`
      );
      process.exit(1);
    }

    const updated = await stripe.webhookEndpoints.update(match.id, {
      enabled_events: EXPECTED_EVENTS,
    });
    console.log(`  + events updated — ${updated.enabled_events.join(", ")}`);
    console.log(`\nSigning secret unchanged; no env var update needed.\n`);
    return;
  }

  const created = await stripe.webhookEndpoints.create({
    url: webhookUrl!,
    enabled_events: EXPECTED_EVENTS,
    description: WEBHOOK_DESCRIPTION,
  });

  console.log(`  + webhook created — ${created.id}`);
  console.log(`    URL: ${created.url}`);
  console.log(`    Events: ${created.enabled_events.join(", ")}`);
  console.log(`    Signing secret: ${created.secret}`);
  console.log(
    `\nNext steps:\n\n` +
      `  1) Add the signing secret to Vercel (you will be prompted to paste; ` +
      `the value never leaves your terminal):\n` +
      `       vercel env add STRIPE_WEBHOOK_SECRET ${vercelEnvTarget}\n\n` +
      `  2) Trigger a redeploy so the new env var takes effect:\n` +
      `       vercel deploy${mode === "LIVE" ? " --prod" : ""}\n`
  );
}

main().catch((err) => {
  console.error("\nWebhook setup failed:");
  console.error(err);
  process.exit(1);
});
