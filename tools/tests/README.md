# UI-тесты сайта N7 v3 «ГЛУБИНА»

```bash
cd tools/tests
npm i
npm test
```

`npm test` последовательно запускает четыре набора, каждый по всем 19 HTML:

| Файл | Что проверяет |
| --- | --- |
| `test-rails.cjs` | Мобильное листание (`n7-rail.js`): число лент, стрелки, счётчик `1 / N`, `tabindex`, `aria-label`, клик «→» меняет счётчик, на ПК листания нет |
| `test-seo.cjs` | `lang="ru"`, один `<title>`/`<h1>`/description, OG/Twitter, canonical, sitemap, alt у img, валидный JSON-LD, `BreadcrumbList`, разделение каталога и освещения (13/14 позиций) |
| `test-intro.cjs` | **Каркас v3:** нет заставки, `data-theme`, `#theme`, инлайна; тёмный `theme-color #05080F`, header/footer, доступный бургер, skip-link, 3 внешних CSS, `n7-depth.js` на всех 19, `n7-scene.js` только на главной, canvas + HUD + CSS-фолбэк, `[data-depth]` и `.v3-iso`, контракты форм. Отдельно проверяет, что рендерер не тащит Three.js/CDN и содержит все фолбэки |
| `test-redesign.cjs` | **Дизайн-система v3:** `--void/--ink/--cyan/--amber`, `preserve-3d`, tilt, изометрия, HUD, `prefers-reduced-motion`, отсутствие цветов v1/v2, единые скругления, manifest/favicon/19 OG, целые ссылки и якоря, новая IA главной, 29 заглушек, телефоны |

jsdom не считает геометрию и не рендерит WebGL. Для этого есть Chromium-прогон:
19 страниц × ПК 1440×900 / МОБ 390×844, computed-стили, палитра, реальный
WebGL-контекст и его фолбэки на мобильных, скругления, overflow, битые
картинки, локальные URL, форма, focus и `prefers-reduced-motion` + 14 PNG.
Отчёт — `screens/redesign-check.txt`, снимки — `screens/v3/`,
Lighthouse — `screens/lighthouse.txt`.

Тесты форм и Telegram-воркера лежат в `tools/telegram-proxy/tests/`.
