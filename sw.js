const ehHtmlOuJsDoPortal = (
    requestFinal.mode === 'navigate' ||
    reqUrl.endsWith('.html') ||
    reqUrl.endsWith('.js') ||
    reqUrl.endsWith('.json') ||
    reqUrl.endsWith('/')
  );

  if (ehHtmlOuJsDoPortal) {
    // ESTRATÉGIA REDE PRIMEIRO (NETWORK-FIRST):
    // Se tiver internet, baixa SEMPRE a versão mais recente do GitHub na hora para todos!
    // Se estiver offline (ou a rede falhar), entrega a versão salva no cache do aparelho.
    event.respondWith(
      fetch(new Request(reqUrl, { cache: 'no-store' }))
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(requestFinal, clone));
          }
          return networkResponse;
        })
        .catch(() => caches.match(requestFinal, { ignoreSearch: true }))
    );
    return;
  }

  // Para imagens e ícones (brasão, logo, etc.), mantém o carregamento instantâneo:
  event.respondWith(
    caches.match(requestFinal, { ignoreSearch: true }).then(cachedResponse => {
      const fetchPromise = fetch(new Request(reqUrl, { cache: 'no-store' }))
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(requestFinal, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);
      return cachedResponse || fetchPromise;
    })
  );
