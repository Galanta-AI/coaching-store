# coaching-store

A Next.js 16 + Stripe + Cal.com template for coaching stores. One coach,
N session types, one-time payments, automatic post-checkout scheduling.

## Quickstart

```bash
gh repo create my-coaching-store --template Galanta-AI/coaching-store --private --clone
cd my-coaching-store
```

Open the repo in [Claude Code](https://claude.com/claude-code) and run:

```
/setup
```

Claude walks you through every step: brand basics, session types, Stripe keys,
Cal.com, webhooks, Resend, and deploy. Aim for a working test-mode store in
~30 minutes (production with custom domain + live keys takes longer because of
DNS).

## What you get

- **Stripe Checkout** (hosted) for one-time payments — zero card data on your
  site, PCI Level 3 by design.
- **Cal.com integration** — paid customers get a single-use private booking
  link via email.
- **Idempotent provisioning** — every script (`setup:stripe`, `setup:calcom`,
  `setup:stripe:webhook`, `promo`) is safe to re-run. Edit
  `src/config/sessions.ts`, re-run, everything updates in lockstep.
- **Promo codes** — a CLI for ad-hoc gifts and campaign drops, with one-time-
  and N-time-use variants, optional expiry, and per-product or all-products
  scoping. Or use the interactive `/mint-code` Claude command.
- **Secrets never enter the chat** — Claude prints env lines; you paste them
  into `.env.local` yourself. Production secrets go through `vercel env add`
  in your own terminal.
- **Security posture out of the box** — signed webhooks, kill switch, CSP, HSTS,
  zod validation, gitleaks + npm audit in CI. See [SECURITY.md](SECURITY.md).

## Stack

- Next.js 16 (App Router, standalone output)
- React 19, TypeScript strict
- Tailwind CSS v4 (CSS custom properties → `@theme inline`)
- Stripe Node SDK
- Cal.com REST API v2
- Resend for transactional email
- Vercel for hosting

## Local development

```bash
npm install
npm run dev
```

The first thing `/setup` does is delete `.template-marker` (a marker file that
gates the CI brand-leak check in the template repo only). After that, you can
edit anything.

## Going live

`/setup` step 9 walks you through it. Short version:

1. `vercel link`
2. For each secret: `vercel env add KEY production` (you type the value into
   Vercel's prompt — never into chat or the repo)
3. `vercel deploy --prod`
4. Once you have a public URL: `STRIPE_WEBHOOK_URL=https://your-domain.com/api/stripe/webhook npm run setup:stripe:webhook` to register the webhook
5. `vercel env add STRIPE_WEBHOOK_SECRET production` with the secret it prints
6. `vercel deploy --prod`

For live Stripe (real money), see SECURITY.md's "Operational runbook" and the
docstring at the top of `scripts/setup-stripe-live.ts`.

## License

MIT. Maintained by [Galanta](https://galanta.ai).
