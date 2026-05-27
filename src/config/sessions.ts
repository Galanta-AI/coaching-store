/**
 * Session catalog — the single source of truth. Read by:
 *   - scripts/setup-stripe.ts        (provisions Stripe products + prices)
 *   - scripts/setup-calcom.ts        (provisions Cal.com event types)
 *   - scripts/create-promo-code.ts   (scopes coupons to specific products)
 *   - src/app/api/checkout/route.ts  (price lookup at checkout)
 *   - src/app/coaching/* components  (renders the booking UI)
 *
 * Edit this file, then re-run `npm run setup:stripe` and `npm run setup:calcom`
 * to keep Stripe + Cal.com + the UI in lockstep.
 *
 * IMPORTANT: this file MUST NOT import the `stripe` package — it's imported
 * from client components and must stay safe for the browser bundle.
 */

import { SITE } from "./site";

export interface SecondaryAction {
  label: string;
  href: string;
}

export interface SessionType {
  /** Stable key. Used in URLs, Stripe metadata, Cal.com slug. lower-case, no spaces. */
  id: string;
  /** Display name (e.g. "Career Coaching"). */
  name: string;
  /** Headline shown above the card title (e.g. "Just starting out?"). */
  audienceHeadline: string;
  /** Card body copy. */
  body: string;
  /** Price in USD whole dollars. Stripe stores cents under the hood. */
  priceUsd: number;
  /** Session duration in minutes. */
  durationMinutes: number;
  /** Cal.com event slug. Appears in the booking URL: cal.com/<username>/<slug>. */
  calSlug: string;
  /** Optional secondary CTA shown under the Book button. */
  secondaryAction?: SecondaryAction;
  /** If true, render this card with the highlighted accent border. */
  isHighlighted?: boolean;
}

export const SESSION_TYPES: SessionType[] = [
  {
    id: "intro",
    name: "Intro Session",
    audienceHeadline: "Just getting started?",
    body: "Replace this body with your own session description. Two or three sentences works best: who it's for, what they walk away with, and any honest constraints.",
    priceUsd: 125,
    durationMinutes: 60,
    calSlug: "intro-session",
  },
];

export const SESSION_TYPE_IDS = SESSION_TYPES.map((s) => s.id);

export const REASSURANCE_LINE =
  "Video session · Reschedule via email 24+ hours ahead.";

export function getSession(id: string): SessionType | undefined {
  return SESSION_TYPES.find((s) => s.id === id);
}

/**
 * Stripe Price `lookup_key` — namespaced by siteSlug so two installs in the
 * same Stripe account don't collide. Must match scripts/setup-stripe.ts.
 */
export function priceLookupKey(id: string): string {
  return `${SITE.siteSlug}_${id}`;
}

/** Cal.com event slug — must match scripts/setup-calcom.ts. */
export function calEventSlug(id: string): string {
  const session = getSession(id);
  if (!session) {
    throw new Error(`Unknown session id: ${id}`);
  }
  return session.calSlug;
}

export function isSessionTypeId(v: unknown): v is string {
  return typeof v === "string" && SESSION_TYPES.some((s) => s.id === v);
}
