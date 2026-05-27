import Stripe from "stripe";

/**
 * Soft kill switch. Set STRIPE_DISABLED=true via `vercel env add` (or in
 * .env.local for local dev) to make checkout return 503 instead of hitting
 * Stripe; the webhook handler short-circuits with 503 as well so Stripe
 * holds and retries events (~3-day window).
 */
export class StripeDisabledError extends Error {
  constructor(message = "Payments are temporarily unavailable.") {
    super(message);
    this.name = "StripeDisabledError";
  }
}

/**
 * Server-only. Never import from a client component — this pulls in the
 * Stripe Node SDK and reads the secret key.
 */
export function getStripe(): Stripe {
  if (process.env.STRIPE_DISABLED === "true") {
    throw new StripeDisabledError();
  }
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}
