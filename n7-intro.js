/* Заставка «Включение света».
   Решение «показывать или нет» принимает маленький инлайн-скрипт в <head> —
   до первой отрисовки, поэтому сайт не мигает. Здесь только воспроизведение,
   пропуск и уборка оверлея.

   Один раз за визит: sessionStorage ключ n7-intro живёт до закрытия вкладки.
   Если человек ушёл с сайта на другой ресурс и вернулся, ключ сбрасывается —
   заставка показывается снова. Внутренние переходы и reload её не повторяют. */
(function () {
  'use strict';
  var root = document.documentElement;
  if (!root.classList.contains('n7i-on')) return;
  var box = document.getElementById('n7Intro');
  if (!box) { root.classList.remove('n7i-on'); return; }
  var skip = box.querySelector('.n7i-skip');
  var done = false, timer = null;
  root.classList.add('n7i-lock');

  function finish() {
    if (done) return;
    done = true;
    root.classList.remove('n7i-on', 'n7i-lock');
    if (box.parentNode) box.parentNode.removeChild(box);
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('pagehide', finish);
    box.removeEventListener('click', finish);
    box.removeEventListener('animationend', onEnd);
    if (timer) clearTimeout(timer);
  }
  function onKey(e) {
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;
    finish();
  }
  function onEnd(e) {
    if (e.target === box && e.animationName === 'n7iOut') finish();
  }
  box.addEventListener('click', finish);
  box.addEventListener('animationend', onEnd);
  window.addEventListener('keydown', onKey, true);
  window.addEventListener('pagehide', finish);
  try { if (skip) skip.focus({ preventScroll: true }); } catch (e) {}
  timer = setTimeout(finish, 2800); /* страховка, если animationend не пришёл */
})();
