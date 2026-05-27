# /mint-code — Interactive promo code wizard

Wrap `scripts/create-promo-code.ts` in a conversation so the developer doesn't
need to remember CLI flags.

## Ask, in order:

1. **Mode** — sandbox or live?
   - Sandbox: `npm run promo` (uses `.env.local`)
   - Live: `npm run promo:live` (uses `.env.live`, refuses non-live keys, 5s
     abort window). Warn the developer that live mode mints a real, working code.

2. **Discount percent** — 50% or 100%?

3. **Products** — read `src/config/sessions.ts` and present the available ids.
   Ask which one(s). Multi-select allowed. Also offer the special token "all"
   (with the snapshot caveat: it pins to today's catalog; new sessions added
   later won't be eligible).

4. **Max redemptions**:
   - Single-use gift (default 1)
   - Campaign (ask for the count, 2–10,000)

5. **Expiry** (optional) — N days from now, or never.

6. **Note** — free-text label, max 500 chars. **Always require this.** Without
   a note, the Stripe dashboard shows a bare code with no context. Suggest:
   "Sarah at Acme" for gifts, "Q3 launch campaign" for campaigns.

## Then run

Construct the command. For example, a 100% off, single-use gift on `intro`:

```bash
npm run promo -- --percent 100 --product intro --max-redemptions 1 --note "Sarah at Acme"
```

A 25-redemption campaign on all products, expiring in 14 days:

```bash
npm run promo -- --percent 50 --product all --max-redemptions 25 --expires-days 14 --note "Q3 launch"
```

Run it. The script prints the resulting promo code string — relay it verbatim
to the developer with the redeem URL.

## The "all" caveat (always surface this)

If the developer picks "all", remind them: the coupon is pinned to today's
product IDs. If they add a new session later, this code will NOT apply to it.
For long-running campaigns that should cover future products, mint a fresh code
after the catalog changes.
