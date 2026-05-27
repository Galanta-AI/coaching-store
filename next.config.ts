import type { NextConfig } from "next";
import { SITE } from "./src/config/site";

const isDev = process.env.NODE_ENV === "development";

const cspScriptSrc = [
  "'self'",
  "'unsafe-inline'",
  ...(isDev ? ["'unsafe-eval'"] : []),
  ...(SITE.subprocessors.posthog
    ? ["https://us.i.posthog.com", "https://us-assets.i.posthog.com"]
    : []),
  ...(SITE.subprocessors.turnstile ? ["https://challenges.cloudflare.com"] : []),
];

const cspConnectSrc = [
  "'self'",
  ...(SITE.subprocessors.posthog
    ? ["https://us.i.posthog.com", "https://us-assets.i.posthog.com"]
    : []),
  ...(SITE.subprocessors.turnstile ? ["https://challenges.cloudflare.com"] : []),
];

const cspFrameSrc = SITE.subprocessors.turnstile
  ? ["https://challenges.cloudflare.com"]
  : ["'none'"];

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    minimumCacheTTL: 2592000,
  },
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000" }],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src ${cspScriptSrc.join(" ")}`,
              "style-src 'self' 'unsafe-inline'",
              `connect-src ${cspConnectSrc.join(" ")}`,
              `frame-src ${cspFrameSrc.join(" ")}`,
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
