import type { Metadata } from "next";
import { SITE } from "@/config/site";

export const metadata: Metadata = {
  title: `1:1 Coaching with ${SITE.coachName}`,
  description: `Paid 1:1 coaching sessions with ${SITE.coachName}. ${SITE.tagline}`,
  openGraph: {
    title: `${SITE.siteName} — 1:1 Coaching with ${SITE.coachName}`,
    description: `Paid 1:1 coaching sessions with ${SITE.coachName}. ${SITE.tagline}`,
    url: `https://${SITE.productionDomain}/coaching`,
  },
};

export default function CoachingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
