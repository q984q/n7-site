# UI-тесты сайта N7 v4 «РЕДАКЦИЯ»

Четыре набора на Node.js / jsdom. Запуск:

```bash
cd tools/tests && npm test
```

| Файл | Что проверяет |
| --- | --- |
| `test-rails.cjs` | Единое мобильное листание, счётчики и доступные имена лент; отсутствие старых dock-точек, бегущей строки и инлайновых панелей. |
| `test-seo.cjs` | 19 страниц, `<title>` / description / canonical / OG / Twitter / JSON-LD / sitemap, один `<h1>`, `alt` у изображений, `404.html noindex`, отсутствие неподтверждённых фактов. |
| `test-intro.cjs` | **Каркас v4:** нет заставки, `data-theme`, `#theme`, инлайна; `theme-color #F4F3EF`, header/footer, доступный бургер, skip-link, 3 внешних CSS, `n7-depth.js` на всех 19, `n7-scene.js` только на главной, canvas + CSS-фолбэк, крупное редакционное фото, отсутствие HUD / изометрии / tilt / `data-depth`, контракты форм. Отдельно проверяет, что рендерер не тащит Three.js/CDN и не запускает бесконечный rAF. |
| `test-redesign.cjs` | **Дизайн-система v4:** `--void/--ink/--cyan/--amber`, бумажная палитра, `transform-style:flat`, прямые углы, `.v4-hero-grid` / `.v4-hero-media`, адаптивный `srcset`, `prefers-reduced-motion`, отсутствие цветов v1/v2/v3 и 3D-артефактов, manifest/favicon/19 OG, 8 font-preload на 18 страницах и лёгкий градиент в презентации, целые ссылки и якоря, IA главной, 29 заглушек, телефоны. |

jsdom не считает геометрию и не рендерит WebGL. Для этого есть Chromium-прогон:
19 страниц × ПК/МОБ, светлая палитра, отсутствие горизонтального overflow,
CSS-фолбэк зерна с первого кадра и один статичный WebGL2-кадр после первого
жеста на ПК (на мобильных и reduced-motion остаётся фолбэк), адаптивный hero,
прямые углы, битые ссылки, форма, листание, focus и скриншоты.

Отчёт — `screens/redesign-check.txt`, снимки — `screens/v4/`,
коллаж — `screens/v4-final.png`. Метрики Lighthouse — `screens/lighthouse.txt`.
