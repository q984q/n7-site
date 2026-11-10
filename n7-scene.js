/* ==========================================================================
   N7 v4 «РЕДАКЦИЯ» — почти невидимая бумажная текстура первого экрана.

   С первого кадра виден CSS-фолбэк img/grain.webp. Один статичный кадр
   WebGL2 рисуется только на широком экране и только после первого жеста
   пользователя: так инициализация GPU не попадает в TBT/LCP. На телефонах,
   при prefers-reduced-motion и без WebGL2 остаётся тот же CSS-фолбэк.
   Никаких 3D-объектов, HUD, счётчиков и бесконечного rAF.
   ========================================================================== */
(function () {
  'use strict';
  var d = document, w = window;
  var canvas = d.getElementById('n7Scene');
  var hero = canvas ? (canvas.closest('.hero') || canvas.parentElement) : null;
  if (!canvas || !hero) return;

  var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)');
  var wide = w.matchMedia && w.matchMedia('(min-width: 900px)');
  var idle = w.requestIdleCallback || function (fn) { return setTimeout(fn, 40); };
  var rendered = false, lost = false, scheduled = false;
  var interacted = false, inView = true;

  function fallback() {
    hero.classList.add('n7-no-webgl');
    hero.classList.remove('n7-webgl-on');
  }

  function software(gl) {
    try {
      var ext = gl.getExtension('WEBGL_debug_renderer_info');
      var name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) || '');
      return /swiftshader|llvmpipe|software|microsoft basic/i.test(name);
    } catch (e) { return false; }
  }

  function compile(gl, type, source) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, source);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  function render() {
    scheduled = false;
    if (rendered || lost || d.hidden) return;
    if (!wide || !wide.matches || (reduce && reduce.matches) || !interacted || !inView) {
      fallback();
      return;
    }

    var gl = null;
    try {
      gl = canvas.getContext('webgl2', {
        alpha: true, antialias: false, depth: false, stencil: false,
        premultipliedAlpha: false, powerPreference: 'low-power'
      });
    } catch (e) { gl = null; }
    if (!gl) { fallback(); return; }
    /* Один кадр дешёвый даже на SwiftShader; просто не умножаем DPR. */
    var slow = software(gl);

    var vs = compile(gl, gl.VERTEX_SHADER,
      '#version 300 es\n' +
      'const vec2 p[3]=vec2[3](vec2(-1.,-1.),vec2(3.,-1.),vec2(-1.,3.));\n' +
      'void main(){gl_Position=vec4(p[gl_VertexID],0.,1.);}');
    var fs = compile(gl, gl.FRAGMENT_SHADER,
      '#version 300 es\nprecision mediump float;\n' +
      'out vec4 o;\n' +
      'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\n' +
      'void main(){float n=h(floor(gl_FragCoord.xy*.75));o=vec4(.063,.094,.125,.045*n);}');
    if (!vs || !fs) { fallback(); return; }

    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { fallback(); return; }
    gl.deleteShader(vs); gl.deleteShader(fs);

    var ratio = Math.min(w.devicePixelRatio || 1, slow ? 1 : 1.5);
    var cw = Math.max(1, Math.round(canvas.clientWidth * ratio));
    var ch = Math.max(1, Math.round(canvas.clientHeight * ratio));
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
    gl.viewport(0, 0, cw, ch);
    gl.disable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prog);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.deleteProgram(prog);

    rendered = true;
    hero.classList.remove('n7-no-webgl');
    hero.classList.add('n7-webgl-on');
    w.n7SceneReady = true;
  }

  function schedule() {
    if (rendered || lost || scheduled || !interacted || !inView) return;
    scheduled = true;
    idle(render, { timeout: 1200 });
  }

  /* Безопасный фолбэк по умолчанию. WebGL не трогаем до жеста. */
  fallback();
  w.n7FallbackReady = true;

  function arm() { interacted = true; schedule(); }
  /* Случайный pointermove при загрузке страницы не считаем жестом. */
  ['pointerdown', 'keydown', 'touchstart', 'scroll', 'wheel'].forEach(function (t) {
    w.addEventListener(t, arm, { once: true, passive: true });
  });

  canvas.addEventListener('webglcontextlost', function (e) {
    e.preventDefault(); lost = true; rendered = false; w.n7SceneReady = false; fallback();
  });
  canvas.addEventListener('webglcontextrestored', function () {
    lost = false; schedule();
  });
  d.addEventListener('visibilitychange', function () { if (!d.hidden) schedule(); });
  w.addEventListener('resize', function () {
    if (!rendered) return;
    rendered = false; w.n7SceneReady = false; schedule();
  }, { passive: true });

  /* Следим за вьюпортом, но сам по себе он сцену не запускает. */
  if ('IntersectionObserver' in w) {
    var io = new IntersectionObserver(function (entries) {
      inView = entries.some(function (e) { return e.isIntersecting; });
      if (inView) schedule();
    }, { threshold: 0.01 });
    io.observe(hero);
  }
})();
