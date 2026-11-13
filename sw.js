const CACHE_NAME = 'sistema-jose-euclides-v11';
const IDB_SYNC_NAME = 'EEMTI_BackgroundSync_DB';
const IDB_VERSION = 2;

const URLS_TO_CACHE = [
  './',
  './index.html',
  './login.html',
  './manifest.json',
  './portal-core.js',
  './LOGO-removebg-preview.png',
  './brasaoestado.png.png',
  './icon-192.png',
  './icon-512.png',
  './acompanhamento.html',
  './aee.html',
  './atendimento-alunos.html',
  './atividade-disciplinas.html',
  './atividade-eletivas.html',
  './auditoria.html',
  './busca-ativa.html',
  './cadastro-alunos.html',
  './cadastro-disciplinas.html',
  './cadastro-eletivas.html',
  './cadastro-livros.html',
  './consulta-ocorrencias-aluno.html',
  './controle-frequencia-ranking.html',
  './frequencia-eletivas.html',
  './frequencia-secretaria.html',
  './gestao-ambiente.html',
  './gestao-bimestre.html',
  './gestao-funcionarios.html',
  './gestao-notas.html',
  './gestao-pdt.html',
  './gestao-pontuacao.html',
  './gestao-serie.html',
  './graficos-ocorrencias.html',
  './historico-eletivas.html',
  './historico-ocorrencias.html',
  './mapeamento-sala.html',
  './matricula-eletivas.html',
  './monitoramento-eletivas.html',
  './notas-registros.html',
  './registro-ocorrencias.html',
  './relatorio-turma-ocorrencias.html',
  './reservas-livros.html',
  './reservas.html',
  './simulados.html',
  './situacao-aluno.html',
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
        try { await cache.add(new Request(url, { cache: 'reload' })); } catch (err) {}
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

  let reqUrl = event.request.url;
  const lower = reqUrl.toLowerCase();

  // Garante que qualquer página que peça brasaoestado.png ou o boneco 2941658.png receba brasaoestado.png.png
  if ((lower.endsWith('brasaoestado.png') && !lower.endsWith('brasaoestado.png.png')) || lower.includes('2941658.png')) {
    reqUrl = new URL('./brasaoestado.png.png', self.location.origin + self.location.pathname.replace(/\/[^/]*$/, '/')).href;
  }

  const requestFinal = reqUrl !== event.request.url ? new Request(reqUrl) : event.request;

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
});

// =========================================================================
// BACKGROUND SYNC: ENVIA DIRETO PARA A PLANILHA COM O APP FECHADO OU MINIMIZADO
// =========================================================================
let envioSwEmAndamento = false;

function abrirBancoNoServiceWorker() {
  return new Promise(resolve => {
    const req = indexedDB.open(IDB_SYNC_NAME, IDB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('fila_pendente')) db.createObjectStore('fila_pendente', { keyPath: 'idFila' });
      if (!db.objectStoreNames.contains('relatorio_concluido')) db.createObjectStore('relatorio_concluido', { autoIncrement: true });
      if (!db.objectStoreNames.contains('fotos_offline')) db.createObjectStore('fotos_offline', { keyPath: 'chave' });
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = () => resolve(null);
  });
}

async function processarFilaEmSegundoPlanoSW(forcarMesmoComJanela = false) {
  if (envioSwEmAndamento) return;

  if (!forcarMesmoComJanela) {
    const clientes = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const algumVisivel = clientes.some(c => c.visibilityState === 'visible');
    if (algumVisivel) return;
  }

  envioSwEmAndamento = true;

  try {
    const db = await abrirBancoNoServiceWorker();
    if (!db) return;

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

    if (itensPendentes.length === 0) return;

    let enviouAlgum = false;

    for (const item of itensPendentes) {
      try {
        const res = await fetch(item.url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(item.payload),
          redirect: 'follow',
          credentials: 'omit'
        });

        const texto = await res.text();
        let json = null;
        try { json = JSON.parse(texto); } catch (e) {}

        if ((json && (json.success || json.msg || json.jaExiste)) || (res.ok && texto.includes('"success"'))) {
          enviouAlgum = true;
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
        break;
      }
    }

    if (enviouAlgum) {
      const todosClientes = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      todosClientes.forEach(cliente => {
        cliente.postMessage({ type: 'SYNC_BACKGROUND_CONCLUIDO' });
      });
    }
  } finally {
    envioSwEmAndamento = false;
  }
}

self.addEventListener('sync', event => {
  if (event.tag === 'sync-fila-eemti') {
    event.waitUntil(processarFilaEmSegundoPlanoSW(true));
  }
});

self.addEventListener('periodicsync', event => {
  if (event.tag === 'periodic-sync-fila-eemti') {
    event.waitUntil(processarFilaEmSegundoPlanoSW(true));
  }
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'DISPARAR_SYNC_AGORA') {
    event.waitUntil(processarFilaEmSegundoPlanoSW(true));
  }
});
