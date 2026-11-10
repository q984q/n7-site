/* ==========================================================================
   N7 v4 «РЕДАКЦИЯ» — лёгкий маркер визуальной системы.
   Никаких tilt, parallax, HUD-счётчиков и 3D-преобразований: редакционная
   сетка работает одинаково с JS и без него. Уважаем prefers-reduced-motion.
   ========================================================================== */
(function () {
  'use strict';
  var d = document, w = window;
  var reduce = false;
  try { reduce = !!(w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) {}

  d.documentElement.classList.add('v4-editorial');
  if (reduce) d.documentElement.classList.add('v4-static');
  w.n7EditorialReady = true;
})();
