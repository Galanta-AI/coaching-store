"use client";

import Button from "../Button";
import { scrollToId } from "@/lib/scrollToId";

interface BookButtonProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * "Book a Session" CTA. Scrolls to the `#book` booking section on click,
 * without writing a `#book` hash to the URL — it renders a real <button>.
 */
export default function BookButton({ children, className }: BookButtonProps) {
  return (
    <Button onClick={() => scrollToId("book")} className={className}>
      {children}
    </Button>
  );
}
