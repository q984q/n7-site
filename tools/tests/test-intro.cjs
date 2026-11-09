/* N7 v2 «Сталь»: единый каркас и честный первый экран на всех 19 страницах.
   Из v1 удалены заставка, переключатель тем и инверсия сайта. Теперь тест
   проверяет, что они не вернулись, а новый header/footer доступны везде. */
const fs = require('fs'), path = require('path');
const R = path.resolve(__dirname, '..', '..');
const files = fs.readdirSync(R).filter(f => f.endsWith('.html')).sort();
let bad = 0;
const ok = (c, t) => { if (!c) { bad++; console.log('  FAIL ' + t); } };

ok(files.length === 19, 'ровно 19 HTML-страниц');

for (const f of files) {
  const s = fs.readFileSync(path.join(R, f), 'utf8');
  /* Никаких артефактов первого экрана v1 */
  ok(!/data-theme=/.test(s), f + ': вернулся data-theme / переключатель');
  ok(!/n7intro|n7-intro|n7i-on|n7i-lock/.test(s), f + ': вернулась заставка');
  ok(!/id="theme"/.test(s), f + ': вернулась кнопка смены темы');
  ok(!/localStorage\.getItem\("n7-theme"\)/.test(s), f + ': вернулось восстановление темы');
  /* Новый каркас */
  ok(/<html lang="ru">/.test(s), f + ': нет lang="ru"');
  ok(/<meta name="theme-color" content="#0B1016">/.test(s), f + ': theme-color не графит');
  ok(/<header class="n7-head">/.test(s), f + ': нет новой шапки');
  ok(/<footer class="n7-foot">/.test(s), f + ': нет нового подвала');
  ok(/id="menu"[^>]*aria-label="Основное меню"/.test(s), f + ': меню без доступного имени');
  ok(/id="burger"[^>]*aria-expanded="false"[^>]*aria-controls="menu"/.test(s), f + ': бургер без состояния');
  ok(!/<a class="logo"[^>]*aria-label=/.test(s), f + ': aria-label у логотипа ломает label-content-name');
  ok(/class="skip"/.test(s) && /id="top"/.test(s), f + ': нет skip-link или #top');
  ok((s.match(/<h1[\s>]/g) || []).length === 1, f + ': должен быть один h1');
  ok(/<meta name="viewport"/.test(s), f + ': нет viewport');
  ok(!/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(s), f + ': внешние шрифты');
  /* Три внешних CSS с версией, без инлайнового critical */
  for (const css of ['fonts.css', 'style.css', 'n7-bold.css'])
    ok(new RegExp('<link rel="stylesheet" href="' + css + '\\?v=[^"]+"').test(s), f + ': нет ' + css);
  ok(!/<style>/.test(s), f + ': инлайновый CSS в head');
  /* Никаких жёстко зашитых цветов v1 */
  ok(!/#f2c200|#ffd633|#0e0f10|#141516/i.test(s), f + ': остался цвет v1');
  ok(!/stroke="#f2c200"/i.test(s), f + ': осталась жёлтая deco-линия');
}

/* Рабочие контракты форм */
const idx = fs.readFileSync(path.join(R, 'index.html'), 'utf8');
ok(/<form id="n7Quick"/.test(idx), 'index: нет быстрой формы');
for (const id of ['q-name', 'q-phone', 'q-work', 'q-agree', 'q-status'])
  ok(idx.includes('id="' + id + '"'), 'index: нет поля ' + id);
ok(/wa\.me\/77778848818/.test(idx), 'index: нет WhatsApp');
const kont = fs.readFileSync(path.join(R, 'kontakty.html'), 'utf8');
ok(/<form id="lead"/.test(kont), 'kontakty: нет формы заявки');
for (const id of ['fname', 'phone', 'work', 'agree', 'send', 'msg', 'status'])
  ok(kont.includes('id="' + id + '"'), 'kontakty: нет поля ' + id);

/* Движок v2: без заставки, но с reduced-motion и WhatsApp-fallback */
const bold = fs.readFileSync(path.join(R, 'n7-bold.js'), 'utf8');
ok(!/n7Cursor|marquee|parallax/.test(bold), 'n7-bold.js: вернулся тяжёлый v1-интерактив');
ok(bold.includes('prefers-reduced-motion') && bold.includes('N7_LEAD_ENDPOINT') && bold.includes('wa.me'),
   'n7-bold.js: нет reduced-motion / endpoint / WhatsApp-fallback');
const fx = fs.readFileSync(path.join(R, 'fx.js'), 'utf8');
ok(fx.includes('prefers-reduced-motion') && fx.includes('IntersectionObserver') &&
   !/innerHTML|\.wd\b/.test(fx), 'fx.js: заголовки снова разбиваются на слова');
const main = fs.readFileSync(path.join(R, 'main.js'), 'utf8');
ok(!/n7-theme/.test(main), 'main.js: вернулась инверсия темы');
ok(!fs.existsSync(path.join(R, 'n7-intro.js')), 'n7-intro.js всё ещё в репозитории');

console.log(bad ? 'КАРКАС V2: ПРОВАЛ (' + bad + ')' : 'Каркас v2: ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ · страниц: ' + files.length);
process.exit(bad ? 1 : 0);
