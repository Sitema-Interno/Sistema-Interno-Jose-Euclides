// =========================================================================
// MOTOR CENTRAL UNIFICADO (PORTAL-CORE.JS):
// - FILA OFFLINE GLOBAL (SINCRONIZA AO ABRIR QUALQUER PÁGINA COM INTERNET)
// - CACHE LEVE UNIVERSAL DE ALUNOS E SÉRIES (PARA FUNCIONAR 100% OFFLINE)
// - CABEÇALHO INSTITUCIONAL PADRÃO COM BRASÃO E FOTO 3×4 PARA PDF
// =========================================================================
(function() {
  const FILA_GLOBAL_KEY = 'fila_offline_eemti_v1';
  const FILAS_LEGADAS = [
    'fila_offline_rac_eemti_v1',
    'fila_offline_atividades_eemti_v1',
    'fila_offline_mapeamento_v1'
  ];

  // Chave universal leve de alunos e séries compartilhada entre Ocorrências, Frequência Secretaria, Atividades e Mapeamento
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

  // 1. Registra o Service Worker e atualiza automaticamente quando houver push no GitHub
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
    });
  }

  // 2. Migra automaticamente qualquer item que estivesse nas filas separadas para a Fila Global Única
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
              url: item.url || "https://script.google.com/macros/s/AKfycbzERHqBAca1K2wCMcqfVXCrulET5ZyMFOyYkXyBcdPyjPnjS28Roga43Sj90O8s5_Om/exec",
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

  // Salva de forma leve os nomes/turmas/dados dos alunos sempre que qualquer página consultar o servidor
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

  // 3. Interceptador Global de Fetch
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

      // Se estiver OFFLINE e for uma ação de gravação (Ocorrências, Atividades, Frequência Secretaria, Frequência Eletiva, Mapeamento):
      if (!navigator.onLine && ACOES_GRAVACAO_OFFLINE[action]) {
        window.enfileirarOperacaoOfflineGlobal(url, bodyObj);
        return new Response(JSON.stringify({
          success: true,
          offline: true,
          msg: 'Sem internet no momento! O registro foi colocado na Fila de Sincronização Offline e será enviado automaticamente assim que você acessar o aplicativo com internet.'
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      try {
        const response = await _fetchNativo(url, options);
        const clone = response.clone();

        // Se a resposta trouxe alunos (de getFiltrosOcorrencias ou listarFrequenciaSecretaria), salva a lista leve universal para uso offline!
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
            msg: 'Conexão instável! O lançamento foi guardado na Fila Offline e será sincronizado automaticamente quando a internet voltar.'
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
      url: url || "https://script.google.com/macros/s/AKfycbzERHqBAca1K2wCMcqfVXCrulET5ZyMFOyYkXyBcdPyjPnjS28Roga43Sj90O8s5_Om/exec",
      payload: payload,
      resumoHtml: resumoCustomizado ? `<li>${resumoCustomizado}</li>` : resumirItemSincronizado(payload)
    });
    localStorage.setItem(FILA_GLOBAL_KEY, JSON.stringify(fila));
    window.atualizarBadgeStatusConexaoGlobal();
  };

  window.obterFilaOfflineGlobal = function() {
    return unificarFilasOfflineNoStorage();
  };

  // 4. Sincroniza automaticamente a fila inteira assim que abrir o aplicativo com internet
  window.sincronizarFilaOfflineGlobal = async function() {
    const fila = unificarFilasOfflineNoStorage();
    window.atualizarBadgeStatusConexaoGlobal();
    if (!navigator.onLine || fila.length === 0) return;

    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Sincronizando Fila Offline...',
        html: `Enviando <b>${fila.length}</b> registro(s) pendente(s) na fila para o banco de dados...`,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });
    }

    const sincronizadosHtml = [];
    const restantes = [];

    for (const item of fila) {
      try {
        const res = await _fetchNativo(item.url, {
          method: 'POST',
          body: JSON.stringify(item.payload)
        });
        const json = await res.json();
        if (json && (json.success || json.msg)) {
          sincronizadosHtml.push(item.resumoHtml);
        } else {
          restantes.push(item);
        }
      } catch (e) {
        restantes.push(item);
      }
    }

    localStorage.setItem(FILA_GLOBAL_KEY, JSON.stringify(restantes));
    window.atualizarBadgeStatusConexaoGlobal();

    if (sincronizadosHtml.length > 0) {
      window.dispatchEvent(new CustomEvent('eemti-fila-sincronizada'));
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Dados Offline Sincronizados!',
          html: `
            <p class="small text-muted mb-2">Os seguintes registros que estavam na fila offline foram salvos na planilha:</p>
            <ul class="text-start small bg-light p-3 rounded border mb-0" style="max-height: 240px; overflow-y: auto;">
              ${sincronizadosHtml.join('')}
            </ul>
          `,
          icon: 'success',
          confirmButtonColor: '#15438c',
          confirmButtonText: 'Concluído!'
        });
      }
    }
  };

  window.atualizarBadgeStatusConexaoGlobal = function() {
    let badge = document.getElementById('badgeStatusOfflineGlobal');
    const fila = unificarFilasOfflineNoStorage();
    if (!badge && document.body) {
      badge = document.createElement('div');
      badge.id = 'badgeStatusOfflineGlobal';
      badge.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:99999;padding:10px 16px;border-radius:30px;font-weight:800;font-size:0.8rem;box-shadow:0 6px 18px rgba(0,0,0,0.22);cursor:pointer;transition:all 0.2s;';
      badge.onclick = () => window.sincronizarFilaOfflineGlobal();
      document.body.appendChild(badge);
    }
    if (!badge) return;

    if (!navigator.onLine) {
      badge.style.display = 'block';
      badge.style.backgroundColor = '#dc2626';
      badge.style.color = '#ffffff';
      badge.innerHTML = `<i class="bi bi-wifi-off me-2"></i>Modo Offline (${fila.length} na fila para sincronizar)`;
    } else if (fila.length > 0) {
      badge.style.display = 'block';
      badge.style.backgroundColor = '#f59e0b';
      badge.style.color = '#0f172a';
      badge.innerHTML = `<span class="spinner-grow spinner-grow-sm me-2"></span>Na fila para sincronizar (${fila.length}) — Clique aqui`;
    } else {
      badge.style.display = 'none';
    }
  };

  window.addEventListener('online', () => {
    window.atualizarBadgeStatusConexaoGlobal();
    window.sincronizarFilaOfflineGlobal();
  });
  window.addEventListener('offline', window.atualizarBadgeStatusConexaoGlobal);
  window.addEventListener('DOMContentLoaded', () => {
    unificarFilasOfflineNoStorage();
    window.atualizarBadgeStatusConexaoGlobal();
    if (navigator.onLine) {
      setTimeout(window.sincronizarFilaOfflineGlobal, 800);
    }
  });

  // =========================================================================
  // 5. GERADOR UNIVERSAL DE CABEÇALHO PADRÃO COM BRASÃO E FOTO 3×4 PARA PDF
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
