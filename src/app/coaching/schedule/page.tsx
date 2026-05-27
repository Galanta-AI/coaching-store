import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Section from "@/components/Section";
import Container from "@/components/Container";
import AccentLine from "@/components/AccentLine";
import Button from "@/components/Button";
import { getStripe } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Schedule your session",
  robots: { index: false, follow: false },
};

const headingStyle = {
  textTransform: "none",
  letterSpacing: "-0.01em",
} as const;

type ScheduleState =
  | { kind: "paid"; calLink: string }
  | { kind: "processing" }
  | { kind: "invalid" };

async function resolveState(sessionId?: string): Promise<ScheduleState> {
  if (!sessionId) return { kind: "invalid" };
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    const calLink = session.metadata?.calLink;
    if (session.payment_status === "paid" && calLink) {
      return { kind: "paid", calLink };
    }
    return { kind: "processing" };
  } catch {
    return { kind: "invalid" };
  }
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const state = await resolveState(session_id);

  return (
    <>
      <Navbar minimal ctaLabel="Coaching" ctaHref="/coaching" />
      <main>
        <Section className="bg-neutral-900">
          <Container>
            <div className="mx-auto flex max-w-[560px] flex-col items-center pt-16 text-center md:pt-24">
              <AccentLine className="mx-auto" />

              {state.kind === "paid" && (
                <>
                  <h1 className="text-[28px] leading-[1.2] md:text-4xl" style={headingStyle}>
                    Payment received &mdash; now pick your time
                  </h1>
                  <p className="mt-6 text-base leading-[1.7] text-neutral-300">
                    Your session is paid for. Choose a time and you&rsquo;ll get a Google
                    Meet link and a calendar invite. This scheduling link works once,
                    so book it in one go.
                  </p>
                  <div className="mt-8">
                    <Button href={state.calLink}>Choose your time</Button>
                  </div>
                  <p className="mt-4 text-sm text-neutral-500">
                    We&rsquo;ve also emailed you this link as a backup.
                  </p>
                </>
              )}

              {state.kind === "processing" && (
                <>
                  <h1 className="text-[28px] leading-[1.2] md:text-4xl" style={headingStyle}>
                    Payment is processing
                  </h1>
                  <p className="mt-6 text-base leading-[1.7] text-neutral-300">
                    Your payment hasn&rsquo;t finished confirming yet. The moment it
                    clears, we&rsquo;ll email you a link to schedule your session
                    &mdash; usually within a few minutes.
                  </p>
                </>
              )}

              {state.kind === "invalid" && (
                <>
                  <h1 className="text-[28px] leading-[1.2] md:text-4xl" style={headingStyle}>
                    No booking found
                  </h1>
                  <p className="mt-6 text-base leading-[1.7] text-neutral-300">
                    We couldn&rsquo;t find a session for this link. If you were trying
                    to book, start from the coaching page.
                  </p>
                  <div className="mt-8">
                    <Button href="/coaching">Go to coaching</Button>
                  </div>
                </>
              )}
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
