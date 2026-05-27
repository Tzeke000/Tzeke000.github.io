/* Shared behaviour for Tzeke000 Studios */
(function () {
  "use strict";

  /* ---- Mobile nav toggle ---- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.getElementById("nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---- Highlight the current page in the nav ---- */
  var current = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(function (a) {
    var href = a.getAttribute("href");
    if (href === current || (current === "index.html" && href === "index.html")) {
      a.classList.add("active");
      a.setAttribute("aria-current", "page");
    }
  });

  /* ---- Current year in footer ---- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---- Newsletter (only present on home) ---- */
  var form = document.getElementById("newsletter-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = document.getElementById("newsletter-email");
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
      if (ok) {
        alert("Thanks for subscribing!");
        input.value = "";
      } else {
        alert("Please enter a valid email address.");
      }
    });
  }

  /* ---- Bio slideshow (only present on bio) ---- */
  var slideshow = document.querySelector("[data-slideshow]");
  if (slideshow) {
    var slides = Array.prototype.slice.call(slideshow.querySelectorAll(".slide"));
    var dotsWrap = document.querySelector("[data-slide-dots]");
    var index = 0;

    var dots = slides.map(function (_, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Go to photo " + (i + 1));
      b.addEventListener("click", function () { show(i); });
      if (dotsWrap) dotsWrap.appendChild(b);
      return b;
    });

    function show(n) {
      index = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle("active", i === index); });
      dots.forEach(function (d, i) { d.classList.toggle("active", i === index); });
    }

    var prev = slideshow.querySelector(".slide-btn.prev");
    var next = slideshow.querySelector(".slide-btn.next");
    if (prev) prev.addEventListener("click", function () { show(index - 1); });
    if (next) next.addEventListener("click", function () { show(index + 1); });

    show(0);
  }
})();
