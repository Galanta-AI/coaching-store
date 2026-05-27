"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "@phosphor-icons/react";
import AccentLine from "../AccentLine";
import FadeIn from "../FadeIn";
import Section from "../Section";
import Container from "../Container";

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

// Edit these to match your policy. Generic placeholders shipped with the template.
const items: FAQItem[] = [
  {
    question: "What if I need to cancel or reschedule?",
    answer:
      "Reschedule up to 24 hours before the session, no charge. Inside 24 hours, the session is non-refundable, and rescheduling costs 50% of the session fee. No-shows forfeit the full fee.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "No. Time is blocked off and prep happens before the session. If something didn't work, tell me — for first-time customers I'll often offer credit on a future session.",
  },
  {
    question: "How do sessions actually run?",
    answer:
      "Video call (Google Meet) at the time you book. Bring your repo links, screenshots, decisions you're stuck on — whatever needs work. The more context up front, the more useful the hour will be.",
  },
  {
    question: "Can a team book together?",
    answer:
      "One connection per session by default. If you want two or three teammates on the same call, book a longer session and add them in the intake form.",
  },
];

function FAQRow({
  item,
  isOpen,
  onToggle,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-neutral-700">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-6 py-6 text-left"
      >
        <span className="text-base font-medium text-white md:text-lg">{item.question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="shrink-0 text-accent-500"
        >
          <Plus size={22} weight="light" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pr-12 pb-6 text-base leading-[1.7] text-neutral-400">{item.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CoachingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Section className="bg-neutral-900">
      <Container>
        <FadeIn className="mb-12 flex flex-col items-center text-center">
          <AccentLine className="mx-auto" />
          <h2 className="text-[26px] leading-[1.2] md:text-4xl">Frequently asked questions</h2>
        </FadeIn>

        <FadeIn>
          <div className="mx-auto max-w-[760px] border-t border-neutral-700">
            {items.map((item, i) => (
              <FAQRow
                key={item.question}
                item={item}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>
        </FadeIn>
      </Container>
    </Section>
  );
}
