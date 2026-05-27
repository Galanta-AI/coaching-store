import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Section from "@/components/Section";
import Container from "@/components/Container";
import AccentLine from "@/components/AccentLine";
import { SITE } from "@/config/site";

export const metadata: Metadata = {
  title: "Security",
  description: `${SITE.siteName} security posture and disclosure policy.`,
};

export default function SecurityPage() {
  return (
    <>
      <Navbar />
      <main>
        <Section className="bg-neutral-900 pt-28 md:pt-36">
          <Container>
            <article className="mx-auto max-w-[720px]">
              <AccentLine />
              <h1
                className="text-3xl md:text-4xl"
                style={{ textTransform: "none", letterSpacing: "-0.01em" }}
              >
                Security
              </h1>
              <div className="mt-10 space-y-6 text-neutral-300">
                <p>
                  {SITE.siteName} runs on a hardened, PCI-conscious stack. Card details
                  never touch this site &mdash; checkout is fully hosted by Stripe.
                </p>

                <h2 className="mt-10 text-xl text-white">Hard guarantees</h2>
                <ul className="ml-6 list-disc space-y-2">
                  <li>
                    <strong>Zero card data on the site.</strong> Stripe Checkout is hosted
                    by Stripe; cards are entered on Stripe&rsquo;s domain, never ours. The
                    site stays in PCI Level 3 scope by design.
                  </li>
                  <li>
                    <strong>Signed webhooks.</strong> Every Stripe webhook is verified via
                    raw-body HMAC (<code className="text-accent-500">constructEvent</code>);
                    forged events are rejected with HTTP 400.
                  </li>
                  <li>
                    <strong>Secrets isolation.</strong> Production secrets live in Vercel
                    encrypted environment variables. Local development uses{" "}
                    <code className="text-accent-500">.env.local</code> (gitignored). Live
                    Stripe keys are pinned to a separate{" "}
                    <code className="text-accent-500">.env.live</code> file and never
                    leave your machine for setup scripts.
                  </li>
                  <li>
                    <strong>Idempotent webhook side effects.</strong> The post-checkout
                    email send is keyed by the Stripe event ID, so duplicate webhook
                    deliveries don&rsquo;t double-send.
                  </li>
                  <li>
                    <strong>Security headers.</strong> HSTS (1 year), X-Frame-Options DENY,
                    Permissions-Policy disabling camera/mic/geolocation, CSP with{" "}
                    <code className="text-accent-500">frame-ancestors &lsquo;none&rsquo;</code>.
                  </li>
                  <li>
                    <strong>Kill switch.</strong> Setting{" "}
                    <code className="text-accent-500">STRIPE_DISABLED=true</code> makes the
                    site return 503 on checkout and webhook; Stripe holds and retries events
                    while incident response is in progress.
                  </li>
                  <li>
                    <strong>Input validation.</strong> Every API route validates its body
                    with zod before doing any work.
                  </li>
                  <li>
                    <strong>CI gates.</strong> Every pull request runs gitleaks,{" "}
                    <code className="text-accent-500">npm audit</code>, lint, and type
                    checks before merge.
                  </li>
                </ul>

                <h2 className="mt-10 text-xl text-white">Best-effort, not a hard limit</h2>
                <p>
                  The checkout endpoint has an in-memory per-IP rate limit. On serverless
                  this is best-effort: it reduces noise from misbehaving clients but does
                  not survive cold starts or coordinate across function instances. We do
                  not market this as a security control. The upgrade path to a distributed
                  limiter (Upstash Redis or Vercel KV) is one drop-in change to{" "}
                  <code className="text-accent-500">src/lib/ratelimit.ts</code>.
                </p>

                <h2 className="mt-10 text-xl text-white">Responsible disclosure</h2>
                <p>
                  Found a security issue? Email{" "}
                  <a
                    className="text-accent-500 underline"
                    href={`mailto:${SITE.disclosureEmail}`}
                  >
                    {SITE.disclosureEmail}
                  </a>
                  . Please give us a reasonable window to investigate and patch before
                  public disclosure. We aim to acknowledge within two business days.
                </p>
              </div>
            </article>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
