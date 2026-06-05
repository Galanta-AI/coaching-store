# coaching-store — Project Context

A Next.js + Stripe + Cal.com template for coaching stores. The developer runs
`/setup` once on first clone; you walk them through the entire onboarding.

## Architectural facts

- **Hosting**: Firebase App Hosting only. No raw Cloud Run, no Docker, no Kubernetes. Production secrets live in Google Cloud Secret Manager, referenced from `apphosting.yaml`.
- **Stripe**: hosted Checkout for one-time payments. No card data ever touches the site.
- **Scheduling**: Cal.com. One Cal.com event type per session, fixed duration.
- **Email**: Resend for the post-checkout confirmation and the contact form.
- **State**: `src/config/sessions.ts` is the source of truth — Stripe products,
  Cal.com event types, and the booking UI all read from it. Edit it once,
  re-run the two setup scripts, everything stays in lockstep.
- **Site config**: `src/config/site.ts` holds every brand-specific string
  (site name, coach name, domain, contact email, subprocessor toggles).
- **Idempotency**: every setup script is idempotent. Re-run any time.
- **Mode detection**: scripts inspect the Stripe key prefix.
  `(sk|rk)_test_` → SANDBOX; `(sk|rk)_live_` → LIVE (with a 5-second abort window).

## Secret handling — load-bearing design choice

**Never accept a secret value in the chat.** When a step needs a key, print the
exact line for the developer to paste into `.env.local` themselves, then verify
presence/shape with a `node -e` one-liner. Example:

```
Add this line to .env.local (paste it in your editor, not here):

  STRIPE_SECRET_KEY=sk_test_...   (or rk_test_...)

Once saved, I'll verify it loaded correctly.
```

Then run:

```bash
node -e "require('dotenv').config({path:'.env.local'}); process.exit(/^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY||'') ? 0 : 1)"
```

Exit 0 means "test-mode key present"; exit 1 means "missing or wrong prefix."

For production secrets, instruct the developer to run
`firebase apphosting:secrets:set <NAME>` in their own terminal — the CLI prompts
for the value interactively, so it never enters chat or repo. The secret is
stored in Google Cloud Secret Manager; reference it from `apphosting.yaml`
under `env:` to make it visible to the running app. Verify with
`firebase apphosting:secrets:list`.

## File-count gate (template repo only)

Net-new application files under `src/` + `scripts/` are gated to exactly 3:
`src/config/site.ts`, `src/lib/validation.ts`, `src/lib/ratelimit.ts`
(`src/config/sessions.ts` is a move from `src/lib/sessions.ts`).

Scaffolding (`.claude/`, `.github/`, root docs) lives on an allowlist; adding
to it requires editing the manifest in `.github/workflows/ci.yml`.

## The `.template-marker` file

Top-level `.template-marker` exists in the unconfigured template. The CI
brand-leak gate runs only when this file is present (`hashFiles('.template-marker')`).
**`/setup` step 1 deletes this file.** Once gone, downstream stores can put
their own brand name anywhere.

## Useful commands

- `npm run dev` — local dev server
- `npm run setup:stripe` — provision Stripe products + prices (sandbox)
- `npm run setup:stripe:live` — same, against live mode (uses .env.live)
- `npm run setup:stripe:webhook` — provision/update Stripe webhook endpoint
- `npm run setup:calcom` — provision Cal.com event types
- `npm run promo` — mint a promo code (sandbox)
- `npm run promo:live` — mint a promo code (live)
- `npm run typecheck` — `tsc --noEmit`
- `npm run knip` — dead-code scan
