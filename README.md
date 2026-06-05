# coaching-store

A Next.js 16 + Stripe + Cal.com template for coaching stores. One coach,
N session types, one-time payments, automatic post-checkout scheduling,
deployed to Firebase App Hosting.

## Quickstart

You won't write code. You'll use [Claude Code](https://claude.com/claude-code)
(an AI agent that runs in your terminal) to walk through every step. About
30 minutes if you're moving steadily; longer if any vendor signup is new.

### 1. Clone

```bash
gh repo create my-coaching-store --template Galanta-AI/coaching-store --private --clone
cd my-coaching-store
```

### 2. Open in Claude Code, run `/setup`

```bash
claude
```

Then inside Claude Code, type `/setup`. Claude walks you through brand basics,
session types, Stripe, Cal.com, Resend, and the final deploy.

### 3. Deploy

`/setup` ends by deploying to Firebase App Hosting. You'll need the
[Firebase Blaze (pay-as-you-go) plan](https://firebase.google.com/pricing)
enabled on your project before this step — App Hosting requires it.

---

<details>
<summary><strong>Before you start: accounts and tools</strong></summary>

Create these accounts (all free to start; Firebase needs Blaze enabled before deploy):

- [Stripe](https://dashboard.stripe.com/register) — payments
- [Cal.com](https://app.cal.com/signup) — scheduling
- [Resend](https://resend.com/signup) — confirmation emails
- [Firebase](https://console.firebase.google.com/) — hosting (upgrade to [Blaze](https://firebase.google.com/pricing) when prompted)

Install these tools locally (each link has macOS/Windows/Linux instructions):

- [Node.js 20+](https://nodejs.org/)
- [Git](https://git-scm.com/downloads)
- [GitHub CLI (`gh`)](https://cli.github.com/)
- [Claude Code](https://docs.claude.com/en/docs/agents-and-tools/claude-code/quickstart)
- [Firebase CLI](https://firebase.google.com/docs/cli)

</details>

<details>
<summary><strong>What <code>/setup</code> will ask you for</strong></summary>

Have these tabs open. Claude tells you which line to paste; you paste it into
`.env.local` in your editor — never into the chat.

- **Stripe key** → [Stripe Developers → API keys](https://dashboard.stripe.com/test/apikeys)
- **Cal.com key** → [Cal.com → Developer → API keys](https://app.cal.com/settings/developer/api-keys)
- **Resend key** → [Resend → API keys](https://resend.com/api-keys)
- **Stripe webhook** — Claude runs a script that creates the webhook in your Stripe account and prints a signing secret you paste into `.env.local`. ([What's a webhook?](https://stripe.com/docs/webhooks))

`.env.local` is a hidden, gitignored file in your project that holds your local
keys. Claude creates and updates it as you go; it never gets committed.

</details>

<details>
<summary><strong>Firebase App Hosting reference</strong></summary>

`/setup` handles the deploy mechanics for you. These are the underlying docs:

- [App Hosting overview](https://firebase.google.com/docs/app-hosting)
- [Get started with Next.js on App Hosting](https://firebase.google.com/docs/app-hosting/get-started)
- [Configuring environment and secrets](https://firebase.google.com/docs/app-hosting/configure#user-defined-environment) — production secrets live in Google Cloud Secret Manager, referenced from `apphosting.yaml`
- [Blaze pricing](https://firebase.google.com/pricing)

</details>

## What you get

- **Stripe Checkout** (hosted) for one-time payments — zero card data on your
  site, PCI Level 3 by design.
- **Cal.com integration** — paid customers get a single-use private booking
  link via email.
- **Idempotent provisioning** — every script (`setup:stripe`, `setup:calcom`,
  `setup:stripe:webhook`, `promo`) is safe to re-run.
- **Promo codes** — a CLI for ad-hoc gifts and campaign drops, or the
  interactive `/mint-code` Claude command.
- **Secrets never enter the chat** — Claude prints env lines; you paste them
  into `.env.local` yourself. Production secrets go through
  `firebase apphosting:secrets:set` in your own terminal.
- **Security posture out of the box** — signed webhooks, kill switch, CSP, HSTS,
  zod validation, gitleaks + npm audit in CI. See [SECURITY.md](SECURITY.md).

## Stack

- Next.js 16 (App Router, standalone output)
- React 19, TypeScript strict
- Tailwind CSS v4
- Stripe Node SDK
- Cal.com REST API v2
- Resend for transactional email
- Firebase App Hosting for production

## Contributing

PRs welcome. Open an issue first for anything substantial. All PRs require
review from [@Sefton419](https://github.com/Sefton419) before merge — see
[`.github/CODEOWNERS`](.github/CODEOWNERS).

## License

MIT. Maintained by [Galanta](https://galanta.ai).
