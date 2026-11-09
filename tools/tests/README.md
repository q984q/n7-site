# UI-тесты сайта N7 v2 «Сталь»

```bash
cd tools/tests
npm i
npm test
```

`npm test` последовательно запускает четыре набора, каждый по всем 19 HTML:

| Файл | Что проверяет |
| --- | --- |
| `test-rails.cjs` | Мобильное листание (`n7-rail.js`): число лент на каждой странице, стрелки, счётчик `1 / N`, `tabindex`, `aria-label`, клик «→» меняет счётчик, на ПК листания нет |
| `test-seo.cjs` | `lang="ru"`, один `<title>`/`<h1>`/description, OG/Twitter, canonical, sitemap, alt у img, валидный JSON-LD, `BreadcrumbList`, отсутствие неподтверждённых сертификатов/гарантий |
| `test-intro.cjs` | **Каркас v2:** нет заставки, `data-theme`, `#theme`, инлайнового critical; есть новый header/footer, `theme-color #0B1016`, доступный бургер, skip-link, 3 внешних CSS с `?v=`, контракты форм `#n7Quick` / `#lead` |
| `test-redesign.cjs` | **Дизайн-система v2:** палитра `--graphite/--steel/--azure`, Inter Tight в базовом CSS, отсутствие жёлтых hex, единые скругления, манифест и favicon, целые ссылки/якоря, новая IA главной, 29 заглушек, телефоны на каждой странице |

jsdom не считает геометрию и реальные обрезки. Для этого есть Chromium-прогон:
19 страниц × ПК 1440×900 / МОБ 390×844, проверка computed-стилей, палитры,
скруглений, overflow, битых картинок, локальных URL, формы, focus и
`prefers-reduced-motion` + 14 PNG. Отчёт — `screens/redesign-check.txt`,
скриншоты — `screens/v2/`, Lighthouse — `screens/lighthouse.txt`.

Тесты форм и Telegram-воркера лежат в `tools/telegram-proxy/tests/`.
