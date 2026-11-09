/* ==========================================================================
 N7 · v3 «ГЛУБИНА» — лёгкий CSS-3D слой для всех 19 страниц
 --------------------------------------------------------------------------
 · tilt: карточки следуют за указателем через --rx / --ry (transform в CSS)
 · parallax: слои [data-depth] двигаются по прокрутке через --py
 · HUD: счётчик кадров/этажей в первом экране, только на широких экранах
 · ничего не делает на touch, при reduced-motion и вне области видимости
 Никаких библиотек, никаких layout-измерений в каждом кадре.
 ========================================================================== */
(function () {
  'use strict';
  var d = document, w = window;
  var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)');
  var fine = w.matchMedia && w.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 901px)');
  var rm = reduce && reduce.matches, ok = fine && fine.matches;

  /* ---------- 1. Tilt карточек ---------- */
  var tilts = d.querySelectorAll('.v3-tilt, .v2-card, .v3-card, .lcard, .pcard, .svc-card, .fmt>div');
  if (ok && !rm && tilts.length) {
    Array.prototype.forEach.call(tilts, function (el) {
      var raf = 0, box = null;
      el.addEventListener('pointerenter', function () { box = el.getBoundingClientRect(); });
      el.addEventListener('pointermove', function (e) {
        if (!box) box = el.getBoundingClientRect();
        var x = (e.clientX - box.left) / box.width - 0.5;
        var y = (e.clientY - box.top) / box.height - 0.5;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          el.style.setProperty('--ry', (x * 9).toFixed(2) + 'deg');
          el.style.setProperty('--rx', (-y * 7).toFixed(2) + 'deg');
          el.style.setProperty('--mx', ((x + 0.5) * 100).toFixed(1) + '%');
          el.style.setProperty('--my', ((y + 0.5) * 100).toFixed(1) + '%');
        });
      }, { passive: true });
      el.addEventListener('pointerleave', function () {
        cancelAnimationFrame(raf);
        el.style.setProperty('--ry', '0deg'); el.style.setProperty('--rx', '0deg');
      }, { passive: true });
    });
  }

  /* ---------- 2. Параллакс слоёв ---------- */
  var layers = d.querySelectorAll('[data-depth]');
  if (layers.length && !rm) {
    var ticking = false;
    function move() {
      ticking = false;
      var vh = w.innerHeight || 800;
      Array.prototype.forEach.call(layers, function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var k = parseFloat(el.getAttribute('data-depth')) || 0;
        var centre = (r.top + r.height / 2 - vh / 2) / vh;
        el.style.setProperty('--py', (-centre * k * 90).toFixed(1) + 'px');
      });
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(move); } }
    w.addEventListener('scroll', onScroll, { passive: true });
    w.addEventListener('resize', onScroll, { passive: true });
    move();
  }

  /* ---------- 3. HUD-индикатор сцены ---------- */
  var stage = d.querySelector('.n7-webgl-on');
  if (stage && !rm) {
    var tag = d.querySelector('.hud-frame');
    if (tag) {
      var t0 = performance.now();
      (function tick(t) {
        if (d.hidden) return;
        if (t - t0 > 420) { t0 = t; tag.setAttribute('data-frame', String((+tag.getAttribute('data-frame') || 0) + 1)); }
        requestAnimationFrame(tick);
      })(t0);
    }
  }

  /* ---------- 4. Мягкое появление (дублирует fx.js для новых классов) ---------- */
  if (!rm && 'IntersectionObserver' in w) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in'); io.unobserve(e.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -4% 0px' });
    d.querySelectorAll('.v3-reveal:not(.in)').forEach(function (el) { io.observe(el); });
  }

  /* ---------- 5. Маркер для тестов / отладки ---------- */
  d.documentElement.classList.add('v3-depth');
  w.n7DepthReady = true;
})();
