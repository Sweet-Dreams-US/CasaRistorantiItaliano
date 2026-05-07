# Casa Ristoranti Italiano — Demo Website

A production-quality demo site for **Casa Ristoranti Italiano**, the family-owned Italian restaurant group in Fort Wayne, Indiana (est. 1977).

> Built by **Sweet Dreams Music LLC** as a creative-direction proposal. Pure HTML / CSS / JS — zero build step. Hosted on GitHub Pages.

🌐 **Live:** https://sweet-dreams-us.github.io/CasaRistorantiItaliano/

---

## What's in here

| Page | Path | What it does |
| --- | --- | --- |
| Home | `index.html` | Hero, signature dishes, story preview, innovations, four locations |
| Story | `story.html` | Long-form editorial chapters + interactive **Fort Wayne Timeline** that scrolls horizontally |
| Menu | `menu.html` | Full editorial menu rendered from `data/menu.json` |
| Order | `order.html` | Online ordering UI with **Toast-ready architecture** (mocked for demo) |
| Locations | `locations.html` | All four Casa locations + a stylized SVG city map |
| Reservations | `reservations.html` | Reservation form with location pre-select via `?loc=` |

---

## Aesthetic direction

**"Tuscan Editorial"** — warm parchment grounds (`#F2EAD7`), terracotta heat (`#B0432A`), aged gold rules, deep ink text. Display type is **Italiana**, body is **EB Garamond**, italic flourishes are **Cormorant Garamond**.

The whole site has a subtle paper-grain overlay, asymmetric editorial layouts, ornamental rules, drop caps, marquee strips, and a rotating "Since 1977" stamp.

---

## Toast integration architecture

The order flow is **Toast-ready**. See [`assets/js/toast-stub.js`](assets/js/toast-stub.js).

For the demo, orders submit to a stub that returns a fake confirmation. To go live:

1. Provision Toast OAuth credentials and per-restaurant GUIDs.
2. Stand up a server proxy that holds the OAuth token (Toast cannot be called directly from the browser).
3. Replace `submitOrder()` body in `toast-stub.js` with a `fetch` to `/api/toast/order`.
4. Map cart `id` → Toast `menuItemGuid` server-side via the Toast `/menus/v2/menus/{restaurantGuid}` endpoint (cache it).
5. POST to `/orders/v2/orders` with the `X-Toast-Restaurant-External-Id` header.

The cart payload (`buildOrderPayload`) is already shaped to match Toast's `selections` schema, so no client changes are required when production credentials are wired up.

```js
// Same call from the client, in production:
const result = await submitOrder(payload);
// → { orderGuid, displayNumber, estimatedReadyTime, status, total }
```

---

## File tree

```
.
├── index.html              # Home
├── story.html              # Story + Fort Wayne timeline
├── menu.html               # Full menu (renders from JSON)
├── order.html              # Online ordering
├── locations.html          # 4 locations + SVG map
├── reservations.html       # Reservation form
├── 404.html                # Not found
├── data/
│   └── menu.json           # Single source of truth for the menu
├── assets/
│   ├── css/
│   │   ├── tokens.css      # Palette, type, spacing, motion vars
│   │   ├── base.css        # Reset + grain + vignette
│   │   ├── typography.css  # Display, body, italic, smallcaps, drop cap
│   │   ├── layout.css      # Nav, marquee, footer, buttons, reveals
│   │   ├── home.css
│   │   ├── story.css       # Long-form + horizontal timeline
│   │   ├── menu.css        # Editorial menu
│   │   ├── order.css       # Cart + checkout
│   │   └── locations.css   # Locations + reservations
│   ├── js/
│   │   ├── main.js         # Entry: nav, reveal, parallax, year stamp
│   │   ├── nav.js          # Mobile burger, current-page mark
│   │   ├── reveal.js       # IntersectionObserver-based reveal
│   │   ├── timeline.js     # Horizontal scroll + drag + keyboard
│   │   ├── menu.js         # Render menu from JSON, sticky tabs
│   │   ├── order.js        # Cart + checkout + Toast adapter
│   │   ├── toast-stub.js   # Toast POS adapter (mocked, swappable)
│   │   └── reservations.js # Reservation form + location pre-select
│   ├── img/                # Higgsfield-generated webp imagery
│   └── svg/                # Logo / ornaments
├── .nojekyll               # Disables Jekyll on GitHub Pages
└── README.md               # This file
```

---

## Imagery

All food and atmosphere photos in `/assets/img/` were generated using the **Higgsfield** AI image platform (Nano Banana 2 + Cinema Studio 2.5 models) and optimized to webp at ~1600&ndash;2400px. Source PNGs were stripped after compression to keep the repo lean (~2MB total imagery).

For a real launch, these are placeholders — replace with photography of the actual Casa dining rooms and dishes.

---

## Local preview

No build step. Just serve the directory:

```bash
# Python
python -m http.server 8080

# Node
npx serve .

# PHP
php -S 0.0.0.0:8080
```

Then visit http://localhost:8080.

---

## Deployment

GitHub Pages serves from the `main` branch root. Push to `main` and the site is live within a minute. The `.nojekyll` file disables Jekyll processing so files starting with `_` are served as-is.

---

## Credits

- Research sourced from [casarestaurants.com](https://www.casarestaurants.com), [Visit Fort Wayne](https://www.visitfortwayne.com/blog/stories/post/casas-the-best-italian-food-in-town-15572/), and the [ACPL Genealogy Center](https://www.genealogycenter.info/viewpage_casarestaurants.php).
- This is a **demo / proposal** site, not affiliated with or endorsed by the Casa Restaurant Group at the time of writing.
- Designed and built in Fort Wayne. ❧
