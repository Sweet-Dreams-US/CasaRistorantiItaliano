/* ==========================================================================
   CASA · toast-stub.js
   Demo Toast POS adapter. Mimics the shape of a real Toast online-ordering
   integration so swapping in production credentials is a one-file change.
   --------------------------------------------------------------------------
   PRODUCTION INTEGRATION (when ready):
     1. Backend: provision Toast OAuth client + restaurant GUIDs.
     2. Replace `submitOrder` body with a fetch to your own /api/toast/order
        proxy (the Toast API requires server-to-server auth — never call it
        directly from the browser).
     3. Map our cart items to Toast `selections` using the menuItemGuid you
        retrieve via `GET /menus/v2/menus/{restaurantGuid}`.
     4. Use `POST /orders/v2/orders` with X-Toast-Restaurant-External-Id
        header. Pipe the response orderGuid back to the client to display
        order tracking.
     5. The shape returned by submitOrder() in this stub matches the fields
        we'd surface from a real Toast response: orderGuid, displayNumber,
        estimatedReadyTime.
   ========================================================================== */

const TOAST_RESTAURANT_GUIDS = {
  // These are placeholders — replace with the actual GUIDs Toast assigns
  // each Casa location after onboarding.
  dupont:   "casa-dupont-DEMO-GUID",
  stellhorn:"casa-stellhorn-DEMO-GUID",
  jefferson:"casa-jefferson-DEMO-GUID",
  parnell:  "casa-parnell-DEMO-GUID"
};

/**
 * Map a local cart item to a Toast `selection` payload shape.
 * In production the menuItemGuid would come from the Toast menus API,
 * cached server-side and joined with our id at order time.
 */
function toToastSelection(cartItem) {
  return {
    externalId: cartItem.id,
    quantity: cartItem.qty,
    // menuItemGuid: <hydrated server-side from Toast menus API>
    displayName: cartItem.name,
    unitOfMeasure: "NONE",
    preDiscountPrice: cartItem.price,
    receiptLinePrice: cartItem.price * cartItem.qty
  };
}

/**
 * Map our local form to a Toast order payload shape.
 */
export function buildOrderPayload({ location, type, items, customer, when }) {
  return {
    externalId: `casa-web-${Date.now()}`,
    restaurantGuid: TOAST_RESTAURANT_GUIDS[location] || "unknown",
    diningOption: type === "pickup" ? "TAKE_OUT" : "DELIVERY",
    source: "casa-website",
    promisedDate: when,
    customer: {
      firstName: (customer.name || "").split(" ")[0] || "Guest",
      lastName: (customer.name || "").split(" ").slice(1).join(" ") || "",
      email: customer.email || "",
      phone: customer.phone || ""
    },
    checks: [
      {
        externalId: `check-${Date.now()}`,
        selections: items.map(toToastSelection),
        customer: {
          firstName: (customer.name || "").split(" ")[0] || "Guest",
          email: customer.email || "",
          phone: customer.phone || ""
        }
      }
    ],
    deliveryInfo:
      type === "delivery"
        ? {
            address1: customer.address || "",
            city: "Fort Wayne",
            state: "IN",
            zipCode: customer.zip || "",
            notes: customer.notes || ""
          }
        : null,
    notes: customer.notes || ""
  };
}

/**
 * Submit the order. In production this hits your server proxy which then
 * relays to Toast's `POST /orders/v2/orders` endpoint with proper OAuth.
 * For the demo we simulate latency and return a fake confirmation.
 */
export async function submitOrder(payload) {
  // Simulate Toast network latency
  await new Promise((r) => setTimeout(r, 1400));

  // Fake response shaped like Toast's:
  return {
    orderGuid: crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    displayNumber: String(Math.floor(100 + Math.random() * 900)),
    estimatedReadyTime: new Date(Date.now() + 1000 * 60 * 25).toISOString(),
    status: "RECEIVED",
    restaurantGuid: payload.restaurantGuid,
    total: payload.checks?.[0]?.selections?.reduce(
      (s, sel) => s + (sel.receiptLinePrice || 0),
      0
    ) || 0
  };
}
