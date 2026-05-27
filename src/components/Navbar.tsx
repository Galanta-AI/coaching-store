"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { List, X } from "@phosphor-icons/react";
import { SITE } from "@/config/site";
import { scrollToId } from "@/lib/scrollToId";

const navLinks = [
  { label: "Coaching", href: "/coaching" },
  { label: "Contact", href: "/contact" },
];

interface NavbarProps {
  /** Strip secondary links and use a conversion-focused CTA. */
  minimal?: boolean;
  ctaLabel?: string;
  ctaHref?: string;
}

export default function Navbar({
  minimal = false,
  ctaLabel,
  ctaHref = "/contact",
}: NavbarProps = {}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const resolvedCtaLabel = ctaLabel ?? (minimal ? "Book a Call" : "Get in Touch");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pageshow", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pageshow", onScroll);
    };
  }, []);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleCtaClick = useCallback(
    (e: React.MouseEvent) => {
      if (ctaHref.startsWith("#")) {
        e.preventDefault();
        scrollToId(ctaHref.slice(1));
      }
    },
    [ctaHref],
  );

  return (
    <>
      <nav
        className={`fixed top-0 left-0 z-50 flex h-16 w-full items-center transition-all duration-300 ${
          scrolled ? "bg-neutral-900 border-b border-white/[0.06]" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-6 lg:px-12">
          <Link href="/" className="text-sm font-medium uppercase tracking-[0.18em] text-white">
            {SITE.siteName}
          </Link>

          <div className="hidden items-center gap-8 lg:flex">
            {!minimal &&
              navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[13px] font-medium uppercase tracking-[0.15em] text-neutral-400 transition-colors duration-150 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            <Link
              href={ctaHref}
              onClick={handleCtaClick}
              className={
                minimal
                  ? "rounded-md bg-accent-500 px-5 py-2 text-[13px] font-medium uppercase tracking-[0.1em] text-white transition-all duration-150 hover:bg-accent-600 hover:shadow-[0_0_20px_rgba(130,189,102,0.2)]"
                  : "rounded-md border border-neutral-500 px-5 py-2 text-[13px] font-medium uppercase tracking-[0.1em] text-neutral-300 transition-all duration-150 hover:border-accent-500 hover:text-white"
              }
            >
              {resolvedCtaLabel}
            </Link>
          </div>

          {minimal ? (
            <Link
              href={ctaHref}
              onClick={handleCtaClick}
              className="rounded-md bg-accent-500 px-4 py-2 text-[12px] font-medium uppercase tracking-[0.1em] text-white transition-all duration-150 hover:bg-accent-600 lg:hidden"
            >
              {resolvedCtaLabel}
            </Link>
          ) : (
            <button
              className="flex items-center lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <List size={28} weight="light" className="text-neutral-300" />
            </button>
          )}
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-neutral-900"
          >
            <button
              className="absolute top-5 right-6"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X size={28} weight="light" className="text-neutral-300" />
            </button>
            <nav className="flex flex-col items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-2xl font-medium uppercase tracking-[0.15em] text-neutral-300 transition-colors duration-150 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/contact"
                onClick={() => setMobileOpen(false)}
                className="mt-4 rounded-md border border-neutral-500 px-7 py-3 text-base font-medium uppercase tracking-[0.1em] text-neutral-300 transition-all duration-150 hover:border-accent-500 hover:text-white"
              >
                Get in Touch
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
