/* ==========================================================================
   CASA · cart.js — shared cart + complete inline ordering flow
   - Persists to localStorage under 'casa_cart_v1' (items) and 'casa_order_v1' (config)
   - Listens for cross-tab updates via 'storage' event
   - Mounts a floating bottom-right widget that contains the WHOLE order flow:
     items, location, pickup/delivery, customer fields, Toast-stub submission
   - All dynamic UI built via DOM construction (no innerHTML)
   ========================================================================== */

import { buildOrderPayload, submitOrder } from "./toast-stub.js";

const ITEMS_KEY = "casa_cart_v1";
const ORDER_KEY = "casa_order_v1";
const TAX_RATE = 0.07;
const DELIVERY_FEE = 4.99;

const LOCATIONS = [
  { id: "dupont", short: "Dupont", full: "Casa Grille · Dupont" },
  { id: "stellhorn", short: "Stellhorn", full: "Casa Grille Italiano · Stellhorn" },
  { id: "jefferson", short: "W. Jefferson", full: "Casa! Ristorante · W. Jefferson" },
  { id: "parnell", short: "Parnell", full: "Casa Ristorante Italiano · Parnell" }
];

const listeners = new Set();

// ---------- Persistence ----------

function readItems() {
  try {
    const raw = localStorage.getItem(ITEMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i) => i && typeof i.id === "string" && typeof i.price === "number" && i.qty > 0
    );
  } catch { return []; }
}

function writeItems(items) {
  try { localStorage.setItem(ITEMS_KEY, JSON.stringify(items)); } catch {}
  notify();
}

function readConfig() {
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    if (!raw) return { location: "dupont", type: "pickup" };
    const c = JSON.parse(raw);
    return {
      location: typeof c?.location === "string" ? c.location : "dupont",
      type: c?.type === "delivery" ? "delivery" : "pickup"
    };
  } catch { return { location: "dupont", type: "pickup" }; }
}

function writeConfig(cfg) {
  try { localStorage.setItem(ORDER_KEY, JSON.stringify(cfg)); } catch {}
  notify();
}

function notify() {
  listeners.forEach((fn) => { try { fn(readItems(), readConfig()); } catch (e) { console.error(e); } });
}

export function subscribe(fn) {
  listeners.add(fn);
  if (!subscribe._wired) {
    window.addEventListener("storage", (e) => {
      if (e.key === ITEMS_KEY || e.key === ORDER_KEY) notify();
    });
    subscribe._wired = true;
  }
  fn(readItems(), readConfig());
  return () => listeners.delete(fn);
}

// ---------- Public API ----------

export function getItems() { return readItems(); }
export function getConfig() { return readConfig(); }
export function getCount() { return readItems().reduce((s, i) => s + i.qty, 0); }

export function getTotals() {
  const items = readItems();
  const cfg = readConfig();
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = subtotal * TAX_RATE;
  const delivery = cfg.type === "delivery" && items.length ? DELIVERY_FEE : 0;
  const total = subtotal + tax + delivery;
  return { subtotal, tax, delivery, total, items, cfg };
}

export function add(item) {
  if (!item || !item.id) return;
  const items = readItems();
  const found = items.find((i) => i.id === item.id);
  if (found) found.qty++;
  else items.push({
    id: item.id,
    name: item.name || item.id,
    italian: item.italian || "",
    price: Number(item.price) || 0,
    qty: 1
  });
  writeItems(items);
}

export function setQty(id, qty) {
  let items = readItems();
  if (qty <= 0) items = items.filter((i) => i.id !== id);
  else {
    const it = items.find((i) => i.id === id);
    if (it) it.qty = qty;
  }
  writeItems(items);
}

export function remove(id) { writeItems(readItems().filter((i) => i.id !== id)); }
export function clear() { writeItems([]); }
export function setLocation(id) { writeConfig({ ...readConfig(), location: id }); }
export function setType(t) { writeConfig({ ...readConfig(), type: t }); }

export const fmt = (n) => "$" + Number(n).toFixed(2);

// ---------- DOM helpers ----------

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

function clearNode(node) { while (node.firstChild) node.removeChild(node.firstChild); }

// ---------- Floating cart widget ----------

export function mountFloatingCart() {
  if (typeof document === "undefined") return;
  const existing = document.getElementById("casa-floating-cart");
  if (existing) return existing;

  const wrap = el("aside", {
    id: "casa-floating-cart",
    class: "fcart",
    "aria-live": "polite",
    "aria-label": "Your order"
  });

  // ---- Pill button ----
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  const p1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  p1.setAttribute("d", "M5 7h14l-1.5 10.5a2 2 0 0 1-2 1.5h-7a2 2 0 0 1-2-1.5L5 7z");
  const p2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  p2.setAttribute("d", "M9 7V5a3 3 0 0 1 6 0v2");
  svg.appendChild(p1); svg.appendChild(p2);

  const $count = el("span", { class: "fcart__count", "data-count": "" }, "0");
  const $label = el("span", { class: "fcart__label", "data-label": "" }, "items");
  const $total = el("span", { class: "fcart__total", "data-total": "" }, "$0.00");
  const $cta = el("span", { class: "fcart__cta", "aria-hidden": "true" }, "Review →");
  const $pulse = el("span", { class: "fcart__pulse" });
  const $iconWrap = el("span", { class: "fcart__icon", "aria-hidden": "true" });
  $iconWrap.appendChild(svg);
  const $body = el("span", { class: "fcart__body" }, $count, $label);

  const $btn = el(
    "button",
    { type: "button", class: "fcart__btn", "data-action": "open" },
    $pulse, $iconWrap, $body, $total, $cta
  );

  // ---- Panel ----
  const $headTitle = el("h3", { text: "Your Order" });
  const $closeBtn = el(
    "button",
    { type: "button", class: "fcart__close", "data-action": "close", "aria-label": "Close cart" },
    "×"
  );
  const $head = el("div", { class: "fcart__head" }, $headTitle, $closeBtn);

  // Config: location + pickup/delivery
  const $locLabel = el("span", { class: "fcart__cfg-label", text: "Order from" });
  const $locRow = el("div", { class: "fcart__choices", "data-loc-row": "" });
  LOCATIONS.forEach((l) => {
    $locRow.appendChild(el("button", {
      type: "button", class: "fcart__choice", "data-loc": l.id, text: l.short
    }));
  });
  const $typeLabel = el("span", { class: "fcart__cfg-label", text: "How" });
  const $typeRow = el("div", { class: "fcart__choices", "data-type-row": "" });
  $typeRow.appendChild(el("button", { type: "button", class: "fcart__choice", "data-type": "pickup", text: "Pickup" }));
  $typeRow.appendChild(el("button", { type: "button", class: "fcart__choice", "data-type": "delivery", text: "Delivery" }));
  const $config = el("div", { class: "fcart__config" }, $locLabel, $locRow, $typeLabel, $typeRow);

  const $list = el("ul", { class: "fcart__list", "data-list": "" });
  const $tots = el("div", { class: "fcart__totals", "data-totals": "" });

  // Inline checkout form (hidden until "Checkout" pressed)
  const $form = el("form", { class: "fcart__form", "data-form": "", novalidate: "" });
  const mkField = (id, label, type = "text", attrs = {}) => {
    const wrap = el("div", { class: "fcart__field" });
    wrap.appendChild(el("label", { for: id, text: label }));
    wrap.appendChild(el("input", { id, name: id, type, ...attrs }));
    return wrap;
  };
  $form.appendChild(mkField("ck-name", "Name", "text", { required: true, autocomplete: "name", placeholder: "Your name" }));
  const $rowEP = el("div", { class: "fcart__form-row" });
  $rowEP.appendChild(mkField("ck-email", "Email", "email", { required: true, autocomplete: "email", placeholder: "you@example.com" }));
  $rowEP.appendChild(mkField("ck-phone", "Phone", "tel", { required: true, autocomplete: "tel", placeholder: "(260) 555-0177" }));
  $form.appendChild($rowEP);
  // Address (delivery only)
  const $addr = mkField("ck-addr", "Delivery address", "text", { autocomplete: "street-address", placeholder: "421 W Berry St" });
  $addr.classList.add("fcart__only-delivery");
  const $rowZip = el("div", { class: "fcart__form-row fcart__only-delivery" });
  $rowZip.appendChild(mkField("ck-zip", "ZIP", "text", { pattern: "[0-9]{5}", autocomplete: "postal-code", placeholder: "46802" }));
  $rowZip.appendChild(el("div"));
  $form.appendChild($addr);
  $form.appendChild($rowZip);
  // Notes
  const $notesWrap = el("div", { class: "fcart__field" });
  $notesWrap.appendChild(el("label", { for: "ck-notes", text: "Notes (optional)" }));
  $notesWrap.appendChild(el("textarea", { id: "ck-notes", name: "notes", rows: "2", placeholder: "Light salt on the salmon, please." }));
  $form.appendChild($notesWrap);

  const $submit = el(
    "button",
    { type: "submit", class: "btn fcart__submit" },
    "Place Order ",
    el("span", { class: "btn__arrow" }, "→")
  );
  $form.appendChild($submit);
  const $stubNote = el(
    "p",
    { class: "fcart__form-note" },
    "Routes to ",
    el("strong", { text: "Toast POS" }),
    " at your selected Casa. Demo: returns a fake confirmation."
  );
  $form.appendChild($stubNote);

  // Success state
  const $success = el("div", { class: "fcart__success", "data-success": "" });

  // Actions
  const $checkBtn = el(
    "button",
    { type: "button", class: "btn fcart__check", "data-action": "checkout" },
    "Checkout ",
    el("span", { class: "btn__arrow" }, "→")
  );
  const $backBtn = el(
    "button",
    { type: "button", class: "fcart__back", "data-action": "back" },
    "← Back to cart"
  );
  $backBtn.style.display = "none";
  const $clearBtn = el(
    "button",
    { type: "button", class: "fcart__clear", "data-action": "clear" },
    "Clear cart"
  );
  const $actions = el("div", { class: "fcart__actions" }, $checkBtn, $backBtn, $clearBtn);

  const $panel = el(
    "div",
    { class: "fcart__panel", role: "dialog", "aria-label": "Cart", "data-panel": "" },
    $head, $config, $list, $tots, $form, $success, $actions
  );

  // Form initially hidden, success initially hidden
  $form.style.display = "none";
  $success.style.display = "none";

  wrap.appendChild($btn);
  wrap.appendChild($panel);
  document.body.appendChild(wrap);

  // ---- Render ----
  function render(items, cfg) {
    const totals = (() => {
      const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
      const tax = subtotal * TAX_RATE;
      const delivery = cfg.type === "delivery" && items.length ? DELIVERY_FEE : 0;
      const total = subtotal + tax + delivery;
      return { subtotal, tax, delivery, total };
    })();
    const count = items.reduce((s, i) => s + i.qty, 0);

    wrap.classList.toggle("is-on", count > 0);
    $count.textContent = String(count);
    $label.textContent = count === 1 ? "item" : "items";
    $total.textContent = fmt(totals.total);

    // Pulse animation when count changes
    if ($btn._lastCount != null && $btn._lastCount !== count) {
      $btn.classList.remove("is-pulse");
      void $btn.offsetWidth;
      $btn.classList.add("is-pulse");
    }
    $btn._lastCount = count;

    // Active config buttons
    $locRow.querySelectorAll("button").forEach((b) =>
      b.classList.toggle("is-active", b.dataset.loc === cfg.location)
    );
    $typeRow.querySelectorAll("button").forEach((b) =>
      b.classList.toggle("is-active", b.dataset.type === cfg.type)
    );

    // Toggle delivery-only fields
    $panel.querySelectorAll(".fcart__only-delivery").forEach((node) => {
      node.style.display = cfg.type === "delivery" ? "" : "none";
    });

    // Items list
    clearNode($list);
    items.forEach((i) => {
      const left = el("div");
      left.appendChild(el("div", { class: "fcart__item-name", text: i.name }));
      if (i.italian) left.appendChild(el("div", { class: "fcart__item-sub", text: i.italian }));

      const price = el("div", { class: "fcart__item-price", text: fmt(i.price * i.qty) });

      const qty = el("div", { class: "fcart__item-qty" });
      qty.appendChild(el("button", {
        type: "button", "data-q": "dec", "data-id": i.id, "aria-label": `Remove one ${i.name}`
      }, "−"));
      qty.appendChild(el("span", { text: String(i.qty) }));
      qty.appendChild(el("button", {
        type: "button", "data-q": "inc", "data-id": i.id, "aria-label": `Add one ${i.name}`
      }, "+"));
      qty.appendChild(el("button", {
        type: "button", class: "fcart__rm", "data-q": "rm", "data-id": i.id
      }, "remove"));

      const li = el("li", { class: "fcart__item" }, left, price, qty);
      $list.appendChild(li);
    });

    // Totals
    clearNode($tots);
    if (items.length === 0) {
      $tots.appendChild(el("div", { class: "fcart__empty", text: "Your basket is empty. The bread basket isn't." }));
    } else {
      const row = (label, value, grand) => {
        const klass = grand ? "fcart__grand" : null;
        const div = el("div", klass ? { class: klass } : {});
        div.appendChild(el("span", { text: label }));
        div.appendChild(el("span", { text: value }));
        return div;
      };
      $tots.appendChild(row("Subtotal", fmt(totals.subtotal), false));
      $tots.appendChild(row("Tax (7%)", fmt(totals.tax), false));
      if (totals.delivery > 0) $tots.appendChild(row("Delivery fee", fmt(totals.delivery), false));
      $tots.appendChild(row("Total", fmt(totals.total), true));
    }

    // Disable checkout if empty
    $checkBtn.disabled = count === 0;
    $checkBtn.style.opacity = count === 0 ? "0.4" : "1";
    $checkBtn.style.cursor = count === 0 ? "not-allowed" : "pointer";
  }

  // ---- Interactions ----
  $btn.addEventListener("click", () => {
    $panel.classList.toggle("is-open");
  });
  $closeBtn.addEventListener("click", () => $panel.classList.remove("is-open"));
  $clearBtn.addEventListener("click", () => clear());

  $locRow.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-loc]");
    if (b) setLocation(b.dataset.loc);
  });
  $typeRow.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-type]");
    if (b) setType(b.dataset.type);
  });

  $list.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-q]");
    if (!b) return;
    const id = b.dataset.id;
    const action = b.dataset.q;
    const items = readItems();
    const it = items.find((i) => i.id === id);
    if (!it) return;
    if (action === "inc") setQty(id, it.qty + 1);
    else if (action === "dec") setQty(id, it.qty - 1);
    else if (action === "rm") remove(id);
  });

  // Switch to checkout form mode
  $checkBtn.addEventListener("click", () => {
    if (readItems().length === 0) return;
    $config.style.display = "none";
    $list.style.display = "none";
    $tots.style.display = "none";
    $form.style.display = "";
    $checkBtn.style.display = "none";
    $clearBtn.style.display = "none";
    $backBtn.style.display = "";
    $form.querySelector("#ck-name").focus();
  });

  $backBtn.addEventListener("click", () => {
    $config.style.display = "";
    $list.style.display = "";
    $tots.style.display = "";
    $form.style.display = "none";
    $success.style.display = "none";
    $checkBtn.style.display = "";
    $clearBtn.style.display = "";
    $backBtn.style.display = "none";
  });

  // Submit order (Toast stub)
  $form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData($form);
    const cfg = readConfig();
    const items = readItems();
    if (!items.length) return;

    const customer = {
      name: fd.get("ck-name"),
      email: fd.get("ck-email"),
      phone: fd.get("ck-phone"),
      address: fd.get("ck-addr") || "",
      zip: fd.get("ck-zip") || "",
      notes: fd.get("notes") || ""
    };

    const payload = buildOrderPayload({
      location: cfg.location,
      type: cfg.type,
      items,
      customer,
      when: new Date().toISOString()
    });

    const orig = $submit.textContent;
    $submit.disabled = true;
    $submit.textContent = "Sending to the kitchen…";

    try {
      const res = await submitOrder(payload);
      const eta = new Date(res.estimatedReadyTime);
      const etaStr = eta.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      const locName =
        (LOCATIONS.find((l) => l.id === cfg.location) || {}).short || "Casa";
      const totals = getTotals();

      // Build success view
      clearNode($success);
      $success.appendChild(el("div", { class: "fcart__success-mark", text: "✦" }));
      $success.appendChild(el("h3", { class: "fcart__success-title", text: "Sent to the kitchen." }));
      $success.appendChild(el(
        "p",
        { class: "fcart__success-line" },
        "Order ",
        el("strong", { class: "fcart__success-num", text: "#" + res.displayNumber }),
        " at Casa ",
        el("strong", { text: locName }),
        "."
      ));
      $success.appendChild(el(
        "p",
        { class: "fcart__success-line" },
        cfg.type === "delivery" ? "Arriving around " : "Ready around ",
        el("strong", { text: etaStr })
      ));
      $success.appendChild(el(
        "p",
        { class: "fcart__success-line" },
        "Total ",
        el("strong", { class: "fcart__success-total", text: fmt(totals.total) })
      ));
      $success.appendChild(el(
        "p",
        { class: "fcart__success-meta" },
        "A confirmation will arrive in your inbox. Bread basket waiting at the counter."
      ));
      const $newOrder = el(
        "button",
        { type: "button", class: "btn btn--ghost fcart__success-new" },
        "Start a New Order"
      );
      $newOrder.addEventListener("click", () => {
        clear();
        $form.reset();
        $form.style.display = "none";
        $success.style.display = "none";
        $config.style.display = "";
        $list.style.display = "";
        $tots.style.display = "";
        $checkBtn.style.display = "";
        $clearBtn.style.display = "";
        $backBtn.style.display = "none";
      });
      $success.appendChild($newOrder);

      // Hide form, show success
      $form.style.display = "none";
      $success.style.display = "";
      // Clear cart on success
      clear();
    } catch (err) {
      console.error(err);
      $submit.textContent = "Try again";
    } finally {
      $submit.disabled = false;
      if ($submit.textContent === "Sending to the kitchen…") $submit.textContent = orig;
    }
  });

  // Close on escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") $panel.classList.remove("is-open");
  });

  subscribe(render);
  return wrap;
}
