/* Редизайн N7 BOLD: тёмная база, единая система на 19 страницах,
   честные тексты, заглушки, целые ссылки и сохранённая SEO-разметка. */
const fs = require('fs'), path = require('path');
const R = path.resolve(__dirname, '..', '..');
const files = fs.readdirSync(R).filter(f => f.endsWith('.html')).sort();
const read = f => fs.readFileSync(path.join(R, f), 'utf8');
let bad = 0;
const ok = (c, t) => { if (!c) { bad++; console.log('  FAIL ' + t); } };

ok(files.length === 19, 'ровно 19 HTML-страниц');

/* Тёмная база и подключение системы на каждой странице */
for (const f of files) {
  const s = read(f);
  ok(/<html lang="ru" data-theme="dark">/.test(s), f + ': тёмная тема по умолчанию');
  ok(/<link rel="stylesheet" href="n7-bold\.css\?v=[^"]+">/.test(s), f + ': нет n7-bold.css');
  ok(/<script src="n7-bold\.js\?v=[^"]+" defer><\/script>/.test(s), f + ': нет n7-bold.js');
  ok(!/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(s), f +': внешние шрифты');
  ok(/<title>/.test(s) && /name="description"/.test(s), f + ': потеряны title/description');
  if (f === '404.html') ok(/name="robots" content="noindex/.test(s), f + ': нет noindex');
  else ok(/rel="canonical"/.test(s), f + ': потерян canonical');
  ok(/property="og:image"/.test(s) && /name="twitter:card"/.test(s), f + ': потеряны OG/Twitter');
  ok((s.match(/<h1[\s>]/g) || []).length === 1, f + ': должен быть один h1');
  ok(/class="skip"/.test(s) && /id="top"/.test(s), f + ': нет skip-link или #top');
  ok(/class="n7intro" id="n7Intro"/.test(s), f + ': потеряна заставка');
  /* только видимый текст: метаописания сохраняем дословно */
  const body = s.slice(s.indexOf('<body>'));
  const banned = ['комплексн', 'современные технологии', 'надёжн', 'высокое качество',
    'гарантия качества', 'профессиональная команда', 'От идеи до реальных результатов',
    'Почему выбирают нас', 'Готовы обсудить ваш проект', 'Расскажите о задаче',
    'Надёжные решения для будущего', 'команда профессионалов'];
  for (const b of banned) ok(!body.toLowerCase().includes(b.toLowerCase()), f + ': штамп «' + b + '»');
  /* alt у всех img */
  const imgs = body.match(/<img\b[^>]*>/g) || [];
  ok(imgs.every(t => /\balt="[^"]*"/.test(t)), f + ': img без alt');
}

/* CSS/JS системы */
const css = read('n7-bold.css'), fc = read('fonts.css'), js = read('n7-bold.js');
ok((css.match(/{/g) || []).length === (css.match(/}/g) || []).length, 'n7-bold.css: баланс скобок');
for (const t of ['--ink:', '--acid:', '--display:', '--mono:', '--w-bold:', '--sec-pad:',
  '@media(prefers-reduced-motion:reduce)', 'n7-marquee', 'n7-cta-big', '[data-n7-stub]'])
  ok(css.includes(t), 'n7-bold.css: нет ' + t);
ok((fc.match(/@font-face/g) || []).length === 15, 'fonts.css: 15 локальных @font-face');
ok(fc.includes("'Inter Tight'") && fc.includes("'IBM Plex Mono'"), 'fonts.css: нет новых шрифтов');
ok(js.includes('prefers-reduced-motion') && js.includes('N7_LEAD_ENDPOINT') && js.includes('wa.me'),
   'n7-bold.js: нет reduced-motion / endpoint / WhatsApp-fallback');
ok(read('main.js').includes("saved||'dark'"), 'main.js: тёмная тема не по умолчанию');
ok(read('fx.js').includes('data-n7-nosplit') && read('fx.js').includes('.n7-cta-big'),
   'fx.js: не исключены заголовки с акцентом / магнитная CTA');

/* Все локальные ссылки и якоря целы */
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

/* Главная: структура 1–9 */
const i = read('index.html');
ok(i.includes('aria-label="СТРОИМ. СДАЁМ. ОТВЕЧАЕМ."'), 'index: нет героя «СТРОИМ. СДАЁМ. ОТВЕЧАЕМ.»');
const hero = i.slice(i.indexOf('<section class="hero'), i.indexOf('</section>'));
ok((hero.match(/class="btn(?: n7-ghost)?" href="(?:#n7Quick|proekty\.html)"/g) || []).length === 2,
   'index: в hero должно быть ровно 2 кнопки');
ok((i.match(/<dt>/g) || []).length >= 3 && i.includes('20+') && i.includes('250+') && i.includes('2000+'),
   'index: нет счётчиков 20+/250+/2000+');
ok(i.includes('n7-marquee-group') && i.includes('Жилое строительство'), 'index: нет бегущей строки');
ok((i.match(/class="n7-tile-no"/g) || []).length === 6, 'index: не 6 плиток услуг');
ok((i.match(/class="n7-pj"/g) || []).length === 4, 'index: не 4 карточки проектов');
ok((i.match(/class="pcat"/g) || []).length === 3, 'index: не 3 категории продукции');
ok(!i.includes('US$'), 'index: остались USD-цены');
ok((i.match(/class="n7-geodot"/g) || []).length === 8, 'index: не 8 городов на схеме');
ok((i.match(/<li><span class="n">0[1-4]<\/span>/g) || []).length === 4, 'index: не 4 этапа 01–04');
ok(/<form id="n7Quick"/.test(i) && (i.match(/<label for="q-(?:name|phone|work)"/g) || []).length === 3,
   'index: нет формы из 3 полей');
ok(/id="q-agree"/.test(i) && /n7-cta-big/.test(i), 'index: нет согласия или огромной кнопки');
ok(/id="sec-3"/.test(i) && /id="sec-6"/.test(i) && /id="sec-7"/.test(i),
   'index: потеряны старые якоря #sec-3/#sec-6/#sec-7');
ok(/wa\.me\/77778848818/.test(i) && /data-n7-stub="requisites"/.test(i),
   'index: нет WhatsApp или заглушки реквизитов');
ok((i.match(/data-n7-stub=/g) || []).length >= 3, 'index: мало явных заглушек');

/* Заглушки на остальных страницах */
const stubs = files.reduce((n, f) => n + (read(f).match(/data-n7-stub=/g) || []).length, 0);
ok(stubs >= 25, 'мало явных заглушек на сайте: ' + stubs);
ok(read('o-kompanii.html').includes('data-n7-stub="photos"'), 'o-kompanii: нет заглушки под фото объектов');
ok(read('produktsiya.html').includes('data-n7-stub="prices-kzt"'), 'produktsiya: нет заглушки прайса в ₸');

console.log(bad ? 'РЕДИЗАЙН: ПРОВАЛ (' + bad + ')' : 'Редизайн: ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ · страниц: ' + files.length + ' · заглушек: ' + stubs);
process.exit(bad ? 1 : 0);
