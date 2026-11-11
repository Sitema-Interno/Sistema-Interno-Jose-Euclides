// =========================================================================
// MOTOR CENTRAL: OFFLINE + SINCRONIZAÇÃO + AUTO-UPDATE GITHUB + PDF PADRÃO
// =========================================================================
(function() {
  const FILA_OFFLINE_KEY = 'fila_offline_eemti_v1';
  const CACHE_LEITURA_PREFIX = 'cache_api_eemti_';

  // Ações de gravação que funcionam Offline e sincronizam ao voltar a internet
  const ACOES_GRAVACAO_OFFLINE = {
    'salvarOcorrencia': 'Ocorrência Disciplinar (RAC)',
    'salvarAtividadeDisciplinas': 'Atividade Contínua (Disciplina/Eletiva)',
    'salvarAtividadeEletivas': 'Atividade de Eletiva',
    'salvarFrequenciaSecretaria': 'Frequência da Secretaria (Manhã/Tarde)',
    'salvarFrequencia': 'Frequência de Eletiva'
  };

  // Ações de leitura que ficam salvas em cache para abrir listas de alunos/turmas mesmo sem internet
  const ACOES_LEITURA_CACHEAVEIS = [
    'getFiltrosOcorrencias', 'listarConfig', 'listarPDT', 'getFiltrosFrequencia',
    'getFiltrosIniciais', 'listarDisciplinasCadastradas', 'getAlunosFrequencia',
    'buscarAlunos', 'getAlunosParaEdicao', 'listarFrequenciaSecretaria',
    'listarAtividadesUnificadas', 'buscarOcorrencias'
  ];

  // 1. Registra o Service Worker e atualiza automaticamente quando houver push no GitHub
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then(reg => {
        setInterval(() => reg.update(), 60000); // Checa atualizações no GitHub a cada 1 minuto
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

  // 2. Descreve de forma legível o que foi salvo para exibir quando a internet voltar
  function resumirItemSincronizado(payload) {
    const act = payload.action;
    const d = payload.dados || payload.dadosFrequencia || payload;
    if (act === 'salvarOcorrencia') {
      return `<li><b>Ocorrência RAC:</b> ${d.aluno || '-'} (${d.serie || '-'}) — <i>${d.ocorrencia || '-'}</i></li>`;
    }
    if (act === 'salvarAtividadeDisciplinas' || act === 'salvarAtividadeEletivas') {
      const qtd = Array.isArray(d.registros) ? d.registros.length : 0;
      return `<li><b>Atividade (${d.disciplina || d.eletiva || '-'}):</b> Turma ${d.serie || d.semestre || '-'} (${d.data || '-'}) — <i>${qtd} alunos</i></li>`;
    }
    if (act === 'salvarFrequenciaSecretaria') {
      return `<li><b>Frequência Secretaria:</b> Turma ${d.serie || '-'} • Turno ${d.turno || '-'} (${d.data || '-'})</li>`;
    }
    if (act === 'salvarFrequencia') {
      return `<li><b>Frequência Eletiva:</b> ${d.eletiva || '-'} (${d.data || '-'} • ${d.semestre || '-'})</li>`;
    }
    return `<li><b>${ACOES_GRAVACAO_OFFLINE[act] || act}:</b> Sincronizado com sucesso</li>`;
  }

  // 3. Interceptador Global de Fetch (Cacheia leituras e guarda gravações quando Offline)
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
      const chaveCacheLeitura = CACHE_LEITURA_PREFIX + action + '_' + JSON.stringify(bodyObj).slice(0, 120);

      // Se estiver OFFLINE antes mesmo de tentar enviar:
      if (!navigator.onLine) {
        if (ACOES_GRAVACAO_OFFLINE[action]) {
          enfileirarOperacaoOffline(url, bodyObj);
          return new Response(JSON.stringify({
            success: true,
            offline: true,
            msg: 'Sem internet no momento! O lançamento foi salvo no aparelho (Modo Offline) e será sincronizado automaticamente assim que a conexão voltar.'
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        const cacheSalvo = localStorage.getItem(chaveCacheLeitura);
        if (cacheSalvo) {
          return new Response(cacheSalvo, { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
      }

      // Tenta buscar na internet
      try {
        const response = await _fetchNativo(url, options);
        const clone = response.clone();
        if (ACOES_LEITURA_CACHEAVEIS.includes(action)) {
          clone.text().then(txt => {
            try { localStorage.setItem(chaveCacheLeitura, txt); } catch (e) {}
          });
        }
        return response;
      } catch (errRede) {
        // Se a internet caiu no meio do envio de uma gravação:
        if (ACOES_GRAVACAO_OFFLINE[action]) {
          enfileirarOperacaoOffline(url, bodyObj);
          return new Response(JSON.stringify({
            success: true,
            offline: true,
            msg: 'Conexão instável! O registro foi salvo no Modo Offline do aparelho e será enviado automaticamente quando a internet estabilizar.'
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        // Se for leitura, devolve o cache local
        const cacheFallback = localStorage.getItem(chaveCacheLeitura);
        if (cacheFallback) {
          return new Response(cacheFallback, { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        throw errRede;
      }
    }
    return _fetchNativo(url, options);
  };

  function enfileirarOperacaoOffline(url, payload) {
    const fila = JSON.parse(localStorage.getItem(FILA_OFFLINE_KEY) || '[]');
    fila.push({
      idFila: Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      dataHora: new Date().toLocaleString('pt-BR'),
      url: url,
      payload: payload,
      resumoHtml: resumirItemSincronizado(payload)
    });
    localStorage.setItem(FILA_OFFLINE_KEY, JSON.stringify(fila));
    atualizarBadgeStatusConexao();
  }

  // 4. Sincroniza tudo automaticamente quando a internet retorna e exibe o modal com os dados sincronizados!
  async function sincronizarFilaOffline() {
    if (!navigator.onLine) return;
    const fila = JSON.parse(localStorage.getItem(FILA_OFFLINE_KEY) || '[]');
    if (fila.length === 0) return;

    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Conexão Restaurada!',
        html: `Sincronizando <b>${fila.length}</b> lançamento(s) feitos em Modo Offline...`,
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
        if (res && res.ok) {
          sincronizadosHtml.push(item.resumoHtml);
        } else {
          restantes.push(item);
        }
      } catch (e) {
        restantes.push(item);
      }
    }

    localStorage.setItem(FILA_OFFLINE_KEY, JSON.stringify(restantes));
    atualizarBadgeStatusConexao();

    if (sincronizadosHtml.length > 0 && typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Dados Offline Sincronizados!',
        html: `
          <p class="small text-muted mb-2">A conexão retornou e os seguintes lançamentos foram salvos na planilha:</p>
          <ul class="text-start small bg-light p-3 rounded border" style="max-height: 240px; overflow-y: auto;">
            ${sincronizadosHtml.join('')}
          </ul>
        `,
        icon: 'success',
        confirmButtonColor: '#15438c',
        confirmButtonText: 'Ótimo!'
      });
    }
  }

  function atualizarBadgeStatusConexao() {
    let badge = document.getElementById('badgeStatusOfflineGlobal');
    const fila = JSON.parse(localStorage.getItem(FILA_OFFLINE_KEY) || '[]');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'badgeStatusOfflineGlobal';
      badge.style.cssText = 'position:fixed;bottom:14px;right:14px;z-index:9999;padding:8px 14px;border-radius:30px;font-weight:800;font-size:0.76rem;box-shadow:0 4px 14px rgba(0,0,0,0.18);cursor:pointer;';
      badge.onclick = () => sincronizarFilaOffline();
      document.body.appendChild(badge);
    }

    if (!navigator.onLine) {
      badge.style.display = 'block';
      badge.style.backgroundColor = '#dc2626';
      badge.style.color = '#ffffff';
      badge.innerHTML = `<i class="bi bi-wifi-off me-1"></i>Modo Offline Ativo (${fila.length} na fila)`;
    } else if (fila.length > 0) {
      badge.style.display = 'block';
      badge.style.backgroundColor = '#f59e0b';
      badge.style.color = '#0f172a';
      badge.innerHTML = `<i class="bi bi-cloud-arrow-up-fill me-1"></i>Sincronizar Agora (${fila.length} pendentes)`;
    } else {
      badge.style.display = 'none';
    }
  }

  window.addEventListener('online', () => {
    atualizarBadgeStatusConexao();
    sincronizarFilaOffline();
  });
  window.addEventListener('offline', atualizarBadgeStatusConexao);
  window.addEventListener('DOMContentLoaded', () => {
    atualizarBadgeStatusConexao();
    if (navigator.onLine) setTimeout(sincronizarFilaOffline, 1500);
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

  /**
   * Desenha o Cabeçalho Institucional Padrão com o Brasão da Escola em qualquer PDF (Retrato ou Paisagem)
   * e opcionalmente desenha a Foto 3×4 do Aluno à direita!
   * Retorna a coordenada Y (`startY`) onde a tabela `doc.autoTable` deve começar.
   */
  window.desenharCabecalhoPadraoEEMTI = async function(doc, opcoes = {}) {
    const largPagina = doc.internal.pageSize.getWidth();
    const margemEsq = 14;
    const margemDir = largPagina - 14;
    const temFotoAluno = Boolean(opcoes.exibirMolduraFoto || opcoes.fotoAlunoBase64);

    // 1. Captura o Brasão da Escola (do elemento <img> do cabeçalho ou do arquivo LOGO-removebg-preview.png)
    const imgLogoDom = document.getElementById('logoEscola') || document.querySelector('.brand-escola img');
    const srcLogo = (imgLogoDom && imgLogoDom.src) ? imgLogoDom.src : 'LOGO-removebg-preview.png';
    const logoB64 = await window.converterImagemParaDataUrlPdf(srcLogo, 200, 200);

    if (logoB64) {
      try { doc.addImage(logoB64, 'JPEG', margemEsq, 10, 20, 20); } catch (e) {}
    }

    // 2. Textos Institucionais Padrão
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

    // 3. Se o relatório tiver Foto 3×4 do Aluno (Histórico de Eletivas, Histórico Disciplinar, Relatório de Turmas)
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
      return 48; // startY para tabelas quando tem Foto 3x4 no cabeçalho
    }

    // Linha divisória padrão quando não tem foto individual no cabeçalho
    doc.setDrawColor(21, 67, 140);
    doc.setLineWidth(0.5);
    doc.line(margemEsq, 34, margemDir, 34);
    return 38; // startY padrão
  };
})();