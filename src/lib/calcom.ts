/**
 * Cal.com API client — server-only. Mints single-use private booking links so
 * a paid customer can schedule exactly once. Falls back to the static (hidden)
 * event URL on any failure, so a Cal.com hiccup never blocks a sale; that
 * booking is then covered by your manual reconciliation.
 */

const API_BASE = "https://api.cal.com/v2";
const EVENT_TYPES_API_VERSION = "2024-06-14";
const PRIVATE_LINKS_API_VERSION = "2024-09-04";

function staticBookingUrl(eventSlug: string): string {
  const username = process.env.CALCOM_USERNAME ?? "";
  return `https://cal.com/${username}/${eventSlug}`;
}

const eventTypeIdCache = new Map<string, number>();

async function calFetch(path: string, apiVersion: string, init?: RequestInit): Promise<unknown> {
  const apiKey = process.env.CALCOM_API_KEY;
  if (!apiKey) throw new Error("CALCOM_API_KEY is not set");
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "cal-api-version": apiVersion,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`Cal.com API ${path} failed: ${res.status}`);
  }
  return res.json();
}

async function resolveEventTypeId(eventSlug: string): Promise<number> {
  const cached = eventTypeIdCache.get(eventSlug);
  if (cached !== undefined) return cached;

  const body = (await calFetch("/event-types", EVENT_TYPES_API_VERSION)) as {
    data?: Array<{ id: number; slug: string }>;
  };
  for (const et of body.data ?? []) {
    eventTypeIdCache.set(et.slug, et.id);
  }

  const id = eventTypeIdCache.get(eventSlug);
  if (id === undefined) {
    throw new Error(`Cal.com event type not found for slug "${eventSlug}"`);
  }
  return id;
}

/**
 * Mint a single-use private booking link for a paid session. The link expires
 * after one booking. Always returns a usable URL: on any Cal.com failure it
 * falls back to the static (hidden) event URL.
 */
export async function createSingleUseLink(eventSlug: string): Promise<string> {
  try {
    const eventTypeId = await resolveEventTypeId(eventSlug);
    const body = (await calFetch(
      `/event-types/${eventTypeId}/private-links`,
      PRIVATE_LINKS_API_VERSION,
      { method: "POST", body: JSON.stringify({ maxUsageCount: 1 }) },
    )) as { data?: { bookingUrl?: string } };

    const bookingUrl = body.data?.bookingUrl;
    if (!bookingUrl) {
      throw new Error("Cal.com private-link response missing bookingUrl");
    }
    return bookingUrl;
  } catch (err) {
    console.error("Cal.com single-use link minting failed; falling back to static URL:", err);
    return staticBookingUrl(eventSlug);
  }
}
