const CACHE_NAME = 'sistema-jose-euclides-v7';
const IDB_SYNC_NAME = 'EEMTI_BackgroundSync_DB';

const URLS_TO_CACHE = [
  './',
  './index.html',
  './login.html',
  './manifest.json',
  './portal-core.js',
  './LOGO-removebg-preview.png',
  './ocorrencias.html',
  './registro-ocorrencias.html',
  './atividades.html',
  './atividade-disciplinas.html',
  './frequencia-secretaria.html',
  './frequencia-eletivas.html',
  './historico-eletivas.html',
  './historico.html',
  './historico-ocorrencias.html',
  './notas-turma.html',
  './notas-registros.html',
  './mapeamento.html',
  './mapeamento-sala.html',
  './reservas.html',
  './atendimento.html',
  './atendimento-alunos.html',
  './notas.html',
  './gestao-notas.html',
  './matricula.html',
  './matricula-eletivas.html',
  './cadastro-disciplinas.html',
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

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || event.request.url.includes('script.google.com') || event.request.url.includes('googleusercontent.com')) {
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

// =========================================================================
// MOTOR BACKGROUND SYNC: ENVIA DIRETO PARA A PLANILHA COM O APP FECHADO!
// =========================================================================
let swSyncRodando = false;

function abrirBancoNoServiceWorker() {
  return new Promise(resolve => {
    const req = indexedDB.open(IDB_SYNC_NAME, 1);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('fila_pendente')) db.createObjectStore('fila_pendente', { keyPath: 'idFila' });
      if (!db.objectStoreNames.contains('relatorio_concluido')) db.createObjectStore('relatorio_concluido', { autoIncrement: true });
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = () => resolve(null);
  });
}

async function processarFilaEmSegundoPlanoSW() {
  if (swSyncRodando) return;
  swSyncRodando = true;

  try {
    const db = await abrirBancoNoServiceWorker();
    if (!db) {
      swSyncRodando = false;
      return;
    }

    const itensPendentes = await new Promise(resolve => {
      try {
        const tx = db.transaction('fila_pendente', 'readonly');
        const req = tx.objectStore('fila_pendente').getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch (e) {
        resolve([]);
      }
    });

    if (itensPendentes.length === 0) {
      swSyncRodando = false;
      return;
    }

    let qtdEnviadosComSucesso = 0;

    for (const item of itensPendentes) {
      try {
        // IMPORTANTE PARA GOOGLE APPS SCRIPT NO SERVICE WORKER:
        // Usa 'text/plain;charset=utf-8' + redirect: 'follow' para atravessar o Redirect 302 do Google sem erro de CORS!
        const res = await fetch(item.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(item.payload),
          redirect: 'follow',
          credentials: 'omit'
        });

        const texto = await res.text();
        let json = null;
        try { json = JSON.parse(texto); } catch (e) {}

        if ((json && (json.success || json.msg)) || (res.ok && texto.includes('"success":true'))) {
          qtdEnviadosComSucesso++;

          // Remove imediatamente da fila_pendente e grava em relatorio_concluido para avisar o professor quando ele abrir o app!
          await new Promise(resolve => {
            const tx = db.transaction(['fila_pendente', 'relatorio_concluido'], 'readwrite');
            tx.objectStore('fila_pendente').delete(item.idFila);
            tx.objectStore('relatorio_concluido').add({
              idFila: item.idFila,
              dataHoraSync: new Date().toLocaleString('pt-BR'),
              resumoHtml: item.resumoHtml
            });
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
          });
        }
      } catch (err) {
        // Se a internet caiu de novo, interrompe e aguarda o próximo evento de rede
        break;
      }
    }

    if (qtdEnviadosComSucesso > 0) {
      // Se houver alguma janela aberta, avisa na hora; se estiver fechado, fica salvo no relatorio_concluido para quando abrir!
      const clientes = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      clientes.forEach(cliente => {
        cliente.postMessage({ type: 'SYNC_BACKGROUND_CONCLUIDO' });
      });
    }
  } finally {
    swSyncRodando = false;
  }
}

// 1. Dispara quando o Sistema Operacional detecta que a internet voltou (mesmo com o app fechado!)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-fila-eemti') {
    event.waitUntil(processarFilaEmSegundoPlanoSW());
  }
});

// 2. Suporte adicional a Periodic Background Sync (Android/Chrome/Edge PWA instalado)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'periodic-sync-fila-eemti') {
    event.waitUntil(processarFilaEmSegundoPlanoSW());
  }
});

// 3. Permite que a página peça ao Service Worker para processar em background
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'DISPARAR_SYNC_SW') {
    event.waitUntil(processarFilaEmSegundoPlanoSW());
  }
});
