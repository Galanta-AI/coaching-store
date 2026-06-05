# Security

A coaching store is a low-volume, high-trust commerce surface: a few dozen
checkouts a month, a real human running the business, customers paying with
their personal cards. This template's security posture matches that profile.

## Hard guarantees

- **Zero card data on the site.** Stripe Checkout is hosted by Stripe. Cards are
  entered on Stripe's domain, never ours. The site stays in PCI Level 3 scope
  by design.
- **Signed webhooks.** Every Stripe webhook is verified via raw-body HMAC
  (`Stripe.webhooks.constructEvent`). Forged events are rejected with HTTP 400.
- **Idempotent side effects.** The post-checkout confirmation email is keyed
  by Stripe `event.id`, so duplicate webhook deliveries collapse into one send.
- **Kill switch.** Set `STRIPE_DISABLED=true` and the checkout endpoint and
  webhook handler both return 503; Stripe holds and retries events (~3-day
  window) until you toggle it back off.
- **Secrets never enter the chat.** The `/setup` flow has Claude print the
  exact env line for the developer to paste into `.env.local` themselves;
  Claude verifies presence and prefix shape with a small `node -e` script
  without ever seeing the value. Production secrets go through
  `firebase apphosting:secrets:set` in the developer's own terminal —
  stored encrypted in Google Cloud Secret Manager, referenced from
  `apphosting.yaml`, never in chat or in the repo.
- **`.env.live` isolation.** Live Stripe keys live in `.env.live` (gitignored,
  separate from `.env.local`). Setup scripts that mutate live data refuse to
  run if the loaded key isn't `(sk|rk)_live_`, and pause 5 seconds before any
  mutation so a misclick can be aborted.
- **Security headers.** HSTS (1 year), X-Frame-Options DENY, X-Content-Type-Options
  nosniff, Permissions-Policy disabling camera/mic/geolocation,
  Content-Security-Policy with `frame-ancestors 'none'`. CSP allowlist for
  PostHog/Turnstile is opt-in via `src/config/site.ts`.
- **Input validation.** Every API route validates its body with zod before
  doing any work. Invalid input returns 400.
- **Origin whitelist.** API routes reject POST requests from unknown origins.
  The whitelist is derived from `SITE.productionDomain` and `SITE.stagingDomain`.
- **CI gates.** Every pull request runs gitleaks (secret scan),
  `npm audit --audit-level=high`, lint, type-check, and dead-code scan (knip)
  before merge.

## Best-effort, not a hard limit

- **Rate limiting.** `src/lib/ratelimit.ts` implements an in-memory per-IP
  limiter applied to `/api/checkout` and `/api/contact`. On serverless this is
  best-effort: it doesn't survive cold starts and doesn't coordinate across
  concurrently-scaled function instances. It reduces noise from misbehaving
  clients but **is not a hard security control**, and we do not market it as
  one. Upgrade path: swap the `Map` for Upstash Redis or Firestore via
  `@upstash/ratelimit` — the call site (`limiter.hit(key)`) stays the same.

## What this template explicitly does NOT do

- No card data handling, ever. Use Stripe-hosted Checkout. Do not switch to
  Payment Element without re-evaluating PCI scope.
- No login/session/auth. The flow is stateless: paid customers receive their
  Cal.com link via email, gated by a single-use Cal.com private link.
- No user-uploaded file handling. Out of scope.

## Responsible disclosure

Found a security issue? Email the address set as `SITE.disclosureEmail` in
`src/config/site.ts`. We aim to acknowledge within two business days.

Please give a reasonable window to investigate and patch before public
disclosure. Coordinated disclosure is appreciated.

## Operational runbook

- **Suspected fraudulent activity**: set `STRIPE_DISABLED=true` via
  `firebase apphosting:secrets:set STRIPE_DISABLED`, push to redeploy.
  Checkout and webhook return 503; Stripe holds events. Investigate, then
  unset and redeploy.
- **Signing secret rotation**: delete the webhook endpoint in the Stripe
  dashboard, re-run `npm run setup:stripe:webhook` (or `:live`), capture the
  new secret printed by the script, run
  `firebase apphosting:secrets:set STRIPE_WEBHOOK_SECRET` to update the
  Secret Manager value, push to redeploy.
- **Stripe key rotation**: rotate in the Stripe dashboard, run
  `firebase apphosting:secrets:set STRIPE_SECRET_KEY` to update the Secret
  Manager value, push to redeploy. Local dev: update `.env.local`.
