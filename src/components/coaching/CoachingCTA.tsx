import FadeIn from "../FadeIn";
import Section from "../Section";
import Container from "../Container";
import BookButton from "./BookButton";
import { SITE } from "@/config/site";

export default function CoachingCTA() {
  return (
    <Section className="bg-neutral-900">
      <Container>
        <FadeIn>
          <div
            className="rounded-2xl border border-neutral-700 bg-neutral-800 px-8 py-16 text-center md:px-16"
            style={{
              boxShadow:
                "0 0 60px rgba(130,189,102,0.05), 0 0 120px rgba(141,102,180,0.03)",
            }}
          >
            <p className="mb-4 text-[11px] font-medium tracking-[0.2em] text-neutral-500 uppercase">
              1:1 sessions with {SITE.coachName}
            </p>
            <h2 className="text-[26px] leading-[1.2] md:text-4xl">Ready to book?</h2>
            <div className="mt-10">
              <BookButton>Book a Session</BookButton>
            </div>
          </div>
        </FadeIn>
      </Container>
    </Section>
  );
}
