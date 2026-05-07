/* ==========================================================================
   CASA · main.js — entry point
   - Mobile nav toggle
   - Scroll reveal observer
   - Year stamp
   - Marquee duplication safety
   - Smooth anchor scroll
   ========================================================================== */

import { initReveal } from "./reveal.js";
import { initNav } from "./nav.js";

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initReveal();
  stampYear();
  initSmoothAnchors();
  initParallaxFrames();
});

function stampYear() {
  const y = $("#year");
  if (y) y.textContent = new Date().getFullYear();
}

function initSmoothAnchors() {
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length <= 1) return;
      const el = $(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", id);
    });
  });
}

/* Subtle parallax on .frame img inside .reveal — drift up to ~12% on scroll */
function initParallaxFrames() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const targets = $$(".dish__frame img, .story-preview__media img, .hero__primary img");
  if (!targets.length || !("IntersectionObserver" in window)) return;

  const onScroll = () => {
    const vh = window.innerHeight;
    targets.forEach((img) => {
      const rect = img.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vh) return;
      const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
      const offset = -progress * 14;
      img.style.transform = `translate3d(0, ${offset}px, 0) scale(1.06)`;
    });
  };

  let raf = null;
  const onScrollRaf = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      onScroll();
      raf = null;
    });
  };

  window.addEventListener("scroll", onScrollRaf, { passive: true });
  window.addEventListener("resize", onScrollRaf);
  onScroll();
}
