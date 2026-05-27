import Link from "next/link";
import { SITE } from "@/config/site";

const exploreLinks = [
  { label: "Coaching", href: "/coaching" },
  { label: "Contact", href: "/contact" },
  { label: "Security", href: "/security" },
  { label: "Privacy", href: "/privacy" },
];

interface FooterProps {
  /** Override the brand tagline shown beneath the site name. */
  tagline?: string;
}

export default function Footer({ tagline }: FooterProps = {}) {
  const taglineText = tagline ?? SITE.tagline;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-700 bg-neutral-800">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-3 lg:px-12">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-white">
            {SITE.siteName}
          </p>
          <p className="mt-3 text-sm text-neutral-500">{taglineText}</p>
        </div>

        <div>
          <h5 className="mb-4 text-[11px] font-medium uppercase tracking-[0.15em] text-neutral-400">
            Explore
          </h5>
          <ul className="space-y-2">
            {exploreLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-neutral-500 transition-colors duration-150 hover:text-neutral-300"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h5 className="mb-4 text-[11px] font-medium uppercase tracking-[0.15em] text-neutral-400">
            Connect
          </h5>
          <ul className="space-y-2">
            <li>
              <a
                href={`mailto:${SITE.contactEmail}`}
                className="text-sm text-neutral-500 transition-colors duration-150 hover:text-neutral-300"
              >
                {SITE.contactEmail}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-neutral-700">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-neutral-600 sm:flex-row lg:px-12">
          <span>&copy; {year} {SITE.siteName}. All rights reserved.</span>
          <Link href="/privacy" className="transition-colors hover:text-neutral-400">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
