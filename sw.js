const CACHE_NAME = 'sistema-jose-euclides-v9';
const IDB_SYNC_NAME = 'EEMTI_BackgroundSync_DB';

const URLS_TO_CACHE = [
  './',
  './index.html',
  './login.html',
  './manifest.json',
  './portal-core.js',
  './LOGO-removebg-preview.png',
  './brasaoestado.png.png',
  './ocorrencias.html',
  './registro-ocorrencias.html',
  './consulta-ocorrencias-aluno.html',
  './historico.html',
  './historico-ocorrencias.html',
  './relatorio-turma-ocorrencias.html',
  './notas-turma.html',
  './notas-registros.html',
  './graficos-ocorrencias.html',
  './simulados.html',
  './atividades.html',
  './atividade-disciplinas.html',
  './frequencia-secretaria.html',
  './controle-frequencia-ranking.html',
  './frequencia-eletivas.html',
  './historico-eletivas.html',
  './monitoramento-eletivas.html',
  './mapeamento.html',
  './mapeamento-sala.html',
  './atendimento.html',
  './atendimento-alunos.html',
  './notas.html',
  './gestao-notas.html',
  './matricula.html',
  './matricula-eletivas.html',
  './cadastro-alunos.html',
  './situacao-aluno.html',
  './busca-ativa.html',
  './aee.html',
  './cadastro-livros.html',
  './reservas-livros.html',
  './gestao-funcionarios.html',
  './cadastro-disciplinas.html',
  './cadastro-eletivas.html',
  './gestao-bimestre.html',
  './gestao-serie.html',
  './gestao-pdt.html',
  './gestao-pontuacao.html',
  './gestao-ambiente.html',
  './acompanhamento.html',
  './auditoria.html',
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

// Interceptação Network-First (HTML, JS, JSON e Imagens locais sempre buscam a versão mais nova do GitHub!)
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || event.request.url.includes('script.google.com') || event.request.url.includes('googleusercontent.com')) {
    return;
  }

  const urlLower = event.request.url.toLowerCase();
  const isArquivoDinamicoLocal =
    event.request.mode === 'navigate' ||
    urlLower.endsWith('.html') ||
    urlLower.endsWith('.js') ||
    urlLower.endsWith('.json') ||
    urlLower.endsWith('.png') ||
    urlLower.endsWith('.jpg') ||
    urlLower.endsWith('.jpeg');

  const fetchReq = isArquivoDinamicoLocal
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
        return caches.match(event.request, { ignoreSearch: true }).then(cachedResponse => {
          return cachedResponse || (event.request.mode === 'navigate' ? caches.match('./index.html') : null);
        });
      })
  );
});

// =========================================================================
// BACKGROUND SYNC: ENVIA QUANDO O APP ESTIVER FECHADO OU MINIMIZADO
// =========================================================================
let envioSwEmAndamento = false;

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
  if (envioSwEmAndamento) return;

  // Se houver uma janela visível em primeiro plano, deixa o portal-core.js enviar para não duplicar!
  // Se estiver minimizado (hidden) ou fechado (0 clientes), o Service Worker assume e envia!
  const clientes = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const algumVisivelEmPrimeiroPlano = clientes.some(c => c.visibilityState === 'visible');
  if (algumVisivelEmPrimeiroPlano) return;

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
    event.waitUntil(processarFilaEmSegundoPlanoSW());
  }
});

self.addEventListener('periodicsync', event => {
  if (event.tag === 'periodic-sync-fila-eemti') {
    event.waitUntil(processarFilaEmSegundoPlanoSW());
  }
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'DISPARAR_SYNC_AGORA') {
    event.waitUntil(processarFilaEmSegundoPlanoSW());
  }
});
