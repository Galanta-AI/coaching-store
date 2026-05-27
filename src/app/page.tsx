import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Section from "@/components/Section";
import Container from "@/components/Container";
import AccentLine from "@/components/AccentLine";
import Button from "@/components/Button";
import { SITE } from "@/config/site";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Section className="bg-neutral-900 pt-32 md:pt-40">
          <Container>
            <div className="mx-auto flex max-w-[720px] flex-col items-center text-center">
              <AccentLine className="mx-auto" />
              <h1
                className="text-[34px] leading-[1.1] font-bold md:text-[56px]"
                style={{ textTransform: "none", letterSpacing: "-0.01em" }}
              >
                {SITE.siteName}
              </h1>
              <p className="mx-auto mt-6 max-w-[560px] text-lg leading-[1.7] text-neutral-300">
                {SITE.tagline}
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
                <Button href="/coaching">Browse Sessions</Button>
                <Link
                  href="/contact"
                  className="text-sm font-medium uppercase tracking-[0.1em] text-neutral-400 hover:text-white"
                >
                  Get in Touch →
                </Link>
              </div>
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
