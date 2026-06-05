# /setup — Coaching Store onboarding

Walk the developer through bootstrapping their coaching store end-to-end. Each
step is idempotent: re-running `/setup` resumes from wherever a config field or
env var is missing. **The filesystem is the state.**

## Load-bearing design principle: secrets never enter chat

For every secret value (Stripe key, Cal.com key, Resend key, webhook secret):

1. Print the exact `KEY=` line for the developer to paste into `.env.local`
   themselves, in their editor — **not in the chat**.
2. Verify presence and shape via a `node -e` one-liner; the script only sees
   "exit 0 = ok" or "exit 1 = missing/wrong-prefix."
3. For Firebase App Hosting production secrets, instruct the developer to
   run `firebase apphosting:secrets:set KEY` in their own terminal — the
   CLI prompts for the value interactively; it never enters the chat. The
   secret is stored in Google Cloud Secret Manager. Reference it from
   `apphosting.yaml` (see Step 9).

You should never see or echo a secret value. If the developer pastes one,
politely refuse, restate the design choice, and move on.

---

## Step 0 — Remove the template marker

Before anything else, from the repo root:

```bash
rm .template-marker
```

This file gates the CI brand-leak check in the template repo only. Once it's
gone, the developer can put their own brand name anywhere without tripping CI.

---

## Step 1 — Brand basics

Ask the developer:

- **Service name** (e.g., "Acme Coaching") → `SITE.siteName`
- **Coach name** (e.g., "Jane Doe") → `SITE.coachName`
- **Tagline** (one sentence) → `SITE.tagline`
- **Primary brand color** (hex, e.g., #82BD66) → Claude picks the 5-shade
  palette (50/100/200/300/400/500/600/700/800/900) and writes it to
  `src/app/globals.css` (replace the `--color-accent-*` block).
- **Production domain** (no protocol, e.g., "acmecoaching.com") → `SITE.productionDomain`
- **Optional staging domain** → `SITE.stagingDomain`
- **Public contact email** → `SITE.contactEmail`
- **Security disclosure email** (defaults to `security@<domain>`) → `SITE.disclosureEmail`
- **Site slug** (lower-case, used in Stripe lookup keys — defaults to a slugified version of siteName) → `SITE.siteSlug`

Edit `src/config/site.ts` with the values. Confirm by reading the file back.

---

## Step 2 — Sessions

Ask: "How many session types are you offering?"

For each session, gather:

- **id** (lowercase, no spaces, e.g., "intro" / "deep-dive")
- **name** (display name)
- **audienceHeadline** (who is this for — appears above the card title)
- **body** (2–3 sentences, what they'll get)
- **priceUsd** (whole dollars)
- **durationMinutes** (typically 30, 60, or 90)
- **calSlug** (URL-safe — appears in the public booking URL)
- **isHighlighted?** (optional — one session can be visually featured)

Edit `src/config/sessions.ts` with the new `SESSION_TYPES` array.

---

## Step 3 — Stripe key

1. Open https://dashboard.stripe.com/test/apikeys in the browser.
2. Recommend a **restricted key** with the minimum scopes:
   - Products: write
   - Prices: write
   - Checkout Sessions: write
   - Webhook Endpoints: write
   - Promotion Codes: write
   - Coupons: write
3. Print the exact env line for the developer to paste into `.env.local`:

   ```
   STRIPE_SECRET_KEY=sk_test_...    (or rk_test_... for a restricted key)
   ```

4. Verify:

   ```bash
   node -e "require('dotenv').config({path:'.env.local'}); process.exit(/^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY||'') ? 0 : 1)"
   ```

   Exit 0 means the key loaded. Exit 1 means it's missing or wrong prefix —
   ask the developer to recheck.

5. Run `npm run setup:stripe` to provision products and prices.

---

## Step 4 — Cal.com

1. Open https://app.cal.com/settings/developer/api-keys.
2. Print env lines for `.env.local`:

   ```
   CALCOM_API_KEY=cal_...
   CALCOM_USERNAME=your-cal-username
   ```

3. Verify both are set:

   ```bash
   node -e "require('dotenv').config({path:'.env.local'}); process.exit(process.env.CALCOM_API_KEY && process.env.CALCOM_USERNAME ? 0 : 1)"
   ```

4. Run `npm run setup:calcom` to provision event types.

---

## Step 5 — Webhook (local development)

Install the Stripe CLI if needed (`brew install stripe/stripe-cli/stripe`),
then have the developer run in their own terminal:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Print the env line for `.env.local`:

```
STRIPE_WEBHOOK_SECRET=whsec_...
```

(the secret is printed by `stripe listen`)

Verify:

```bash
node -e "require('dotenv').config({path:'.env.local'}); process.exit(/^whsec_/.test(process.env.STRIPE_WEBHOOK_SECRET||'') ? 0 : 1)"
```

---

## Step 6 — Resend

1. Open https://resend.com/api-keys.
2. Print env lines for `.env.local`:

   ```
   RESEND_API_KEY=re_...
   EMAIL_FROM="Your Site <onboarding@resend.dev>"
   ```

   Note: `onboarding@resend.dev` is Resend's shared sender — fine for testing.
   For production, the developer must verify a domain in Resend
   (https://resend.com/domains) and set `EMAIL_FROM=…@verified-domain.com`.
   That's DNS-gated and can take time; flag it as a separate task, not on the
   ~30-min critical path.

3. Verify:

   ```bash
   node -e "require('dotenv').config({path:'.env.local'}); process.exit(/^re_/.test(process.env.RESEND_API_KEY||'') ? 0 : 1)"
   ```

---

## Step 7 — Copy

The placeholder copy is generic. Offer to draft real copy from the developer's
one-paragraph brief (you took this in step 1). Edit:

- `src/components/coaching/CoachingHero.tsx` — headline + subhead
- `src/components/coaching/CoachingFAQ.tsx` — the 4 default FAQ items
- `src/components/coaching/CoachingCTA.tsx` — final CTA copy
- `src/app/page.tsx` — home landing

Show diffs in chat and let the developer push back before saving.

---

## Step 8 — Local smoke test

Have the developer run:

```bash
npm install
npm run dev
```

Walk them through:

1. Visit http://localhost:3000 → should see the home page with their brand color.
2. Click "Browse Sessions" → land on `/coaching`.
3. Click "Book" on a session → redirects to Stripe Checkout.
4. Use test card `4242 4242 4242 4242`, any future date, any CVC.
5. Land on `/coaching/schedule?session_id=…` with a "Choose your time" button.
6. Check the `stripe listen` terminal — should show
   `checkout.session.completed` fired and 200 OK.
7. Check the email at the address you entered at Stripe — should arrive within a minute.

If any step fails, surface the error and help debug.

---

## Step 9 — Deploy to Firebase App Hosting

App Hosting natively serves Next.js apps with `output: "standalone"` (already
set in `next.config.ts`). Secrets live in Google Cloud Secret Manager and are
referenced from `apphosting.yaml`.

### 9a — Install and authenticate

Have the developer run, in their own terminal:

```bash
npm install -g firebase-tools
firebase login
```

`firebase login` opens a browser; wait for the developer to return.

### 9b — Firebase project + Blaze plan

Direct the developer to https://console.firebase.google.com/ to create a project
(or pick an existing one). **App Hosting requires the Blaze pay-as-you-go plan.**
The free Spark plan will not work. Link them to
https://firebase.google.com/pricing and have them upgrade the project to Blaze
before continuing — this requires a credit card and is gated by Google's billing
flow, not something you can automate.

Once Blaze is on, the developer runs:

```bash
firebase use --add
```

…and selects the project.

### 9c — Initialize App Hosting

```bash
firebase init apphosting
```

Walk through the prompts. This connects the GitHub repo and generates
`apphosting.yaml` at the repo root. App Hosting will auto-deploy on every push
to the connected branch.

### 9d — Set production secrets

For each secret, the developer runs:

```bash
firebase apphosting:secrets:set STRIPE_SECRET_KEY
firebase apphosting:secrets:set CALCOM_API_KEY
firebase apphosting:secrets:set CALCOM_USERNAME
firebase apphosting:secrets:set RESEND_API_KEY
firebase apphosting:secrets:set EMAIL_FROM
```

The CLI prompts for the value interactively; it never enters chat or the repo.
Each secret is stored in Google Cloud Secret Manager.

Then reference them from `apphosting.yaml`:

```yaml
env:
  - variable: STRIPE_SECRET_KEY
    secret: STRIPE_SECRET_KEY
  - variable: CALCOM_API_KEY
    secret: CALCOM_API_KEY
  - variable: CALCOM_USERNAME
    secret: CALCOM_USERNAME
  - variable: RESEND_API_KEY
    secret: RESEND_API_KEY
  - variable: EMAIL_FROM
    secret: EMAIL_FROM
```

Commit `apphosting.yaml` (it contains references, not values).

### 9e — Deploy

```bash
git push origin main
```

App Hosting builds and deploys. The first build typically takes 3–5 minutes.
The backend URL is shown in the Firebase console under App Hosting → Backends.

### 9f — Production webhook

Once the App Hosting backend has a public URL:

```bash
STRIPE_WEBHOOK_URL=https://<your-backend>.web.app/api/stripe/webhook \
  npm run setup:stripe:webhook
```

The script prints the signing secret. Add it:

```bash
firebase apphosting:secrets:set STRIPE_WEBHOOK_SECRET
```

Add the matching `env:` entry to `apphosting.yaml`, then push to trigger
redeploy.

---

## Going live (separate session, longer)

When the developer is ready to switch from test to live Stripe:

1. Create `.env.live` (gitignored) with `STRIPE_SECRET_KEY=sk_live_...` (or `rk_live_...`).
2. Run `npm run setup:stripe:live` — provisions live Stripe products.
3. Run `npm run setup:stripe:webhook:live` — registers the live webhook endpoint, prints the live signing secret.
4. Developer runs `firebase apphosting:secrets:set STRIPE_SECRET_KEY` (the prompt updates the existing secret value) and `firebase apphosting:secrets:set STRIPE_WEBHOOK_SECRET` (with the live signing secret).
5. Push to main to redeploy.

DNS for the custom domain and Resend domain verification can take hours; not on
the test-mode critical path.

---

## When something goes wrong

- **`setup:stripe` says "no active products found"**: the developer hasn't edited `src/config/sessions.ts` yet. Step 2.
- **Webhook signature verification fails**: `STRIPE_WEBHOOK_SECRET` is missing or mismatched. Re-run `stripe listen` and re-paste.
- **Checkout returns 503**: `STRIPE_DISABLED=true` is set, or the Stripe key is missing.
- **Cal.com link is the static URL fallback**: `CALCOM_API_KEY` is wrong, or the event type wasn't created. Re-run `npm run setup:calcom`.
- **Promo code says "no products found"**: `npm run setup:stripe` hasn't been run yet.

### If the App Hosting deploy fails

*This section will be expanded after the first real end-to-end deploy. Likely entries to be populated from that dry-run:*

- **"Billing account not configured" / build refuses to start**: the project hasn't been upgraded to Blaze. Send the developer to https://firebase.google.com/pricing to upgrade.
- **Build fails with "secret not found"**: a name in `apphosting.yaml`'s `env:` block doesn't match a secret in Secret Manager. List existing secrets with `firebase apphosting:secrets:list` and either rename the entry or set the missing secret.
- **GitHub repo not connected**: `firebase init apphosting` was skipped or its GitHub authorization step was dismissed. Re-run it.
- **Backend URL returns 404 after first deploy**: confirm the build actually succeeded (Firebase console → App Hosting → Backends → Rollouts). The first rollout takes 3–5 minutes and 404s before it finishes.
- **Webhook returns 400 after deploy**: `STRIPE_WEBHOOK_SECRET` set but `apphosting.yaml` is missing the `env:` entry referencing it. Add the entry, commit, push.

When stuck, suggest reading the relevant script — they're commented heavily.
