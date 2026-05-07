/* ==========================================================================
   CASA · timeline.js — horizontal scroll affordance + drag + wheel + keys
   ========================================================================== */

(function () {
  const wrap = document.querySelector(".timeline__track-wrap");
  if (!wrap) return;

  // Vertical wheel becomes horizontal scroll inside the track
  wrap.addEventListener(
    "wheel",
    (e) => {
      const dy = e.deltaY;
      const dx = e.deltaX;
      // If user is genuinely scrolling vertical and the track can scroll horizontally
      if (Math.abs(dy) > Math.abs(dx) && wrap.scrollWidth > wrap.clientWidth + 4) {
        const max = wrap.scrollWidth - wrap.clientWidth;
        const next = wrap.scrollLeft + dy;
        if (next > 0 && next < max) {
          wrap.scrollLeft = next;
          e.preventDefault();
        }
      }
    },
    { passive: false }
  );

  // Drag-to-scroll
  let isDown = false, startX = 0, startScroll = 0;
  wrap.addEventListener("mousedown", (e) => {
    isDown = true;
    startX = e.pageX - wrap.offsetLeft;
    startScroll = wrap.scrollLeft;
    wrap.style.cursor = "grabbing";
    wrap.style.userSelect = "none";
  });
  document.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    wrap.style.cursor = "";
    wrap.style.userSelect = "";
  });
  wrap.addEventListener("mouseleave", () => {
    if (!isDown) return;
    isDown = false;
    wrap.style.cursor = "";
    wrap.style.userSelect = "";
  });
  wrap.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - wrap.offsetLeft;
    const walk = (x - startX) * 1.4;
    wrap.scrollLeft = startScroll - walk;
  });

  // Keyboard navigation: ArrowLeft/Right
  wrap.addEventListener("keydown", (e) => {
    const step = wrap.clientWidth * 0.5;
    if (e.key === "ArrowRight") {
      wrap.scrollBy({ left: step, behavior: "smooth" });
      e.preventDefault();
    }
    if (e.key === "ArrowLeft") {
      wrap.scrollBy({ left: -step, behavior: "smooth" });
      e.preventDefault();
    }
    if (e.key === "Home") {
      wrap.scrollTo({ left: 0, behavior: "smooth" });
      e.preventDefault();
    }
    if (e.key === "End") {
      wrap.scrollTo({ left: wrap.scrollWidth, behavior: "smooth" });
      e.preventDefault();
    }
  });

  // Reveal each card as it enters viewport horizontally
  if ("IntersectionObserver" in window) {
    const cards = wrap.querySelectorAll(".tl-card");
    cards.forEach((c) => {
      c.style.opacity = "0";
      c.style.transform = "translateY(16px)";
      c.style.transition = "opacity 0.7s var(--ease-snap), transform 0.7s var(--ease-snap)";
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
            io.unobserve(entry.target);
          }
        });
      },
      { root: wrap, threshold: 0.18 }
    );

    cards.forEach((c) => io.observe(c));
  }
})();
