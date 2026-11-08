/* N7 Construction · офлайн-режим.
   Network-first: сеть всегда в приоритете, кэш используется только при её отсутствии.
   Ничего не прекэшируется и не подменяется при работающем интернете — после деплоя
   посетитель всегда видит свежую версию. Только свой origin, только GET. */
var CACHE = 'n7-offline-v1';

self.addEventListener('install', function () { self.skipWaiting(); });

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) {
      return k.indexOf('n7-offline-') === 0 && k !== CACHE;
    }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;

  e.respondWith(fetch(req).then(function (res) {
    if (res && res.ok && res.type === 'basic') {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { return c.put(req, copy); }).catch(function () {});
    }
    return res;
  }).catch(function () {
    return caches.match(req).then(function (hit) {
      if (hit) return hit;
      if (req.mode === 'navigate') {
        var html = '<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8">' +
          '<meta name="viewport" content="width=device-width, initial-scale=1">' +
          '<title>Нет соединения · N7 Construction</title>' +
          '<style>body{margin:0;display:grid;place-items:center;min-height:100vh;background:#141516;color:#ecece8;' +
          'font:16px/1.6 system-ui,sans-serif;text-align:center;padding:24px}div{max-width:460px}' +
          'h1{font-size:26px;color:#f2c200}a{color:#f2c200}p{color:#a9aaa4}</style></head>' +
          '<body><div><h1>Нет соединения</h1><p>Страница ещё не сохранена для офлайн-просмотра. ' +
          'Вернитесь к сети и откройте её снова — или позвоните нам.</p>' +
          '<p><a href="./">На главную</a> · <a href="tel:+77778848818">+7 (777) 884-88-18</a></p></div></body></html>';
        return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
      return new Response('', { status: 503, statusText: 'Offline' });
    });
  }));
});
