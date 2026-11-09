/* N7 v3 «ГЛУБИНА»: полная замена визуального языка на 19 страницах.
   Проверяем тёмную палитру, WebGL-сцену, CSS-3D, новую IA, единый каркас,
   честные тексты, заглушки, целые ссылки/якоря и сохранённую SEO-разметку. */
const fs = require('fs'), path = require('path');
const R = path.resolve(__dirname, '..', '..');
const files = fs.readdirSync(R).filter(f => f.endsWith('.html')).sort();
const read = f => fs.readFileSync(path.join(R, f), 'utf8');
let bad = 0;
const ok = (c, t) => { if (!c) { bad++; console.log('  FAIL ' + t); } };

ok(files.length === 19, 'ровно 19 HTML-страниц');

for (const f of files) {
  const s = read(f);
  ok(/<html lang="ru">/.test(s), f + ': нет lang="ru"');
  ok(/<link rel="stylesheet" href="n7-bold\.css\?v=[^"]+">/.test(s), f + ': нет n7-bold.css');
  ok(/<script src="n7-bold\.js\?v=[^"]+" defer><\/script>/.test(s), f + ': нет n7-bold.js');
  ok(/<script src="n7-depth\.js\?v=[^"]+" defer><\/script>/.test(s), f + ': нет 3D-слоя');
  ok(!/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(s), f + ': внешние шрифты');
  ok(/<title>/.test(s) && /name="description"/.test(s), f + ': потеряны title/description');
  if (f === '404.html') ok(/name="robots" content="noindex/.test(s), f + ': нет noindex');
  else ok(/rel="canonical"/.test(s), f + ': потерян canonical');
  ok(/property="og:image"/.test(s) && /name="twitter:card"/.test(s), f + ': потеряны OG/Twitter');
  ok(/property="og:locale"/.test(s) && /property="og:url"/.test(s), f + ': потеряны OG locale/url');
  ok((s.match(/<h1[\s>]/g) || []).length === 1, f + ': должен быть один h1');
  ok(/<script type="application\/ld\+json">/.test(s), f + ': потерян JSON-LD');
  ok(/class="skip"/.test(s) && /id="top"/.test(s), f + ': нет skip-link или #top');
  ok(!/n7intro|n7-intro\.js|data-theme=|id="theme"/.test(s), f + ': артефакт v1');
  ok(/<header class="n7-head">/.test(s) && /<footer class="n7-foot">/.test(s), f + ': нет каркаса');
  ok(/theme-color" content="#05080F"/.test(s), f + ': theme-color не v3');
  /* только видимый текст: метаописания сохраняем дословно */
  const body = s.slice(s.indexOf('<body>'));
  const banned = ['комплексн', 'современные технологии', 'надёжн', 'высокое качество',
    'гарантия качества', 'профессиональная команда', 'От идеи до реальных результатов',
    'Почему выбирают нас', 'Готовы обсудить ваш проект', 'Расскажите о задаче',
    'Надёжные решения для будущего', 'команда профессионалов'];
  for (const b of banned) ok(!body.toLowerCase().includes(b.toLowerCase()), f + ': штамп «' + b + '»');
  const imgs = body.match(/<img\b[^>]*>/g) || [];
  ok(imgs.every(t => /\balt="[^"]*"/.test(t)), f + ': img без alt');
  /* ни одного жёстко зашитого цвета v1/v2 */
  ok(!/#f2c200|#ffd633|#ecece8|#0e0f10|#141516|#4EA8FF|#EAF0F5/i.test(s),
     f + ': жёсткий цвет v1/v2 в HTML');
}

/* ---------- Дизайн-система v3 ---------- */
const css = read('n7-bold.css'), base = read('style.css'), fc = read('fonts.css');
ok((css.match(/{/g) || []).length === (css.match(/}/g) || []).length, 'n7-bold.css: баланс скобок');
ok((base.match(/{/g) || []).length === (base.match(/}/g) || []).length, 'style.css: баланс скобок');
for (const t of ['--void:#05080F', '--ink:#070B14', '--cyan:#4DE8DC', '--amber:#FFB45C',
  '--fg:#EAF3FA', '--mut:#A8BCD0', '--geo:', '--display:', '--mono:',
  '--n7-r:', '--n7-r-pill:', '@media(prefers-reduced-motion:reduce)', '[data-n7-stub]',
  'transform-style:preserve-3d', '[data-depth]', '.v3-tilt', '.v3-iso', '#n7Scene',
  '.n7-fallback', '.n7-hud', 'n7-webgl-on'])
  ok(css.includes(t), 'n7-bold.css: нет ' + t);
ok(css.includes('ВЕРСИЯ 3'), 'n7-bold.css: не помечен как v3');
ok(css.includes('.cp svg') || css.includes('[data-depth]'), 'n7-bold.css: нет параллакса');
/* Ни одного нулевого радиуса у карточек и панелей */
const zeroRules = [...css.matchAll(/([^{}]+)\{([^{}]*border-radius:\s*0\s*[;}][^{}]*)\}/g)]
  .map(m => m[1].trim().replace(/\s+/g, ' '));
ok(zeroRules.every(sel => /\.hero-photo|figure \.ph|\[aria-hidden/.test(sel)),
   'n7-bold.css: нулевой радиус у карточки или панели: ' + zeroRules.join(' | '));
ok(/:root\{--bg:#070B14/.test(base), 'style.css: базовая палитра не v3');
ok(!/#f2c200|#ffd633|rgba\(242,194,0|#4EA8FF|#EAF0F5/i.test(base), 'style.css: остался цвет v1/v2');
ok(/--hd:'Inter Tight'/.test(base), 'style.css: заголовки не Inter Tight');
ok((fc.match(/@font-face/g) || []).length === 15, 'fonts.css: 15 локальных @font-face');
ok(fc.includes("'Inter Tight'") && fc.includes("'IBM Plex Mono'") && fc.includes("'Unbounded'"),
   'fonts.css: нет шрифтов v3');

/* ---------- Манифест, иконки, OG ---------- */
const man = JSON.parse(read('manifest.json'));
ok(man.theme_color === '#05080F' && man.background_color === '#05080F',
   'manifest.json: цвета не v3');
ok(read('img/favicon.svg').includes('#4DE8DC'), 'favicon.svg: нет циана');
ok(!read('img/favicon.svg').includes('#f2c200'), 'favicon.svg: остался жёлтый');
ok(read('tools/make_og.py').includes('ГЛУБИНА'), 'make_og.py: генератор не v3');
ok(fs.readdirSync(path.join(R, 'img', 'og')).filter(f => f.endsWith('.webp')).length === 19,
   'img/og: не 19 превью');

/* ---------- Все локальные ссылки и якоря целы ---------- */
const ids = {};
for (const f of files) ids[f] = new Set((read(f).match(/\bid="([^"]+)"/g) || []).map(x => x.slice(4, -1)));
for (const f of files) {
  const s = read(f), links = s.match(/(?:href|src)="([^"]+)"/g) || [];
  for (const raw of links) {
    const u = raw.replace(/^(?:href|src)="|"$/g, '');
    if (/^(https?:|mailto:|tel:|data:|\?|#)/.test(u)) {
      const a = u.replace(/^#/, '');
      if (u.startsWith('#') && a && !ids[f].has(a)) ok(false, f + ': битый якорь ' + u);
      continue;
    }
    const p = u.split('#')[0].split('?')[0], frag = u.includes('#') ? u.split('#')[1].split('?')[0] : '';
    if (!p) continue;
    ok(fs.existsSync(path.join(R, p)), f + ': битая ссылка ' + u);
    if (frag && p.endsWith('.html') && ids[p]) ok(ids[p].has(frag), f + ': битый якорь ' + u);
  }
}

/* ---------- Главная: новая IA + сцена ---------- */
const i = read('index.html');
ok(/Строим\./.test(i) && /Сдаём\./.test(i) && /Отвечаем\./.test(i), 'index: нет героя');
ok(!/СТРОИМ\. СДАЁМ\. ОТВЕЧАЕМ\./.test(i), 'index: остался uppercase-герой v1');
for (const id of ['sec-1', 'sec-2', 'sec-3', 'sec-4', 'sec-5', 'sec-6', 'sec-7'])
  ok(i.includes('id="' + id + '"'), 'index: потерян #' + id);
ok((i.match(/class="v2-card/g) || []).length >= 9, 'index: мало карточек сетки');
ok((i.match(/class="v2-row v2-row--3"/g) || []).length >= 2, 'index: нет модульной сетки');
ok((i.match(/class="pcat(?:\s|")/g) || []).length === 3, 'index: не 3 раздела поставок');
ok((i.match(/<figure>/g) || []).length === 4, 'index: не 4 карточки проектов');
ok((i.match(/<li><span>/g) || []).length >= 8, 'index: нет географии по городам');
ok(i.includes('20+') && i.includes('250+') && i.includes('2000+'), 'index: потеряны счётчики');
ok(i.includes('50+') && i.includes('200+') && i.includes('15'), 'index: потеряны цифры географии');
ok(/<form id="n7Quick"/.test(i) && (i.match(/<label for="q-(?:name|phone|work)"/g) || []).length === 3,
   'index: нет формы из 3 полей');
ok(/id="q-agree"/.test(i) && /n7-cta-big/.test(i), 'index: нет согласия или кнопки отправки');
ok(/wa\.me\/77778848818/.test(i) && /data-n7-stub="requisites"/.test(i),
   'index: нет WhatsApp или заглушки реквизитов');
ok(!i.includes('US$'), 'index: остались USD-цены');
ok(!/n7-marquee|n7intro|n7-foot-line/.test(i), 'index: остался визуальный язык v1');
ok(/id="n7Scene"/.test(i) && /n7-hud/.test(i) && /n7-fallback/.test(i), 'index: нет 3D-первого экрана');

/* ---------- Заглушки и факты на остальных страницах ---------- */
const stubs = files.reduce((n, f) => n + (read(f).match(/data-n7-stub=/g) || []).length, 0);
ok(stubs === 29, 'заглушек должно быть 29, получилось ' + stubs);
ok(read('o-kompanii.html').includes('data-n7-stub="photos"'), 'o-kompanii: нет заглушки под фото');
ok(read('produktsiya.html').includes('data-n7-stub="prices-kzt"'), 'produktsiya: нет заглушки прайса');
for (const f of files) {
  const s = read(f);
  ok(s.includes('+7 (777) 884-88-18') && s.includes('+7 (747) 534-40-14'), f + ': потерян телефон');
}

console.log(bad ? 'V3 «ГЛУБИНА»: ПРОВАЛ (' + bad + ')'
  : 'V3 «ГЛУБИНА»: ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ · страниц: ' + files.length + ' · заглушек: ' + stubs);
process.exit(bad ? 1 : 0);
