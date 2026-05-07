/* ==========================================================================
   CASA · order.js — render orderable menu, manage cart, simulate Toast checkout
   Renders trusted JSON via DOM construction (no innerHTML for untrusted text).
   ========================================================================== */

import { buildOrderPayload, submitOrder } from "./toast-stub.js";

const TAX_RATE = 0.07; // 7% Indiana

const state = {
  location: "dupont",
  type: "pickup",
  items: [] // [{ id, name, italian, price, qty }]
};

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
const fmt = (n) => "$" + n.toFixed(2);

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("data-")) node.setAttribute(k, v);
    else if (k.startsWith("aria-")) node.setAttribute(k, v);
    else if (k in node) node[k] = v;
    else node.setAttribute(k, v);
  }
  children.flat().forEach((c) => {
    if (c == null) return;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return node;
}

function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

(async function init() {
  await renderMenu();
  bindConfig();
  bindCheckout();
  renderCart();
})();

async function renderMenu() {
  const root = $("#order-menu-root");
  if (!root) return;

  let data;
  try {
    const res = await fetch("data/menu.json");
    if (!res.ok) throw new Error();
    data = await res.json();
  } catch {
    root.textContent = "Menu temporarily unavailable. Please call your nearest Casa.";
    return;
  }

  // Filter sections that make sense for online order
  const orderable = data.sections.filter((s) => s.id !== "vino");

  const frag = document.createDocumentFragment();

  orderable.forEach((sec) => {
    const section = el("section", { class: "order-menu__section", "data-sec": sec.id });

    const title = el("h2", { class: "order-menu__title" });
    title.appendChild(document.createTextNode(sec.name + " "));
    title.appendChild(el("em", { text: sec.english }));
    section.appendChild(title);

    sec.items.forEach((it) => {
      const price = typeof it.price === "number" ? it.price : 0;
      const card = el("article", { class: "order-card", "data-id": it.id });

      const left = el("div");
      left.appendChild(el("div", { class: "order-card__name", text: it.name }));
      if (it.italian) {
        left.appendChild(el("span", { class: "order-card__sub", text: it.italian }));
      }
      card.appendChild(left);

      card.appendChild(el("div", { class: "order-card__price", text: fmt(price) }));

      if (it.desc) {
        // Description may contain HTML entities like &amp; from JSON; we treat
        // it as plain text to be safe.
        card.appendChild(el("p", { class: "order-card__desc", text: stripEntities(it.desc) }));
      }

      const btn = el(
        "button",
        {
          class: "order-card__btn",
          type: "button",
          "data-id": it.id,
          "data-name": it.name,
          "data-italian": it.italian || "",
          "data-price": String(price),
          "aria-label": `Add ${it.name} to your order`
        },
        el("span", { class: "plus", text: "+" }),
        " Add to Order"
      );
      card.appendChild(btn);

      section.appendChild(card);
    });

    frag.appendChild(section);
  });

  clear(root);
  root.appendChild(frag);

  root.addEventListener("click", (e) => {
    const btn = e.target.closest(".order-card__btn");
    if (!btn) return;
    addToCart({
      id: btn.dataset.id,
      name: btn.dataset.name,
      italian: btn.dataset.italian,
      price: parseFloat(btn.dataset.price)
    });
  });
}

// Decode HTML entities like &amp;, &deg;, &thinsp; for text rendering.
function stripEntities(s) {
  return String(s)
    .replace(/&amp;/g, "&")
    .replace(/&deg;/g, "°")
    .replace(/&thinsp;/g, " ")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—");
}

function addToCart(item) {
  const existing = state.items.find((i) => i.id === item.id);
  if (existing) existing.qty++;
  else state.items.push({ ...item, qty: 1 });
  renderCart(true);
}

function changeQty(id, delta) {
  const item = state.items.find((i) => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    state.items = state.items.filter((i) => i.id !== id);
  }
  renderCart();
}

function removeItem(id) {
  state.items = state.items.filter((i) => i.id !== id);
  renderCart();
}

function totals() {
  const subtotal = state.items.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = subtotal * TAX_RATE;
  const fee = state.type === "delivery" ? 4.99 : 0;
  const total = subtotal + tax + fee;
  return { subtotal, tax, fee, total };
}

function renderCart(pulse = false) {
  const list = $("#cart-list");
  const totalsEl = $("#cart-totals");
  const countEl = $("#cart-count");
  const submitBtn = $("#cart-checkout");

  clear(list);
  clear(totalsEl);

  if (!state.items.length) {
    const li = el("li", { class: "cart__empty" });
    li.appendChild(document.createTextNode("Your basket is still empty."));
    li.appendChild(el("br"));
    li.appendChild(el("span", { style: "color: var(--terracotta);", text: "The bread basket isn't." }));
    list.appendChild(li);
    countEl.textContent = "0 items";
    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.4";
    submitBtn.style.cursor = "not-allowed";
    return;
  }

  state.items.forEach((i) => {
    const li = el("li");
    const left = el("div");
    left.appendChild(el("div", { class: "cart__name", text: i.name }));
    if (i.italian) {
      left.appendChild(
        el("span", {
          class: "order-card__sub",
          style: "font-size: 0.75rem;",
          text: i.italian
        })
      );
    }
    li.appendChild(left);
    li.appendChild(el("div", { class: "cart__price", text: fmt(i.price * i.qty) }));

    const qty = el("div", { class: "cart__qty" });
    qty.appendChild(
      el("button", {
        type: "button",
        "data-action": "dec",
        "data-id": i.id,
        "aria-label": `Remove one ${i.name}`,
        text: "−"
      })
    );
    qty.appendChild(el("span", { text: String(i.qty) }));
    qty.appendChild(
      el("button", {
        type: "button",
        "data-action": "inc",
        "data-id": i.id,
        "aria-label": `Add one ${i.name}`,
        text: "+"
      })
    );
    qty.appendChild(
      el("button", {
        type: "button",
        class: "cart__remove",
        "data-action": "remove",
        "data-id": i.id,
        text: "remove"
      })
    );
    li.appendChild(qty);

    list.appendChild(li);
  });

  const t = totals();
  const itemCount = state.items.reduce((s, i) => s + i.qty, 0);
  countEl.textContent = `${itemCount} item${itemCount === 1 ? "" : "s"}`;

  const rows = [
    { label: "Subtotal", val: fmt(t.subtotal), grand: false }
  ];
  rows.push({ label: "Tax (7%)", val: fmt(t.tax), grand: false });
  if (state.type === "delivery") {
    rows.push({ label: "Delivery fee", val: fmt(t.fee), grand: false });
  }
  rows.push({ label: "Total", val: fmt(t.total), grand: true });

  rows.forEach((r) => {
    const labelClass = "label" + (r.grand ? " row--grand" : "");
    const valClass = "val" + (r.grand ? " row--grand" : "");
    totalsEl.appendChild(el("span", { class: labelClass, text: r.label }));
    totalsEl.appendChild(el("span", { class: valClass, text: r.val }));
  });

  submitBtn.disabled = false;
  submitBtn.style.opacity = "1";
  submitBtn.style.cursor = "pointer";

  if (pulse) {
    const cart = $(".cart");
    if (cart && cart.animate) {
      cart.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.02)" }, { transform: "scale(1)" }],
        { duration: 300, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
      );
    }
  }
}

function bindConfig() {
  $$(".choice").forEach((btn) => {
    btn.addEventListener("click", () => {
      const group = btn.dataset.group;
      const value = btn.dataset.value;
      $$(`.choice[data-group="${group}"]`).forEach((b) =>
        b.classList.toggle("is-active", b === btn)
      );
      state[group] = value;
      renderCart();
    });
  });

  $("#cart-list").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    if (action === "inc") changeQty(id, 1);
    else if (action === "dec") changeQty(id, -1);
    else if (action === "remove") removeItem(id);
  });
}

function bindCheckout() {
  const overlay = $("#checkout");
  const btn = $("#cart-checkout");
  const closeBtn = $("#checkout-close");
  const form = $("#checkout-form");
  const success = $("#checkout-success");
  const formWrap = $("#checkout-form-wrap");

  btn.addEventListener("click", () => {
    if (!state.items.length) return;
    overlay.classList.add("is-open");
    success.style.display = "none";
    formWrap.style.display = "block";
    form.reset();
    $$("[data-only-delivery]").forEach((elNode) => {
      elNode.style.display = state.type === "delivery" ? "" : "none";
    });
  });

  closeBtn.addEventListener("click", () => overlay.classList.remove("is-open"));
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("is-open");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const customer = {
      name: fd.get("name"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      address: fd.get("address"),
      zip: fd.get("zip"),
      notes: fd.get("notes")
    };

    const payload = buildOrderPayload({
      location: state.location,
      type: state.type,
      items: state.items,
      customer,
      when: new Date().toISOString()
    });

    const submitBtn = form.querySelector('button[type="submit"]');
    const orig = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending to the kitchen…";

    try {
      const result = await submitOrder(payload);
      const eta = new Date(result.estimatedReadyTime);
      const etaStr = eta.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

      formWrap.style.display = "none";
      success.style.display = "block";
      $("#order-display-num").textContent = result.displayNumber;
      $("#order-eta").textContent = etaStr;
      $("#order-loc").textContent =
        ({ dupont: "Dupont", stellhorn: "Stellhorn", jefferson: "W. Jefferson", parnell: "Parnell" })[state.location] || "";
      $("#order-total").textContent = fmt(totals().total);

      state.items = [];
      renderCart();
    } catch (err) {
      submitBtn.textContent = "Try again";
      console.error(err);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = orig;
    }
  });
}
