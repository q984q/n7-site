/* N7 v2 «Сталь»: полная замена визуального языка на 19 страницах.
   Проверяем палитру, новую IA, единый каркас, честные тексты, заглушки,
   целые ссылки/якоря и сохранённую SEO-разметку. */
const fs = require('fs'), path = require('path');
const R = path.resolve(__dirname, '..', '..');
const files = fs.readdirSync(R).filter(f => f.endsWith('.html')).sort();
const read = f => fs.readFileSync(path.join(R, f), 'utf8');
let bad = 0;
const ok = (c, t) => { if (!c) { bad++; console.log('  FAIL ' + t); } };

ok(files.length === 19, 'ровно 19 HTML-страниц');

for (const f of files) {
  const s = read(f);
  ok(/<html lang="ru">/.test(s), f + ': v2 без data-theme');
  ok(/<link rel="stylesheet" href="n7-bold\.css\?v=[^"]+">/.test(s), f + ': нет n7-bold.css');
  ok(/<script src="n7-bold\.js\?v=[^"]+" defer><\/script>/.test(s), f + ': нет n7-bold.js');
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
  ok(/<header class="n7-head">/.test(s) && /<footer class="n7-foot">/.test(s), f + ': нет каркаса v2');
  /* только видимый текст: метаописания сохраняем дословно */
  const body = s.slice(s.indexOf('<body>'));
  const banned = ['комплексн', 'современные технологии', 'надёжн', 'высокое качество',
    'гарантия качества', 'профессиональная команда', 'От идеи до реальных результатов',
    'Почему выбирают нас', 'Готовы обсудить ваш проект', 'Расскажите о задаче',
    'Надёжные решения для будущего', 'команда профессионалов'];
  for (const b of banned) ok(!body.toLowerCase().includes(b.toLowerCase()), f + ': штамп «' + b + '»');
  const imgs = body.match(/<img\b[^>]*>/g) || [];
  ok(imgs.every(t => /\balt="[^"]*"/.test(t)), f + ': img без alt');
  /* ни одного жёстко зашитого цвета v1 */
  ok(!/#f2c200|#ffd633|#ecece8|#0e0f10|#141516/i.test(s), f + ': жёсткий цвет v1 в HTML');
}

/* ---------- Дизайн-система ---------- */
const css = read('n7-bold.css'), base = read('style.css'), fc = read('fonts.css');
ok((css.match(/{/g) || []).length === (css.match(/}/g) || []).length, 'n7-bold.css: баланс скобок');
ok((base.match(/{/g) || []).length === (base.match(/}/g) || []).length, 'style.css: баланс скобок');
for (const t of ['--graphite:#0B1016', '--steel:#EAF0F5', '--azure:#4EA8FF',
  '--v2-display:', '--v2-mono:', '--n7-r:', '--n7-r-pill:',
  '@media(prefers-reduced-motion:reduce)', '[data-n7-stub]', 'v2-hero-grid', 'v2-card'])
  ok(css.includes(t), 'n7-bold.css: нет ' + t);
ok(css.includes('ЕДИНЫЙ МЕХАНИЗМ СКРУГЛЕНИЙ'), 'n7-bold.css: нет единой системы скруглений');
/* Нулевой радиус допустим только у edge-to-edge фона hero, у контейнеров
   hero-кнопок/счётчиков и у внутреннего фото, которое обрезает карточка. */
const zeroRules = [...css.matchAll(/([^{}]+)\{([^{}]*border-radius:\s*0[^{}]*)\}/g)]
  .map(m => m[1].trim().replace(/\s+/g, ' '));
ok(zeroRules.length > 0 && zeroRules.every(sel => /\.hero-photo|\.acts|\.stats|figure \.ph/.test(sel)),
   'n7-bold.css: нулевой радиус у карточки или панели: ' + zeroRules.join(' | '));
ok(css.includes('.ph,.prod-ph,.pj-ph,.mapimg,.lb-img'),
   'n7-bold.css: фото не подключены к единому радиусу');
ok(/:root\{--bg:#EAF0F5/.test(base), 'style.css: базовая палитра не сталь');
ok(!/#f2c200|#ffd633|rgba\(242,194,0/i.test(base), 'style.css: остался жёлтый v1');
ok(/--hd:'Inter Tight'/.test(base), 'style.css: заголовки не Inter Tight');
ok((fc.match(/@font-face/g) || []).length === 15, 'fonts.css: 15 локальных @font-face');
ok(fc.includes("'Inter Tight'") && fc.includes("'IBM Plex Mono'"), 'fonts.css: нет новых шрифтов');

/* ---------- Манифест и иконки ---------- */
const man = JSON.parse(read('manifest.json'));
ok(man.theme_color === '#0B1016' && man.background_color === '#EAF0F5',
   'manifest.json: цвета не v2');
ok(read('img/favicon.svg').includes('#4EA8FF'), 'favicon.svg: нет лазури');
ok(!read('img/favicon.svg').includes('#f2c200'), 'favicon.svg: остался жёлтый');

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

/* ---------- Главная: новая IA ---------- */
const i = read('index.html');
ok(/Строим\./.test(i) && /Сдаём\./.test(i) && /Отвечаем\./.test(i), 'index: нет нового героя');
ok(!/СТРОИМ\. СДАЁМ\. ОТВЕЧАЕМ\./.test(i), 'index: остался uppercase-герой v1');
for (const id of ['sec-1', 'sec-2', 'sec-3', 'sec-4', 'sec-5', 'sec-6', 'sec-7'])
  ok(i.includes('id="' + id + '"'), 'index: потерян #' + id);
ok((i.match(/class="v2-card/g) || []).length >= 9, 'index: мало карточек новой сетки');
ok((i.match(/class="v2-row v2-row--3"/g) || []).length >= 2, 'index: нет новой модульной сетки');
ok((i.match(/class="pcat"/g) || []).length === 3, 'index: не 3 раздела поставок');
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

/* ---------- Заглушки и факты на остальных страницах ---------- */
const stubs = files.reduce((n, f) => n + (read(f).match(/data-n7-stub=/g) || []).length, 0);
ok(stubs === 29, 'заглушек должно быть 29, получилось ' + stubs);
ok(read('o-kompanii.html').includes('data-n7-stub="photos"'), 'o-kompanii: нет заглушки под фото');
ok(read('produktsiya.html').includes('data-n7-stub="prices-kzt"'), 'produktsiya: нет заглушки прайса');
for (const f of files) {
  const s = read(f);
  ok(s.includes('+7 (777) 884-88-18') && s.includes('+7 (747) 534-40-14'), f + ': потерян телефон');
}

console.log(bad ? 'V2 «СТАЛЬ»: ПРОВАЛ (' + bad + ')'
  : 'V2 «Сталь»: ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ · страниц: ' + files.length + ' · заглушек: ' + stubs);
process.exit(bad ? 1 : 0);
