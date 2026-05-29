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
      var email = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert("Please enter a valid email address.");
        return;
      }
      var subject = "Newsletter — Subscribe";
      var body = "Hi Tzeke000, please add me to your newsletter.\n\nEmail: " + email;
      var href = "mailto:Tzeke000@gmail.com"
        + "?subject=" + encodeURIComponent(subject)
        + "&body=" + encodeURIComponent(body);
      window.location.href = href;
      input.value = "";
      setTimeout(function () {
        alert("Almost done — tap Send in your email app to confirm your subscription.");
      }, 600);
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

/* ===========================================================
   Visual layer: scroll reveal, canvas backgrounds, parallax
   =========================================================== */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Scroll-reveal via IntersectionObserver ---- */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    if (prefersReduced || !("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) { el.classList.add("in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
      revealEls.forEach(function (el) { io.observe(el); });
    }
  }

  if (prefersReduced) return;

  function hexToRgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }

  /* ---- Animated gradient blob background ---- */
  (function () {
    var canvas = document.getElementById("bg-canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0;
    var blobs = [];
    var COLORS = ["#ff2d95", "#8b5cff", "#1ad1ff", "#ff5a6e", "#7af0c8"];

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeBlob(i) {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: 200 + Math.random() * 180,
        color: COLORS[i % COLORS.length],
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 0.6
      };
    }

    function init() {
      resize();
      var count = w < 700 ? 3 : 5;
      blobs = [];
      for (var i = 0; i < count; i++) blobs.push(makeBlob(i));
    }

    var raf, t = 0;
    function tick() {
      t += 0.006;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (var i = 0; i < blobs.length; i++) {
        var b = blobs[i];
        b.x += b.vx + Math.sin(t * b.speed + b.phase) * 0.5;
        b.y += b.vy + Math.cos(t * b.speed + b.phase * 1.3) * 0.5;
        if (b.x < -b.r) b.x = w + b.r;
        if (b.x > w + b.r) b.x = -b.r;
        if (b.y < -b.r) b.y = h + b.r;
        if (b.y > h + b.r) b.y = -b.r;
        var g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, hexToRgba(b.color, 0.32));
        g.addColorStop(0.6, hexToRgba(b.color, 0.06));
        g.addColorStop(1, hexToRgba(b.color, 0));
        ctx.fillStyle = g;
        ctx.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
      }
      raf = requestAnimationFrame(tick);
    }

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(init, 120);
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { cancelAnimationFrame(raf); }
      else { raf = requestAnimationFrame(tick); }
    });

    init();
    raf = requestAnimationFrame(tick);
  })();

  /* ---- Hero particle network ---- */
  (function () {
    var canvas = document.getElementById("hero-particles");
    if (!canvas) return;
    var hero = canvas.parentElement;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0;
    var particles = [];
    var mouse = { x: -9999, y: -9999, active: false };

    function resize() {
      w = hero.clientWidth;
      h = hero.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn() {
      particles = [];
      var density = w < 700 ? 12000 : 6500;
      var n = Math.round((w * h) / density);
      n = Math.min(n, 110);
      for (var i = 0; i < n; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          r: Math.random() * 1.3 + 0.6
        });
      }
    }

    function init() { resize(); spawn(); }

    var raf;
    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < particles.length; i++) {
        var a = particles[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;
        if (mouse.active) {
          var mdx = a.x - mouse.x, mdy = a.y - mouse.y;
          var md = mdx * mdx + mdy * mdy;
          if (md < 16000 && md > 1) {
            var f = (16000 - md) / 16000;
            var dist = Math.sqrt(md);
            a.vx += (mdx / dist) * f * 0.18;
            a.vy += (mdy / dist) * f * 0.18;
          }
        }
        a.vx *= 0.99; a.vy *= 0.99;
        if (a.vx > 1) a.vx = 1; if (a.vx < -1) a.vx = -1;
        if (a.vy > 1) a.vy = 1; if (a.vy < -1) a.vy = -1;
        for (var j = i + 1; j < particles.length; j++) {
          var b = particles[j];
          var dx = a.x - b.x, dy = a.y - b.y;
          var d2 = dx * dx + dy * dy;
          if (d2 < 12000) {
            var alpha = (1 - d2 / 12000) * 0.5;
            ctx.strokeStyle = "rgba(255,255,255," + alpha + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }

    hero.addEventListener("mousemove", function (e) {
      var rect = hero.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    });
    hero.addEventListener("mouseleave", function () { mouse.active = false; });

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(init, 120);
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { cancelAnimationFrame(raf); }
      else { raf = requestAnimationFrame(tick); }
    });

    init();
    raf = requestAnimationFrame(tick);
  })();

  /* ---- Hero parallax ---- */
  (function () {
    var bg = document.querySelector(".hero-bg");
    if (!bg) return;
    var ticking = false;
    function update() {
      var sc = window.scrollY;
      bg.style.transform = "scale(1.12) translate3d(0," + (sc * 0.18) + "px,0)";
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  })();
})();
