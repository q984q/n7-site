const path = require('node:path');
const R = path.resolve(__dirname, '..', '..', '..');
/* Воркер целиком, без сети: мок Bot API. Проверяем CORS, отправку, валидацию, XSS, ошибки. */
const fs = require('fs');
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL ' + m); } else console.log('  ok  ' + m); };
(async function () {
  const src = fs.readFileSync(path.join(__dirname, '..', 'worker.js'), 'utf8');
  const { default: worker } = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));
  const env = { TELEGRAM_TOKEN: 'TEST_TOKEN', TELEGRAM_CHAT_ID: '555001', ALLOWED_ORIGIN: 'https://q984q.github.io' };
  const calls = [];
  let tgReply = () => ({ ok: true, result: { message_id: 42 } });
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    if (String(url).endsWith('/getUpdates')) return new Response(JSON.stringify({ ok: true, result: [{ message: { chat: { id: 777888 } } }] }), { status: 200 });
    return new Response(JSON.stringify(tgReply()), { status: 200 });
  };
  const post = (body) => new Request('https://n7-lead.example.workers.dev', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Origin': 'https://q984q.github.io' }, body: JSON.stringify(body)
  });
  const good = { name: 'Иван <b>', phone: '+7 777 123-45-67', work: 'Жилое строительство', msg: 'Нужен расчёт', page: 'Контакты · N7', list: '1. Покрытие — 14 мм' };

  console.log('1) preflight / метод');
  let r = await worker.fetch(new Request('https://x/', { method: 'OPTIONS', headers: { Origin: env.ALLOWED_ORIGIN } }), env);
  ok(r.status === 204, 'OPTIONS → 204');
  ok(r.headers.get('Access-Control-Allow-Origin') === env.ALLOWED_ORIGIN, 'CORS только для GitHub Pages');
  ok((await worker.fetch(new Request('https://x/', { method: 'GET' }), env)).status === 405, 'GET → 405');

  console.log('2) валидная заявка → sendMessage');
  calls.length = 0;
  r = await worker.fetch(post(good), env);
  const j = await r.json();
  ok(r.status === 200 && j.ok === true, '200 / ok=true, message_id=' + j.message_id);
  ok(calls.length === 1 && /\/sendMessage$/.test(calls[0].url), 'вызван Bot API sendMessage');
  const sent = JSON.parse(calls[0].init.body);
  ok(sent.chat_id === '555001', 'chat_id из секрета');
  ok(sent.parse_mode === 'HTML' && sent.disable_web_page_preview === true, 'HTML + без превью ссылок');
  ok(/Новая заявка/.test(sent.text) && /Нужен расчёт/.test(sent.text), 'текст заявки');
  ok(/Лист подбора/.test(sent.text) && /14 мм/.test(sent.text), 'лист подбора в сообщении');
  ok(sent.text.includes('&lt;b&gt;') && !sent.text.includes('Иван <b>'), 'HTML-экранирование имени (XSS)');
  ok(sent.text.length < 4000, 'длина сообщения в лимите Bot API');

  console.log('3) спам-ловушка / валидация');
  calls.length = 0;
  r = await worker.fetch(post({ ...good, company: 'spam' }), env);
  ok(r.status === 200 && (await r.json()).ignored === true, 'honeypot отброшен');
  ok(calls.length === 0, 'Bot API не вызывался');
  ok((await worker.fetch(post({ ...good, phone: '123' }), env)).status === 400, 'короткий телефон → 400');
  ok((await worker.fetch(post({ ...good, msg: 'x'.repeat(3000) }), env)).status === 400, 'слишком длинное поле → 400');

  console.log('4) chat_id не задан → берём из getUpdates');
  calls.length = 0;
  const env2 = { TELEGRAM_TOKEN: 'TEST_TOKEN', ALLOWED_ORIGIN: env.ALLOWED_ORIGIN };
  r = await worker.fetch(post(good), env2);
  ok(r.status === 200, 'заявка принята');
  ok(calls.some(c => /\/getUpdates$/.test(c.url)), 'getUpdates вызван');
  ok(JSON.parse(calls.find(c => /\/sendMessage$/.test(c.url)).init.body).chat_id === 777888, 'chat_id = 777888');

  console.log('5) отказ Bot API / нет токена');
  tgReply = () => ({ ok: false, description: 'Bad Request' });
  r = await worker.fetch(post(good), env);
  ok(r.status === 502 && (await r.json()).error === 'telegram_rejected', 'отказ Telegram → 502');
  tgReply = () => ({ ok: true, result: { message_id: 42 } });
  ok((await worker.fetch(post(good), {})).status === 503, 'нет токена → 503');

  console.log('6) быстрая заявка без телефона (квиз / КП)');
  calls.length = 0;
  tgReply = () => ({ ok: true, result: { message_id: 43 } });
  r = await worker.fetch(post({ kind: 'quick', name: 'Посетитель сайта', phone: '', text: 'Подбор по квизу: 14 мм', page: 'Квиз · N7' }), env);
  ok(r.status === 200, 'принята без телефона');
  const qmsg = JSON.parse(calls[0].init.body).text;
  ok(/Без контактных данных/.test(qmsg) && /14 мм/.test(qmsg), 'помётка «без контактов» и результат');
  ok((await worker.fetch(post({ kind: 'quick', text: '' }), env)).status === 400, 'пустой текст → 400');
  ok((await worker.fetch(post({ phone: '123' }), env)).status === 400, 'обычная заявка без телефона всё ещё отклоняется');

  console.log(fails ? '\nОШИБОК: ' + fails : '\nВСЕ ПРОВЕРКИ ПРОЙДЕНЫ');
  process.exit(fails ? 1 : 0);
})();
