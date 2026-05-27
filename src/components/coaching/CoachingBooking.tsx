"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AccentLine from "../AccentLine";
import FadeIn from "../FadeIn";
import Section from "../Section";
import Container from "../Container";
import Button from "../Button";
import { REASSURANCE_LINE, SESSION_TYPES } from "@/config/sessions";

export default function CoachingBooking() {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset loading state when the user navigates back from Stripe via the
  // browser's back button — the bfcache may restore the page with stale state.
  useEffect(() => {
    const onShow = () => {
      setLoadingKey(null);
      setError(null);
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  async function startCheckout(sessionType: string) {
    setLoadingKey(sessionType);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionType }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Checkout failed.");
      }
      window.location.assign(data.url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
      setLoadingKey(null);
    }
  }

  return (
    <Section id="book" className="bg-neutral-900">
      <Container>
        <FadeIn className="mb-14 flex flex-col items-center text-center">
          <AccentLine className="mx-auto" />
          <h2 className="text-[26px] leading-[1.2] md:text-4xl">
            Ways to work together
          </h2>
        </FadeIn>

        <FadeIn>
          <div className="grid gap-6 md:grid-cols-3">
            {SESSION_TYPES.map((session) => {
              const loading = loadingKey === session.id;
              const anyLoading = loadingKey !== null;
              const cardBorder = session.isHighlighted
                ? "border-2 border-accent-500"
                : "border border-neutral-700";

              return (
                <div
                  key={session.id}
                  className={`relative flex flex-col overflow-hidden rounded-xl bg-neutral-800 p-8 ${cardBorder}`}
                >
                  <h3 className="text-balance text-base leading-tight font-medium text-white md:text-lg">
                    {session.audienceHeadline}
                  </h3>
                  <p className="mt-3 text-xs font-medium tracking-[0.08em] text-accent-500 uppercase">
                    {session.name} — ${session.priceUsd}
                  </p>

                  <p className="mt-5 text-sm leading-[1.7] text-neutral-300">
                    {session.body}
                  </p>

                  <div className="mt-auto pt-8">
                    <Button
                      onClick={() => startCheckout(session.id)}
                      className={`w-full ${anyLoading && !loading ? "opacity-50" : ""}`}
                    >
                      {loading ? (
                        <>
                          <svg
                            className="mr-2 h-3.5 w-3.5 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                          </svg>
                          Redirecting…
                        </>
                      ) : (
                        "Book"
                      )}
                    </Button>

                    {session.secondaryAction && (
                      <Link
                        href={session.secondaryAction.href}
                        className="mt-4 block text-center text-xs text-accent-500 underline underline-offset-2 hover:text-accent-400"
                      >
                        {session.secondaryAction.label} →
                      </Link>
                    )}

                    <p className="mt-6 border-t border-neutral-700/50 pt-4 text-center text-xs text-pretty text-neutral-500 italic">
                      {REASSURANCE_LINE}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {error && (
            <p className="mt-6 text-center text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
        </FadeIn>
      </Container>
    </Section>
  );
}
