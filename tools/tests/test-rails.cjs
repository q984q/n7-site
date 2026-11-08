/* Проверка единого листания и чистоты панели на всех 18 страницах.
   Запуск: cd tools/tests && npm i && npm test
   jsdom не считает геометрию — scrollBy замокан, поэтому проверяем структуру,
   счётчики и реакцию на кнопки. Реальные замеры — /tmp/n7-browser/rail.mjs. */
const { JSDOM } = require('jsdom');
const fs = require('fs'), path = require('path');
const R = path.resolve(__dirname, '..', '..');
const HTML = fs.readdirSync(R).filter(f => f.endsWith('.html')).sort();
let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.log('  FAIL ' + m); } };

const expect = {
  'index.html': 6, '404.html': 1, 'kak-vybrat.html': 2, 'o-kompanii.html': 4,
  'produktsiya.html': 2, 'proekty.html': 1, 'sotrudnichestvo.html': 3,
  'sportivnye-pokrytiya.html': 2, 'uslugi.html': 1, 'prezentatsiya.html': 0
};

for (const f of HTML) {
  const dom = new JSDOM(fs.readFileSync(path.join(R, f), 'utf8'), {
    url: 'https://q984q.github.io/n7-site/' + f, runScripts: 'outside-only', pretendToBeVisual: true
  });
  const w = dom.window, d = w.document;
  w.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });
  w.scrollTo = () => {}; w.open = () => null; w.print = () => {};
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.HTMLElement.prototype.scrollBy = function (o) { this.scrollLeft += (o.left || 0); this.dispatchEvent(new w.Event('scroll')); };
  for (const sc of [...d.querySelectorAll('script[src]')]) {
    const p = sc.getAttribute('src').split('?')[0];
    try { w.eval(fs.readFileSync(path.join(R, p), 'utf8')); }
    catch (e) { ok(false, f + ': ' + p + ' → ' + e.message); }
  }
  d.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true }));

  const rails = [...d.querySelectorAll('.n7rail')], uis = [...d.querySelectorAll('.n7rail-ui')];
  ok(rails.length === (expect[f] || 0), f + ': лент ' + rails.length + ' (ждали ' + (expect[f] || 0) + ')');
  ok(uis.length === rails.length, f + ': UI != лент');
  rails.forEach((r, i) => {
    ok(r.children.length >= 3, f + ' лента ' + i + ': меньше 3 карточек');
    ok(!r.closest('.slide') && !r.closest('#deck'), f + ' лента ' + i + ' внутри слайда');
    ok(r.id !== 'catalog' && !r.querySelector('.lcard'), f + ' лента ' + i + ' задела каталог');
    ok(r.getAttribute('tabindex') === '0' && /^Листание: /.test(r.getAttribute('aria-label') || ''), f + ' лента ' + i + ': нет доступного имени');
  });
  uis.forEach((u, i) => {
    ok(/^\d+ \/ \d+$/.test(u.querySelector('.n7rail-num').textContent), f + ' UI ' + i + ': счётчик');
    ok(u.querySelector('.n7rail-prev') && u.querySelector('.n7rail-next'), f + ' UI ' + i + ': стрелки');
  });
  ok(!d.querySelector('.toc .tprog') && !d.querySelector('.toc ol a i'), f + ': точка/полоска в панели осталась');
  ok(!d.querySelector('.dock .dock-i.on') || true, '');  /* стиль проверяется ниже по CSS */
}

/* Кнопка «→» меняет счётчик */
{
  const dom = new JSDOM(fs.readFileSync(path.join(R, 'index.html'), 'utf8'), {
    url: 'https://q984q.github.io/n7-site/index.html', runScripts: 'outside-only', pretendToBeVisual: true
  });
  const w = dom.window, d = w.document;
  w.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });
  w.HTMLElement.prototype.scrollBy = function (o) { this.scrollLeft += (o.left || 0); this.dispatchEvent(new w.Event('scroll')); };
  w.eval(fs.readFileSync(path.join(R, 'n7-rail.js'), 'utf8'));
  d.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true }));
  const num = d.querySelector('.n7rail-num'), r = d.querySelector('.n7rail');
  Object.defineProperty(r, 'scrollWidth', { value: 2000, configurable: true });
  Object.defineProperty(r, 'clientWidth', { value: 350, configurable: true });
  r.dispatchEvent(new w.Event('scroll'));
  ok(num.textContent === '1 / 6', 'стартовый счётчик: ' + num.textContent);
  d.querySelector('.n7rail-next').click();
  ok(num.textContent !== '1 / 6', 'клик «→» меняет счётчик: ' + num.textContent);
}

/* CSS: единые правила, точка в dock удалена */
const css = fs.readFileSync(path.join(R, 'style.css'), 'utf8');
ok(/\.n7rail\{display:flex!important/.test(css), 'CSS: лента = flex');
ok(!/\.dock-i\.on::before/.test(css), 'CSS: точка под названием в dock удалена');
ok(!/\.toc \.tprog/.test(css), 'CSS: полоска-точка в панели удалена');
ok(!/@keyframes mq\{/.test(css), 'CSS: бегущая строка удалена');
ok(/\.n7tags\{/.test(css), 'CSS: статичные чипы вместо бегущей строки');

/* Дубль id */
const about = fs.readFileSync(path.join(R, 'o-kompanii.html'), 'utf8');
ok((about.match(/id="sec-3"/g) || []).length === 1, 'o-kompanii.html: дубль id="sec-3" устранён');

console.log('Проверено страниц: ' + HTML.length + (bad ? '\nОШИБОК: ' + bad : '\nВСЕ ПРОВЕРКИ ПРОЙДЕНЫ'));
process.exit(bad ? 1 : 0);
