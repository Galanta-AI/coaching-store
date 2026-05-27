/**
 * Cal.com event types — idempotent provisioning.
 *
 * Re-run any time: missing event types are created, existing ones updated to
 * match src/config/sessions.ts. Slugs MUST match calEventSlug() in that file.
 *
 * Fixed-length events (not multi-duration) are intentional: a multi-duration
 * event lets the booker change the session length on the Cal.com page, which
 * must not be possible — the length is whatever they paid for.
 *
 * Usage: CALCOM_API_KEY in .env.local, then `npm run setup:calcom`.
 */

import { config } from "dotenv";
import { SESSION_TYPES, type SessionType } from "../src/config/sessions";
import { SITE } from "../src/config/site";

config({ path: ".env.local" });

const API_BASE = "https://api.cal.com/v2";
const API_VERSION = "2024-06-14";

const apiKey = process.env.CALCOM_API_KEY;
if (!apiKey) {
  console.error("Missing CALCOM_API_KEY. Add it to .env.local at the repo root.");
  process.exit(1);
}

// Pay-to-session buffer: no slot can be booked sooner than this. 3 days default.
// Adjust here if you want a different policy across all session types.
const MINIMUM_NOTICE_MINUTES = 3 * 24 * 60;

interface BookingField {
  type: "text" | "textarea" | "boolean";
  slug: string;
  label: string;
  required: boolean;
  placeholder?: string;
}

// name + email are Cal.com defaults — only custom intake questions go here.
// Edit this list to change what every session asks for at booking time.
const INTAKE_FIELDS: BookingField[] = [
  {
    type: "textarea",
    slug: "help-with",
    label: "What would you like help with?",
    required: true,
    placeholder:
      "Be specific. The more I know, the more useful the session will be.",
  },
  {
    type: "text",
    slug: "referral",
    label: "How did you find me?",
    required: false,
  },
];

function payloadFor(session: SessionType): string {
  return JSON.stringify({
    title: session.name,
    slug: session.calSlug,
    description: session.body,
    lengthInMinutes: session.durationMinutes,
    minimumBookingNotice: MINIMUM_NOTICE_MINUTES,
    hidden: true,
    disableGuests: true,
    locations: [{ type: "integration", integration: "google-meet" }],
    bookingFields: INTAKE_FIELDS,
  });
}

async function calApi(path: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "cal-api-version": API_VERSION,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Cal.com API ${init?.method ?? "GET"} ${path} failed: ${res.status} ${text}`);
  }
  return text ? JSON.parse(text) : {};
}

async function existingIdsBySlug(): Promise<Map<string, number>> {
  const body = (await calApi("/event-types")) as { data?: Array<{ id: number; slug: string }> };
  const map = new Map<string, number>();
  for (const e of body.data ?? []) map.set(e.slug, e.id);
  return map;
}

async function main(): Promise<void> {
  console.log(`\n${SITE.siteName} — Cal.com event types\n`);

  const existing = await existingIdsBySlug();

  for (const session of SESSION_TYPES) {
    const id = existing.get(session.calSlug);
    if (id !== undefined) {
      await calApi(`/event-types/${id}`, { method: "PATCH", body: payloadFor(session) });
      console.log(`  ~ updated  — ${session.calSlug}`);
    } else {
      await calApi("/event-types", { method: "POST", body: payloadFor(session) });
      console.log(`  + created  — ${session.calSlug}`);
    }
  }

  console.log(
    `\nDone. ${SESSION_TYPES.length} event types: hidden, ${MINIMUM_NOTICE_MINUTES / 60 / 24}-day minimum notice, no extra guests.\n`,
  );
}

main().catch((err) => {
  console.error("\nSetup failed:");
  console.error(err);
  process.exit(1);
});
