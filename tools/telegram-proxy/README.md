# Заявки с сайта → Telegram

Статический GitHub Pages **не может** хранить токен бота: всё, что лежит в JS,
видно любому посетителю. Поэтому токен живёт только в секретах Cloudflare Worker,
а сайт отправляет заявку на публичный URL воркера.

## 1. Перевыпустите токен
Токен был отправлен в чате в открытом виде — отзовите его у `@BotFather`
(`/revoke`) и создайте новый. Старый нигде не используется.

## 2. Задеплойте воркер
```bash
cd tools/telegram-proxy
npm i --save-dev wrangler
npx wrangler login
npx wrangler secret put TELEGRAM_TOKEN      # вставьте НОВЫЙ токен
npx wrangler secret put TELEGRAM_CHAT_ID    # ваш chat id; если пропустить — возьмём из getUpdates
npx wrangler deploy
```
Чтобы получить chat id: напишите боту любое сообщение, затем откройте
`https://api.telegram.org/bot<ТОКЕН>/getUpdates` и скопируйте `message.chat.id`.
Если `TELEGRAM_CHAT_ID` не задан, воркер сам возьмёт последний чат из `getUpdates`.

`wrangler deploy` выведет URL вида `https://n7-lead-telegram.<аккаунт>.workers.dev`.

## 3. Подключите сайт
В `main.js` задайте `N7_LEAD_ENDPOINT` (или атрибут `data-endpoint` у `<form id="lead">`):
```js
var N7_LEAD_ENDPOINT = 'https://n7-lead-telegram.<аккаунт>.workers.dev';
```
Это **публичный** URL, не секрет — его можно коммитить. После этого все заявки,
листы подбора и результат квиза уходят в Telegram сразу, а WhatsApp остаётся
резервным каналом, если воркер недоступен.

## Защита
- CORS разрешён только `https://q984q.github.io` (`ALLOWED_ORIGIN`).
- Honeypot-поля (`company`, `website`, `_gotcha`) молча отбрасываются.
- Валидация телефона, лимит 2000 символов на поле, HTML-экранирование.
- Для защиты от floods включите Rate Limiting в Cloudflare на роут воркера.

## Проверка без деплоя
`npm i && npm test` (в этом каталоге) прогоняет оба теста: `tests/test-worker.cjs`
через мок Bot API — CORS, `sendMessage`, `getUpdates`, honeypot, XSS и ошибочные
ответы; `tests/test-lead.cjs` в jsdom — путь «форма / быстрая заявка → воркер →
успех или WhatsApp-fallback».
