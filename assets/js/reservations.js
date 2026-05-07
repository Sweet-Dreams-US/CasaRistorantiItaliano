/* ==========================================================================
   CASA · reservations.js — pre-select location from URL, simulate submit
   ========================================================================== */

const $ = (s, c = document) => c.querySelector(s);

(function () {
  const form = $("#res-form");
  if (!form) return;

  // Pre-select location from ?loc= query
  const params = new URLSearchParams(location.search);
  const loc = params.get("loc");
  if (loc) {
    const sel = $("#rf-loc");
    if (sel && [...sel.options].some((o) => o.value === loc)) {
      sel.value = loc;
    }
  }

  // Set date min to today
  const dateEl = $("#rf-date");
  if (dateEl) {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    dateEl.min = today.toISOString().slice(0, 10);
  }

  const locNames = {
    dupont: "Dupont",
    stellhorn: "Stellhorn",
    jefferson: "W. Jefferson",
    parnell: "Parnell"
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submit = form.querySelector('button[type="submit"]');
    const orig = submit.textContent;
    submit.disabled = true;
    submit.textContent = "Holding the table…";

    // Simulate a remote call
    await new Promise((r) => setTimeout(r, 1200));

    const fd = new FormData(form);
    const payload = {
      location: fd.get("location"),
      date: fd.get("date"),
      time: fd.get("time"),
      party: fd.get("party"),
      name: fd.get("name"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      occasion: fd.get("occasion"),
      notes: fd.get("notes"),
      submittedAt: new Date().toISOString()
    };

    // Production: POST to your reservations service / OpenTable / Resy / Yelp / Toast Tables
    console.log("[Casa] reservation payload:", payload);

    // Show success
    form.style.display = "none";
    const success = $("#res-success");
    success.classList.add("is-shown");
    success.style.display = "block";
    $("#rs-party").textContent = payload.party;
    $("#rs-loc").textContent = locNames[payload.location] || "Casa";

    // Format date nicely
    let dateStr = payload.date;
    try {
      const d = new Date(payload.date + "T00:00:00");
      dateStr = d.toLocaleDateString([], {
        weekday: "long",
        month: "long",
        day: "numeric"
      });
    } catch {}
    $("#rs-date").textContent = dateStr;
    $("#rs-time").textContent = payload.time;

    submit.disabled = false;
    submit.textContent = orig;
  });
})();
