const path = require('node:path');
const R = path.resolve(__dirname, '..', '..', '..');
/* Путь «форма → защищённый прокси → Telegram» и резервный WhatsApp-канал. */
const { JSDOM } = require('jsdom');
const fs = require('fs');
const HTML = fs.readFileSync(path.join(R, 'kontakty.html'), 'utf8');
const JS = fs.readFileSync(path.join(R, 'main.js'), 'utf8');
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL ' + m); } else console.log('  ok  ' + m); };

function boot(opts) {
  const dom = new JSDOM(HTML, { url: 'https://q984q.github.io/n7-site/kontakty.html', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  w.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });
  const opened = [], calls = [];
  w.open = (u) => { opened.push(u); return null; };
  w.scrollTo = () => {};
  if (opts.endpoint) w.N7_LEAD_ENDPOINT = opts.endpoint;
  w.fetch = (url, init) => { calls.push({ url, init }); return opts.fetch ? opts.fetch(url, init) : Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, message_id: 77 }) }); };
  if (opts.list) w.n7List = opts.list;
  w.eval(JS);
  w.eval(fs.readFileSync(path.join(R, 'features.js'), 'utf8'));
  return { w, d: w.document, opened, calls };
}
function submit(s, a = true) {
  s.d.querySelector('#fname').value = 'Иван';
  s.d.querySelector('#phone').value = '+7 777 123-45-67';
  s.d.querySelector('#work').value = 'Жилое строительство';
  s.d.querySelector('#msg').value = 'Тестовая заявка';
  s.d.querySelector('#agree').checked = a;
  s.d.querySelector('#lead').dispatchEvent(new s.w.Event('submit', { bubbles: true, cancelable: true }));
  return s.d.querySelector('#status');
}

(async function () {
  console.log('1) endpoint задан → уходит POST с JSON');
  let a = boot({ endpoint: 'https://n7-lead.example.workers.dev', list: { count: () => 1, all: () => [{ title: 'Покрытие', text: '14 мм' }] } });
  let st = submit(a);
  await new Promise(r => setTimeout(r, 10));
  ok(a.calls.length === 1, 'fetch вызван ровно один раз');
  ok(a.calls[0].url === 'https://n7-lead.example.workers.dev', 'URL прокси верный');
  ok(a.calls[0].init.method === 'POST', 'метод POST');
  ok(a.calls[0].init.headers['Content-Type'] === 'application/json', 'Content-Type: application/json');
  let body = JSON.parse(a.calls[0].init.body);
  ok(body.name === 'Иван' && body.phone === '+7 777 123-45-67', 'имя и телефон в теле');
  ok(body.work === 'Жилое строительство' && body.msg === 'Тестовая заявка', 'направление и комментарий');
  ok(/14 мм/.test(body.list), 'лист подбора приложен');
  ok(/Новая заявка|Заявка с сайта N7/.test(body.text), 'готовый текст заявки приложен');
  ok(/^https:\/\/q984q/.test(body.url), 'страница-источник');
  ok(a.opened.length === 0, 'WhatsApp НЕ открывается при успехе');
  ok(!st.querySelector('pre'), 'резервный текст НЕ показан');
  ok(/Заявка отправлена/.test(st.textContent), 'статус «Заявка отправлена»');
  ok(a.d.querySelector('#fname').value === '', 'форма очищена');

  console.log('2) прокси недоступен → резервный WhatsApp, заявка не теряется');
  let b = boot({ endpoint: 'https://n7-lead.example.workers.dev', fetch: () => Promise.reject(new Error('network')) });
  st = submit(b);
  await new Promise(r => setTimeout(r, 10));
  ok(b.calls.length === 1, 'попытка отправки была');
  ok(b.opened.length === 1 && /wa\.me/.test(b.opened[0]), 'открыт WhatsApp');
  ok(!!st.querySelector('pre'), 'текст заявки показан для копирования');
  ok(!!st.querySelector('a.btn'), 'кнопка «Отправить в WhatsApp»');

  console.log('3) прокси вернул ошибку → тот же fallback');
  let c = boot({ endpoint: 'https://n7-lead.example.workers.dev', fetch: () => Promise.resolve({ ok: false, json: () => Promise.resolve({ ok: false }) }) });
  submit(c);
  await new Promise(r => setTimeout(r, 10));
  ok(c.opened.length === 1, 'WhatsApp открыт');

  console.log('4) endpoint не задан → сразу fallback, без fetch');
  let e = boot({});
  submit(e);
  ok(e.calls.length === 0, 'fetch не вызывается');
  ok(e.opened.length === 1, 'WhatsApp открыт');

  console.log('5) без согласия → ничего не отправляется');
  let f = boot({ endpoint: 'https://n7-lead.example.workers.dev' });
  submit(f, false);
  ok(f.calls.length === 0 && f.opened.length === 0, 'отправки нет');
  ok(/Проверьте поля/.test(f.d.querySelector('#status').textContent), 'ошибка валидации');

  console.log('6) быстрая заявка из квиза / листа подбора → сразу в Telegram');
  let g = boot({ endpoint: 'https://n7-lead.example.workers.dev' });
  await g.w.n7Send('Подбор по квизу: покрытие 14 мм');
  ok(g.calls.length === 1, 'POST на прокси без формы');
  let q = JSON.parse(g.calls[0].init.body);
  ok(q.kind === 'quick' && /квизу/.test(q.text), 'kind=quick и текст результата');
  ok(g.opened.length === 0, 'WhatsApp не открывается');

  console.log('7) прокси не задан → быстрая заявка уходит в WhatsApp');
  let h = boot({});
  await h.w.n7Send('КП');
  ok(h.calls.length === 0 && h.opened.length === 1 && /wa\.me/.test(h.opened[0]), 'резервный канал работает');

  console.log(fails ? '\nОШИБОК: ' + fails : '\nВСЕ ПРОВЕРКИ ПРОЙДЕНЫ');
  process.exit(fails ? 1 : 0);
})();
