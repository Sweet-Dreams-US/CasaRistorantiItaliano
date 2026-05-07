/* ==========================================================================
   CASA · nav.js
   ========================================================================== */

export function initNav() {
  const nav = document.getElementById("site-nav");
  if (!nav) return;
  const burger = nav.querySelector(".nav__burger");
  const menu = nav.querySelector(".nav__menu");

  if (burger && menu) {
    burger.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", String(open));
    });

    menu.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        nav.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Highlight current page
  const here = location.pathname.split("/").pop() || "index.html";
  nav.querySelectorAll(".nav__link").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === here) a.setAttribute("aria-current", "page");
  });

  // Scroll glass effect
  let lastScroll = 0;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 12);
    lastScroll = y;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}
