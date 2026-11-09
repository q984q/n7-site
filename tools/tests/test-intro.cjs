/* Заставка «Включение света»: разметка на всех страницах, логика «один раз
   за визит» и доступный пропуск. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const R = path.resolve(__dirname, '..', '..');
const files = fs.readdirSync(R).filter(f => f.endsWith('.html')).sort();
const html = fs.readFileSync(path.join(R, 'index.html'), 'utf8');
const m = html.match(/<script>\/\*n7-intro\*\/([\s\S]*?)<\/script>/);
let bad = 0;
const ok = (c, t) => { if (!c) { bad++; console.log('  FAIL ' + t); } };

ok(!!m, 'инлайн-скрипт решения о заставке найден');
for (const f of files) {
  const s = fs.readFileSync(path.join(R, f), 'utf8');
  ok(s.includes('/*n7-intro*/'), f + ': нет инлайн-скрипта');
  ok(/<div class="n7intro" id="n7Intro" role="dialog" aria-modal="true"/.test(s), f + ': нет оверлея');
  ok(s.includes('class="n7i-mark">N7</span>') && s.includes('class="n7i-skip"'), f + ': нет логотипа или кнопки пропуска');
  ok(/<script src="n7-intro\.js\?v=[^"]+" defer><\/script>/.test(s), f + ': не подключён n7-intro.js');
  ok(s.indexOf('/*n7-intro*/') < s.indexOf('id="n7Intro"'), f + ': решение принимается после оверлея');
}

/* Прогон инлайн-скрипта в изолированном контексте с разными входами */
const script = m ? m[1] : '';
const ORIGIN = 'https://q984q.github.io';
function visit(o) {
  const store = o.flag ? { 'n7-intro': '1' } : {};
  const cls = new Set();
  const ctx = {
    matchMedia: q => ({ matches: !!o.reduced && /reduce/.test(q) }),
    performance: { getEntriesByType: () => [{ type: o.type || 'navigate' }] },
    document: { referrer: o.referrer || '', documentElement: { classList: { add: c => cls.add(c) } } },
    location: { origin: ORIGIN }, URL,
    sessionStorage: {
      getItem: k => store[k] || null,
      setItem: (k, v) => { store[k] = v; },
      removeItem: k => { delete store[k]; }
    }
  };
  vm.runInNewContext(script, ctx);
  return { on: cls.has('n7i-on'), flag: store['n7-intro'] || null };
}
let r = visit({});
ok(r.on && r.flag === '1', 'первый вход: заставка показывается и ключ ставится');
r = visit({ flag: true, referrer: ORIGIN + '/index.html' });
ok(!r.on && r.flag === '1', 'переход внутри сайта: заставка не повторяется');
r = visit({ flag: true, referrer: 'https://example.com/', type: 'reload' });
ok(!r.on && r.flag === '1', 'reload: заставка не повторяется');
r = visit({ flag: true, referrer: 'https://example.com/', type: 'navigate' });
ok(r.on && r.flag === '1', 'после полного ухода и возврата: заставка снова');
r = visit({ referrer: '', reduced: true });
ok(!r.on && r.flag === null, 'prefers-reduced-motion: заставка отключена');

/* Внешний скрипт: блокировка, фокус на «Пропустить», уборка оверлея */
const { JSDOM } = require('jsdom');
const dom = new JSDOM(html, { url: ORIGIN + '/n7-site/index.html', runScripts: 'outside-only', pretendToBeVisual: true });
const w = dom.window, d = w.document;
w.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });
d.documentElement.classList.add('n7i-on');
w.eval(fs.readFileSync(path.join(R, 'n7-intro.js'), 'utf8'));
ok(d.documentElement.classList.contains('n7i-lock'), 'на время заставки прокрутка заблокирована');
ok(d.activeElement === d.querySelector('.n7i-skip'), 'фокус на кнопке «Пропустить»');
d.querySelector('.n7i-skip').dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
ok(!d.getElementById('n7Intro'), 'по клику оверлей удалён');
ok(!d.documentElement.classList.contains('n7i-on') && !d.documentElement.classList.contains('n7i-lock'),
  'классы заставки и блокировки сняты');

console.log('Проверено страниц: ' + files.length + (bad ? '\nОШИБОК: ' + bad : '\nЗаставка: ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ'));
process.exit(bad ? 1 : 0);
