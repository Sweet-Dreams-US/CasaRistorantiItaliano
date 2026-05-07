/* ==========================================================================
   CASA · reveal.js — IntersectionObserver-based scroll reveals
   ========================================================================== */

export function initReveal() {
  const targets = document.querySelectorAll(".reveal, .reveal--mask");
  if (!targets.length) return;

  // If reduced motion, just show everything
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    targets.forEach((t) => t.classList.add("is-visible"));
    return;
  }

  if (!("IntersectionObserver" in window)) {
    targets.forEach((t) => t.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
  );

  targets.forEach((t) => io.observe(t));
}
