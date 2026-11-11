const CACHE_NAME = 'sistema-jose-euclides-v5';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './login.html',
  './manifest.json',
  './LOGO-removebg-preview.png',
  './registro-ocorrencias.html',
  './atividade-disciplinas.html',
  './frequencia-secretaria.html',
  './frequencia-eletiva.html',
  './historico-eletivas.html',
  './historico-ocorrencias.html',
  './relatorio-turma.html',
  './mapeamento-sala.html',
  './reservas.html',
  './atendimento.html',
  './notas.html',
  './matricula-eletivas.html',
  './busca-ativa.html',
  './aee.html',
  './atendimento-alunos.html',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const url of URLS_TO_CACHE) {
        try { await cache.add(url); } catch (err) {}
      }
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptação Network-First com bypass de cache HTTP para pegar qualquer push do GitHub na hora!
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || event.request.url.includes('script.google.com')) {
    return;
  }

  const isHtmlOuJsLocal = event.request.mode === 'navigate' ||
                          event.request.url.endsWith('.html') ||
                          event.request.url.endsWith('.js') ||
                          event.request.url.endsWith('.json');

  const fetchReq = isHtmlOuJsLocal
    ? new Request(event.request.url, { cache: 'no-store' })
    : event.request;

  event.respondWith(
    fetch(fetchReq)
      .then(fetchResponse => {
        if (fetchResponse && fetchResponse.status === 200) {
          const responseClone = fetchResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return fetchResponse;
      })
      .catch(() => {
        return caches.match(event.request).then(cachedResponse => {
          return cachedResponse || (event.request.mode === 'navigate' ? caches.match('./index.html') : null);
        });
      })
  );
});