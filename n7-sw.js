/* N7 Construction · самоликвидация service worker.
   Офлайн-SW перехватывал все навигации и мог вернуть заглушку вместо страницы,
   а также закрепить устаревший style.css после деплоя. Регистрация отключена в main.js;
   этот файл остаётся, чтобы браузеры, уже установившие SW, удалили его и очистили кэш. */
self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){return k.indexOf('n7-offline-')===0})
        .map(function(k){return caches.delete(k)}));
    }).then(function(){return self.clients.claim()})
      .then(function(){return self.registration.unregister()})
  );
});
self.addEventListener('fetch', function(){ /* намеренно не перехватываем: сеть сама */ });
