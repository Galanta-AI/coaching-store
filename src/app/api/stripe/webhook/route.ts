import { type NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { SITE } from "@/config/site";

export async function POST(request: NextRequest) {
  if (process.env.STRIPE_DISABLED === "true") {
    // 503 makes Stripe hold and retry events while the kill switch is on.
    return NextResponse.json(
      { error: "Payments are temporarily unavailable." },
      { status: 503 },
    );
  }

  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error("Stripe webhook: missing signature header or webhook secret");
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  // Signature verification needs the raw, unparsed body.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const email = session.customer_details?.email;
  const calLink = session.metadata?.calLink;

  if (!email || !calLink) {
    console.error(
      `Stripe webhook ${event.id}: session ${session.id} is missing email or calLink`,
    );
    return NextResponse.json({ received: true });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send(
      {
        from: process.env.EMAIL_FROM || `${SITE.siteName} <onboarding@resend.dev>`,
        to: email,
        replyTo: SITE.contactEmail,
        subject: `Your ${SITE.siteName} session — pick a time`,
        text: [
          `Thanks for booking a session with ${SITE.coachName}.`,
          "",
          "Pick your time here (this link works once, so book it in one go):",
          calLink,
          "",
          "Once you choose a slot you'll get a Google Meet link and a calendar invite.",
          "",
          `— ${SITE.coachName}`,
        ].join("\n"),
      },
      // Collapses duplicate webhook deliveries of the same event into one send.
      { idempotencyKey: event.id },
    );
    if (error) {
      throw new Error(`Resend rejected the send: ${error.message}`);
    }
  } catch (err) {
    console.error(`Stripe webhook ${event.id}: Resend send failed:`, err);
    // 500 so Stripe retries; the idempotency key prevents a double-send.
    return NextResponse.json({ error: "Email send failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
