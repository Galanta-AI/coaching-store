"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Section from "@/components/Section";
import Container from "@/components/Container";
import AccentLine from "@/components/AccentLine";
import Button from "@/components/Button";

export default function ContactPage() {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedAt = useRef<number>(0);

  // Reset on bfcache restore.
  useEffect(() => {
    mountedAt.current = Date.now();
    const onShow = () => {
      mountedAt.current = Date.now();
      setSuccess(false);
      setError(null);
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const data = new FormData(form);
    const body = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      company: String(data.get("company") ?? "") || undefined,
      message: String(data.get("message") ?? ""),
      website: String(data.get("website") ?? ""),
      elapsedMs: Date.now() - mountedAt.current,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? "Send failed.");
      }
      setSuccess(true);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar minimal ctaLabel="Coaching" ctaHref="/coaching" />
      <main>
        <Section className="bg-neutral-900 pt-28 md:pt-36">
          <Container>
            <div className="mx-auto max-w-[560px]">
              <AccentLine />
              <h1
                className="text-3xl md:text-4xl"
                style={{ textTransform: "none", letterSpacing: "-0.01em" }}
              >
                Get in touch
              </h1>
              <p className="mt-4 text-neutral-400">
                Have a question that doesn&rsquo;t fit a session? Drop a note.
              </p>

              {success ? (
                <p className="mt-10 rounded-md border border-accent-500/40 bg-accent-500/10 p-4 text-sm text-accent-300">
                  Thanks — message received. I&rsquo;ll get back to you within
                  two business days.
                </p>
              ) : (
                <form onSubmit={onSubmit} className="mt-10 space-y-5">
                  {/* Honeypot — must stay empty */}
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    className="hidden"
                    aria-hidden="true"
                  />
                  <Field name="name" label="Name" required />
                  <Field name="email" type="email" label="Email" required />
                  <Field name="company" label="Company (optional)" />
                  <div>
                    <label
                      htmlFor="message"
                      className="mb-2 block text-xs font-medium uppercase tracking-[0.1em] text-neutral-400"
                    >
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-4 py-3 text-base text-neutral-100 focus:border-accent-500 focus:outline-none"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-400" role="alert">
                      {error}
                    </p>
                  )}

                  <Button type="submit" className={submitting ? "opacity-50" : ""}>
                    {submitting ? "Sending…" : "Send"}
                  </Button>
                </form>
              )}
            </div>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-xs font-medium uppercase tracking-[0.1em] text-neutral-400"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-4 py-3 text-base text-neutral-100 focus:border-accent-500 focus:outline-none"
      />
    </div>
  );
}
