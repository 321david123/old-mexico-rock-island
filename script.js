/* =========================================================
   OLD MEXICO — interactions
   Lenis smooth scroll + GSAP/ScrollTrigger + Swiper
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Lenis smooth scroll ---------- */
  var lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  /* ---------- GSAP / ScrollTrigger ---------- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) { lenis.on("scroll", ScrollTrigger.update); }

    /* Reveal on scroll */
    gsap.utils.toArray("[data-reveal]").forEach(function (el) {
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: function () { el.classList.add("is-visible"); }
      });
    });

    if (!reduceMotion) {
      /* Hero headline lines */
      gsap.set("[data-hero-line]", { yPercent: 115 });
      gsap.to("[data-hero-line]", {
        yPercent: 0, duration: 1.1, ease: "power4.out", stagger: 0.12, delay: 0.25
      });

      /* Hero rule grows */
      gsap.to("#heroRule", { width: 220, duration: 1.1, ease: "power3.out", delay: 0.7 });

      /* Hero parallax (image drifts up on scroll) */
      gsap.to("#heroImg", {
        yPercent: 12, ease: "none",
        scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true }
      });

      /* Parallax inner images */
      gsap.utils.toArray("[data-parallax]").forEach(function (img) {
        gsap.fromTo(img, { yPercent: -8 }, {
          yPercent: 8, ease: "none",
          scrollTrigger: { trigger: img.closest("[data-parallax-wrap]") || img, start: "top bottom", end: "bottom top", scrub: true }
        });
      });

      /* Letter-stagger on signature titles */
      gsap.utils.toArray("[data-letters]").forEach(function (title) {
        var text = title.textContent;
        title.setAttribute("aria-label", text);
        title.innerHTML = "";
        text.split("").forEach(function (ch) {
          var s = document.createElement("span");
          s.className = "ltr";
          s.setAttribute("aria-hidden", "true");
          s.textContent = ch === " " ? " " : ch;
          title.appendChild(s);
        });
        gsap.from(title.querySelectorAll(".ltr"), {
          yPercent: 120, opacity: 0, duration: 0.6, ease: "power3.out", stagger: 0.025,
          scrollTrigger: { trigger: title, start: "top 85%", once: true }
        });
      });
    }

    /* Stat counters */
    gsap.utils.toArray(".stat__num[data-count]").forEach(function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var suffix = el.getAttribute("data-suffix") || "";
      var obj = { val: 0 };
      ScrollTrigger.create({
        trigger: el, start: "top 90%", once: true,
        onEnter: function () {
          if (reduceMotion) { el.textContent = target.toFixed(decimals) + suffix; return; }
          gsap.to(obj, {
            val: target, duration: 1.6, ease: "power2.out",
            onUpdate: function () { el.textContent = obj.val.toFixed(decimals) + suffix; }
          });
        }
      });
    });
  }

  /* ---------- Nav: solid on scroll ---------- */
  var nav = document.getElementById("nav");
  function onScroll() {
    if (window.scrollY > 60) { nav.classList.add("is-solid"); }
    else { nav.classList.remove("is-solid"); }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile overlay ---------- */
  var toggle = document.getElementById("navToggle");
  var overlay = document.getElementById("overlay");
  var overlayClose = document.getElementById("overlayClose");

  function openOverlay() {
    overlay.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    if (lenis) lenis.stop();
  }
  function closeOverlay() {
    overlay.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    if (lenis) lenis.start();
  }
  if (toggle) toggle.addEventListener("click", openOverlay);
  if (overlayClose) overlayClose.addEventListener("click", closeOverlay);
  overlay.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", closeOverlay);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && overlay.classList.contains("is-open")) closeOverlay();
  });

  /* ---------- Smooth anchor scroll via Lenis ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (id.length < 2) return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      if (lenis) { lenis.scrollTo(el, { offset: -70 }); }
      else { el.scrollIntoView({ behavior: "smooth" }); }
    });
  });

  /* ---------- Menu tabs ---------- */
  var tabs = document.querySelectorAll(".menu__tab");
  var panels = document.querySelectorAll(".menu__panel");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var name = tab.getAttribute("data-tab");
      tabs.forEach(function (t) {
        var active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", active ? "true" : "false");
      });
      panels.forEach(function (p) {
        p.classList.toggle("is-active", p.getAttribute("data-panel") === name);
      });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  });

  /* ---------- Highlight "open now" in hours ---------- */
  (function highlightHours() {
    var rows = document.querySelectorAll("#hours tr");
    if (!rows.length) return;
    var now = new Date();
    var day = now.getDay(); // 0 Sun .. 6 Sat
    var hour = now.getHours();
    // Mon(0)..Sun(6) row order in table
    var rowIndex = day === 0 ? 6 : day - 1;
    var open = day !== 0 && hour >= 11 && hour < 21;
    if (open && rows[rowIndex]) rows[rowIndex].classList.add("is-now");
  })();

  /* ---------- Swiper: Gallery ---------- */
  if (window.Swiper) {
    new Swiper(".gallery__swiper", {
      slidesPerView: "auto",
      spaceBetween: 18,
      grabCursor: true,
      navigation: { prevEl: ".gallery__btn--prev", nextEl: ".gallery__btn--next" },
      breakpoints: { 760: { spaceBetween: 28 } }
    });

    new Swiper(".reviews__swiper", {
      slidesPerView: 1,
      loop: true,
      autoplay: { delay: 5500, disableOnInteraction: false },
      pagination: { el: ".reviews__dots", clickable: true },
      effect: "fade",
      fadeEffect: { crossFade: true }
    });
  }
})();
