/* ==========================================================================
   CASA · shop.js — sticky cart for the retail shop
   Wired with the same Toast-stub-style payload pattern; for production this
   would route through Shopify or Square eCommerce.
   ========================================================================== */

const cart = [];

function fmt(n) { return "$" + n.toFixed(2); }

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

function renderCart() {
  const wrap = document.getElementById("shop-cart");
  const count = wrap.querySelector(".shop-cart__count");
  const total = wrap.querySelector(".shop-cart__total");

  if (!cart.length) {
    wrap.classList.remove("is-on");
    return;
  }
  const items = cart.reduce((s, i) => s + i.qty, 0);
  const sum = cart.reduce((s, i) => s + i.qty * i.price, 0);
  count.textContent = items;
  total.textContent = fmt(sum);
  wrap.classList.add("is-on");
}

function addToCart(p) {
  const existing = cart.find((c) => c.id === p.id);
  if (existing) existing.qty++;
  else cart.push({ ...p, qty: 1 });
  renderCart();
  flashButton(p.id);
}

function flashButton(id) {
  const btn = document.querySelector(`button[data-product-id="${id}"]`);
  if (!btn || !btn.animate) return;
  const orig = btn.textContent;
  btn.textContent = "Added ✦";
  btn.animate(
    [{ background: "var(--terracotta)" }, { background: "var(--ink)" }],
    { duration: 600, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
  );
  setTimeout(() => {
    btn.textContent = orig;
  }, 900);
}

function showCheckout() {
  const overlay = document.getElementById("shop-checkout");
  if (!overlay) return;
  const list = overlay.querySelector("[data-cart-list]");
  const totalEl = overlay.querySelector("[data-cart-total]");
  // Reset
  while (list.firstChild) list.removeChild(list.firstChild);
  let sum = 0;
  cart.forEach((i) => {
    const li = el(
      "li",
      { class: "shop-checkout__item" },
      el("div", { class: "shop-checkout__name", text: i.name }),
      el("div", { class: "shop-checkout__qty", text: `Qty ${i.qty}` }),
      el("div", { class: "shop-checkout__lineprice", text: fmt(i.qty * i.price) })
    );
    list.appendChild(li);
    sum += i.qty * i.price;
  });
  totalEl.textContent = fmt(sum);
  overlay.classList.add("is-open");
}

function init() {
  document.querySelectorAll(".product__btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      addToCart({
        id: btn.dataset.productId,
        name: btn.dataset.productName,
        price: parseFloat(btn.dataset.productPrice)
      });
    });
  });

  const cartBtn = document.querySelector("#shop-cart .shop-cart__btn");
  if (cartBtn) cartBtn.addEventListener("click", showCheckout);

  const close = document.getElementById("shop-checkout-close");
  if (close)
    close.addEventListener("click", () => {
      document.getElementById("shop-checkout").classList.remove("is-open");
    });

  const overlay = document.getElementById("shop-checkout");
  if (overlay)
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.remove("is-open");
    });

  const form = document.getElementById("shop-checkout-form");
  if (form)
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = "Packing the box…";
      // Production: replace with Shopify/Square Storefront API call
      await new Promise((r) => setTimeout(r, 1200));
      form.style.display = "none";
      const success = document.getElementById("shop-checkout-success");
      success.style.display = "block";
      cart.length = 0;
      renderCart();
    });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
