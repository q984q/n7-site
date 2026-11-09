/* ==========================================================================
   N7 · v3 «ГЛУБИНА» — интерактивная WebGL2-сцена первого экрана
   --------------------------------------------------------------------------
   Собственный микро-рендерер без внешних библиотек: одна программа для
   твёрдых тел / стекла / рёбер / пола, вторая — для светящейся пыли.
   Архитектурный объект собирается из плит при загрузке, медленно вращается,
   реагирует на указатель и прокрутку. Реалистичный объём: два источника
   света, блики, френель, туман, перспективная сетка пола.

   Мобильные устройства, reduced-motion и отсутствие WebGL2 получают
   CSS-фолбэк: сцена вообще не инициализируется и не грузит память.
   ========================================================================== */
(function () {
  'use strict';
  var canvas = document.getElementById('n7Scene');
  if (!canvas) return;

  var hero = canvas.closest('.hero') || canvas.parentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)');
  var wide = matchMedia('(min-width: 900px)');

  /* ---------- матрицы (column-major, WebGL) ---------- */
  function perspective(fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0,
      0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
  }
  function lookAt(eye, ctr, up) {
    var zx = eye[0] - ctr[0], zy = eye[1] - ctr[1], zz = eye[2] - ctr[2];
    var zl = 1 / Math.hypot(zx, zy, zz); zx *= zl; zy *= zl; zz *= zl;
    var xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
    var xl = 1 / Math.hypot(xx, xy, xz); xx *= xl; xy *= xl; xz *= xl;
    var yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    return new Float32Array([xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
      -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
      -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
      -(zx * eye[0] + zy * eye[1] + zz * eye[2]), 1]);
  }
  /* модель = перенос * поворот вокруг Y * масштаб (нормали осевые — корректны) */
  function model(x, y, z, sx, sy, sz, ry) {
    var c = Math.cos(ry || 0), s = Math.sin(ry || 0);
    return new Float32Array([
      c * sx, 0, -s * sx, 0,
      0, sy, 0, 0,
      s * sz, 0, c * sz, 0,
      x, y, z, 1]);
  }

  /* ---------- шейдеры ---------- */
  var VS = '#version 300 es\n' +
    'in vec3 aPos; in vec3 aNormal;' +
    'uniform mat4 uProj,uView,uModel;' +
    'out vec3 vN,vW,vL;' +
    'void main(){vec4 w=uModel*vec4(aPos,1.0);vW=w.xyz;vL=aPos;' +
    'vN=normalize(mat3(uModel)*aNormal);gl_Position=uProj*uView*w;}';

  var FS = '#version 300 es\nprecision highp float;' +
    'in vec3 vN,vW,vL;out vec4 o;' +
    'uniform vec3 uColor,uEye,uFog,uL1,uL2;' +
    'uniform float uMode,uAlpha,uFogNear,uFogFar,uTime;' +
    'void main(){' +
    'vec3 N=normalize(vN),V=normalize(uEye-vW);float d=length(uEye-vW);' +
    'float fres=pow(1.0-max(dot(N,V),0.0),2.6);vec3 c=uColor;float a=uAlpha;' +
    'if(uMode<0.5){' +
    ' float df=max(dot(N,normalize(uL1)),0.0)*0.95+max(dot(N,normalize(uL2)),0.0)*0.42;' +
    ' float sp=pow(max(dot(N,normalize(normalize(uL1)+V)),0.0),56.0)*0.85;' +
    ' c=uColor*(0.20+df)+vec3(0.35,0.98,0.94)*sp+vec3(0.08,0.48,0.55)*fres*0.9;' +
    '}else if(uMode<1.5){' +
    ' c=uColor*(1.15+0.18*sin(uTime*1.4+vW.y*3.0));' +
    '}else if(uMode<2.5){' +
    ' c=mix(uColor*0.20,uColor*1.5+vec3(0.20,0.65,0.66),fres);' +
    ' a=uAlpha*(0.13+fres*0.82);' +
    '}else{' +
    ' vec2 q=vW.xz*0.55,g=abs(fract(q)-0.5)/fwidth(q);' +
    ' float line=1.0-min(min(g.x,g.y),1.0);' +
    ' vec2 m=vW.xz*0.11;float major=1.0-min(min(abs(fract(m.x)-0.5),abs(fract(m.y)-0.5))*18.0,1.0);' +
    ' float fade=1.0-smoothstep(2.0,17.0,d);' +
    ' c=vec3(0.04,0.10,0.16)+vec3(0.16,0.86,0.84)*line*0.75+vec3(1.0,0.68,0.32)*major*0.20;' +
    ' a=(line*0.40+major*0.10)*fade;' +
    '}' +
    'float f=smoothstep(uFogNear,uFogFar,d);' +
    'c=mix(c,uFog,f*0.88);a*=1.0-f*0.62;' +
    'o=vec4(c,a);}';

  var PVS = '#version 300 es\n' +
    'in vec3 aPos;uniform mat4 uProj,uView;uniform float uTime,uDpr;' +
    'out float vT;' +
    'void main(){vec3 p=aPos;' +
    'p.y+=sin(uTime*0.24+p.x*2.7)*0.28;p.x+=cos(uTime*0.17+p.z*2.1)*0.20;' +
    'p.z+=sin(uTime*0.13+p.x*1.7)*0.16;' +
    'vT=fract(sin(dot(aPos.xy,vec2(12.9898,78.233)))*43758.5453);' +
    'gl_Position=uProj*uView*vec4(p,1.0);' +
    'gl_PointSize=(1.6+2.4*vT)*uDpr;}';
  var PFS = '#version 300 es\nprecision mediump float;in float vT;out vec4 o;' +
    'void main(){float r=length(gl_PointCoord-0.5);' +
    'float a=(1.0-smoothstep(0.12,0.5,r))*(0.22+0.55*vT);' +
    'o=vec4(mix(vec3(0.32,0.92,0.90),vec3(1.0,0.72,0.40),step(0.78,vT)),1.0)*a;}';

  function compile(gl, type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('[n7-scene] shader:', gl.getShaderInfoLog(s)); return null;
    }
    return s;
  }
  function program(gl, vs, fs) {
    var v = compile(gl, gl.VERTEX_SHADER, vs), f = compile(gl, gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    var p = gl.createProgram(); gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.warn('[n7-scene] link:', gl.getProgramInfoLog(p)); return null;
    }
    gl.deleteShader(v); gl.deleteShader(f);
    return p;
  }

  /* ---------- геометрия: куб (грани + рёбра) и плоскость ---------- */
  function cubeBuffers(gl) {
    var p = [], n = [], idx = [];
    var faces = [
      [[0, 0, 1], [[-.5, -.5, .5], [.5, -.5, .5], [.5, .5, .5], [-.5, .5, .5]]],
      [[0, 0, -1], [[.5, -.5, -.5], [-.5, -.5, -.5], [-.5, .5, -.5], [.5, .5, -.5]]],
      [[1, 0, 0], [[.5, -.5, .5], [.5, -.5, -.5], [.5, .5, -.5], [.5, .5, .5]]],
      [[-1, 0, 0], [[-.5, -.5, -.5], [-.5, -.5, .5], [-.5, .5, .5], [-.5, .5, -.5]]],
      [[0, 1, 0], [[-.5, .5, .5], [.5, .5, .5], [.5, .5, -.5], [-.5, .5, -.5]]],
      [[0, -1, 0], [[-.5, -.5, -.5], [.5, -.5, -.5], [.5, -.5, .5], [-.5, -.5, .5]]]
    ];
    faces.forEach(function (f, i) {
      f[1].forEach(function (v) { p.push.apply(p, v); n.push.apply(n, f[0]); });
      var b = i * 4; idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    });
    var e = [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7];
    var vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    var pb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, pb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(p), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    var nb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, nb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(n), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    var ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
    var eb = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eb);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(e), gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    return { vao: vao, tri: ib, edge: eb, triN: idx.length, edgeN: e.length };
  }
  function planeBuffers(gl) {
    var vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -9, -0.36, -9, 9, -0.36, -9, 9, -0.36, 9, -9, -0.36, 9,
      0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0
    ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 48);
    var ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    return { vao: vao, idx: ib, n: 6 };
  }
  function dustBuffers(gl, count) {
    var a = [], i, r, t;
    for (i = 0; i < count; i++) {
      r = 1.4 + Math.random() * 6.5; t = Math.random() * Math.PI * 2;
      a.push(Math.cos(t) * r, Math.random() * 5.4 - 0.2, Math.sin(t) * r);
    }
    var vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(a), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    return { vao: vao, n: count };
  }

  /* ---------- объект: сборная башня N7 ---------- */
  var SOLID = 0, EDGE = 1, GLASS = 2;
  var solids = [], glasses = [], edges = [];
  function box(list, x, y, z, sx, sy, sz, color, ry, alpha) {
    list.push({ m: model(x, y, z, sx, sy, sz, ry || 0), c: color, a: alpha == null ? 1 : alpha });
  }
  function buildTower() {
    var steel = [0.075, 0.115, 0.165], plate = [0.12, 0.19, 0.255];
    var glass = [0.16, 0.62, 0.70], cyan = [0.20, 0.88, 0.86], amber = [1.0, 0.66, 0.30];
    box(solids, 0, -0.30, 0, 4.6, 0.16, 4.6, [0.055, 0.085, 0.125]);
    box(edges, 0, -0.30, 0, 4.6, 0.16, 4.6, cyan, 0, 0.55);
    var i, y, off, s = 1;
    for (i = 0; i < 7; i++) {
      y = 0.05 + i * 0.60;
      off = Math.sin(i * 0.85) * 0.17;
      s = 1 - i * 0.052;
      /* плита перекрытия */
      box(solids, off, y, off * 0.6, 2.75 * s, 0.105, 2.75 * s, plate, 0.045 * i);
      box(edges, off, y, off * 0.6, 2.75 * s, 0.105, 2.75 * s, cyan, 0.045 * i, 0.42);
      /* стеклянный объём этажа */
      box(glasses, off, y + 0.30, off * 0.6, 2.42 * s, 0.47, 2.42 * s, glass, 0.045 * i);
    }
    /* несущие колонны */
    var c = 1.20;
    [[-c, -c], [c, -c], [-c, c], [c, c]].forEach(function (q) {
      box(solids, q[0], 2.10, q[1], 0.115, 4.55, 0.115, steel);
      box(edges, q[0], 2.10, q[1], 0.115, 4.55, 0.115, cyan, 0, 0.70);
    });
    /* центральное ядро с тёплым светом */
    box(solids, 0, 2.10, 0, 0.46, 4.30, 0.46, [0.14, 0.10, 0.075]);
    box(edges, 0, 2.10, 0, 0.46, 4.30, 0.46, amber, 0, 0.85);
    /* венчающая плита и шпиль */
    box(solids, 0, 4.42, 0, 1.85, 0.14, 1.85, plate);
    box(edges, 0, 4.42, 0, 1.85, 0.14, 1.85, cyan, 0, 0.85);
    box(solids, 0, 4.80, 0, 0.095, 0.68, 0.095, amber);
    box(edges, 0, 4.80, 0, 0.095, 0.68, 0.095, amber, 0, 1);
    /* боковые «крылья» — объёмная композиция */
    box(solids, -2.35, 0.72, 0.55, 1.05, 1.42, 1.55, steel, 0.22);
    box(edges, -2.35, 0.72, 0.55, 1.05, 1.42, 1.55, cyan, 0.22, 0.35);
    box(solids, 2.30, 0.98, -0.35, 0.92, 1.94, 1.30, steel, -0.16);
    box(edges, 2.30, 0.98, -0.35, 0.92, 1.94, 1.30, amber, -0.16, 0.38);
    /* светящиеся маркеры этажей на фасаде */
    for (i = 0; i < 7; i++) {
      box(edges, 1.31 - i * 0.065, 0.05 + i * 0.60, 0, 0.06, 0.026, 1.65,
        i % 2 ? amber : cyan, 0, 0.9);
    }
  }

  /* ---------- запуск ---------- */
  var gl = null, raf = 0, running = false, lost = false, staticOnce = false;

  /* Программный WebGL (SwiftShader/llvmpipe в CI, headless и на слабых ПК)
     не должен крутить бесконечный rAF: это съедает CPU и TBT. Рисуем один
     собранный кадр и отдаём управление браузеру. */
  function isSoftware(g) {
    try {
      var e = g.getExtension('WEBGL_debug_renderer_info');
      var r = e ? String(g.getParameter(e.UNMASKED_RENDERER_WEBGL) || '') : '';
      return /SwiftShader|llvmpipe|Software|softpipe|Mesa OffScreen/i.test(r);
    } catch (_) { return false; }
  }
  var yaw = -0.42, pitch = 0.12, tYaw = -0.42, tPitch = 0.12;
  var scrollShift = 0, start = 0, dpr = 1;
  var U = {}, PU = {}, cube, plane, dust, main, particles;

  function uniforms(gl, p, names) {
    var o = {}; names.forEach(function (n) { o[n] = gl.getUniformLocation(p, n); }); return o;
  }
  function setCommon(gl, proj, view, eye, time) {
    gl.uniformMatrix4fv(U.uProj, false, proj);
    gl.uniformMatrix4fv(U.uView, false, view);
    gl.uniform3fv(U.uEye, eye);
    gl.uniform3fv(U.uFog, [0.020, 0.032, 0.060]);
    gl.uniform3fv(U.uL1, [-0.55, 0.85, 0.62]);
    gl.uniform3fv(U.uL2, [0.80, -0.18, -0.55]);
    gl.uniform1f(U.uFogNear, 6.0); gl.uniform1f(U.uFogFar, 19.0);
    gl.uniform1f(U.uTime, time);
  }
  function drawList(gl, list, mode, ib, count, alphaOverride) {
    gl.uniform1f(U.uMode, mode);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    list.forEach(function (o) {
      gl.uniformMatrix4fv(U.uModel, false, o.m);
      gl.uniform3fv(U.uColor, o.c);
      gl.uniform1f(U.uAlpha, alphaOverride == null ? o.a : alphaOverride);
      gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
    });
  }

  function resize() {
    if (!gl) return;
    var r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    var w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
  }

  var lastFrame = 0;
  function frame(now) {
    if (!running || lost || !gl) return;
    if (!staticOnce && lastFrame && now - lastFrame < 30) {
      raf = requestAnimationFrame(frame); return;
    }
    lastFrame = now;
    var t = staticOnce ? 2.2 : (start ? (now - start) / 1000 : 0);
    yaw += (tYaw - yaw) * 0.045; pitch += (tPitch - pitch) * 0.045;
    var prog = Math.min(1, t / 1.5);
    var Y = 2.75 + pitch * 0.9 + scrollShift * 0.55;
    var R = 11.5 - scrollShift * 0.7;
    var eye = [Math.sin(yaw) * R, Y, Math.cos(yaw) * R];
    var proj = perspective(0.72, canvas.width / canvas.height, 0.1, 60);
    var view = lookAt(eye, [0, 2.05 + scrollShift * 0.20, 0], [0, 1, 0]);
    /* композиция: объект в правой трети, текст слева остаётся читаемым */
    view[12] += 2.45;

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.GL_DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(main);
    setCommon(gl, proj, view, eye, t);

    /* пол: сетка без записи глубины */
    gl.depthMask(false);
    gl.uniform1f(U.uMode, 3); gl.uniform1f(U.uAlpha, 1);
    gl.uniformMatrix4fv(U.uModel, false, model(0, 0, 0, 1, 1, 1, yaw * 0.06));
    gl.uniform3fv(U.uColor, [0.1, 0.5, 0.55]);
    gl.bindVertexArray(plane.vao); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, plane.idx);
    gl.drawElements(gl.TRIANGLES, plane.n, gl.UNSIGNED_SHORT, 0);
    gl.depthMask(true);

    /* твёрдые тела: «сборка» снизу вверх */
    gl.bindVertexArray(cube.vao);
    var nSolid = Math.max(1, Math.ceil(solids.length * prog));
    drawList(gl, solids.slice(0, nSolid), SOLID, cube.tri, cube.triN);

    /* стекло */
    gl.depthMask(false);
    var nGlass = Math.ceil(glasses.length * Math.min(1, Math.max(0, (prog - 0.25) / 0.75)));
    drawList(gl, glasses.slice(0, nGlass), GLASS, cube.tri, cube.triN);

    /* светящиеся рёбра — аддитивно */
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.uniform1f(U.uMode, EDGE);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube.edge);
    edges.slice(0, Math.max(1, Math.ceil(edges.length * prog))).forEach(function (o) {
      gl.uniformMatrix4fv(U.uModel, false, o.m);
      gl.uniform3fv(U.uColor, o.c); gl.uniform1f(U.uAlpha, o.a * 0.55);
      gl.drawElements(gl.LINES, cube.edgeN, gl.UNSIGNED_SHORT, 0);
    });
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    /* пыль */
    gl.useProgram(particles);
    gl.uniformMatrix4fv(PU.uProj, false, proj);
    gl.uniformMatrix4fv(PU.uView, false, view);
    gl.uniform1f(PU.uTime, t); gl.uniform1f(PU.uDpr, dpr);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.bindVertexArray(dust.vao);
    gl.drawArrays(gl.POINTS, 0, dust.n);
    gl.bindVertexArray(null);
    gl.depthMask(true);

    if (reduce.matches || staticOnce) { running = false; return; }
    raf = requestAnimationFrame(frame);
  }

  function play() {
    if (running || lost || !gl || document.hidden) return;
    if (staticOnce) { running = true; frame(performance.now()); running = false; return; }
    running = true; if (!start) start = performance.now() - 1600;
    raf = requestAnimationFrame(frame);
  }
  function pause() { running = false; cancelAnimationFrame(raf); }

  function init() {
    try {
      gl = canvas.getContext('webgl2', {
        alpha: true, antialias: true, depth: true, premultipliedAlpha: false,
        powerPreference: 'high-performance'
      });
    } catch (e) { gl = null; }
    if (!gl) { hero.classList.add('n7-no-webgl'); return; }
    staticOnce = isSoftware(gl) || reduce.matches;
    if (staticOnce) hero.classList.add('n7-static');

    main = program(gl, VS, FS); particles = program(gl, PVS, PFS);
    if (!main || !particles) { hero.classList.add('n7-no-webgl'); return; }
    U = uniforms(gl, main, ['uProj', 'uView', 'uModel', 'uColor', 'uEye', 'uFog',
      'uL1', 'uL2', 'uMode', 'uAlpha', 'uFogNear', 'uFogFar', 'uTime']);
    PU = uniforms(gl, particles, ['uProj', 'uView', 'uTime', 'uDpr']);
    cube = cubeBuffers(gl); plane = planeBuffers(gl); dust = dustBuffers(gl, 190);
    buildTower();
    resize();
    canvas.setAttribute('aria-hidden', 'true');
    hero.classList.add('n7-webgl-on');

    window.addEventListener('resize', function () { resize(); if (!running) frame(performance.now()); }, { passive: true });
    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var r = hero.getBoundingClientRect();
      tYaw = -0.42 + ((e.clientX - r.left) / r.width - 0.5) * 0.85;
      tPitch = 0.12 - ((e.clientY - r.top) / r.height - 0.5) * 0.42;
    }, { passive: true });
    hero.addEventListener('pointerleave', function () { tYaw = -0.42; tPitch = 0.12; }, { passive: true });
    window.addEventListener('scroll', function () {
      var r = hero.getBoundingClientRect();
      scrollShift = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height)));
      if (!running && !reduce.matches) frame(performance.now());
    }, { passive: true });
    canvas.addEventListener('webglcontextlost', function (e) {
      e.preventDefault(); lost = true; pause(); hero.classList.add('n7-no-webgl');
    });
    document.addEventListener('visibilitychange', function () { document.hidden ? pause() : play(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es[0].isIntersecting && !reduce.matches ? play() : pause();
      }, { threshold: 0.02 }).observe(hero);
    }
    if (staticOnce) { running = true; frame(performance.now()); running = false; }
    /* авто-поворот добавляем к цели указателя */
    if (!staticOnce) (function spin() {
      if (!lost) { tYaw += 0.0016; setTimeout(spin, 32); }
    })();
    window.n7SceneReady = true;
  }

  /* Грузим только на широких экранах без reduced-motion и после первого кадра,
     чтобы.canvas не конкурировал с LCP (h1) и не расходовал батарею телефона. */
  function boot() {
    if (!wide.matches || reduce.matches) { hero.classList.add('n7-no-webgl'); return; }
    if ('requestIdleCallback' in window) requestIdleCallback(init, { timeout: 900 });
    else setTimeout(init, 260);
  }
  wide.addEventListener ? wide.addEventListener('change', function (e) {
    if (e.matches && !window.n7SceneReady) boot(); else if (!e.matches) { pause(); }
  }) : null;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
