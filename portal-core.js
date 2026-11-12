// =========================================================================
// MOTOR CENTRAL UNIFICADO (PORTAL-CORE.JS) - VERSÃO 2º PLANO (NON-BLOCKING)
// - SINCRONIZAÇÃO EM SEGUNDO PLANO (SEM TRAVAR A TELA DO PROFESSOR)
// - SUPORTE A BACKGROUND SYNC COM O APP FECHADO (VIA INDEXEDDB + SW.JS)
// - EXIBE O AVISO DOS DADOS SINCRONIZADOS APENAS AO FINALIZAR
// =========================================================================
(function() {
  const FILA_GLOBAL_KEY = 'fila_offline_eemti_v1';
  const LOG_SINCRONIZADOS_KEY = 'log_recem_sincronizados_eemti_v1';
  const IDB_SYNC_NAME = 'EEMTI_BackgroundSync_DB';
  const API_PADRAO_URL = "https://script.google.com/macros/s/AKfycbzERHqBAca1K2wCMcqfVXCrulET5ZyMFOyYkXyBcdPyjPnjS28Roga43Sj90O8s5_Om/exec";

  const FILAS_LEGADAS = [
    'fila_offline_rac_eemti_v1',
    'fila_offline_atividades_eemti_v1',
    'fila_offline_mapeamento_v1'
  ];

  window.KEY_ALUNOS_UNIVERSAL_EEMTI = 'cache_rac_alunos_leve_v3';
  window.KEY_SERIES_UNIVERSAL_EEMTI = 'cache_rac_series_v3';

  const ACOES_GRAVACAO_OFFLINE = {
    'salvarOcorrencia': 'Ocorrência Disciplinar (RAC)',
    'salvarAtividadeDisciplinas': 'Atividade Contínua (Disciplina/Eletiva)',
    'salvarAtividadeEletivas': 'Atividade de Eletiva',
    'salvarFrequenciaSecretaria': 'Frequência da Secretaria (Manhã/Tarde)',
    'salvarFrequencia': 'Frequência de Eletiva',
    'salvarMapeamentoSala': 'Mapeamento de Sala de Aula'
  };

  let sincronizacaoEmAndamento = false;

  // =========================================================================
  // 1. PONTE INDEXEDDB (COMPARTILHADA COM O SERVICE WORKER EM 2º PLANO)
  // =========================================================================
  function abrirBancoSyncIDB() {
    return new Promise(resolve => {
      if (!window.indexedDB) return resolve(null);
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

  async function espelharFilaParaIndexedDB(filaArray) {
    const db = await abrirBancoSyncIDB();
    if (!db) return;
    try {
      const tx = db.transaction('fila_pendente', 'readwrite');
      const store = tx.objectStore('fila_pendente');
      store.clear();
      (filaArray || []).forEach(item => store.put(item));
    } catch (e) {}

    // Registra o gatilho de Background Sync do Sistema Operacional (para sincronizar mesmo com o app fechado!)
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (filaArray && filaArray.length > 0) {
          await reg.sync.register('sync-fila-eemti');
        }
      } catch (e) {}
    }
  }

  // Verifica se o Service Worker sincronizou itens enquanto o aplicativo estava fechado!
  async function verificarSincronizacoesFeitasComAppFechado() {
    const db = await abrirBancoSyncIDB();
    let itensDoBackground = [];

    if (db) {
      await new Promise(resolve => {
        try {
          const tx = db.transaction(['relatorio_concluido', 'fila_pendente'], 'readwrite');
          const storeRel = tx.objectStore('relatorio_concluido');
          const storeFila = tx.objectStore('fila_pendente');

          const reqRel = storeRel.getAll();
          const reqFila = storeFila.getAll();

          tx.oncomplete = () => {
            if (Array.isArray(reqRel.result) && reqRel.result.length > 0) {
              itensDoBackground = reqRel.result.map(r => r.resumoHtml || r);
              // Limpa o relatório do IDB e atualiza a fila do localStorage
              const txClear = db.transaction('relatorio_concluido', 'readwrite');
              txClear.objectStore('relatorio_concluido').clear();

              const filaRestanteNoIDB = Array.isArray(reqFila.result) ? reqFila.result : [];
              localStorage.setItem(FILA_GLOBAL_KEY, JSON.stringify(filaRestanteNoIDB));
            }
            resolve();
          };
          tx.onerror = () => resolve();
        } catch (e) {
          resolve();
        }
      });
    }

    // Também verifica se alguma sincronização em 2º plano terminou milissegundos antes de o professor trocar de página
    const logLocal = JSON.parse(localStorage.getItem(LOG_SINCRONIZADOS_KEY) || '[]');
    if (logLocal.length > 0) {
      itensDoBackground = itensDoBackground.concat(logLocal);
      localStorage.removeItem(LOG_SINCRONIZADOS_KEY);
    }

    if (itensDoBackground.length > 0) {
      window.atualizarBadgeStatusConexaoGlobal();
      exibirAvisoFinalDeDadosSincronizados(itensDoBackground);
    }
  }

  // =========================================================================
  // 2. REGISTRO DO SERVICE WORKER E ESCUTA DE MENSAGENS EM 2º PLANO
  // =========================================================================
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then(reg => {
        setInterval(() => reg.update(), 60000);
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
              window.location.reload();
            }
          });
        });
      }).catch(() => {});

      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'SYNC_BACKGROUND_CONCLUIDO') {
          verificarSincronizacoesFeitasComAppFechado();
        }
      });
    });
  }

  // =========================================================================
  // 3. UNIFICAÇÃO DE FILAS E RESUMO LEGÍVEL DOS DADOS
  // =========================================================================
  function unificarFilasOfflineNoStorage() {
    let filaGlobal = JSON.parse(localStorage.getItem(FILA_GLOBAL_KEY) || '[]');
    let alterou = false;

    FILAS_LEGADAS.forEach(chaveAntiga => {
      const itensAntigos = JSON.parse(localStorage.getItem(chaveAntiga) || '[]');
      if (Array.isArray(itensAntigos) && itensAntigos.length > 0) {
        itensAntigos.forEach(item => {
          let payloadUnificado = item.payload;
          if (!payloadUnificado && item.dados) {
            let acaoInferida = 'salvarOcorrencia';
            if (chaveAntiga.includes('atividades')) acaoInferida = 'salvarAtividadeDisciplinas';
            if (chaveAntiga.includes('mapeamento')) acaoInferida = 'salvarMapeamentoSala';
            payloadUnificado = { action: acaoInferida, dados: item.dados };
          }
          if (payloadUnificado) {
            filaGlobal.push({
              idFila: item.idFila || item.idTemp || item.idLocal || (Date.now() + '_' + Math.random().toString(36).slice(2, 6)),
              dataHora: item.dataHora || new Date().toLocaleString('pt-BR'),
              url: item.url || API_PADRAO_URL,
              payload: payloadUnificado,
              resumoHtml: item.resumoHtml || (`<li>${item.resumo || resumirItemSincronizado(payloadUnificado)}</li>`)
            });
            alterou = true;
          }
        });
        localStorage.removeItem(chaveAntiga);
      }
    });

    if (alterou) {
      localStorage.setItem(FILA_GLOBAL_KEY, JSON.stringify(filaGlobal));
      espelharFilaParaIndexedDB(filaGlobal);
    }
    return filaGlobal;
  }

  function resumirItemSincronizado(payload) {
    const act = payload.action;
    const d = payload.dados || payload.dadosFrequencia || payload;
    if (act === 'salvarOcorrencia') {
      return `<li><b>Ocorrência RAC:</b> ${d.aluno || '-'} (${d.serie || '-'}) — <i>${d.ocorrencia || '-'}</i></li>`;
    }
    if (act === 'salvarAtividadeDisciplinas' || act === 'salvarAtividadeEletivas') {
      return `<li><b>Atividade (${d.disciplina || d.eletiva || '-'}):</b> Turma ${d.serie || d.semestre || '-'} (${d.data || '-'})</li>`;
    }
    if (act === 'salvarFrequenciaSecretaria') {
      return `<li><b>Frequência Secretaria:</b> Turma ${d.serie || '-'} • Turno ${d.turno || '-'} (${d.data || '-'})</li>`;
    }
    if (act === 'salvarFrequencia') {
      return `<li><b>Frequência Eletiva:</b> ${d.eletiva || '-'} (${d.data || '-'} • ${d.semestre || '-'})</li>`;
    }
    if (act === 'salvarMapeamentoSala') {
      return `<li><b>Mapeamento de Sala:</b> Turma ${d.serie || '-'} (PDT: ${d.pdt || '-'})</li>`;
    }
    return `<li><b>${ACOES_GRAVACAO_OFFLINE[act] || act}:</b> Sincronizado com sucesso</li>`;
  }

  function atualizarCacheLeveAlunosUniversal(listaAlunosBruta, listaSeriesBruta) {
    try {
      if (Array.isArray(listaSeriesBruta) && listaSeriesBruta.length > 0) {
        const seriesLimpas = listaSeriesBruta.map(s => String(s || "").replace(/["']/g, "").trim().toUpperCase()).filter(Boolean);
        localStorage.setItem(window.KEY_SERIES_UNIVERSAL_EEMTI, JSON.stringify(seriesLimpas));
      }
      if (Array.isArray(listaAlunosBruta) && listaAlunosBruta.length > 0) {
        const alunosLeves = listaAlunosBruta.map(a => ({
          nome: String(a.nome || "").replace(/\s+/g, " ").trim().toUpperCase(),
          serie: String(a.serie || "").replace(/["']/g, "").trim().toUpperCase(),
          bolsaFamilia: String(a.bolsaFamilia || "NÃO").trim().toUpperCase(),
          peDeMeia: String(a.peDeMeia || "NÃO").trim().toUpperCase(),
          sexo: String(a.sexo || "-").trim().toUpperCase()
        })).filter(x => x.nome && x.serie && x.serie !== "TRANSFERIDO");

        if (alunosLeves.length > 0) {
          localStorage.setItem(window.KEY_ALUNOS_UNIVERSAL_EEMTI, JSON.stringify(alunosLeves));
        }
      }
    } catch (e) {}
  }

  // =========================================================================
  // 4. INTERCEPTADOR DE REQUISIÇÕES E ENFILEIRAMENTO OFFLINE
  // =========================================================================
  const _fetchNativo = window.fetch;
  window.fetch = async function(url, options) {
    if (options && options.method === 'POST' && typeof options.body === 'string' && String(url).includes('script.google.com')) {
      let bodyObj = {};
      try {
        bodyObj = JSON.parse(options.body);
        const uLog = JSON.parse(localStorage.getItem('usuarioLogado') || '{}');
        const nomeAutor = (uLog.nome || uLog.usuario?.nome || uLog.col1 || "").toUpperCase();
        if (nomeAutor && !bodyObj.usuarioLogado) bodyObj.usuarioLogado = nomeAutor;
        options.body = JSON.stringify(bodyObj);
      } catch (e) {}

      const action = bodyObj.action || '';

      if (!navigator.onLine && ACOES_GRAVACAO_OFFLINE[action]) {
        window.enfileirarOperacaoOfflineGlobal(url, bodyObj);
        return new Response(JSON.stringify({
          success: true,
          offline: true,
          msg: 'Salvo no Modo Offline! A sincronização ocorrerá automaticamente em segundo plano assim que houver internet.'
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      try {
        const response = await _fetchNativo(url, options);
        const clone = response.clone();

        if (action === 'getFiltrosOcorrencias' || action === 'listarFrequenciaSecretaria') {
          clone.json().then(data => {
            if (data && data.success) {
              atualizarCacheLeveAlunosUniversal(data.alunos || data.alunosDetalhados, data.series);
            }
          }).catch(() => {});
        }
        return response;
      } catch (errRede) {
        if (ACOES_GRAVACAO_OFFLINE[action]) {
          window.enfileirarOperacaoOfflineGlobal(url, bodyObj);
          return new Response(JSON.stringify({
            success: true,
            offline: true,
            msg: 'Conexão instável! Salvo na fila e será sincronizado em segundo plano sem interromper seu uso.'
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        throw errRede;
      }
    }
    return _fetchNativo(url, options);
  };

  window.enfileirarOperacaoOfflineGlobal = function(url, payload, resumoCustomizado) {
    const fila = unificarFilasOfflineNoStorage();
    fila.push({
      idFila: Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      dataHora: new Date().toLocaleString('pt-BR'),
      url: url || API_PADRAO_URL,
      payload: payload,
      resumoHtml: resumoCustomizado ? `<li>${resumoCustomizado}</li>` : resumirItemSincronizado(payload)
    });
    localStorage.setItem(FILA_GLOBAL_KEY, JSON.stringify(fila));
    espelharFilaParaIndexedDB(fila);
    window.atualizarBadgeStatusConexaoGlobal();
  };

  window.obterFilaOfflineGlobal = function() {
    return unificarFilasOfflineNoStorage();
  };

  // =========================================================================
  // 5. SINCRONIZAÇÃO EM SEGUNDO PLANO (SEM CONGESTIONAR OU TRAVAR A TELA!)
  // =========================================================================
  function exibirAvisoFinalDeDadosSincronizados(listaHtmlSincronizados) {
    if (!listaHtmlSincronizados || listaHtmlSincronizados.length === 0) return;
    if (typeof Swal === 'undefined') return;

    Swal.fire({
      title: 'Dados Offline Sincronizados!',
      html: `
        <p class="small text-muted mb-2">A sincronização em segundo plano foi concluída! Os seguintes registros foram salvos no banco de dados:</p>
        <ul class="text-start small bg-light p-3 rounded border mb-0" style="max-height: 240px; overflow-y: auto;">
          ${listaHtmlSincronizados.join('')}
        </ul>
      `,
      icon: 'success',
      confirmButtonColor: '#15438c',
      confirmButtonText: 'OK, Entendido!'
    });
  }

  window.sincronizarFilaOfflineGlobal = async function() {
    if (sincronizacaoEmAndamento || !navigator.onLine) return;

    const filaInicial = unificarFilasOfflineNoStorage();
    if (filaInicial.length === 0) {
      window.atualizarBadgeStatusConexaoGlobal();
      return;
    }

    sincronizacaoEmAndamento = true;
    const totalParaEnviar = filaInicial.length;
    let enviadosAgora = 0;
    const sincronizadosHtml = [];

    // NÃO abre Swal.fire de loading! O professor continua mexendo normalmente na tela
    // enquanto atualizamos apenas o pequeno badge no canto inferior direito:
    window.atualizarBadgeStatusConexaoGlobal(`Sincronizando em 2º plano (0/${totalParaEnviar})...`);

    for (let i = 0; i < filaInicial.length; i++) {
      if (!navigator.onLine) break;
      const item = filaInicial[i];
      window.atualizarBadgeStatusConexaoGlobal(`Sincronizando em 2º plano (${i + 1}/${totalParaEnviar})...`);

      try {
        const res = await _fetchNativo(item.url || API_PADRAO_URL, {
          method: 'POST',
          body: JSON.stringify(item.payload)
        });
        const json = await res.json();

        if (json && (json.success || json.msg)) {
          sincronizadosHtml.push(item.resumoHtml);
          enviadosAgora++;

          // Remove imediatamente da fila no localStorage o item que acabou de ser sincronizado
          // (para que se o professor mudar de página no meio da sincronização, não envie duplicado!)
          const filaAtual = JSON.parse(localStorage.getItem(FILA_GLOBAL_KEY) || '[]')
            .filter(f => f.idFila !== item.idFila);
          localStorage.setItem(FILA_GLOBAL_KEY, JSON.stringify(filaAtual));
          espelharFilaParaIndexedDB(filaAtual);
        }
      } catch (e) {
        // Se falhou por oscilação de rede, mantém na fila para a próxima tentativa
      }
    }

    sincronizacaoEmAndamento = false;
    window.atualizarBadgeStatusConexaoGlobal();

    if (sincronizadosHtml.length > 0) {
      window.dispatchEvent(new CustomEvent('eemti-fila-sincronizada'));

      // Se a página estiver visível, mostra o aviso imediatamente; se o usuário estiver trocando de aba, guarda no log para mostrar ao abrir
      if (document.visibilityState === 'visible' && typeof Swal !== 'undefined') {
        exibirAvisoFinalDeDadosSincronizados(sincronizadosHtml);
      } else {
        const logAnt = JSON.parse(localStorage.getItem(LOG_SINCRONIZADOS_KEY) || '[]');
        localStorage.setItem(LOG_SINCRONIZADOS_KEY, JSON.stringify(logAnt.concat(sincronizadosHtml)));
      }
    }
  };

  window.atualizarBadgeStatusConexaoGlobal = function(textoProgressoEmSegundoPlano) {
    let badge = document.getElementById('badgeStatusOfflineGlobal');
    const fila = unificarFilasOfflineNoStorage();
    if (!badge && document.body) {
      badge = document.createElement('div');
      badge.id = 'badgeStatusOfflineGlobal';
      badge.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:99999;padding:9px 15px;border-radius:30px;font-weight:800;font-size:0.78rem;box-shadow:0 6px 18px rgba(0,0,0,0.2);cursor:pointer;transition:all 0.2s;pointer-events:auto;';
      badge.onclick = () => window.sincronizarFilaOfflineGlobal();
      document.body.appendChild(badge);
    }
    if (!badge) return;

    if (textoProgressoEmSegundoPlano) {
      badge.style.display = 'block';
      badge.style.backgroundColor = '#15438c';
      badge.style.color = '#ffffff';
      badge.innerHTML = `<span class="spinner-border spinner-border-sm me-2" style="width:0.85rem;height:0.85rem;"></span>${textoProgressoEmSegundoPlano}`;
      return;
    }

    if (!navigator.onLine) {
      badge.style.display = 'block';
      badge.style.backgroundColor = '#dc2626';
      badge.style.color = '#ffffff';
      badge.innerHTML = `<i class="bi bi-wifi-off me-2"></i>Modo Offline (${fila.length} na fila)`;
    } else if (fila.length > 0) {
      badge.style.display = 'block';
      badge.style.backgroundColor = '#f59e0b';
      badge.style.color = '#0f172a';
      badge.innerHTML = `<i class="bi bi-cloud-arrow-up-fill me-2"></i>Na fila (${fila.length}) — Sincronizando em 2º plano...`;
    } else {
      badge.style.display = 'none';
    }
  };

  window.addEventListener('online', () => {
    window.atualizarBadgeStatusConexaoGlobal();
    window.sincronizarFilaOfflineGlobal();
  });
  window.addEventListener('offline', () => {
    window.atualizarBadgeStatusConexaoGlobal();
  });

  window.addEventListener('DOMContentLoaded', async () => {
    unificarFilasOfflineNoStorage();
    window.atualizarBadgeStatusConexaoGlobal();

    // 1º Verifica se o Service Worker já sincronizou itens enquanto o app estava fechado!
    await verificarSincronizacoesFeitasComAppFechado();

    // 2º Se ainda houver itens na fila e tiver internet, sincroniza em 2º plano sem travar a tela!
    if (navigator.onLine) {
      setTimeout(window.sincronizarFilaOfflineGlobal, 400);
    }
  });

  // =========================================================================
  // 6. GERADOR UNIVERSAL DE CABEÇALHO PADRÃO COM BRASÃO E FOTO 3×4 PARA PDF
  // =========================================================================
  window.converterImagemParaDataUrlPdf = function(srcOuBase64, larg = 300, alt = 400) {
    return new Promise(resolve => {
      if (!srcOuBase64) return resolve(null);
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = function() {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || larg;
          canvas.height = img.naturalHeight || alt;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.92));
        } catch (e) {
          resolve(String(srcOuBase64).startsWith('data:image') ? srcOuBase64 : null);
        }
      };
      img.onerror = () => resolve(String(srcOuBase64).startsWith('data:image') ? srcOuBase64 : null);
      img.src = srcOuBase64;
    });
  };

  window.desenharCabecalhoPadraoEEMTI = async function(doc, opcoes = {}) {
    const largPagina = doc.internal.pageSize.getWidth();
    const margemEsq = 14;
    const margemDir = largPagina - 14;
    const temFotoAluno = Boolean(opcoes.exibirMolduraFoto || opcoes.fotoAlunoBase64);

    const imgLogoDom = document.getElementById('logoEscola') || document.querySelector('.brand-escola img');
    const srcLogo = (imgLogoDom && imgLogoDom.src) ? imgLogoDom.src : 'LOGO-removebg-preview.png';
    const logoB64 = await window.converterImagemParaDataUrlPdf(srcLogo, 200, 200);

    if (logoB64) {
      try { doc.addImage(logoB64, 'JPEG', margemEsq, 10, 20, 20); } catch (e) {}
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(21, 67, 140);
    doc.text('EEMTI DR. JOSÉ EUCLIDES FERREIRA GOMES JÚNIOR', margemEsq + 23, 15.5);

    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(String(opcoes.tituloDocumento || 'RELATÓRIO OFICIAL DO SISTEMA ESCOLAR').toUpperCase(), margemEsq + 23, 21);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    const sub1 = opcoes.subtitulo1 || `Emitido em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    doc.text(sub1, margemEsq + 23, 26);

    if (opcoes.subtitulo2) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(String(opcoes.subtitulo2), margemEsq + 23, 31);
    }

    if (temFotoAluno) {
      const xFoto = margemDir - 25;
      const yFoto = 9;
      doc.setDrawColor(21, 67, 140);
      doc.setLineWidth(0.4);
      doc.roundedRect(xFoto, yFoto, 25, 33, 1.5, 1.5, 'S');

      const fotoAlunoLimpa = opcoes.fotoAlunoBase64
        ? await window.converterImagemParaDataUrlPdf(opcoes.fotoAlunoBase64, 300, 400)
        : null;

      if (fotoAlunoLimpa) {
        try {
          doc.addImage(fotoAlunoLimpa, 'JPEG', xFoto + 0.5, yFoto + 0.5, 24, 32);
        } catch (e) {
          doc.setFontSize(6);
          doc.text('FOTO 3x4', xFoto + 12.5, yFoto + 17, { align: 'center' });
        }
      } else {
        doc.setFontSize(6);
        doc.setTextColor(140, 140, 140);
        doc.text('SEM FOTO 3x4', xFoto + 12.5, yFoto + 17, { align: 'center' });
      }

      doc.setDrawColor(21, 67, 140);
      doc.setLineWidth(0.5);
      doc.line(margemEsq, 44, margemDir, 44);
      return 48;
    }

    doc.setDrawColor(21, 67, 140);
    doc.setLineWidth(0.5);
    doc.line(margemEsq, 34, margemDir, 34);
    return 38;
  };
})();
