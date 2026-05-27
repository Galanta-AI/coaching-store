import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { SITE } from "@/config/site";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(`https://${SITE.productionDomain}`),
  title: {
    default: SITE.siteName,
    template: `%s — ${SITE.siteName}`,
  },
  description: SITE.tagline,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: `https://${SITE.productionDomain}`,
    siteName: SITE.siteName,
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased`}>{children}</body>
    </html>
  );
}
