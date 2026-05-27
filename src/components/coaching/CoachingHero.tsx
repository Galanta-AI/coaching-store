"use client";

import { motion } from "framer-motion";
import BookButton from "./BookButton";
import Container from "../Container";
import { SITE } from "@/config/site";

export default function CoachingHero() {
  return (
    <section className="relative overflow-hidden bg-neutral-900 pt-24 pb-16 md:pt-32 md:pb-20">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.17 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, #404040 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        className="pointer-events-none absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "900px",
          height: "900px",
          maxWidth: "120vw",
          background:
            "radial-gradient(circle, rgba(130,189,102,0.10) 0%, rgba(130,189,102,0.04) 35%, transparent 65%)",
        }}
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-20"
        style={{ background: "linear-gradient(to bottom, transparent, #171717)" }}
        aria-hidden="true"
      />

      <Container className="relative z-20 flex flex-col items-center text-center">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
          className="mb-6 text-[12px] font-medium tracking-[0.2em] text-accent-500 uppercase"
        >
          1:1 Coaching with {SITE.coachName}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.4 }}
          className="max-w-[920px] text-[32px] leading-[1.1] font-bold md:text-[56px]"
          style={{ textTransform: "none", letterSpacing: "-0.01em" }}
        >
          <span className="text-accent-500">Get unstuck.</span> Real expertise,
          one hour at a time.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.7 }}
          className="mx-auto mt-6 max-w-[680px] text-lg leading-[1.7] text-neutral-300"
        >
          {SITE.tagline} Replace this hero copy in `src/components/coaching/CoachingHero.tsx`.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.9 }}
          className="mt-10"
        >
          <BookButton>Book a Session</BookButton>
        </motion.div>
      </Container>
    </section>
  );
}
