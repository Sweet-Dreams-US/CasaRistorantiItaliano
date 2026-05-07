/* ==========================================================================
   CASA · menu.js — render menu from /data/menu.json
   - Each item has an Add-to-Order button wired to the shared cart
   - Wine section is informational only (in-house pour)
   - Sticky tab tracker for sections
   ========================================================================== */

import * as cart from "./cart.js";

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("data-") || k.startsWith("aria-")) node.setAttribute(k, v);
    else if (k in node) node[k] = v;
    else node.setAttribute(k, v);
  }
  children.flat().forEach((c) => {
    if (c == null) return;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return node;
}

function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

function decode(s) {
  return String(s)
    .replace(/&amp;/g, "&")
    .replace(/&deg;/g, "°")
    .replace(/&thinsp;/g, " ")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—");
}

(async function () {
  const root = $("#menu-root");
  const tabsRoot = $("#menu-tabs");
  if (!root) return;

  // Mount the floating cart on the menu page
  cart.mountFloatingCart();

  let data;
  try {
    const res = await fetch("data/menu.json");
    if (!res.ok) throw new Error("Menu fetch failed");
    data = await res.json();
  } catch (err) {
    root.textContent = "Menu temporarily unavailable. Please call the restaurant.";
    console.error(err);
    return;
  }

  const features = [
    { src: "assets/img/wood-fired-pizza.webp", title: "The brick oven", copy: "Lit at four. Charring bottoms by five. Out at midnight." },
    { src: "assets/img/pasta-hands.webp", title: "Hand-rolled, every morning", copy: "Eight pasta shapes, one rolling pin, the same wooden butcher block since 1985." },
    { src: "assets/img/lasagna.webp", title: "Lasagna della Nonna", copy: "Built and baked in deep ceramic. The whole sheet still bubbling when it lands." }
  ];

  // ----- Build tabs -----
  clear(tabsRoot);
  data.sections.forEach((sec, i) => {
    tabsRoot.appendChild(
      el("button", {
        type: "button",
        class: "menu-tab" + (i === 0 ? " is-active" : ""),
        "data-target": "sec-" + sec.id,
        text: decode(sec.name)
      })
    );
  });

  // ----- Build sections -----
  const frag = document.createDocumentFragment();

  data.sections.forEach((sec, idx) => {
    const isInfoOnly = sec.id === "vino"; // wine is in-house pour, not orderable online
    const section = el("section", { class: "menu-section", id: "sec-" + sec.id, "aria-labelledby": "sec-" + sec.id + "-title" });

    const head = el("header", { class: "menu-section__head" });
    head.appendChild(el("span", { class: "menu-section__num", text: sec.num }));

    const title = el("h2", { id: "sec-" + sec.id + "-title", class: "menu-section__title" });
    title.appendChild(document.createTextNode(decode(sec.name)));
    title.appendChild(el("br"));
    title.appendChild(el("em", { text: decode(sec.english) }));
    head.appendChild(title);

    if (sec.sub) head.appendChild(el("span", { class: "menu-section__sub", text: decode(sec.sub) }));
    section.appendChild(head);

    const list = el("div", { class: "menu-section__list" });
    sec.items.forEach((it) => {
      const item = el("div", { class: "menu-item" + (isInfoOnly ? " is-info" : "") });

      const left = el("div");
      const nameDiv = el("div", { class: "menu-item__name" });
      nameDiv.appendChild(document.createTextNode(decode(it.name)));
      if (it.house) nameDiv.appendChild(el("span", { class: "badge-mark", title: "House signature" }));
      if (it.veg) nameDiv.appendChild(el("span", { class: "badge-mark veg", title: "Vegetarian" }));
      if (it.gf) nameDiv.appendChild(el("span", { class: "badge-mark gf", title: "Gluten-free preparation available" }));
      left.appendChild(nameDiv);
      if (it.italian) left.appendChild(el("span", { class: "menu-item__sub", text: decode(it.italian) }));
      item.appendChild(left);

      const priceText = typeof it.price === "number" ? "$" + it.price : it.price;
      item.appendChild(el("div", { class: "menu-item__price", text: priceText }));

      if (it.desc) item.appendChild(el("div", { class: "menu-item__desc", text: decode(it.desc) }));

      // Add-to-Order button (skip for in-house wine pours)
      if (!isInfoOnly && typeof it.price === "number") {
        const addBtn = el(
          "button",
          {
            type: "button",
            class: "menu-item__add",
            "data-id": it.id,
            "data-name": decode(it.name),
            "data-italian": decode(it.italian || ""),
            "data-price": String(it.price),
            "aria-label": `Add ${decode(it.name)} to your order`
          },
          el("span", { class: "plus", text: "+" }),
          " Add to Order"
        );
        addBtn.addEventListener("click", () => {
          cart.add({
            id: it.id,
            name: decode(it.name),
            italian: decode(it.italian || ""),
            price: it.price
          });
          // Visual feedback
          addBtn.classList.add("is-added");
          const orig = addBtn.lastChild;
          const origText = " Add to Order";
          addBtn.lastChild.textContent = " Added ✦";
          setTimeout(() => {
            addBtn.classList.remove("is-added");
            addBtn.lastChild.textContent = origText;
          }, 900);
        });
        item.appendChild(addBtn);
      }

      list.appendChild(item);
    });
    section.appendChild(list);
    frag.appendChild(section);

    // Insert decorative image every 3 sections
    if ((idx + 1) % 3 === 0 && idx !== data.sections.length - 1) {
      const f = features[Math.floor(idx / 2) % features.length];
      const feat = el("div", { class: "menu-feature" });
      feat.appendChild(el("img", { src: f.src, alt: "", loading: "lazy" }));
      const cap = el("div", { class: "menu-feature__caption" });
      cap.appendChild(el("div", { class: "menu-feature__title", text: f.title }));
      cap.appendChild(el("div", { class: "menu-feature__copy", text: f.copy }));
      feat.appendChild(cap);
      frag.appendChild(feat);
    }
  });

  // Closing note
  const note = el("div", { class: "menu-note" });
  note.appendChild(el("span", { class: "menu-note__num", text: "·" }));
  const noteBody = el("div");
  noteBody.appendChild(el("h4", { text: "Gluten-free & Vegetarian" }));
  noteBody.appendChild(
    el("p", {
      text:
        "Casa offers complete gluten-free preparations of most pastas, all pizze and most entrées. Vegetarian dishes are marked. Tell your server about any allergens — our kitchens know how to keep their hands clean."
    })
  );
  note.appendChild(noteBody);
  frag.appendChild(note);

  clear(root);
  root.appendChild(frag);

  // ----- Tab interactions -----
  const tabs = tabsRoot.querySelectorAll(".menu-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const id = tab.getAttribute("data-target");
      const sec = document.getElementById(id);
      if (!sec) return;
      const offset = 128;
      const top = sec.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });

  if ("IntersectionObserver" in window) {
    const sections = root.querySelectorAll(".menu-section");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.target === id));
          }
        });
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: 0 }
    );
    sections.forEach((s) => io.observe(s));
  }
})();
