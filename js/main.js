(function () {
  "use strict";

  var cfg = window.PHG_CONFIG || {};
  var hasEmail = !!(cfg.email && cfg.email.trim());

  /* ---------- No email configured: hide email links, button and wording ---------- */
  if (!hasEmail) {
    document.querySelectorAll('[data-config="email"]').forEach(function (el) {
      var li = el.closest("li");
      (li || el).remove();
    });
    document.querySelectorAll('[data-channel="email"], [data-if-email]').forEach(function (el) {
      el.remove();
    });
    var actions = document.querySelector(".form-actions");
    if (actions) actions.classList.add("single");
  }

  /* ---------- Fill contact details from config ---------- */
  document.querySelectorAll("[data-config]").forEach(function (el) {
    var key = el.getAttribute("data-config");
    if (key === "phone") {
      el.textContent = cfg.phoneDisplay || "";
      el.href = "tel:" + (cfg.phoneDisplay || "").replace(/[^\d+]/g, "");
    } else if (key === "email") {
      el.textContent = cfg.email || "";
      el.href = "mailto:" + (cfg.email || "");
    } else if (cfg[key]) {
      el.textContent = cfg[key];
    }
  });

  var waFloat = document.getElementById("wa-float");
  if (waFloat) {
    waFloat.href = "https://wa.me/" + cfg.whatsappNumber +
      "?text=" + encodeURIComponent("Hi PHG Labs, I'd like to know more about your products.");
  }

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("main-nav");
  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    toggle.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      nav.classList.remove("open");
      toggle.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });

  /* ---------- Header shadow on scroll ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() { header.classList.toggle("scrolled", window.scrollY > 10); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Enquiry form ---------- */
  var form = document.getElementById("enquiry-form");
  var select = form.elements.product;
  var errorEl = form.querySelector(".form-error");

  // Build the product dropdown from the product cards, plus general options.
  var options = [];
  document.querySelectorAll(".product[data-product]").forEach(function (card) {
    options.push(card.getAttribute("data-product"));
  });
  options.push("Web / Mobile App Development", "Cloud & DevOps", "AI & Automation", "Other / General Enquiry");
  options.forEach(function (name) {
    var opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });

  // Clicking "Enquire about X" on a product card preselects it in the form.
  document.querySelectorAll(".product").forEach(function (card) {
    var link = card.querySelector(".product-link");
    if (link) {
      link.addEventListener("click", function () {
        select.value = card.getAttribute("data-product");
      });
    }
  });

  var channel = "whatsapp";
  form.querySelectorAll("button[data-channel]").forEach(function (btn) {
    btn.addEventListener("click", function () { channel = btn.getAttribute("data-channel"); });
  });

  form.addEventListener("input", function (e) {
    e.target.classList.remove("invalid");
    errorEl.hidden = true;
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var fields = ["name", "email", "phone", "product", "message"];
    var invalid = [];
    fields.forEach(function (f) {
      var el = form.elements[f];
      var ok = el.value.trim() !== "" && el.checkValidity();
      if (f === "phone") ok = ok && el.value.replace(/\D/g, "").length >= 7;
      el.classList.toggle("invalid", !ok);
      if (!ok) invalid.push(el);
    });

    if (invalid.length) {
      errorEl.textContent = "Please fill in all required fields with valid details.";
      errorEl.hidden = false;
      invalid[0].focus();
      return;
    }

    var v = function (f) { return form.elements[f].value.trim(); };
    var lines = [
      "New enquiry from PHG Labs website",
      "",
      "Name: " + v("name"),
      v("company") ? "Company: " + v("company") : null,
      "Email: " + v("email"),
      "Phone: " + v("phone"),
      "Interested in: " + v("product"),
      "",
      "Message:",
      v("message")
    ].filter(function (l) { return l !== null; });
    var body = lines.join("\n");

    if (channel === "email") {
      var subject = "Enquiry: " + v("product") + " - " + v("name");
      window.location.href = "mailto:" + cfg.email +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
    } else {
      window.open("https://wa.me/" + cfg.whatsappNumber + "?text=" + encodeURIComponent(body), "_blank", "noopener");
    }
  });

  /* ---------- Reveal-on-scroll animation ---------- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".product, .service, .value, .process li").forEach(function (el) {
      el.classList.add("reveal");
      io.observe(el);
    });
  }
})();
