/* N7 Construction → Telegram Bot API.
   Cloudflare Worker. Секреты задаются ТОЛЬКО через `wrangler secret put`,
   в репозитории и в браузере их нет. См. README.md рядом с файлом. */
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), {
    status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers }
  });
}

function buildMessage(d) {
  if (d.kind === 'quick') {
    return ['<b>Заявка / КП · N7 Construction</b>', '',
      esc(String(d.text || '').slice(0, 3500)), '',
      '<i>Без контактных данных — из квиза или листа подбора.</i>',
      '<b>Страница:</b> ' + esc(d.page || '—')].join('\n');
  }
  const lines = ['<b>Новая заявка · N7 Construction</b>', ''];
  const f = (label, v) => { if (v) lines.push('<b>' + label + ':</b> ' + esc(v)); };
  f('Имя', d.name);
  f('Телефон', d.phone);
  f('Направление', d.work);
  if (d.msg) lines.push('', '<b>Комментарий:</b>', esc(d.msg));
  if (d.list) lines.push('', '<b>Лист подбора:</b>', esc(d.list));
  lines.push('', '<b>Страница:</b> ' + esc(d.page || '—'));
  lines.push('<b>Время:</b> ' + esc(new Date().toISOString().replace('T', ' ').slice(0, 19)) + ' UTC');
  return lines.join('\n');
}

export default {
  async fetch(req, env) {
    const origin = env.ALLOWED_ORIGIN || 'https://q984q.github.io';
    const cors = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    };
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405, cors);

    let d;
    try {
      const ct = req.headers.get('content-type') || '';
      if (ct.includes('application/json')) d = await req.json();
      else {
        d = {};
        (await req.formData()).forEach((v, k) => { d[k] = String(v); });
      }
    } catch (e) { return json({ ok: false, error: 'bad_body' }, 400, cors); }
    if (!d || typeof d !== 'object') d = {};

    /* ловушка для ботов + ограничение длины */
    if (d.company || d.website || d._gotcha) return json({ ok: true, ignored: true }, 200, cors);
    const quick = d.kind === 'quick';
    const fields = quick ? ['text', 'page'] : ['name', 'phone', 'work', 'msg', 'list', 'page'];
    const tooLong = fields.some(k => String(d[k] || '').length > (quick && k === 'text' ? 3500 : 2000));
    const digits = String(d.phone || '').replace(/\D/g, '');
    if (tooLong || (quick ? !String(d.text || '').trim() : (!d.name || digits.length < 10)))
      return json({ ok: false, error: 'invalid' }, 400, cors);

    const token = env.TELEGRAM_TOKEN;
    if (!token) return json({ ok: false, error: 'no_token' }, 503, cors);
    const api = 'https://api.telegram.org/bot' + token;

    let chat = env.TELEGRAM_CHAT_ID;
    if (!chat) {
      try {
        const u = await (await fetch(api + '/getUpdates')).json();
        const ids = (u.result || [])
          .map(x => (x.message && x.message.chat && x.message.chat.id) ||
                    (x.edited_message && x.edited_message.chat && x.edited_message.chat.id))
          .filter(Boolean);
        chat = ids.length ? ids[ids.length - 1] : null;
      } catch (e) { chat = null; }
      if (!chat) return json({ ok: false, error: 'chat_unknown' }, 503, cors);
    }

    try {
      const r = await fetch(api + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chat,
          text: buildMessage(d),
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      });
      const out = await r.json();
      if (!r.ok || !out.ok) return json({ ok: false, error: 'telegram_rejected' }, 502, cors);
      return json({ ok: true, message_id: out.result.message_id }, 200, cors);
    } catch (e) {
      return json({ ok: false, error: 'upstream' }, 502, cors);
    }
  }
};
