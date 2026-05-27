import { type NextRequest, NextResponse } from "next/server";
import { getStripe, StripeDisabledError } from "@/lib/stripe";
import { createSingleUseLink } from "@/lib/calcom";
import { priceLookupKey, calEventSlug } from "@/config/sessions";
import { allowedOrigins } from "@/config/site";
import { checkoutBodySchema } from "@/lib/validation";
import { clientIp, createLimiter } from "@/lib/ratelimit";

const limiter = createLimiter({ limit: 10, windowMs: 60 * 60 * 1000 });

function resolveOrigin(origin: string | null): string | null {
  if (!origin) return null;
  if (allowedOrigins().has(origin)) return origin;
  if (
    process.env.NODE_ENV === "development" &&
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  ) {
    return origin;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const origin = resolveOrigin(request.headers.get("origin"));
    if (!origin) {
      return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
    }

    const ip = clientIp(request.headers);
    const { allowed } = limiter.hit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const parsed = checkoutBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request." },
        { status: 400 },
      );
    }
    const { sessionType } = parsed.data;

    const stripe = getStripe();

    // Resolve the Stripe Price by lookup key. Exactly one active price is
    // expected — 0 means the setup script never ran, >1 means it ran twice.
    const lookupKey = priceLookupKey(sessionType);
    const prices = await stripe.prices.list({
      lookup_keys: [lookupKey],
      active: true,
      limit: 2,
    });
    if (prices.data.length !== 1) {
      console.error(
        `Expected exactly 1 active Stripe price for "${lookupKey}", found ${prices.data.length}. Run "npm run setup:stripe".`,
      );
      return NextResponse.json(
        { error: "This session isn't available right now." },
        { status: 500 },
      );
    }

    // Mint the single-use Cal.com link before checkout so it can ride along in
    // the session metadata. This never throws — it falls back to a static URL.
    const calLink = await createSingleUseLink(calEventSlug(sessionType));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: prices.data[0].id, quantity: 1 }],
      allow_promotion_codes: true,
      metadata: { sessionType, calLink },
      success_url: `${origin}/coaching/schedule?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/coaching`,
    });

    if (!session.url) {
      throw new Error("Stripe Checkout Session returned no url");
    }
    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof StripeDisabledError) {
      return NextResponse.json(
        { error: "Payments are temporarily unavailable. Please try again later." },
        { status: 503 },
      );
    }
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
