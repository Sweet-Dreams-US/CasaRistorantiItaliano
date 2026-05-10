/* ==========================================================================
   CASA · admin.js — operator dashboard demo
   - Inline mock data (production wires to Toast / OpenTable / Stripe / Sanity)
   - Tab routing via #hash
   - Location filter ripples through every view
   - SVG charts hand-built (no chart library)
   - All DOM via createElement
   ========================================================================== */

// ============================================================================
// DOM helpers
// ============================================================================

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("data-") || k.startsWith("aria-")) node.setAttribute(k, v);
    else if (k === "html") {} // intentionally not supported — use text
    else if (k in node) node[k] = v;
    else node.setAttribute(k, v);
  }
  children.flat().forEach((c) => {
    if (c == null) return;
    node.appendChild(typeof c === "string" || typeof c === "number"
      ? document.createTextNode(String(c)) : c);
  });
  return node;
}

function svgEl(tag, attrs = {}) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    node.setAttribute(k, String(v));
  }
  return node;
}

const fmt = (n) => "$" + Number(n).toFixed(2);
const fmtK = (n) =>
  n >= 1000 ? "$" + (n / 1000).toFixed(1) + "K" : "$" + Math.round(n);

const time = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const weekdayMD = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
};

// ============================================================================
// Mock data — production replaces with Toast / OpenTable / Stripe / Sanity
// ============================================================================

const LOCATIONS = [
  { id: "dupont",    short: "Dupont",      name: "Casa Grille · Dupont" },
  { id: "stellhorn", short: "Stellhorn",   name: "Casa Grille Italiano · Stellhorn" },
  { id: "jefferson", short: "Jefferson",   name: "Casa! Ristorante · W. Jefferson" },
  { id: "parnell",   short: "Parnell",     name: "Casa Ristorante Italiano · Parnell" }
];

// 26 sample orders across locations and statuses
const ORDERS = [
  { id: "C-4831", customer: "Maria Santangelo", phone: "(260) 555-0114", items: [["Linguine Tutto Mare", 1], ["Casaburo Salad", 2], ["Tiramisù", 1]], total: 47.83, location: "dupont", type: "pickup", status: "placed", placedAt: "T-2", readyBy: "T+22" },
  { id: "C-4830", customer: "James Hall",      phone: "(260) 555-0177", items: [["Margherita di Casa", 1], ["Diavola", 1], ["Caprese di Stagione", 1]], total: 53.21, location: "stellhorn", type: "pickup", status: "prep", placedAt: "T-7", readyBy: "T+12" },
  { id: "C-4829", customer: "Anne Becker",     phone: "(260) 555-0162", items: [["Lasagna della Nonna", 2], ["Bottle of Chianti", 1]], total: 79.64, location: "jefferson", type: "delivery", status: "prep", placedAt: "T-9", readyBy: "T+18" },
  { id: "C-4828", customer: "Marco Conti",     phone: "(260) 555-0103", items: [["Pollo al Griglia", 1], ["Carciofi alla Romana", 1], ["Cannoli", 2]], total: 56.04, location: "stellhorn", type: "pickup", status: "ready", placedAt: "T-15", readyBy: "T+0" },
  { id: "C-4827", customer: "Sarah Bishop",    phone: "(260) 555-0145", items: [["Pizza Vegetariana", 1], ["Fettuccine Alfredo", 1]], total: 38.92, location: "parnell", type: "pickup", status: "ready", placedAt: "T-18", readyBy: "T-2" },
  { id: "C-4826", customer: "Davide Romano",   phone: "(260) 555-0193", items: [["Ravioli di Ricotta", 1], ["Rigatoni alla Bolognese", 1], ["Espresso", 2]], total: 49.10, location: "dupont", type: "pickup", status: "complete", placedAt: "T-32", readyBy: "T-12" },
  { id: "C-4825", customer: "Beth Olson",      phone: "(260) 555-0124", items: [["Salmone Caccia", 1], ["Linguine Vongole", 1]], total: 56.55, location: "jefferson", type: "pickup", status: "complete", placedAt: "T-44", readyBy: "T-22" },
  { id: "C-4824", customer: "Tony Vitale",     phone: "(260) 555-0186", items: [["Quattro Formaggi", 1], ["Antipasto della Tavola", 1]], total: 44.88, location: "stellhorn", type: "delivery", status: "complete", placedAt: "T-58", readyBy: "T-28" },
  { id: "C-4823", customer: "Linda Park",      phone: "(260) 555-0115", items: [["Pollo al Griglia", 2], ["Casaburo Salad", 1]], total: 62.30, location: "parnell", type: "pickup", status: "complete", placedAt: "T-72", readyBy: "T-48" },
  { id: "C-4822", customer: "Pat O'Donnell",   phone: "(260) 555-0188", items: [["Ossobuco", 1], ["Bottle of Barolo", 1]], total: 87.12, location: "jefferson", type: "pickup", status: "complete", placedAt: "T-92", readyBy: "T-72" },
  { id: "C-4821", customer: "Joe Casaburo",    phone: "(260) 555-0102", items: [["Lasagna della Nonna", 1], ["Margherita di Casa", 1]], total: 32.40, location: "dupont", type: "pickup", status: "complete", placedAt: "T-110", readyBy: "T-88" },
  { id: "C-4820", customer: "Karen Pyle",      phone: "(260) 555-0156", items: [["Spaghetti Pomodoro", 2], ["Polpette di Casa", 1]], total: 41.28, location: "stellhorn", type: "delivery", status: "complete", placedAt: "T-145", readyBy: "T-110" },
  { id: "C-4819", customer: "Ben Frye",        phone: "(260) 555-0144", items: [["Bistecca alla Fiorentina", 1]], total: 78.00, location: "jefferson", type: "pickup", status: "complete", placedAt: "T-200", readyBy: "T-180" },
  { id: "C-4818", customer: "Nora Schmidt",    phone: "(260) 555-0167", items: [["Linguine Tutto Mare", 1], ["Tiramisù", 1]], total: 36.85, location: "parnell", type: "pickup", status: "complete", placedAt: "T-220", readyBy: "T-200" },
  { id: "C-4817", customer: "Greg Mancini",    phone: "(260) 555-0173", items: [["Pizza Vegetariana", 1], ["Diavola", 1]], total: 37.47, location: "dupont", type: "pickup", status: "canceled", placedAt: "T-250", readyBy: null }
];

// 18 reservations across locations and dates
const RESERVATIONS = [
  { id: "R-1051", customer: "Daniel Maupin",  party: 4, location: "jefferson", when: "T+45", occasion: "Anniversary", phone: "(260) 555-0167" },
  { id: "R-1052", customer: "Rebecca Frank",  party: 2, location: "dupont",    when: "T+90", occasion: "Date night",  phone: "(260) 555-0148" },
  { id: "R-1053", customer: "Kyle Brown",     party: 6, location: "stellhorn", when: "T+120", occasion: "Birthday",    phone: "(260) 555-0192" },
  { id: "R-1054", customer: "Jenna Patel",    party: 3, location: "parnell",   when: "T+150", occasion: "",            phone: "(260) 555-0184" },
  { id: "R-1055", customer: "Mark Salazar",   party: 8, location: "jefferson", when: "T+200", occasion: "Communion",   phone: "(260) 555-0177" },
  { id: "R-1056", customer: "Anita Lyons",    party: 2, location: "stellhorn", when: "TOMORROW 6:00p", occasion: "",    phone: "(260) 555-0149" },
  { id: "R-1057", customer: "Vince Romano",   party: 4, location: "dupont",    when: "TOMORROW 6:30p", occasion: "Birthday", phone: "(260) 555-0163" },
  { id: "R-1058", customer: "Hannah Wilkins", party: 4, location: "parnell",   when: "TOMORROW 7:00p", occasion: "",    phone: "(260) 555-0166" },
  { id: "R-1059", customer: "Greg Petty",     party: 12, location: "jefferson", when: "FRI 6:30p",     occasion: "Retirement", phone: "(260) 555-0142" },
  { id: "R-1060", customer: "Lou Caraballo",  party: 6, location: "stellhorn", when: "FRI 7:00p",      occasion: "",            phone: "(260) 555-0125" },
  { id: "R-1061", customer: "Patty Hines",    party: 2, location: "parnell",   when: "FRI 7:30p",      occasion: "Anniversary", phone: "(260) 555-0184" },
  { id: "R-1062", customer: "Chris Anderson", party: 8, location: "dupont",    when: "SAT 6:00p",      occasion: "Birthday",    phone: "(260) 555-0117" },
  { id: "R-1063", customer: "Diane Phelps",   party: 4, location: "jefferson", when: "SAT 7:00p",      occasion: "",            phone: "(260) 555-0106" },
  { id: "R-1064", customer: "Sam Knabel",     party: 2, location: "stellhorn", when: "SAT 8:00p",      occasion: "Date night",  phone: "(260) 555-0149" }
];

// Banquet + catering inquiries
const EVENTS = [
  { id: "E-2031", type: "Banquet", customer: "Bishop Luers HS",   party: 80,  location: "jefferson", when: "May 24",  status: "Quoted",  contact: "Patty Mason · (260) 555-0119", notes: "Senior banquet, family-style preferred" },
  { id: "E-2032", type: "Catering",customer: "Lutheran Hospital", party: 45,  location: "any",       when: "May 18",  status: "New",     contact: "Drew Phillips · (260) 555-0137", notes: "Onsite drop-off, family pans, vegetarian options" },
  { id: "E-2033", type: "Banquet", customer: "Markey wedding",    party: 60,  location: "stellhorn", when: "Jun 14",  status: "Confirmed", contact: "Renee Markey · (260) 555-0182", notes: "Plated 3-course, paired wines, dance floor" },
  { id: "E-2034", type: "Catering",customer: "Lincoln Financial", party: 120, location: "any",       when: "May 22",  status: "Quoted",  contact: "Sales team · (260) 555-0144", notes: "Lunch buffet, must include gluten-free" },
  { id: "E-2035", type: "Banquet", customer: "Casa fundraiser",   party: 100, location: "dupont",    when: "May 28",  status: "Confirmed", contact: "Jim Casaburo · (internal)", notes: "Spirit night for St. Vincent de Paul" },
  { id: "E-2036", type: "Catering",customer: "Conwell Egan family", party: 25, location: "any",      when: "May 12",  status: "Quoted",  contact: "Joan Conwell · (260) 555-0103", notes: "Memorial luncheon, family pans + Casaburo + bread" },
  { id: "E-2037", type: "Banquet", customer: "Bishop Dwenger team", party: 35, location: "stellhorn", when: "May 19", status: "New",     contact: "Coach Riley · (260) 555-0166", notes: "Boys soccer postseason dinner" }
];

// 9 reviews from Google/Yelp/TripAdvisor
const REVIEWS = [
  { id: "RV-901", customer: "Brittney Walters", source: "Google", stars: 5, location: "stellhorn", date: "2 days ago", body: "We've been coming to Casa for fifteen years. The Casaburo Salad is still the best in town and the bread basket never runs out. Service was warm and our waitress remembered us from last month.", reply: null },
  { id: "RV-902", customer: "Tim O'Brien",      source: "Yelp",   stars: 4, location: "jefferson", date: "3 days ago", body: "Linguine Tutto Mare was perfect. Slight wait for our table on a Saturday at 7 — would call ahead next time. New space on Jefferson is beautiful.", reply: null },
  { id: "RV-903", customer: "Anonymous",        source: "Google", stars: 2, location: "dupont",    date: "4 days ago", body: "Pizza came out cold. Server didn't seem to notice when we asked for the check.", reply: null },
  { id: "RV-904", customer: "Liz Patel",        source: "TripAdvisor", stars: 5, location: "parnell",   date: "1 week ago", body: "Anniversary dinner. Perfect from the bread to the espresso. Tom himself stopped by our table.", reply: { author: "Tom Casaburo", date: "6 days ago", body: "So glad you came in for your anniversary, Liz. Salud, and we'll see you next year." } },
  { id: "RV-905", customer: "Doug Greene",      source: "Google", stars: 5, location: "stellhorn", date: "1 week ago", body: "The Pollo al Griglia is half the reason I work in Fort Wayne. Wood-fired vegetables on the side are unreal.", reply: { author: "Jim Casaburo", date: "5 days ago", body: "Doug — appreciate you. The rotisserie is on every night, come get the chicken hot off it any time." } },
  { id: "RV-906", customer: "Sandra K.",        source: "Yelp",   stars: 5, location: "dupont",    date: "2 weeks ago", body: "Took my mom for her 80th. They sang to her, brought a candle, made it special. We'll be back.", reply: null },
  { id: "RV-907", customer: "Mike R.",          source: "Google", stars: 3, location: "jefferson", date: "2 weeks ago", body: "Solid food, busy place on a Friday. Wait was longer than I'd like. Bread basket was a star, as always.", reply: null }
];

// Top customers (lifetime visits + spend)
const CUSTOMERS = [
  { name: "Vince Romano",    email: "vince@example.com",  visits: 142, lifetime: 8420.50, lastVisit: "3 days ago", favoriteLoc: "Dupont" },
  { name: "Patti Casaburo",  email: "patti@example.com",  visits: 138, lifetime: 7984.20, lastVisit: "1 day ago",  favoriteLoc: "Stellhorn" },
  { name: "Daniel Maupin",   email: "danm@example.com",   visits: 96,  lifetime: 6210.00, lastVisit: "1 week ago", favoriteLoc: "Jefferson" },
  { name: "Greg Petty",      email: "gpetty@example.com", visits: 88,  lifetime: 5890.40, lastVisit: "today",      favoriteLoc: "Jefferson" },
  { name: "Sarah Bishop",    email: "sarah@example.com",  visits: 74,  lifetime: 4720.00, lastVisit: "2 days ago", favoriteLoc: "Parnell" },
  { name: "Anne Becker",     email: "abecker@example.com",visits: 68,  lifetime: 4220.10, lastVisit: "3 days ago", favoriteLoc: "Jefferson" },
  { name: "Doug Greene",     email: "dgreene@example.com",visits: 64,  lifetime: 3892.00, lastVisit: "1 week ago", favoriteLoc: "Stellhorn" },
  { name: "Beth Olson",      email: "beth@example.com",   visits: 58,  lifetime: 3540.50, lastVisit: "5 days ago", favoriteLoc: "Jefferson" },
  { name: "Marco Conti",     email: "marco@example.com",  visits: 52,  lifetime: 3280.20, lastVisit: "today",      favoriteLoc: "Stellhorn" },
  { name: "Mark Salazar",    email: "marks@example.com",  visits: 46,  lifetime: 2940.00, lastVisit: "1 week ago", favoriteLoc: "Jefferson" }
];

// Per-day weekly revenue per location (Mon-Sun)
const WEEK_REVENUE = {
  dupont:    [4280, 5120, 4890, 5340, 8920, 11240, 7820],
  stellhorn: [5640, 6020, 5780, 6120, 9840, 12420, 9120],
  jefferson: [6240, 6580, 6320, 7020, 11240, 14820, 10240],
  parnell:   [3420, 3680, 3520, 3920, 6420, 8240, 5840]
};

// Hourly orders today, 24 entries
const HOURLY_ORDERS = {
  dupont:    [0,0,0,0,0,0,0,0,0,0,0,8,12,9,6,4,3,5,12,18,21,16,8,2],
  stellhorn: [0,0,0,0,0,0,0,0,0,0,0,9,14,11,7,4,3,6,15,22,26,18,10,3],
  jefferson: [0,0,0,0,0,0,0,0,0,0,0,11,16,13,8,5,4,7,17,24,28,20,11,4],
  parnell:   [0,0,0,0,0,0,0,0,0,0,0,6,9,7,4,3,2,4,9,14,16,12,6,2]
};

// Top items per period (rank + count + revenue)
const TOP_ITEMS = [
  { name: "Casaburo Salad",       count: 1842, revenue: 20262 },
  { name: "Margherita di Casa",   count: 924,  revenue: 15708 },
  { name: "Lasagna della Nonna",  count: 712,  revenue: 13528 },
  { name: "Linguine Tutto Mare",  count: 488,  revenue: 12688 },
  { name: "Pollo al Griglia",     count: 524,  revenue: 12576 },
  { name: "Fettuccine Alfredo",   count: 612,  revenue: 10404 },
  { name: "Pizza Vegetariana",    count: 384,  revenue: 6912 },
  { name: "Tiramisù",             count: 528,  revenue: 5808 }
];

// Financial snapshot
const FIN = {
  todayRevenue: 14820,
  weekRevenue: 89240,
  monthRevenue: 372480,
  lastMonthRevenue: 348220,
  todayOrders: 187,
  todayCovers: 412,
  weekOrders: 1284,
  monthOrders: 5412,
  feesThisMonth: { toast: 11174, stripe: 3724, mailchimp: 84, opentable: 480 },
  cogs: 134093,    // ~36% food cost
  payroll: 99776,   // ~26.8%
  rent: 18000,
  utilities: 8420,
  marketing: 4280,
  other: 12420,
  deposits: [
    { date: "Yesterday", amount: 14820, source: "Toast" },
    { date: "2 days ago", amount: 13120, source: "Toast" },
    { date: "3 days ago", amount: 11580, source: "Toast" },
    { date: "4 days ago", amount: 10940, source: "Toast" },
    { date: "5 days ago", amount: 12640, source: "Toast" },
    { date: "6 days ago", amount: 13820, source: "Toast" },
    { date: "7 days ago", amount: 12320, source: "Toast" }
  ]
};

// Menu structure for the editor — uses real menu sections
const MENU_SECTIONS = [
  { id: "antipasti", name: "Antipasti", items: [
    { id: "bruschetta-pomodoro", name: "Bruschetta al Pomodoro", italian: "Tomato bruschetta", price: 11, available: true },
    { id: "calamari-fritti",     name: "Calamari Fritti",        italian: "",                  price: 14, available: true },
    { id: "antipasto-tavola",    name: "Antipasto della Tavola", italian: "House platter",     price: 22, available: true },
    { id: "polpette",            name: "Polpette di Casa",       italian: "House meatballs",   price: 13, available: true },
    { id: "carciofi",            name: "Carciofi alla Romana",   italian: "Slow-braised artichokes", price: 15, available: false }
  ]},
  { id: "insalate", name: "Insalate", items: [
    { id: "casaburo",       name: "The Casaburo",        italian: "the original",     price: 11, available: true, signature: true },
    { id: "caprese",        name: "Caprese di Stagione", italian: "seasonal caprese", price: 13, available: true },
    { id: "wedge-italiano", name: "Wedge Italiano",      italian: "",                 price: 12, available: true },
    { id: "panzanella",     name: "Panzanella d'Estate", italian: "summer bread salad", price: 12, available: true }
  ]},
  { id: "pasta", name: "Paste", items: [
    { id: "linguine-tutto-mare", name: "Linguine Tutto Mare",   italian: "of the sea",  price: 26, available: true, signature: true },
    { id: "casa-cream",          name: "Funghi al Forno",       italian: "wild mushroom cream", price: 21, available: true },
    { id: "lasagna",             name: "Lasagna della Nonna",   italian: "grandmother's lasagna", price: 19, available: true, signature: true },
    { id: "fettuccine-alfredo",  name: "Fettuccine Alfredo",    italian: "",            price: 17, available: true },
    { id: "linguine-vongole",    name: "Linguine con Vongole",  italian: "with clams",  price: 23, available: true },
    { id: "rigatoni-bolognese",  name: "Rigatoni alla Bolognese",italian: "",          price: 21, available: true },
    { id: "ravioli-ricotta",     name: "Ravioli di Ricotta",    italian: "ricotta",     price: 19, available: true },
    { id: "pomodoro-basilico",   name: "Spaghetti Pomodoro",    italian: "tomato & basil", price: 16, available: true }
  ]},
  { id: "pizze", name: "Pizze", items: [
    { id: "margherita-casa",     name: "Margherita di Casa",   italian: "house margherita", price: 17, available: true, signature: true },
    { id: "diavola",             name: "Diavola",              italian: "spicy soppressata", price: 19, available: true },
    { id: "quattro-formaggi",    name: "Quattro Formaggi",     italian: "four cheeses",     price: 19, available: true },
    { id: "veggie",              name: "Pizza Vegetariana",    italian: "garden",            price: 18, available: true },
    { id: "prosciutto-rucola",   name: "Prosciutto e Rucola",  italian: "& arugula",         price: 21, available: true },
    { id: "salsiccia-friarelli", name: "Salsiccia & Friarielli",italian: "sausage & rabe",  price: 20, available: false }
  ]},
  { id: "carne-pesce", name: "Carne & Pesce", items: [
    { id: "pollo-griglia",  name: "Pollo al Griglia",     italian: "wood-fired chicken", price: 24, available: true, signature: true },
    { id: "salmone-caccia", name: "Salmone Caccia",       italian: "pan-seared salmon",  price: 28, available: true },
    { id: "ossobuco",       name: "Ossobuco di Vitello",  italian: "braised veal shank", price: 36, available: true },
    { id: "bistecca",       name: "Bistecca alla Fiorentina", italian: "florentine ribeye for two", price: 78, available: true },
    { id: "vitello-marsala",name: "Vitello al Marsala",   italian: "veal Marsala",       price: 30, available: true }
  ]}
];

// Daily lunch specials
const SPECIALS = [
  { day: "Monday",    name: "Cavatelli al Sugo",      italian: "House cavatelli, slow-cooked beef sugo",   price: 13 },
  { day: "Tuesday",   name: "Polpette & Polenta",     italian: "Three meatballs, soft polenta",           price: 14 },
  { day: "Wednesday", name: "Lasagna & Casaburo",     italian: "Half lasagna, full Casaburo",             price: 14 },
  { day: "Thursday",  name: "Pollo Marsala",          italian: "Chicken Marsala & tagliatelle",           price: 15 },
  { day: "Friday",    name: "Linguine Vongole",       italian: "Linguine with baby clams",                price: 16 },
  { day: "Saturday",  name: "Margherita di Casa",     italian: "Personal wood-fired margherita",          price: 13 }
];

// ============================================================================
// State + routing
// ============================================================================

const state = {
  tab: "dashboard",
  loc: "all" // 'all' | 'dupont' | 'stellhorn' | 'jefferson' | 'parnell'
};

const filterByLoc = (rows) =>
  state.loc === "all" ? rows : rows.filter((r) => r.location === state.loc || r.location === "any");

const sumWeekRevenue = () => {
  if (state.loc === "all") {
    return [0, 1, 2, 3, 4, 5, 6].map((d) =>
      Object.values(WEEK_REVENUE).reduce((s, arr) => s + arr[d], 0)
    );
  }
  return WEEK_REVENUE[state.loc] || WEEK_REVENUE.dupont;
};

const sumHourly = () => {
  if (state.loc === "all") {
    return Array.from({ length: 24 }, (_, i) =>
      Object.values(HOURLY_ORDERS).reduce((s, arr) => s + arr[i], 0)
    );
  }
  return HOURLY_ORDERS[state.loc];
};

// ============================================================================
// Charts (vanilla SVG)
// ============================================================================

function lineChart(values, opts = {}) {
  const w = opts.w || 720;
  const h = opts.h || 220;
  const pad = { l: 40, r: 16, t: 16, b: 28 };
  const max = Math.max(...values, 1) * 1.1;
  const stepX = (w - pad.l - pad.r) / (values.length - 1);

  const svg = svgEl("svg", { class: "chart", viewBox: `0 0 ${w} ${h}`, preserveAspectRatio: "none" });

  // grid lines (4)
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + ((h - pad.t - pad.b) * i) / 4;
    svg.appendChild(svgEl("line", { x1: pad.l, x2: w - pad.r, y1: y, y2: y, stroke: "rgba(26,20,16,0.08)", "stroke-width": "1" }));
    svg.appendChild(svgEl("text", {
      x: pad.l - 8, y: y + 4, "text-anchor": "end",
      "font-family": "'Cormorant Garamond', serif", "font-style": "italic", "font-size": "11", fill: "#6F5B47"
    })).textContent = fmtK((max * (4 - i)) / 4);
  }

  // x labels
  (opts.labels || []).forEach((lbl, i) => {
    const x = pad.l + i * stepX;
    svg.appendChild(svgEl("text", {
      x, y: h - 10, "text-anchor": "middle",
      "font-family": "'Cormorant Garamond', serif", "font-style": "italic", "font-size": "11", fill: "#6F5B47"
    })).textContent = lbl;
  });

  // area fill
  const points = values.map((v, i) => `${pad.l + i * stepX},${pad.t + (h - pad.t - pad.b) * (1 - v / max)}`);
  const areaPath = `M${pad.l},${h - pad.b} L${points.join(" L")} L${pad.l + (values.length - 1) * stepX},${h - pad.b} Z`;
  svg.appendChild(svgEl("path", { d: areaPath, fill: "rgba(176,67,42,0.1)" }));

  // line
  const linePath = "M" + points.join(" L");
  svg.appendChild(svgEl("path", { d: linePath, fill: "none", stroke: "#B0432A", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round" }));

  // dots + values on hover (just dots for now)
  values.forEach((v, i) => {
    const cx = pad.l + i * stepX;
    const cy = pad.t + (h - pad.t - pad.b) * (1 - v / max);
    svg.appendChild(svgEl("circle", { cx, cy, r: 3, fill: "#B0432A" }));
  });

  return svg;
}

function barChart(values, labels, opts = {}) {
  const w = opts.w || 720;
  const h = opts.h || 220;
  const pad = { l: 36, r: 16, t: 16, b: 32 };
  const max = Math.max(...values, 1) * 1.1;
  const innerW = w - pad.l - pad.r;
  const stepX = innerW / values.length;
  const barW = stepX * 0.6;

  const svg = svgEl("svg", { class: "chart", viewBox: `0 0 ${w} ${h}`, preserveAspectRatio: "none" });

  // grid
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + ((h - pad.t - pad.b) * i) / 4;
    svg.appendChild(svgEl("line", { x1: pad.l, x2: w - pad.r, y1: y, y2: y, stroke: "rgba(26,20,16,0.06)" }));
  }

  values.forEach((v, i) => {
    const x = pad.l + i * stepX + (stepX - barW) / 2;
    const barH = ((h - pad.t - pad.b) * v) / max;
    const y = h - pad.b - barH;
    svg.appendChild(svgEl("rect", {
      x, y, width: barW, height: barH, fill: "#B0432A", "fill-opacity": "0.85", rx: "2"
    }));
    if (labels && labels[i]) {
      svg.appendChild(svgEl("text", {
        x: pad.l + i * stepX + stepX / 2, y: h - 12, "text-anchor": "middle",
        "font-family": "'Cormorant Garamond', serif", "font-style": "italic", "font-size": "10", fill: "#6F5B47"
      })).textContent = labels[i];
    }
  });

  return svg;
}

function donutChart(values, labels, colors, opts = {}) {
  const size = opts.size || 200;
  const r = size / 2;
  const inner = r * 0.62;
  const total = values.reduce((s, v) => s + v, 0);
  const svg = svgEl("svg", { class: "chart", viewBox: `0 0 ${size} ${size}`, width: size, height: size });

  let acc = 0;
  values.forEach((v, i) => {
    const startA = (acc / total) * Math.PI * 2 - Math.PI / 2;
    acc += v;
    const endA = (acc / total) * Math.PI * 2 - Math.PI / 2;
    const x1 = r + r * Math.cos(startA);
    const y1 = r + r * Math.sin(startA);
    const x2 = r + r * Math.cos(endA);
    const y2 = r + r * Math.sin(endA);
    const xi2 = r + inner * Math.cos(endA);
    const yi2 = r + inner * Math.sin(endA);
    const xi1 = r + inner * Math.cos(startA);
    const yi1 = r + inner * Math.sin(startA);
    const large = v / total > 0.5 ? 1 : 0;
    const d = [
      `M ${x1} ${y1}`,
      `A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`,
      `L ${xi2} ${yi2}`,
      `A ${inner} ${inner} 0 ${large} 0 ${xi1} ${yi1}`,
      "Z"
    ].join(" ");
    svg.appendChild(svgEl("path", { d, fill: colors[i] || "#B0432A" }));
  });

  // center label
  svg.appendChild(svgEl("text", {
    x: r, y: r - 4, "text-anchor": "middle",
    "font-family": "'Italiana', serif", "font-size": "20", fill: "#1A1410"
  })).textContent = total >= 1000 ? Math.round(total / 1000) + "k" : String(total);
  svg.appendChild(svgEl("text", {
    x: r, y: r + 14, "text-anchor": "middle",
    "font-family": "'Cormorant Garamond', serif", "font-style": "italic", "font-size": "11", fill: "#6F5B47"
  })).textContent = opts.subtitle || "";

  return svg;
}

function sparkline(values, color = "#B0432A") {
  const w = 200;
  const h = 32;
  const max = Math.max(...values, 1) * 1.1;
  const min = Math.min(...values, 0);
  const stepX = w / (values.length - 1);
  const points = values.map((v, i) => `${i * stepX},${h - ((v - min) / (max - min || 1)) * h}`);
  const svg = svgEl("svg", { class: "stat__sparkline", viewBox: `0 0 ${w} ${h}`, preserveAspectRatio: "none" });
  svg.appendChild(svgEl("polyline", { points: points.join(" "), fill: "none", stroke: color, "stroke-width": "1.5", "stroke-linecap": "round" }));
  return svg;
}

// ============================================================================
// Common helpers
// ============================================================================

const locName = (id) => (LOCATIONS.find((l) => l.id === id) || {}).short || id;

function statCard({ label, value, valueSub, delta, deltaUp, sparkValues }) {
  const c = el("div", { class: "stat" });
  c.appendChild(el("div", { class: "stat__label", text: label }));
  const v = el("div", { class: "stat__value" });
  v.appendChild(document.createTextNode(value));
  if (valueSub) v.appendChild(el("em", { text: " " + valueSub }));
  c.appendChild(v);
  if (delta) {
    c.appendChild(el("div", {
      class: "stat__delta " + (deltaUp ? "stat__delta--up" : "stat__delta--down"),
      text: (deltaUp ? "▲ " : "▼ ") + delta
    }));
  }
  if (sparkValues) c.appendChild(sparkline(sparkValues));
  return c;
}

function pageHead(title, sub, actions = []) {
  const head = el("div", { class: "page-head" });
  const left = el("div");
  left.appendChild(el("h1", {}, ...title));
  if (sub) left.appendChild(el("div", { class: "page-head__sub", text: sub }));
  head.appendChild(left);
  if (actions.length) {
    const right = el("div", { class: "page-head__actions" }, ...actions);
    head.appendChild(right);
  }
  return head;
}

function panel(title, sub, body) {
  const p = el("div", { class: "panel" });
  if (title) {
    const h = el("div", { class: "panel__head" });
    h.appendChild(el("div", { class: "panel__title", text: title }));
    if (sub) h.appendChild(el("div", { class: "panel__sub", text: sub }));
    p.appendChild(h);
  }
  const b = el("div", { class: "panel__body" + (body && body.classList && body.classList.contains("flush") ? " panel__body--flush" : "") });
  if (body instanceof Node) b.appendChild(body);
  p.appendChild(b);
  return p;
}

function emHelper(em) { return el("em", { text: em }); }

// ============================================================================
// Tab renderers
// ============================================================================

function renderDashboard(root) {
  // Page head
  root.appendChild(pageHead(
    ["Dashboard ", emHelper("today"), "."],
    `Now showing: ${state.loc === "all" ? "all four locations" : locName(state.loc) + " only"} · ` + new Date().toLocaleString()
  ));

  // Stats
  const week = sumWeekRevenue();
  const grid = el("div", { class: "stat-grid" });
  grid.appendChild(statCard({
    label: "Today's Revenue",
    value: fmtK(state.loc === "all" ? FIN.todayRevenue : Math.round(FIN.todayRevenue * 0.25)),
    delta: "12% vs. yesterday", deltaUp: true,
    sparkValues: week
  }));
  grid.appendChild(statCard({
    label: "Today's Orders",
    value: state.loc === "all" ? "187" : "47",
    delta: "8 ahead of last Wednesday", deltaUp: true,
    sparkValues: [142, 156, 138, 174, 192, 211, 187]
  }));
  grid.appendChild(statCard({
    label: "Avg. Ticket",
    value: state.loc === "all" ? "$79.25" : "$74.80",
    delta: "$3.20 vs. last week", deltaUp: true,
    sparkValues: [72, 74, 71, 76, 79, 81, 79]
  }));
  grid.appendChild(statCard({
    label: "Online Order Share",
    value: state.loc === "all" ? "38%" : "42%",
    delta: "+4 pts in 30 days", deltaUp: true,
    sparkValues: [28, 31, 33, 35, 37, 38, 38]
  }));
  root.appendChild(grid);

  // Two-column charts
  const twoCol = el("div", { class: "two-col" });

  // Revenue this week chart
  const revPanel = panel("Revenue this week", "Mon · Tue · Wed · Thu · Fri · Sat · Sun");
  const revBody = revPanel.querySelector(".panel__body");
  revBody.appendChild(lineChart(week, { labels: ["M","T","W","T","F","S","S"], h: 240 }));
  twoCol.appendChild(revPanel);

  // Top items
  const topPanel = panel("Top items · 30 days", "Sorted by revenue");
  const topBody = topPanel.querySelector(".panel__body");
  const topList = el("div", { class: "chart-list" });
  const maxRev = Math.max(...TOP_ITEMS.map((i) => i.revenue));
  TOP_ITEMS.slice(0, 6).forEach((it) => {
    const row = el("div", { class: "chart-row" });
    row.appendChild(el("div", { class: "chart-row__name", text: it.name }));
    const bar = el("div", { class: "chart-row__bar" });
    const fill = el("div", { class: "chart-row__fill" });
    fill.style.transform = "scaleX(0)";
    requestAnimationFrame(() => { fill.style.transform = `scaleX(${it.revenue / maxRev})`; });
    bar.appendChild(fill);
    row.appendChild(bar);
    row.appendChild(el("div", { class: "chart-row__val", text: fmtK(it.revenue) + " · " + it.count }));
    topList.appendChild(row);
  });
  topBody.appendChild(topList);
  twoCol.appendChild(topPanel);

  root.appendChild(twoCol);

  // Hourly orders today
  const hourPanel = panel("Orders by hour, today", "Online + dine-in combined");
  hourPanel.querySelector(".panel__body").appendChild(barChart(
    sumHourly().slice(11, 24),
    ["11a","12p","1p","2p","3p","4p","5p","6p","7p","8p","9p","10p","11p"],
    { h: 220 }
  ));
  root.appendChild(hourPanel);
}

function renderOrders(root) {
  const orders = filterByLoc(ORDERS);

  root.appendChild(pageHead(
    ["Orders"],
    `${orders.filter(o => o.status === "placed" || o.status === "prep").length} active · ${orders.filter(o => o.status === "complete").length} fulfilled today`,
    [
      el("button", { class: "btn-admin btn-admin--ghost", text: "Export CSV" }),
      el("button", { class: "btn-admin", text: "+ Manual order" })
    ]
  ));

  // Status filter
  const tools = el("div", { class: "toolbar" });
  const statuses = [["all","All"],["placed","New"],["prep","In progress"],["ready","Ready"],["complete","Complete"]];
  const grp = el("div", { class: "toolbar__group" });
  let currentFilter = "all";
  statuses.forEach(([id, label]) => {
    const b = el("button", { class: "toolbar__btn" + (id === "all" ? " is-active" : ""), text: label });
    b.addEventListener("click", () => {
      currentFilter = id;
      grp.querySelectorAll(".toolbar__btn").forEach(x => x.classList.toggle("is-active", x === b));
      renderTable();
    });
    grp.appendChild(b);
  });
  tools.appendChild(grp);
  tools.appendChild(el("input", { class: "toolbar__search", placeholder: "Search by order # or customer…", type: "search" }));
  root.appendChild(tools);

  // Table panel
  const p = panel("All orders", null);
  p.classList.add("flush");
  const body = p.querySelector(".panel__body");
  body.classList.add("panel__body--flush");
  body.style.padding = "0";
  root.appendChild(p);

  function renderTable() {
    while (body.firstChild) body.removeChild(body.firstChild);
    const rows = currentFilter === "all" ? orders : orders.filter(o => o.status === currentFilter);
    if (!rows.length) {
      body.appendChild(el("div", { class: "empty" },
        el("div", { class: "empty__mark", text: "✦" }),
        "No orders match this filter."
      ));
      return;
    }
    const tbl = el("table", { class: "tbl" });
    const thead = el("thead");
    const tr = el("tr");
    ["Order","Customer","Items","Location","Type","Status","Total"].forEach(h => tr.appendChild(el("th", { text: h })));
    thead.appendChild(tr);
    tbl.appendChild(thead);
    const tbody = el("tbody");
    rows.forEach(o => {
      const r = el("tr");
      r.appendChild(el("td", {}, el("div", { class: "tbl__id", text: o.id }), el("div", { class: "tbl__items", text: relativeTime(o.placedAt) })));
      r.appendChild(el("td", {}, el("div", { text: o.customer }), el("div", { class: "tbl__items", text: o.phone })));
      r.appendChild(el("td", {}, el("div", { class: "tbl__items", text: o.items.map(([n, q]) => (q > 1 ? q + " × " : "") + n).join(", ") })));
      r.appendChild(el("td", {}, el("span", { class: "pill pill--loc-" + o.location, text: locName(o.location) })));
      r.appendChild(el("td", { text: o.type === "delivery" ? "Delivery" : "Pickup" }));
      r.appendChild(el("td", {}, el("span", { class: "pill pill--" + o.status, text: { placed:"New", prep:"Preparing", ready:"Ready", complete:"Complete", canceled:"Canceled" }[o.status] })));
      r.appendChild(el("td", {}, el("span", { class: "tbl__price", text: fmt(o.total) })));
      tbody.appendChild(r);
    });
    tbl.appendChild(tbody);
    body.appendChild(tbl);
  }
  renderTable();
}

function relativeTime(t) {
  if (!t) return "";
  if (t.startsWith("T-")) return t.slice(2) + " min ago";
  if (t.startsWith("T+")) return "in " + t.slice(2) + " min";
  if (t === "T+0") return "now";
  return t;
}

function renderReservations(root) {
  const list = filterByLoc(RESERVATIONS);
  root.appendChild(pageHead(
    ["Reservations"],
    `${list.length} upcoming across the next 7 nights`,
    [el("button", { class: "btn-admin btn-admin--ghost", text: "Sync OpenTable" }), el("button", { class: "btn-admin", text: "+ Add booking" })]
  ));

  const p = panel("Upcoming bookings", "Tonight + next 7 days");
  p.classList.add("flush");
  const body = p.querySelector(".panel__body");
  body.style.padding = "0";

  const tbl = el("table", { class: "tbl" });
  const thead = el("thead");
  const tr = el("tr");
  ["When","Guest","Party","Location","Occasion","Phone"].forEach(h => tr.appendChild(el("th", { text: h })));
  thead.appendChild(tr);
  tbl.appendChild(thead);
  const tbody = el("tbody");
  list.forEach(r => {
    const row = el("tr");
    row.appendChild(el("td", {}, el("div", { class: "tbl__id", text: relativeOrLabel(r.when) })));
    row.appendChild(el("td", { text: r.customer }));
    row.appendChild(el("td", { text: String(r.party) }));
    row.appendChild(el("td", {}, el("span", { class: "pill pill--loc-" + r.location, text: locName(r.location) })));
    row.appendChild(el("td", { text: r.occasion || "—" }));
    row.appendChild(el("td", { text: r.phone }));
    tbody.appendChild(row);
  });
  tbl.appendChild(tbody);
  body.appendChild(tbl);
  root.appendChild(p);
}

function relativeOrLabel(s) {
  if (!s) return "";
  if (s.startsWith("T+")) return "in " + s.slice(2) + " min";
  return s;
}

function renderEvents(root) {
  const list = filterByLoc(EVENTS);
  root.appendChild(pageHead(
    ["Events ", emHelper("&"), " catering"],
    `${list.filter(e => e.status === "New").length} new · ${list.filter(e => e.status === "Quoted").length} quoted · ${list.filter(e => e.status === "Confirmed").length} on the books`,
    [el("button", { class: "btn-admin", text: "+ Manual inquiry" })]
  ));

  list.forEach(e => {
    const p = panel(null, null);
    const body = p.querySelector(".panel__body");
    const head = el("div", { style: "display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 1rem; margin-bottom: 0.625rem;" });
    head.appendChild(el("div", {},
      el("span", { class: "tbl__id", text: e.id }),
      document.createTextNode(" · "),
      el("strong", { style: "font-family: 'Italiana', serif; font-size: 1.25rem; color: var(--ink);", text: e.customer }),
      el("span", { style: "font-family: 'Cormorant Garamond', serif; font-style: italic; color: var(--ink-mute); margin-left: 0.5rem;", text: " · " + e.type + " · " + e.party + " guests · " + e.when })
    ));
    head.appendChild(el("span", { class: "pill pill--" + ({ "New":"placed", "Quoted":"prep", "Confirmed":"ready" }[e.status] || "complete"), text: e.status }));
    body.appendChild(head);

    body.appendChild(el("div", { style: "font-family: 'EB Garamond', serif; color: var(--ink-soft); margin-bottom: 0.5rem;", text: e.notes }));
    body.appendChild(el("div", { style: "font-family: 'Cormorant Garamond', serif; font-style: italic; color: var(--ink-mute); font-size: 0.875rem; margin-bottom: 0.875rem;", text: "Contact: " + e.contact + " · Location: " + locName(e.location) }));

    const actions = el("div", { style: "display: flex; gap: 0.5rem;" });
    actions.appendChild(el("button", { class: "btn-admin btn-admin--ghost", text: "Reply" }));
    if (e.status === "New") actions.appendChild(el("button", { class: "btn-admin", text: "Send quote" }));
    if (e.status === "Quoted") actions.appendChild(el("button", { class: "btn-admin", text: "Mark confirmed" }));
    actions.appendChild(el("button", { class: "btn-admin btn-admin--ghost", text: "View thread" }));
    body.appendChild(actions);

    root.appendChild(p);
  });
}

function renderAnalytics(root) {
  root.appendChild(pageHead(
    ["Analytics"],
    `Last 30 days · ${state.loc === "all" ? "all locations" : locName(state.loc) + " only"}`,
    [el("button", { class: "btn-admin btn-admin--ghost", text: "Export PDF" }), el("button", { class: "btn-admin btn-admin--ghost", text: "Date range" })]
  ));

  // Revenue trend
  const week = sumWeekRevenue();
  const trendPanel = panel("Revenue · last 7 days", "Mon → Sun");
  trendPanel.querySelector(".panel__body").appendChild(lineChart(week, { labels: ["M","T","W","T","F","S","S"], h: 280 }));
  root.appendChild(trendPanel);

  // Two-col: hourly + by location
  const tc = el("div", { class: "two-col" });

  const hp = panel("Orders by hour, today", null);
  hp.querySelector(".panel__body").appendChild(barChart(
    sumHourly().slice(11, 24),
    ["11a","12p","1p","2p","3p","4p","5p","6p","7p","8p","9p","10p","11p"],
    { h: 240 }
  ));
  tc.appendChild(hp);

  const lp = panel("Revenue by location · 30 days", null);
  const lpb = lp.querySelector(".panel__body");
  const locValues = LOCATIONS.map(l => WEEK_REVENUE[l.id].reduce((s,v) => s + v, 0) * 4.3);
  const locColors = ["#B0432A","#C8954A","#3F4A2A","#1A1410"];
  const donutWrap = el("div", { style: "display: flex; gap: 1.5rem; align-items: center; justify-content: center; flex-wrap: wrap;" });
  donutWrap.appendChild(donutChart(locValues, LOCATIONS.map(l => l.short), locColors, { subtitle: "total", size: 200 }));
  const legend = el("div", { style: "display: grid; gap: 0.5rem;" });
  LOCATIONS.forEach((l, i) => {
    const row = el("div", { style: "display: flex; align-items: center; gap: 0.5rem; font-family: 'EB Garamond', serif; font-size: 0.875rem;" });
    row.appendChild(el("span", { style: `width: 10px; height: 10px; border-radius: 999px; background: ${locColors[i]};` }));
    row.appendChild(el("span", { text: l.short }));
    row.appendChild(el("span", { style: "color: var(--ink-mute); font-style: italic; margin-left: auto;", text: fmtK(locValues[i]) }));
    legend.appendChild(row);
  });
  donutWrap.appendChild(legend);
  lpb.appendChild(donutWrap);
  tc.appendChild(lp);

  root.appendChild(tc);

  // Top items full table
  const ip = panel("Top items · last 30 days", "Ranked by revenue");
  const ipb = ip.querySelector(".panel__body");
  const list = el("div", { class: "chart-list" });
  const max = Math.max(...TOP_ITEMS.map(i => i.revenue));
  TOP_ITEMS.forEach(it => {
    const row = el("div", { class: "chart-row" });
    row.appendChild(el("div", { class: "chart-row__name", text: it.name }));
    const bar = el("div", { class: "chart-row__bar" });
    const fill = el("div", { class: "chart-row__fill" });
    fill.style.transform = "scaleX(0)";
    requestAnimationFrame(() => { fill.style.transform = `scaleX(${it.revenue / max})`; });
    bar.appendChild(fill);
    row.appendChild(bar);
    row.appendChild(el("div", { class: "chart-row__val", text: fmtK(it.revenue) + " · " + it.count + " sold" }));
    list.appendChild(row);
  });
  ipb.appendChild(list);
  root.appendChild(ip);
}

function renderAccounting(root) {
  root.appendChild(pageHead(
    ["Accounting"],
    `Month-to-date P&L · ${state.loc === "all" ? "all four locations combined" : locName(state.loc) + " only"}`,
    [el("button", { class: "btn-admin btn-admin--ghost", text: "Export to QuickBooks" }), el("button", { class: "btn-admin btn-admin--ghost", text: "Download P&L PDF" })]
  ));

  const grid = el("div", { class: "stat-grid" });
  grid.appendChild(statCard({ label: "Revenue MTD", value: fmtK(FIN.monthRevenue), delta: "+7% vs. last month", deltaUp: true, sparkValues: [310,322,341,358,372] }));
  grid.appendChild(statCard({ label: "Cost of Goods", value: fmtK(FIN.cogs), delta: "36.0% of revenue", deltaUp: false, sparkValues: [115,118,124,128,134] }));
  grid.appendChild(statCard({ label: "Payroll", value: fmtK(FIN.payroll), delta: "26.8% of revenue", deltaUp: false, sparkValues: [85,88,92,96,99] }));
  grid.appendChild(statCard({ label: "Net Income", value: fmtK(FIN.monthRevenue - FIN.cogs - FIN.payroll - FIN.rent - FIN.utilities - FIN.marketing - FIN.other), delta: "Margin 25.6%", deltaUp: true, sparkValues: [82,86,89,92,95] }));
  root.appendChild(grid);

  const tc = el("div", { class: "two-col" });

  // P&L breakdown
  const pl = panel("P&L breakdown", "May, month-to-date");
  const plb = pl.querySelector(".panel__body");
  const lines = [
    ["Revenue", FIN.monthRevenue, "var(--olive)"],
    ["Cost of goods sold (food)", -FIN.cogs, "var(--terracotta)"],
    ["Payroll & benefits", -FIN.payroll, "var(--terracotta)"],
    ["Rent (4 locations)", -FIN.rent, "var(--terracotta)"],
    ["Utilities", -FIN.utilities, "var(--terracotta)"],
    ["Marketing", -FIN.marketing, "var(--terracotta)"],
    ["Other operating", -FIN.other, "var(--terracotta)"]
  ];
  const tbl = el("table", { class: "tbl" });
  const tbody = el("tbody");
  lines.forEach(([label, amt, color]) => {
    const row = el("tr");
    row.appendChild(el("td", {}, el("div", { style: `font-family: 'EB Garamond', serif; color: ${color};`, text: label })));
    row.appendChild(el("td", { style: "text-align: right;" }, el("span", { class: "tbl__price", text: (amt < 0 ? "−" : "") + fmt(Math.abs(amt)).replace("$","$") })));
    tbody.appendChild(row);
  });
  // Net income
  const net = lines.reduce((s, [_, amt]) => s + amt, 0);
  const netRow = el("tr");
  netRow.appendChild(el("td", {}, el("strong", { style: "font-family: 'Italiana', serif; font-size: 1.125rem;", text: "Net income" })));
  netRow.appendChild(el("td", { style: "text-align: right;" }, el("strong", { class: "tbl__price", style: "font-family: 'Italiana', serif; font-size: 1.25rem; color: var(--olive);", text: fmt(net) })));
  tbody.appendChild(netRow);
  tbl.appendChild(tbody);
  plb.appendChild(tbl);
  tc.appendChild(pl);

  // Fees + deposits
  const fp = panel("Platform fees · month-to-date", null);
  const fpb = fp.querySelector(".panel__body");
  const fees = [
    ["Toast (POS + Online Ordering)", FIN.feesThisMonth.toast, "3.0% of orders"],
    ["Stripe (cards)", FIN.feesThisMonth.stripe, "2.9% + 30¢"],
    ["OpenTable", FIN.feesThisMonth.opentable, "$1.50 per cover"],
    ["Mailchimp", FIN.feesThisMonth.mailchimp, "Flat monthly"]
  ];
  const ftbl = el("table", { class: "tbl" });
  const ftbody = el("tbody");
  fees.forEach(([label, amt, sub]) => {
    const row = el("tr");
    const name = el("td", {});
    name.appendChild(el("div", { text: label, style: "font-family: 'EB Garamond', serif;" }));
    name.appendChild(el("div", { class: "tbl__items", text: sub }));
    row.appendChild(name);
    row.appendChild(el("td", { style: "text-align: right;" }, el("span", { class: "tbl__price", text: fmt(amt) })));
    ftbody.appendChild(row);
  });
  ftbl.appendChild(ftbody);
  fpb.appendChild(ftbl);
  tc.appendChild(fp);

  root.appendChild(tc);

  // Recent deposits
  const dp = panel("Recent deposits · last 7 days", "Auto-deposited from Toast to your bank");
  dp.classList.add("flush");
  const dpb = dp.querySelector(".panel__body");
  dpb.style.padding = "0";
  const dtbl = el("table", { class: "tbl" });
  const dthead = el("thead");
  const dthr = el("tr");
  ["Date","Source","Amount"].forEach(h => dthr.appendChild(el("th", { text: h })));
  dthead.appendChild(dthr); dtbl.appendChild(dthead);
  const dtbody = el("tbody");
  FIN.deposits.forEach(d => {
    const r = el("tr");
    r.appendChild(el("td", { text: d.date }));
    r.appendChild(el("td", { text: d.source }));
    r.appendChild(el("td", { style: "text-align: right;" }, el("span", { class: "tbl__price", text: fmt(d.amount) })));
    dtbody.appendChild(r);
  });
  dtbl.appendChild(dtbody);
  dpb.appendChild(dtbl);
  root.appendChild(dp);
}

function renderMenu(root) {
  root.appendChild(pageHead(
    ["Menu editor"],
    `Edits publish to all four locations within 30 seconds · backed by Sanity CMS`,
    [el("button", { class: "btn-admin btn-admin--ghost", text: "Preview public site" }), el("button", { class: "btn-admin", text: "+ Add item" })]
  ));

  const wrap = el("div", { class: "menu-editor" });

  // Sections sidebar
  const sects = el("div", { class: "menu-editor__sections" });
  let activeSection = MENU_SECTIONS[0].id;
  function renderSections() {
    while (sects.firstChild) sects.removeChild(sects.firstChild);
    MENU_SECTIONS.forEach(s => {
      const row = el("div", { class: "menu-editor__section" + (s.id === activeSection ? " is-active" : "") });
      row.appendChild(el("span", { text: s.name }));
      row.appendChild(el("span", { class: "menu-editor__section-count", text: s.items.length + " items" }));
      row.addEventListener("click", () => { activeSection = s.id; renderSections(); renderItems(); });
      sects.appendChild(row);
    });
    const add = el("div", { class: "menu-editor__section", style: "color: var(--ink-mute); font-style: italic;" });
    add.appendChild(el("span", { text: "+ New section" }));
    sects.appendChild(add);
  }

  // Items panel
  const itemsPanel = panel(null, null);
  itemsPanel.classList.add("flush");
  const itemsBody = itemsPanel.querySelector(".panel__body");
  itemsBody.style.padding = "0";

  function renderItems() {
    while (itemsBody.firstChild) itemsBody.removeChild(itemsBody.firstChild);
    const sec = MENU_SECTIONS.find(s => s.id === activeSection);
    sec.items.forEach(item => {
      const row = el("div", { class: "editable-row" + (!item.available ? " is-86" : "") });
      row.appendChild(el("div", { class: "editable-row__handle", text: "⋮⋮" }));
      const name = el("div");
      name.appendChild(el("div", { class: "editable-row__name", text: item.name }));
      if (item.italian) name.appendChild(el("span", { class: "editable-row__sub", text: item.italian + (item.signature ? "  · House signature" : "") }));
      row.appendChild(name);

      // Price input
      const priceWrap = el("div");
      const priceInput = el("input", { type: "number", value: String(item.price), step: "0.5", class: "editable-row__price-input" });
      priceInput.addEventListener("change", () => { item.price = parseFloat(priceInput.value); });
      priceWrap.appendChild(priceInput);
      row.appendChild(priceWrap);

      // Available toggle
      const toggle = el("label", { class: "toggle" + (item.available ? " is-on" : " is-86") });
      toggle.appendChild(el("span", { class: "toggle__track" }));
      toggle.appendChild(el("span", { text: item.available ? "Available" : "86'd" }));
      toggle.addEventListener("click", () => {
        item.available = !item.available;
        renderItems();
      });
      row.appendChild(toggle);

      // Edit button
      row.appendChild(el("button", { class: "btn-admin btn-admin--ghost", text: "Edit" }));
      itemsBody.appendChild(row);
    });
  }

  renderSections();
  renderItems();

  wrap.appendChild(sects);
  wrap.appendChild(itemsPanel);
  root.appendChild(wrap);
}

function renderSpecials(root) {
  root.appendChild(pageHead(
    ["Specials ", emHelper("this week")],
    "Lunch specials · Mon-Sat 11a–3p · Edits go live immediately",
    [el("button", { class: "btn-admin btn-admin--ghost", text: "Schedule next week" }), el("button", { class: "btn-admin", text: "+ One-night feature" })]
  ));

  const grid = el("div", { style: "display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;" });
  SPECIALS.forEach(s => {
    const card = el("div", { class: "panel" });
    const body = el("div", { class: "panel__body" });
    body.appendChild(el("div", { style: "font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 0.6875rem; letter-spacing: 0.32em; text-transform: uppercase; color: var(--terracotta); margin-bottom: 0.5rem;", text: s.day }));
    body.appendChild(el("input", { type: "text", value: s.name, style: "width: 100%; font-family: 'Italiana', serif; font-size: 1.5rem; line-height: 1.05; background: transparent; border: 0; padding: 0; margin-bottom: 0.25rem; color: var(--ink);" }));
    body.appendChild(el("input", { type: "text", value: s.italian, style: "width: 100%; font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 0.875rem; background: transparent; border: 0; padding: 0; margin-bottom: 0.875rem; color: var(--terracotta);" }));
    const priceRow = el("div", { style: "display: flex; align-items: center; gap: 0.5rem;" });
    priceRow.appendChild(el("span", { style: "font-family: 'Cormorant Garamond', serif; font-style: italic; color: var(--ink-mute); font-size: 0.75rem; letter-spacing: 0.2em; text-transform: uppercase;", text: "Price" }));
    priceRow.appendChild(el("input", { type: "number", value: String(s.price), step: "0.5", style: "width: 80px; font-family: 'Cormorant Garamond', serif; font-style: italic; color: var(--terracotta); border: 1px solid rgba(26,20,16,0.15); padding: 0.4rem 0.5rem; border-radius: 4px; background: var(--cream);" }));
    body.appendChild(priceRow);
    body.appendChild(el("div", { style: "display: flex; gap: 0.5rem; margin-top: 1rem;" },
      el("button", { class: "btn-admin btn-admin--ghost", text: "Replace" }),
      el("button", { class: "btn-admin btn-admin--ghost", text: "Remove" })
    ));
    card.appendChild(body);
    grid.appendChild(card);
  });
  root.appendChild(grid);

  // Featured / monthly
  root.appendChild(pageHead(["Chef's monthly feature"], "May 2026", [el("button", { class: "btn-admin", text: "Edit feature" })]));
  const f = el("div", { class: "panel" });
  const fb = el("div", { class: "panel__body" });
  fb.appendChild(el("div", { style: "font-family: 'Italiana', serif; font-size: 2rem; line-height: 1; margin-bottom: 0.5rem;", text: "Ossobuco di Vitello" }));
  fb.appendChild(el("div", { style: "font-family: 'Cormorant Garamond', serif; font-style: italic; color: var(--terracotta); margin-bottom: 1rem;", text: "Bone-in veal shank · saffron risotto Milanese · gremolata" }));
  fb.appendChild(el("div", { style: "font-family: 'EB Garamond', serif; color: var(--ink-soft); line-height: 1.55;", text: "$36 per plate · paired wine $14 · available all of May at all four locations, dinner only" }));
  f.appendChild(fb);
  root.appendChild(f);
}

function renderReviews(root) {
  const list = filterByLoc(REVIEWS);
  const avg = (list.reduce((s,r) => s + r.stars, 0) / list.length).toFixed(1);

  root.appendChild(pageHead(
    ["Reviews"],
    `${list.length} new in the last 30 days · ${avg} ★ average · ${list.filter(r => !r.reply).length} need a reply`,
    [el("button", { class: "btn-admin btn-admin--ghost", text: "Sync sources" })]
  ));

  list.forEach(r => {
    const card = el("article", { class: "review" });
    card.appendChild(el("div", { class: "review__avatar", text: (r.customer[0] || "?").toUpperCase() }));
    const body = el("div");
    const head = el("div", { class: "review__head" });
    head.appendChild(el("span", { class: "review__name", text: r.customer }));
    head.appendChild(el("span", { class: "review__stars", text: "★".repeat(r.stars) + "☆".repeat(5 - r.stars) }));
    head.appendChild(el("span", { class: "review__source", text: r.source.toUpperCase() + " · " + r.date }));
    head.appendChild(el("span", { class: "pill pill--loc-" + r.location, text: locName(r.location) }));
    body.appendChild(head);
    body.appendChild(el("div", { class: "review__body", text: r.body }));

    if (r.reply) {
      const replyEl = el("div", { class: "review__reply" });
      replyEl.appendChild(el("strong", { text: r.reply.author + " replied · " + r.reply.date }));
      replyEl.appendChild(el("br"));
      replyEl.appendChild(document.createTextNode(r.reply.body));
      body.appendChild(replyEl);
    } else {
      const actions = el("div", { class: "review__actions" });
      actions.appendChild(el("button", { class: "btn-admin", text: "Reply" }));
      actions.appendChild(el("button", { class: "btn-admin btn-admin--ghost", text: "Mark resolved" }));
      if (r.stars <= 3) actions.appendChild(el("button", { class: "btn-admin btn-admin--ghost", text: "Flag manager" }));
      body.appendChild(actions);
    }
    card.appendChild(body);
    root.appendChild(card);
  });
}

function renderCustomers(root) {
  root.appendChild(pageHead(
    ["Customers"],
    `Top customers across all four locations · ${CUSTOMERS.length} loyalty members shown`,
    [el("button", { class: "btn-admin btn-admin--ghost", text: "Export segment" }), el("button", { class: "btn-admin", text: "Send campaign" })]
  ));

  const p = panel("Top customers · lifetime value", "Sorted by lifetime spend");
  p.classList.add("flush");
  const body = p.querySelector(".panel__body");
  body.style.padding = "0";

  const tbl = el("table", { class: "tbl" });
  const thead = el("thead");
  const tr = el("tr");
  ["Customer","Email","Visits","Lifetime","Last visit","Favorite Casa"].forEach(h => tr.appendChild(el("th", { text: h })));
  thead.appendChild(tr); tbl.appendChild(thead);
  const tbody = el("tbody");
  CUSTOMERS.forEach(c => {
    const r = el("tr");
    r.appendChild(el("td", {}, el("strong", { style: "font-family: 'Italiana', serif;", text: c.name })));
    r.appendChild(el("td", { text: c.email, style: "color: var(--ink-mute);" }));
    r.appendChild(el("td", { text: String(c.visits) }));
    r.appendChild(el("td", {}, el("span", { class: "tbl__price", text: fmt(c.lifetime) })));
    r.appendChild(el("td", { text: c.lastVisit }));
    r.appendChild(el("td", {}, el("span", { class: "pill pill--loc-" + c.favoriteLoc.toLowerCase().replace("w. ","").replace(" ",""), text: c.favoriteLoc })));
    tbody.appendChild(r);
  });
  tbl.appendChild(tbody);
  body.appendChild(tbl);
  root.appendChild(p);
}

function renderSettings(root) {
  root.appendChild(pageHead(
    ["Settings"],
    state.loc === "all" ? "Editing all four locations · changes apply per-location below" : `Editing ${locName(state.loc)} only`,
    [el("button", { class: "btn-admin", text: "Save changes" })]
  ));

  const grid = el("div", { class: "settings-grid" });

  // Hours panel
  const hp = panel("Hours of operation", "Per location, all visible");
  const hpb = hp.querySelector(".panel__body");
  ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].forEach((day, i) => {
    const row = el("div", { class: "field-row" });
    row.appendChild(el("label", { text: day }));
    const inputs = el("div", { style: "display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;" });
    const isWeekend = i >= 4;
    inputs.appendChild(el("input", { type: "time", value: i === 6 ? "12:00" : "11:00" }));
    inputs.appendChild(el("input", { type: "time", value: isWeekend ? "22:00" : "21:00" }));
    row.appendChild(inputs);
    hpb.appendChild(row);
  });
  grid.appendChild(hp);

  // Contact info
  const cp = panel("Contact information", null);
  const cpb = cp.querySelector(".panel__body");
  [
    ["Restaurant phone", "(260) 489-4458"],
    ["Reservations email", "reservations@casarestaurants.com"],
    ["Catering inquiries email", "catering@casarestaurants.com"],
    ["Press & community", "community@casarestaurants.com"]
  ].forEach(([label, val]) => {
    const row = el("div", { class: "field-row" });
    row.appendChild(el("label", { text: label }));
    row.appendChild(el("input", { type: "text", value: val }));
    cpb.appendChild(row);
  });
  grid.appendChild(cp);

  // Brand
  const bp = panel("Brand", null);
  const bpb = bp.querySelector(".panel__body");
  [
    ["Display name", "Casa Ristoranti Italiano"],
    ["Tagline", "Family-owned Italian. Fort Wayne. Since 1977."],
    ["Primary color", "#B0432A"],
    ["Cream background", "#F2EAD7"]
  ].forEach(([label, val]) => {
    const row = el("div", { class: "field-row" });
    row.appendChild(el("label", { text: label }));
    row.appendChild(el("input", { type: "text", value: val }));
    bpb.appendChild(row);
  });
  grid.appendChild(bp);

  // Tax & policy
  const tp = panel("Tax & policy", null);
  const tpb = tp.querySelector(".panel__body");
  [
    ["Sales tax rate", "7.00%"],
    ["Delivery fee", "$4.99"],
    ["Default tip option (online)", "20% suggested"],
    ["Cancellation window", "2 hours"]
  ].forEach(([label, val]) => {
    const row = el("div", { class: "field-row" });
    row.appendChild(el("label", { text: label }));
    row.appendChild(el("input", { type: "text", value: val }));
    tpb.appendChild(row);
  });
  grid.appendChild(tp);

  root.appendChild(grid);
}

function renderIntegrations(root) {
  root.appendChild(pageHead(
    ["Integrations"],
    "External services that power Casa's website and operations"
  ));

  const integrations = [
    { name: "Toast POS", sub: "Online ordering routes to Toast tablets at all 4 locations", logo: "T", status: "Connected", ok: true },
    { name: "OpenTable", sub: "Reservations sync bidirectionally", logo: "O", status: "Connected", ok: true },
    { name: "Stripe", sub: "Card processing for online orders + e-commerce shop", logo: "S", status: "Connected", ok: true },
    { name: "Sanity CMS", sub: "Menu content, story, photo galleries", logo: "C", status: "Connected", ok: true },
    { name: "Mailchimp", sub: "Newsletter & specials email campaigns", logo: "M", status: "Connected", ok: true },
    { name: "Google Business", sub: "Hours, photos, reviews sync", logo: "G", status: "Connected", ok: true },
    { name: "Yelp Business", sub: "Reviews import + reply", logo: "Y", status: "Connected", ok: true },
    { name: "Vercel Analytics", sub: "Web traffic + Core Web Vitals", logo: "V", status: "Connected", ok: true },
    { name: "QuickBooks Online", sub: "Daily sales export to GL", logo: "Q", status: "Not connected", ok: false },
    { name: "DoorDash Drive", sub: "Optional delivery-only fulfillment", logo: "D", status: "Not connected", ok: false }
  ];

  integrations.forEach(i => {
    const card = el("div", { class: "integration" });
    card.appendChild(el("div", { class: "integration__logo", text: i.logo }));
    const body = el("div", { class: "integration__body" });
    body.appendChild(el("div", { class: "integration__name", text: i.name }));
    body.appendChild(el("div", { class: "integration__sub", text: i.sub }));
    card.appendChild(body);
    card.appendChild(el("span", {
      class: "integration__status " + (i.ok ? "integration__status--ok" : "integration__status--off"),
      text: i.status
    }));
    if (i.ok) card.appendChild(el("button", { class: "btn-admin btn-admin--ghost", text: "Configure" }));
    else card.appendChild(el("button", { class: "btn-admin", text: "Connect" }));
    root.appendChild(card);
  });
}

// ============================================================================
// Routing
// ============================================================================

const tabs = {
  dashboard: renderDashboard,
  orders: renderOrders,
  reservations: renderReservations,
  events: renderEvents,
  analytics: renderAnalytics,
  accounting: renderAccounting,
  menu: renderMenu,
  specials: renderSpecials,
  reviews: renderReviews,
  customers: renderCustomers,
  settings: renderSettings,
  integrations: renderIntegrations
};

function render() {
  const main = $("#main");
  while (main.firstChild) main.removeChild(main.firstChild);
  const fn = tabs[state.tab] || renderDashboard;
  fn(main);
  // Update nav active state
  $$(".nav-tab").forEach(b => b.classList.toggle("is-active", b.dataset.tab === state.tab));
  $$(".loc-switch__btn").forEach(b => b.classList.toggle("is-active", b.dataset.loc === state.loc));
}

function init() {
  // Tab clicks
  $$(".nav-tab").forEach(b => {
    b.addEventListener("click", () => {
      state.tab = b.dataset.tab;
      location.hash = state.tab + "/" + state.loc;
      render();
    });
  });
  // Location switch
  $$(".loc-switch__btn").forEach(b => {
    b.addEventListener("click", () => {
      state.loc = b.dataset.loc;
      location.hash = state.tab + "/" + state.loc;
      render();
    });
  });
  // Read initial hash: #tab/loc
  const h = location.hash.slice(1);
  if (h) {
    const [t, l] = h.split("/");
    if (tabs[t]) state.tab = t;
    if (l && (l === "all" || LOCATIONS.find(x => x.id === l))) state.loc = l;
  }
  render();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
