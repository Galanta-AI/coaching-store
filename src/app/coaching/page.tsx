import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CoachingHero from "@/components/coaching/CoachingHero";
import CoachingBooking from "@/components/coaching/CoachingBooking";
import CoachingFAQ from "@/components/coaching/CoachingFAQ";
import CoachingCTA from "@/components/coaching/CoachingCTA";

export default function CoachingPage() {
  return (
    <>
      <Navbar ctaLabel="Book a Session" ctaHref="#book" />
      <main>
        <CoachingHero />
        <CoachingBooking />
        <CoachingFAQ />
        <CoachingCTA />
      </main>
      <Footer />
    </>
  );
}
