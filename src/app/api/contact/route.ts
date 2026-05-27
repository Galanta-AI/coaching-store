import { type NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { SITE, allowedOrigins } from "@/config/site";
import { contactBodySchema } from "@/lib/validation";
import { clientIp, createLimiter } from "@/lib/ratelimit";

const limiter = createLimiter({ limit: 3, windowMs: 60 * 60 * 1000 });

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (allowedOrigins().has(origin)) return true;
  if (process.env.NODE_ENV === "development") {
    return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  }
  return false;
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return false;
  const formData = new URLSearchParams({ secret, response: token, remoteip: ip });
  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: formData },
    );
    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (!isAllowedOrigin(origin)) {
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

    const parsed = contactBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid submission." },
        { status: 400 },
      );
    }
    const body = parsed.data;

    if (SITE.subprocessors.turnstile) {
      if (!body.turnstileToken || !(await verifyTurnstile(body.turnstileToken, ip))) {
        return NextResponse.json(
          { error: "Verification failed. Please refresh and try again." },
          { status: 400 },
        );
      }
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.EMAIL_FROM || `${SITE.siteName} <onboarding@resend.dev>`,
      to: SITE.contactEmail,
      replyTo: body.email,
      subject: `New inquiry from ${body.name}${body.company ? ` (${body.company})` : ""}`,
      text: [
        `Name: ${body.name}`,
        `Email: ${body.email}`,
        body.company ? `Company: ${body.company}` : null,
        `\nMessage:\n${body.message}`,
      ]
        .filter(Boolean)
        .join("\n"),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
