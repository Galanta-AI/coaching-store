/**
 * Smoothly scroll an in-page section into view by element id.
 *
 * Idempotent — re-scrolls on every call regardless of URL/hash state — and
 * honors `prefers-reduced-motion`. Respects each target's `scroll-margin-top`,
 * so id'd Section components land below the fixed navbar.
 */
export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}
