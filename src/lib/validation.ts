import { z } from "zod";
import { SESSION_TYPE_IDS } from "@/config/sessions";

/** POST /api/checkout body. */
export const checkoutBodySchema = z.object({
  sessionType: z.string().refine((v) => SESSION_TYPE_IDS.includes(v), {
    message: "Unknown session type.",
  }),
});

/** POST /api/contact body. */
export const contactBodySchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  company: z.string().max(200).optional(),
  message: z.string().min(1).max(5000),
  // Honeypot — must be empty.
  website: z.string().max(0).optional().or(z.literal("")),
  // Anti-bot — milliseconds elapsed since page render. Must be >= 2000.
  elapsedMs: z.number().int().min(2000),
  // Cloudflare Turnstile token. Optional in v1 — if SITE.subprocessors.turnstile
  // is true, the route handler must additionally verify the token server-side.
  turnstileToken: z.string().optional(),
});

export type CheckoutBody = z.infer<typeof checkoutBodySchema>;
export type ContactBody = z.infer<typeof contactBodySchema>;
