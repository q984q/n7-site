/* SEO-аудит всех страниц: метаданные, OG/Twitter, canonical, JSON-LD,
   заголовки, alt, sitemap, OG-картинки и отсутствие неподтверждённых фактов. */
const fs = require('fs'), path = require('path');
const R = path.resolve(__dirname, '..', '..');
const files = fs.readdirSync(R).filter(f => f.endsWith('.html')).sort();
const sitemap = fs.readFileSync(path.join(R, 'sitemap.xml'), 'utf8');
const base = 'https://q984q.github.io/n7-site/';
let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.log('  FAIL ' + m); } };
const NEED = ['og:type', 'og:title', 'og:description', 'og:image', 'og:url', 'og:locale',
  'og:image:width', 'og:image:height', 'og:site_name',
  'twitter:card', 'twitter:image', 'twitter:title', 'twitter:description'];
const FORBID = ['по данным каталога производителя', 'по каталогам производителя',
  'по спецификации производителя', 'сертификация ITTF', 'гарантия 3–8 лет',
  'От 3 до 8 лет', 'network-first кэш'];

for (const f of files) {
  const s = fs.readFileSync(path.join(R, f), 'utf8');
  ok(/<html lang="ru"(?:\s[^>]*)?>/.test(s), f + ': lang=ru');
  ok((s.match(/<title>/g) || []).length === 1, f + ': ровно один <title>');
  ok((s.match(/<h1/g) || []).length === 1, f + ': ровно один <h1>');
  ok((s.match(/<meta name="description"/g) || []).length === 1, f + ': ровно один description');
  for (const k of NEED) ok(s.includes('content="' + k) || s.includes(k + '"'), f + ': нет ' + k);
  /* property="og:..." и name="twitter:..." */
  for (const k of NEED.filter(x => x.startsWith('og:')))
    ok(s.includes('property="' + k + '"'), f + ': нет property ' + k);
  for (const k of NEED.filter(x => x.startsWith('twitter:')))
    ok(s.includes('name="' + k + '"'), f + ': нет name ' + k);
  const can = s.match(/<link rel="canonical" href="([^"]+)"/);
  if (f === '404.html') {
    ok(/name="robots" content="noindex/.test(s), '404: noindex');
  } else {
    const want = f === 'index.html' ? base : base + f;
    ok(!!can && can[1] === want, f + ': canonical = ' + (can && can[1]));
    ok(sitemap.includes('<loc>' + base + f + '</loc>'), f + ': нет в sitemap.xml');
  }
  const imgs = [...s.matchAll(/<img\b[^>]*>/g)].map(m => m[0]);
  ok(imgs.every(x => /\balt="/.test(x)), f + ': img без alt');
  /* OG-картинка существует */
  const og = s.match(/<meta property="og:image" content="([^"]+)"/);
  ok(!!og && fs.existsSync(path.join(R, og[1].replace(base, ''))), f + ': файл og:image не найден');
  /* JSON-LD валиден */
  for (const m of s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch (e) { ok(false, f + ': битый JSON-LD'); }
  }
  if (f !== 'index.html') ok(s.includes('BreadcrumbList'), f + ': нет BreadcrumbList');
  for (const phrase of FORBID) ok(!s.includes(phrase), f + ': неподтверждённая фраза «' + phrase + '»');
  /* Никаких голословных сертификатов, олимпиад, гарантий и сроков службы */
  const claims = [
    /\b(?:ITTF|IAAF|ITF|FIBA|FIVB|IHF)\s+Approved\b/i,
    /Олимпиада в Париже|Олимпийские игры|Официальный корт FIBA/i,
    /Гарантия\s+\d+\s*(?:лет|год)/i,
    /[Сс]рок службы\s+(?:от\s+)?\d+/,
    /по каталог(?:ам|у) производителя|по спецификации производителя/i
  ];
  for (const re of claims) {
    if (f === 'o-kompanii.html') continue; /* там список ожидаемых документов, не утверждение */
    ok(!re.test(s), f + ': неподтверждённое утверждение ' + re);
  }
}

/* Разделение покрытий и освещения */
const cover = fs.readFileSync(path.join(R, 'produktsiya.html'), 'utf8');
const light = fs.readFileSync(path.join(R, 'osveshhenie.html'), 'utf8');
ok(!cover.includes('id="lgrid"') && !cover.includes('#light-slot'), 'produktsiya.html ещё содержит освещение');
ok(light.includes('id="lgrid"') && (light.match(/<article class="lcard"/g) || []).length === 14,
  'osveshhenie.html: нет 14 типов освещения');
ok(cover.includes('class="splitnav"') && light.includes('class="splitnav"'), 'нет переключателя разделов');
ok(light.includes('"numberOfItems":14'), 'osveshhenie.html: ItemList без 14 позиций');
ok(!fs.readFileSync(path.join(R, 'n7-search.js'), 'utf8').includes('produktsiya.html#osveshhenie'),
  'поисковый индекс ссылается на старый якорь');
ok(!/meta name="description"[^>]*сертификац/i.test(cover), 'meta description с неподтверждёнными сертификатами');

console.log('Проверено страниц: ' + files.length + (bad ? '\nОШИБОК: ' + bad : '\nSEO: ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ'));
process.exit(bad ? 1 : 0);
