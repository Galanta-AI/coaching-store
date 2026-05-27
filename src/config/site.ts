/**
 * Site-wide configuration. Edit this file (or have /setup edit it for you).
 * Every brand-specific string in the codebase reads from here.
 */

export interface SiteConfig {
  /** Namespace prefix for Stripe lookup keys + coupon IDs. lower-case, no spaces, hyphens ok. */
  siteSlug: string;
  /** Display name. Used in navbar, footer, page titles, email copy. */
  siteName: string;
  /** Coach name. Used in bio and hero. */
  coachName: string;
  /** One-line tagline shown in the footer. */
  tagline: string;
  /** Production domain (no protocol, no trailing slash). e.g. "example.com" */
  productionDomain: string;
  /** Optional staging domain (no protocol). e.g. "staging.example.com" */
  stagingDomain?: string;
  /** Public contact email. */
  contactEmail: string;
  /** Security disclosure email. Shown in SECURITY.md and /security. */
  disclosureEmail: string;
  /**
   * Subprocessor toggles. Each one expands the CSP allowlist in next.config.ts
   * AND determines which env vars /setup will ask for.
   *
   * Stripe / Cal.com / Resend are always on — they are the core integrations.
   */
  subprocessors: {
    posthog: boolean;
    turnstile: boolean;
    readonly stripe: true;
    readonly calcom: true;
    readonly resend: true;
  };
}

export const SITE: SiteConfig = {
  siteSlug: "coaching-store",
  siteName: "Coaching Store",
  coachName: "Your Name",
  tagline: "Coaching that respects your time.",
  productionDomain: "example.com",
  contactEmail: "hello@example.com",
  disclosureEmail: "security@example.com",
  subprocessors: {
    posthog: false,
    turnstile: false,
    stripe: true,
    calcom: true,
    resend: true,
  },
};

/**
 * Origins allowed for API POST routes. Computed from productionDomain +
 * stagingDomain (if set) + localhost (in development).
 */
export function allowedOrigins(): Set<string> {
  const set = new Set<string>([
    `https://${SITE.productionDomain}`,
    `https://www.${SITE.productionDomain}`,
  ]);
  if (SITE.stagingDomain) {
    set.add(`https://${SITE.stagingDomain}`);
  }
  if (process.env.NODE_ENV === "development") {
    set.add("http://localhost:3000");
  }
  return set;
}
