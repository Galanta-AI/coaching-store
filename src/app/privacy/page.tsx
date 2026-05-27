import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Section from "@/components/Section";
import Container from "@/components/Container";
import AccentLine from "@/components/AccentLine";
import { SITE } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: `${SITE.siteName} privacy policy.`,
};

export default function PrivacyPage() {
  const subprocessors = [
    SITE.subprocessors.stripe && { name: "Stripe", purpose: "Payment processing" },
    SITE.subprocessors.calcom && { name: "Cal.com", purpose: "Session scheduling" },
    SITE.subprocessors.resend && { name: "Resend", purpose: "Transactional email" },
    SITE.subprocessors.posthog && { name: "PostHog", purpose: "Product analytics (opt-in)" },
    SITE.subprocessors.turnstile && {
      name: "Cloudflare Turnstile",
      purpose: "Anti-bot verification on the contact form",
    },
  ].filter((x): x is { name: string; purpose: string } => x !== false);

  return (
    <>
      <Navbar />
      <main>
        <Section className="bg-neutral-900 pt-28 md:pt-36">
          <Container>
            <article className="mx-auto max-w-[720px]">
              <AccentLine />
              <h1
                className="text-3xl md:text-4xl"
                style={{ textTransform: "none", letterSpacing: "-0.01em" }}
              >
                Privacy
              </h1>
              <div className="prose prose-invert mt-10 space-y-6 text-neutral-300">
                <p>
                  This is a starter privacy policy generated from your site configuration.
                  Edit <code className="text-accent-500">src/app/privacy/page.tsx</code> to
                  match the actual data flows of your business. The template lists the
                  subprocessors currently enabled in{" "}
                  <code className="text-accent-500">src/config/site.ts</code>.
                </p>

                <h2 className="mt-10 text-xl text-white">What we collect</h2>
                <ul className="ml-6 list-disc space-y-2">
                  <li>
                    <strong>Checkout:</strong> name, email, and payment details — payment
                    details are collected by Stripe on Stripe-hosted pages; we never see or
                    store card data.
                  </li>
                  <li>
                    <strong>Scheduling:</strong> the name and email you provide to Cal.com
                    when booking your session, plus any intake form fields.
                  </li>
                  <li>
                    <strong>Contact form:</strong> name, email, optional company name, and
                    your message.
                  </li>
                </ul>

                <h2 className="mt-10 text-xl text-white">Subprocessors</h2>
                <ul className="ml-6 list-disc space-y-2">
                  {subprocessors.map((s) => (
                    <li key={s.name}>
                      <strong>{s.name}</strong> — {s.purpose}
                    </li>
                  ))}
                </ul>

                <h2 className="mt-10 text-xl text-white">Contact</h2>
                <p>
                  Privacy questions or data deletion requests:{" "}
                  <a className="text-accent-500 underline" href={`mailto:${SITE.contactEmail}`}>
                    {SITE.contactEmail}
                  </a>
                  .
                </p>
              </div>
            </article>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
