/* N7 v3 «ГЛУБИНА»: единый каркас и честный первый экран на всех 19 страницах.
   Проверяем, что артефакты v1/v2 не вернулись, а 3D-слой подключён везде,
   WebGL-сцена — только на главной и только с безопасным фолбэком. */
const fs = require('fs'), path = require('path');
const R = path.resolve(__dirname, '..', '..');
const files = fs.readdirSync(R).filter(f => f.endsWith('.html')).sort();
let bad = 0;
const ok = (c, t) => { if (!c) { bad++; console.log('  FAIL ' + t); } };

ok(files.length === 19, 'ровно 19 HTML-страниц');

for (const f of files) {
  const s = fs.readFileSync(path.join(R, f), 'utf8');
  /* Никаких артефактов v1/v2 */
  ok(!/data-theme=/.test(s), f + ': вернулся data-theme / переключатель');
  ok(!/n7intro|n7-intro|n7i-on|n7i-lock/.test(s), f + ': вернулась заставка');
  ok(!/id="theme"/.test(s), f + ': вернулась кнопка смены темы');
  ok(!/localStorage\.getItem\("n7-theme"\)/.test(s), f + ': вернулось восстановление темы');
  /* Новый каркас */
  ok(/<html lang="ru">/.test(s), f + ': нет lang="ru"');
  ok(/<meta name="theme-color" content="#05080F">/.test(s), f + ': theme-color не v3 void');
  ok(/<header class="n7-head">/.test(s), f + ': нет шапки');
  ok(/<footer class="n7-foot">/.test(s), f + ': нет подвала');
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
  /* Единый CSS-3D слой на всех 19 страницах */
  ok(/<script src="n7-depth\.js\?v=[^"]+" defer><\/script>/.test(s), f + ': нет n7-depth.js');
  ok(/data-depth=/.test(s), f + ': нет параллакс-слоёв');
  /* CSS-3D есть везде: изометрическая плита в pagehero, tilt-карточки или сцена */
  ok(/v3-iso|v3-tilt|n7Scene/.test(s), f + ': нет CSS/3D-слоя');
  if (/class="pagehero"/.test(s)) ok(/class="v3-iso"/.test(s), f + ': нет изометрии в pagehero');
  /* Никаких жёстко зашитых цветов v1/v2 */
  ok(!/#f2c200|#ffd633|#0e0f10|#141516|#4EA8FF|#EAF0F5/i.test(s), f + ': остался цвет v1/v2');
  ok(!/stroke="#f2c200"/i.test(s), f + ': осталась жёлтая deco-линия');
}

/* Главная: WebGL-сцена + HUD + CSS-фолбэк */
const idx = fs.readFileSync(path.join(R, 'index.html'), 'utf8');
ok(/<canvas id="n7Scene"[^>]*aria-hidden="true">/.test(idx), 'index: нет canvas сцены');
ok(/<div class="n7-fallback"/.test(idx), 'index: нет CSS-фолбэка без WebGL');
ok(/<div class="n7-hud"[^>]*aria-hidden="true">/.test(idx), 'index: нет HUD-слоя');
ok(/<script src="n7-scene\.js\?v=[^"]+" defer><\/script>/.test(idx), 'index: нет рендерера');
ok(!/rel="preload" as="image" href="img\/hero\.webp"/.test(idx), 'index: лишний preload фото');
for (const f of files.filter(f => f !== 'index.html'))
  ok(!/n7-scene\.js/.test(fs.readFileSync(path.join(R, f), 'utf8')), f + ': сцена грузится не на главной');

/* Рабочие контракты форм */
ok(/<form id="n7Quick"/.test(idx), 'index: нет быстрой формы');
for (const id of ['q-name', 'q-phone', 'q-work', 'q-agree', 'q-status'])
  ok(idx.includes('id="' + id + '"'), 'index: нет поля ' + id);
ok(/wa\.me\/77778848818/.test(idx), 'index: нет WhatsApp');
const kont = fs.readFileSync(path.join(R, 'kontakty.html'), 'utf8');
ok(/<form id="lead"/.test(kont), 'kontakty: нет формы заявки');
for (const id of ['fname', 'phone', 'work', 'agree', 'send', 'msg', 'status'])
  ok(kont.includes('id="' + id + '"'), 'kontakty: нет поля ' + id);

/* Движок: без заставки, но с reduced-motion и WhatsApp-fallback */
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

/* Рендерер: WebGL2, фолбэки, пауза и отказ от мобильных */
const scene = fs.readFileSync(path.join(R, 'n7-scene.js'), 'utf8');
for (const t of ['webgl2', 'prefers-reduced-motion', 'min-width: 900px', 'webglcontextlost',
  'IntersectionObserver', 'visibilitychange', 'requestIdleCallback', 'devicePixelRatio'])
  ok(scene.includes(t), 'n7-scene.js: нет ' + t);
ok(!/three\.js|THREE|cdn|unpkg|jsdelivr/i.test(scene), 'n7-scene.js: внешняя библиотека');
const depth = fs.readFileSync(path.join(R, 'n7-depth.js'), 'utf8');
for (const t of ['prefers-reduced-motion', 'hover: hover', 'IntersectionObserver', '--rx', '--py'])
  ok(depth.includes(t), 'n7-depth.js: нет ' + t);

console.log(bad ? 'КАРКАС V3: ПРОВАЛ (' + bad + ')' : 'Каркас v3 «ГЛУБИНА»: ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ · страниц: ' + files.length);
process.exit(bad ? 1 : 0);
