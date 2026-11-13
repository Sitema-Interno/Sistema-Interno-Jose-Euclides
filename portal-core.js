// =========================================================================
// MOTOR CENTRAL UNIFICADO (PORTAL-CORE.JS) - LAYOUT PERFEITO + FOTOS OFFLINE
// 1. CORRIGE TEXTO VERTICAL (NUNCA QUEBRA 1 LETRA POR LINHA NAS TABELAS)
// 2. ABREVIA BOTÕES DE CHAMADA (P, F, FJ, A) E SÉRIES NOS HISTÓRICOS (1ª A, 2ª A)
// 3. CORRIGE O BRASÃO DO ESTADO (brasaoestado.png.png) EM TODAS AS PÁGINAS
// 4. SALVA FOTOS 3×4 DOS ALUNOS E CAPAS DE LIVROS EM CACHE PARA USO OFFLINE
// 5. ABERTURA EM 1 MILISSEGUNDO DO CACHE + SINCRONIZAÇÃO COM APP FECHADO
// =========================================================================
(function() {
  const FILA_GLOBAL_KEY = 'fila_offline_eemti_v1';
  const LOG_SINCRONIZADOS_KEY = 'log_recem_sincronizados_eemti_v1';
  const SESSAO_JA_SINCRONIZADA_KEY = 'sessao_inicial_sincronizada_eemti_v1';
  const ULTIMA_ATUALIZACAO_STR_KEY = 'ultima_atualizacao_banco_eemti_str';
  const IDB_SYNC_NAME = 'EEMTI_BackgroundSync_DB';
  const IDB_VERSION = 2; // Versão 2 inclui store de fotos offline
  const API_PADRAO_URL = "https://script.google.com/macros/s/AKfycbzERHqBAca1K2wCMcqfVXCrulET5ZyMFOyYkXyBcdPyjPnjS28Roga43Sj90O8s5_Om/exec";

  const FILAS_LEGADAS = [
    'fila_offline_rac_eemti_v1',
    'fila_offline_atividades_eemti_v1',
    'fila_offline_mapeamento_v1'
  ];

  window.KEY_ALUNOS_UNIVERSAL_EEMTI = 'cache_rac_alunos_leve_v3';
  window.KEY_SERIES_UNIVERSAL_EEMTI = 'cache_rac_series_v3';
  const KEY_MATRICULAS_ELETIVAS_OFFLINE = 'cache_matriculas_eletivas_global_v1';
  const KEY_CATALOGO_ELETIVAS_OFFLINE = 'cache_catalogo_eletivas_global_v1';
  const KEY_TODAS_OCORRENCIAS_OFFLINE = 'cache_rac_todas_ocorrencias_v1';
  const KEY_PONTUACOES_RAC_OFFLINE = 'cache_rac_pontuacoes_v1';
  const KEY_FREQ_ELETIVAS_LANCAMENTOS = 'cache_freq_eletivas_lancamentos_v1';
  const KEY_AMBIENTES_OFFLINE = 'cache_ambientes_escola_v1';

  const ACOES_GRAVACAO_OFFLINE = {
    'salvarOcorrencia': 'Ocorrência Disciplinar (RAC)',
    'excluirOcorrencia': 'Exclusão de Ocorrência (RAC)',
    'salvarAtividadeDisciplinas': 'Atividade Contínua (Disciplina/Eletiva)',
    'salvarAtividadeEletivas': 'Atividade de Eletiva',
    'salvarFrequenciaSecretaria': 'Frequência da Secretaria (Manhã/Tarde)',
    'salvarFrequencia': 'Frequência de Eletiva',
    'excluirFrequencia': 'Exclusão de Frequência de Eletiva',
    'salvarMapeamentoSala': 'Mapeamento de Sala de Aula',
    'salvarAtendimentoAluno': 'Atendimento ao Responsável (PDT)',
    'salvarSuspensaoManual': 'Suspensão Disciplinar Manual',
    'salvarNotas': 'Notas de Eletivas',
    'salvarNotasEletiva': 'Notas de Eletivas',
    'salvarSituacaoAluno': 'Situação do Aluno',
    'salvarAee': 'Registro AEE',
    'salvarBuscaAtiva': 'Ficha de Busca Ativa',
    'salvarEmprestimoLivroBiblioteca': 'Empréstimo de Livro (Biblioteca)',
    'registrarDevolucaoLivroBiblioteca': 'Devolução de Livro (Biblioteca)'
  };

  const ACOES_EXCLUSIVAS_ONLINE_RESERVAS = [
    'listarReservas',
    'salvarReserva',
    'excluirReserva'
  ];

  const ACOES_MUTACAO_CADASTROS = [
    'salvarOcorrencia', 'excluirOcorrencia',
    'salvarAtividadeDisciplinas', 'salvarAtividadeEletivas',
    'salvarFrequenciaSecretaria', 'salvarFrequencia', 'excluirFrequencia',
    'salvarAtendimentoAluno', 'salvarSuspensaoManual',
    'salvarAlunoIndividual', 'salvarAlunosLote', 'atualizarAluno', 'editarAluno',
    'excluirAluno', 'migrarAlunosSelecionados', 'salvarMatricula', 'cadastrarEletiva',
    'atualizarEletiva', 'editarEletiva', 'excluirEletiva', 'salvarDisciplinaCadastro',
    'excluirDisciplinaCadastro', 'salvarConfig', 'excluirConfig', 'salvarPDT', 'excluirPDT',
    'salvarMapeamentoSala', 'salvarDiasLetivosMes', 'salvarNotas', 'salvarNotasEletiva',
    'salvarSituacaoAluno', 'excluirSituacaoAluno', 'salvarAee', 'excluirAee',
    'salvarBuscaAtiva', 'excluirBuscaAtiva', 'salvarLivroBiblioteca', 'salvarLivrosLoteBiblioteca',
    'excluirLivroBiblioteca', 'salvarEmprestimoLivroBiblioteca', 'registrarDevolucaoLivroBiblioteca'
  ];

  const ACOES_LEITURA_CACHE_PURO = [
    'getFiltrosOcorrencias', 'buscarOcorrencias', 'getDadosHistorico',
    'listarFrequenciaSecretaria', 'getFiltrosFrequencia', 'getFiltrosIniciais',
    'getEletivasProfessor', 'getEletivasPorAno', 'getAlunosFrequencia', 'buscarAlunos',
    'getHistoricoEletivasAluno', 'pesquisarAlunoGlobal', 'getRelatorioMatriculas',
    'listarDisciplinasCadastradas', 'listarAtividadesUnificadas',
    'listarPDT', 'listarTodosMapeamentos', 'buscarMapeamentoSala',
    'getAlunosParaPainelSuspensao', 'listarAtendimentosAlunos',
    'getDadosMatricula', 'getAlunosComNotas',
    'listarConfig', 'listarSituacaoAlunos', 'listarAee', 'listarBuscaAtiva',
    'listarLivrosBiblioteca', 'listarDadosEmprestimosBiblioteca',
    'buscarDadosSimulados', 'getMonitoramentoEletivas', 'listarFuncionarios',
    'getProfessores', 'buscarEletivasCadastradas', 'getAlunosParaEdicao',
    'obterFotoAlunoIndividual', 'buscarFrequenciasGerenciamento', 'getRelatorioFaltas'
  ];

  let sincronizacaoEmAndamento = false;
  let prefetchEmAndamento = false;
  let mapaFotosAlunosCacheMemoria = {};

  // =========================================================================
  // 0. RESPONSIVIDADE CORRIGIDA (SEM TEXTO VERTICAL LETRA POR LETRA!)
  // =========================================================================
  function injetarResponsividadeGlobalEEMTI() {
    if (document.getElementById('estiloResponsivoUniversalEEMTI')) return;
    const style = document.createElement('style');
    style.id = 'estiloResponsivoUniversalEEMTI';
    style.innerHTML = `
      html, body {
        max-width: 100vw !important;
        overflow-x: hidden !important;
      }
      .main-container, .container, .container-fluid, .card {
        max-width: 100% !important;
        box-sizing: border-box !important;
      }

      /* Enquadramento de tabelas com rolagem horizontal suave quando necessário,
         PROIBINDO quebrar palavras letra por letra na vertical! */
      .table-responsive, .card > .w-100, .card > div > table.table {
        max-width: 100% !important;
      }
      .card:has(table.table) {
        overflow-x: auto !important;
        -webkit-overflow-scrolling: touch;
      }
      table.table, .tabela-enquadrada {
        width: 100% !important;
        table-layout: auto !important;
        border-collapse: collapse !important;
      }
      table.table th, table.table td, .tabela-enquadrada th, .tabela-enquadrada td {
        word-break: normal !important;
        overflow-wrap: break-word !important;
        hyphens: none !important;
        vertical-align: middle !important;
      }

      /* Impede que colunas de nomes de alunos ou detalhes fiquem espremidas em 1 letra por linha */
      table.table th:nth-child(2), table.table td:nth-child(2),
      table.table th:nth-child(3), table.table td:nth-child(3) {
        min-width: 115px;
      }
      table.table th:first-child, table.table td:first-child {
        min-width: 36px;
      }

      /* Compacta espaço entre botões de ação em todo o sistema */
      .d-flex.gap-2, .d-flex.gap-3, .btn-group {
        gap: 5px !important;
      }
      td .btn + .btn, td .btn + button, th .btn + .btn {
        margin-left: 3px !important;
      }

      /* Selo de atualização discreto no topo (após botão Sair) */
      .badge-sync-header-eemti {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.67rem;
        font-weight: 700;
        color: #0f766e;
        background: #f0fdfa;
        border: 1px solid #99f6e4;
        padding: 4px 9px;
        border-radius: 50px;
        cursor: pointer;
        user-select: none;
        transition: all 0.2s ease;
        white-space: nowrap;
      }
      .badge-sync-header-eemti:hover {
        background: #ccfbf1;
      }
      .badge-sync-header-eemti.sincronizando {
        color: #1d4ed8;
        background: #eff6ff;
        border-color: #bfdbfe;
      }
      .badge-sync-header-eemti.offline {
        color: #b91c1c;
        background: #fef2f2;
        border-color: #fecaca;
      }

      /* Botões compactos P, F, FJ, A na chamada e atividades */
      .btn-chamada-compacto {
        min-width: 34px !important;
        padding: 5px 7px !important;
        font-weight: 800 !important;
        font-size: 0.74rem !important;
        border-radius: 7px !important;
        line-height: 1.1 !important;
      }

      @media (max-width: 768px) {
        .top-header {
          flex-direction: column !important;
          align-items: center !important;
          text-align: center !important;
          padding: 10px 8px 6px 8px !important;
          gap: 8px !important;
        }
        .brand-escola {
          flex-direction: row !important;
          justify-content: center !important;
          text-align: left !important;
          gap: 10px !important;
        }
        .brand-escola img {
          height: 60px !important;
          width: auto !important;
        }
        .brand-titulo-principal {
          font-size: 1.38rem !important;
        }
        .brand-subtitulo {
          font-size: 0.56rem !important;
        }
        .brand-slogan {
          font-size: 1.1rem !important;
        }
        .user-bar {
          flex-wrap: wrap !important;
          justify-content: center !important;
          width: 100% !important;
          padding: 6px 8px !important;
          border-radius: 14px !important;
          gap: 5px !important;
        }
        .main-container {
          padding: 8px 6px 24px 6px !important;
        }
        .card {
          padding: 11px 9px !important;
          border-radius: 12px !important;
          margin-bottom: 12px !important;
        }
        .nav-tabs {
          display: flex !important;
          flex-wrap: wrap !important;
          gap: 4px !important;
        }
        .nav-tabs .nav-item {
          flex: 1 1 auto !important;
        }
        .nav-tabs .nav-link {
          font-size: 0.74rem !important;
          padding: 7px 8px !important;
          text-align: center !important;
        }
        table.table th {
          font-size: 0.66rem !important;
          padding: 6px 4px !important;
          line-height: 1.15 !important;
        }
        table.table td {
          font-size: 0.72rem !important;
          padding: 6px 4px !important;
          line-height: 1.2 !important;
        }
        table.table td .btn {
          font-size: 0.68rem !important;
          padding: 4px 7px !important;
          margin: 1px !important;
        }
        table.table td .badge {
          font-size: 0.63rem !important;
          padding: 3px 5px !important;
        }
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  injetarResponsividadeGlobalEEMTI();

  // =========================================================================
  // 1. COMPACTADOR VISUAL AUTOMÁTICO:
  // - Transforma "Presente (P)", "Falta (F)", "Justificada (FJ)", "Atestado (A)" em "P", "F", "FJ", "A"
  // - Abrevia "1ª SÉRIE A" -> "1ª A", "2ª SÉRIE B" -> "2ª B" APENAS nas tabelas e históricos
  //   (mantendo "2ª SÉRIE A" intacto nos <select> de seleção!)
  // =========================================================================
  window.abreviarSerieParaExibicao = function(textoSerie) {
    if (!textoSerie) return "";
    return String(textoSerie)
      .replace(/\b([123][ªº°])\s*(?:SÉRIE|SERIE|ANO)\s*([A-Z])\b/gi, '$1 $2')
      .replace(/\b([123][ªº°])\s*(?:SÉRIE|SERIE)\b/gi, '$1 SÉRIE');
  };

  function aplicarCompactacaoVisualNasTabelasEBotoes() {
    // A) Compacta botões de Frequência da Secretaria para P, F, FJ, A
    document.querySelectorAll('table button, table .btn, table label.btn').forEach(btn => {
      if (btn.children.length > 0 && !btn.querySelector('i')) return;
      const txt = (btn.textContent || '').trim();
      if (txt === 'Presente (P)' || txt === 'Presente') {
        btn.textContent = 'P';
        btn.title = 'Presente (P)';
        btn.classList.add('btn-chamada-compacto');
      } else if (txt === 'Falta (F)' || txt === 'Falta') {
        btn.textContent = 'F';
        btn.title = 'Falta (F)';
        btn.classList.add('btn-chamada-compacto');
      } else if (txt === 'Justificada (FJ)' || txt === 'Falta Justificada (FJ)' || txt === 'Justificada') {
        btn.textContent = 'FJ';
        btn.title = 'Falta Justificada (FJ)';
        btn.classList.add('btn-chamada-compacto');
      } else if (txt === 'Atestado (A)' || txt === 'Atestado') {
        btn.textContent = 'A';
        btn.title = 'Atestado (A)';
        btn.classList.add('btn-chamada-compacto');
      }
    });

    // B) Abrevia "2ª SÉRIE A" para "2ª A" dentro de células de tabelas (td, badge), sem mexer nos <select>!
    document.querySelectorAll('table td .badge, table td span, table td div, table td').forEach(el => {
      if (el.children.length === 0) {
        const original = el.textContent || '';
        if (/\b[123][ªº°]\s*(?:SÉRIE|SERIE|ANO)\s+[A-Z]\b/i.test(original)) {
          const abreviado = window.abreviarSerieParaExibicao(original);
          if (abreviado !== original) {
            el.textContent = abreviado;
          }
        }
      }
    });

    // C) Garante que o Brasão do Estado ("brasaoestado.png.png") apareça mesmo se alguma imagem caiu no fallback do boneco flaticon
    CorrigirBrasaoEstadoELogoNaTela();
  }

  function CorrigirBrasaoEstadoELogoNaTela() {
    const b64Brasao = localStorage.getItem('cache_brasao_oficial_eemti_b64');
    document.querySelectorAll('.brand-escola img, img#logoEscola, img.watermark-brasao-fundo, img[src*="LOGO-removebg"], img[src*="brasaoestado"], img[src*="2941658.png"]').forEach(img => {
      const srcAtual = String(img.getAttribute('src') || '');
      // Remove o onerror antigo que colocava o boneco de óculos (2941658.png)
      img.onerror = function() {
        if (b64Brasao && this.src !== b64Brasao) {
          this.src = b64Brasao;
        } else if (!this.src.endsWith('brasaoestado.png.png')) {
          this.src = 'brasaoestado.png.png';
        }
      };

      if (srcAtual.includes('2941658.png') || srcAtual.includes('LOGO-removebg-preview.png') || (srcAtual.includes('brasaoestado') && !srcAtual.endsWith('brasaoestado.png.png'))) {
        if (!navigator.onLine && b64Brasao) {
          img.src = b64Brasao;
        } else {
          img.src = 'brasaoestado.png.png';
        }
      }
    });
  }

  // Observa mudanças nas tabelas para aplicar P/F/FJ/A e "2ª A" em milissegundos assim que qualquer lista carregar!
  let timerCompactacao = null;
  const observerTabelas = new MutationObserver(() => {
    if (timerCompactacao) clearTimeout(timerCompactacao);
    timerCompactacao = setTimeout(aplicarCompactacaoVisualNasTabelasEBotoes, 40);
  });

  function iniciarObservadorVisualDOM() {
    if (!document.body) return;
    aplicarCompactacaoVisualNasTabelasEBotoes();
    observerTabelas.observe(document.body, { childList: true, subtree: true });
  }

  function registrarDataHoraAtualizacaoBanco() {
    const agora = new Date();
    const dataBr = agora.toLocaleDateString('pt-BR');
    const horaBr = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const strFinal = `${dataBr} às ${horaBr}`;
    localStorage.setItem(ULTIMA_ATUALIZACAO_STR_KEY, strFinal);
    atualizarSeloTopoSincronizacao();
  }

  function atualizarSeloTopoSincronizacao(estadoEspecial) {
    const userBar = document.querySelector('.user-bar');
    if (!userBar) return;

    let selo = document.getElementById('seloTopoSyncBancoEEMTI');
    if (!selo) {
      selo = document.createElement('span');
      selo.id = 'seloTopoSyncBancoEEMTI';
      selo.className = 'badge-sync-header-eemti';
      selo.title = 'Clique aqui quando quiser buscar dados novos da planilha e atualizar o cache';
      selo.onclick = () => {
        if (navigator.onLine) {
          atualizarSeloTopoSincronizacao('SINCRONIZANDO');
          window.sincronizarFilaOfflineGlobal();
          window.executarPreCarregamentoTotalOffline(true);
        } else {
          atualizarSeloTopoSincronizacao('OFFLINE');
        }
      };
      userBar.appendChild(selo);
    } else if (userBar.lastElementChild !== selo) {
      userBar.appendChild(selo);
    }

    const ultStr = localStorage.getItem(ULTIMA_ATUALIZACAO_STR_KEY) || 'Aguardando...';

    if (!navigator.onLine || estadoEspecial === 'OFFLINE') {
      selo.className = 'badge-sync-header-eemti offline';
      selo.innerHTML = `<i class="bi bi-wifi-off"></i> Offline (${ultStr})`;
    } else if (estadoEspecial === 'SINCRONIZANDO') {
      selo.className = 'badge-sync-header-eemti sincronizando';
      selo.innerHTML = `<span class="spinner-border spinner-border-sm" style="width:0.65rem;height:0.65rem;"></span> Atualizando cache...`;
    } else {
      selo.className = 'badge-sync-header-eemti';
      selo.innerHTML = `<i class="bi bi-arrow-repeat"></i> Atualizado: ${ultStr}`;
    }
  }

  function configurarImagensENavegacaoTopo() {
    const path = window.location.pathname.toLowerCase();
    const estaNaHome = path.endsWith('index.html') || path.endsWith('/') || path === '';
    const estaNoLogin = path.endsWith('login.html');

    CorrigirBrasaoEstadoELogoNaTela();

    // Faz cache em Base64 do brasaoestado.png.png para funcionar 100% offline e nos PDFs
    if (navigator.onLine) {
      window.converterImagemParaDataUrlPdf('brasaoestado.png.png', 300, 300).then(b64 => {
        if (b64) {
          try {
            localStorage.setItem('cache_brasao_oficial_eemti_b64', b64);
            localStorage.setItem('cache_logo_oficial_eemti_b64', b64);
          } catch (e) {}
          CorrigirBrasaoEstadoELogoNaTela();
        }
      });
    }

    if (estaNoLogin) return;

    if (estaNaHome) {
      sessionStorage.removeItem('ultimo_topico_colmeia_selecionado_eemti');
      if (typeof window.fecharPainelTopico === 'function') {
        window.fecharPainelTopico();
      }
    }

    const userBar = document.querySelector('.user-bar');
    if (userBar && !estaNaHome && !document.getElementById('btnVoltarPaginaAnteriorEEMTI')) {
      const btnVoltar = document.createElement('button');
      btnVoltar.type = 'button';
      btnVoltar.id = 'btnVoltarPaginaAnteriorEEMTI';
      btnVoltar.className = 'btn btn-outline-primary btn-sm rounded-pill px-3 fw-bold';
      btnVoltar.innerHTML = `<i class="bi bi-arrow-left-circle-fill me-1"></i>Voltar`;
      btnVoltar.title = 'Voltar para a página inicial limpa';
      btnVoltar.onclick = function() {
        sessionStorage.removeItem('ultimo_topico_colmeia_selecionado_eemti');
        window.location.href = 'index.html';
      };

      const btnRef = userBar.querySelector('a[href*="index.html"], button.btn-outline-danger');
      if (btnRef) {
        userBar.insertBefore(btnVoltar, btnRef);
      } else {
        userBar.appendChild(btnVoltar);
      }
    }

    if (userBar) {
      const btnSair = userBar.querySelector('button.btn-outline-danger');
      if (btnSair && !btnSair._eemtiCleanBound) {
        btnSair._eemtiCleanBound = true;
        btnSair.addEventListener('click', () => {
          sessionStorage.removeItem(SESSAO_JA_SINCRONIZADA_KEY);
          sessionStorage.removeItem('ultimo_topico_colmeia_selecionado_eemti');
        });
      }
    }

    atualizarSeloTopoSincronizacao();
  }

  function obterNomeUsuarioLogadoCore() {
    try {
      const uLog = JSON.parse(localStorage.getItem('usuarioLogado') || '{}');
      return String(uLog.nome || uLog.usuario?.nome || uLog.col1 || "").trim().toUpperCase();
    } catch (e) {
      return "";
    }
  }

  function normalizarSeriePadraoCore(s) {
    let str = String(s || "").replace(/["'“”‘’]/g, "").replace(/\s+/g, " ").trim().toUpperCase();
    const m = str.match(/^([123])[ºª°oA]?\s*(?:ANO|SÉRIE|SERIE)?\s*([A-Z0-9].*)$/i);
    return m ? `${m[1]}ª SÉRIE ${m[2].trim()}` : str;
  }

  function extrairCodigoEletivaCore(nome) {
    const str = String(nome || "").trim().toUpperCase();
    const m = str.match(/^([A-Z]{2,4}\d{2,4})\s*[-|]/);
    return m ? m[1] : str;
  }

  function converterDataParaTimestampLocal(valor) {
    if (!valor) return 0;
    const str = String(valor).trim();
    const mBr = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (mBr) {
      return new Date(parseInt(mBr[3], 10), parseInt(mBr[2], 10) - 1, parseInt(mBr[1], 10), 12, 0, 0).getTime();
    }
    const mIso = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (mIso) {
      return new Date(parseInt(mIso[1], 10), parseInt(mIso[2], 10) - 1, parseInt(mIso[3], 10), 12, 0, 0).getTime();
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }

  function liberarEspacoStorageAntigo() {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('cache_api_eemti_') || k.startsWith('cache_acervo_bib_') || k.startsWith('cache_req_v2_')) {
        localStorage.removeItem(k);
      }
    });
  }

  function salvarNoLocalStorageSeguro(chave, valorObj) {
    try {
      localStorage.setItem(chave, JSON.stringify(valorObj));
    } catch (e) {
      liberarEspacoStorageAntigo();
      try { localStorage.setItem(chave, JSON.stringify(valorObj)); } catch (e2) {}
    }
  }

  // =========================================================================
  // 2. BANCO INDEXEDDB: FILA DE SYNC + CACHE DE FOTOS 3×4 E CAPAS OFFLINE!
  // =========================================================================
  function abrirBancoSyncIDB() {
    return new Promise(resolve => {
      if (!window.indexedDB) return resolve(null);
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

  async function salvarFotoNoIndexedDB(chaveAlunoOuLivro, dadosFotoObj) {
    if (!chaveAlunoOuLivro || !dadosFotoObj) return;
    mapaFotosAlunosCacheMemoria[chaveAlunoOuLivro] = dadosFotoObj;
    const db = await abrirBancoSyncIDB();
    if (!db || !db.objectStoreNames.contains('fotos_offline')) return;
    try {
      const tx = db.transaction('fotos_offline', 'readwrite');
      tx.objectStore('fotos_offline').put({ chave: chaveAlunoOuLivro, dados: dadosFotoObj });
    } catch (e) {}
  }

  async function carregarTodasFotosDoIndexedDBParaMemoria() {
    const db = await abrirBancoSyncIDB();
    if (!db || !db.objectStoreNames.contains('fotos_offline')) return;
    return new Promise(resolve => {
      try {
        const tx = db.transaction('fotos_offline', 'readonly');
        const req = tx.objectStore('fotos_offline').getAll();
        req.onsuccess = () => {
          (req.result || []).forEach(item => {
            if (item && item.chave) mapaFotosAlunosCacheMemoria[item.chave] = item.dados;
          });
          resolve();
        };
        req.onerror = () => resolve();
      } catch (e) {
        resolve();
      }
    });
  }

  function gerarChaveCacheRequisicao(action, bodyObj) {
    const copia = Object.assign({}, bodyObj || {});
    delete copia.usuarioLogado;
    return `cache_req_v3_${action}_${JSON.stringify(copia).slice(0, 180)}`;
  }

  function salvarRespostaNoCacheInstantaneo(action, bodyObj, textoJson) {
    if (!ACOES_LEITURA_CACHE_PURO.includes(action)) return;
    if (!textoJson) return;

    // Se a resposta contiver fotos 3x4 de alunos (getAlunosParaEdicao, obterFotoAlunoIndividual, getFiltrosOcorrencias)
    // ou capas de livros, salva cada foto no IndexedDB para aparecer 100% offline sem estourar o localStorage!
    try {
      const parsed = JSON.parse(textoJson);
      if (action === 'obterFotoAlunoIndividual' && parsed && parsed.success && bodyObj.aluno) {
        salvarFotoNoIndexedDB('ALUNO_' + String(bodyObj.aluno).trim().toUpperCase(), parsed);
      } else if (action === 'getAlunosParaEdicao' && Array.isArray(parsed)) {
        const serieChave = normalizarSeriePadraoCore((bodyObj.dados && bodyObj.dados.serie) || bodyObj.serie || '');
        if (serieChave) salvarFotoNoIndexedDB('TURMA_EDICAO_' + serieChave, parsed);
        parsed.forEach(al => {
          if (al && al.nome && al.foto) {
            salvarFotoNoIndexedDB('ALUNO_' + String(al.nome).trim().toUpperCase(), {
              success: true,
              nome: al.nome,
              serie: al.serie,
              foto: al.foto,
              mae: al.mae || '',
              pai: al.pai || ''
            });
          }
        });
      } else if ((action === 'obterCapaLivroDrive' || action === 'obterAnexoBuscaAtivaDrive') && parsed && parsed.success && bodyObj.caminho) {
        salvarFotoNoIndexedDB('ARQ_' + String(bodyObj.caminho).trim(), parsed);
      }
    } catch (e) {}

    if (textoJson.length > 420000) return;
    try {
      const ch = gerarChaveCacheRequisicao(action, bodyObj);
      localStorage.setItem(ch, textoJson);
    } catch (e) {
      liberarEspacoStorageAntigo();
    }
  }

  function obterRespostaDoCacheInstantaneo(action, bodyObj) {
    // 1. Verifica se é consulta de Foto 3x4 ou Turma com Fotos já salva no IndexedDB em memória
    if (action === 'obterFotoAlunoIndividual' && bodyObj.aluno) {
      const chAl = 'ALUNO_' + String(bodyObj.aluno).trim().toUpperCase();
      if (mapaFotosAlunosCacheMemoria[chAl]) {
        return JSON.stringify(mapaFotosAlunosCacheMemoria[chAl]);
      }
    }
    if (action === 'getAlunosParaEdicao') {
      const serieChave = normalizarSeriePadraoCore((bodyObj.dados && bodyObj.dados.serie) || bodyObj.serie || '');
      if (serieChave && mapaFotosAlunosCacheMemoria['TURMA_EDICAO_' + serieChave]) {
        return JSON.stringify(mapaFotosAlunosCacheMemoria['TURMA_EDICAO_' + serieChave]);
      }
    }
    if ((action === 'obterCapaLivroDrive' || action === 'obterAnexoBuscaAtivaDrive') && bodyObj.caminho) {
      const chArq = 'ARQ_' + String(bodyObj.caminho).trim();
      if (mapaFotosAlunosCacheMemoria[chArq]) {
        return JSON.stringify(mapaFotosAlunosCacheMemoria[chArq]);
      }
    }

    if (!ACOES_LEITURA_CACHE_PURO.includes(action)) return null;

    const respostaCalculadaLocalmente = construirRespostaOfflineInteligente(action, bodyObj);
    if (respostaCalculadaLocalmente) return respostaCalculadaLocalmente;

    try {
      const ch = gerarChaveCacheRequisicao(action, bodyObj);
      const direto = localStorage.getItem(ch);
      if (direto) return direto;
    } catch (e) {}

    return null;
  }

  async function fetchComTimeoutSeguranca(url, opcoes, timeoutMs = 18000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const opcoesFinais = Object.assign({}, opcoes, {
        signal: controller.signal,
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow'
      });
      return await _fetchNativo(url, opcoesFinais);
    } finally {
      clearTimeout(timer);
    }
  }

  // =========================================================================
  // 3. SINCRONIZAÇÃO GERAL (1 VEZ AO ABRIR O SISTEMA OU CLICANDO EM ATUALIZAR)
  // =========================================================================
  window.executarPreCarregamentoTotalOffline = async function(forcarManual = false) {
    if (!navigator.onLine || prefetchEmAndamento) return;

    const uLog = JSON.parse(localStorage.getItem('usuarioLogado') || 'null');
    if (!uLog) return;
    const nomeProfLogado = obterNomeUsuarioLogadoCore();

    const jaSincronizouNestaSessao = sessionStorage.getItem(SESSAO_JA_SINCRONIZADA_KEY) === 'SIM';
    const jaTemAlunosNoCache = Boolean(localStorage.getItem(window.KEY_ALUNOS_UNIVERSAL_EEMTI));

    if (!forcarManual && jaSincronizouNestaSessao && jaTemAlunosNoCache) {
      atualizarSeloTopoSincronizacao();
      return;
    }

    prefetchEmAndamento = true;
    atualizarSeloTopoSincronizacao('SINCRONIZANDO');

    try {
      const [
        resFreqSec,
        resFiltrosRac,
        resDisc,
        resMatElet,
        resBim,
        resPontosRac,
        resOcoRac,
        resPdt,
        resMapas
      ] = await Promise.all([
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'listarFrequenciaSecretaria' }) }).then(r => r.json()).catch(() => null),
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'getFiltrosOcorrencias' }) }).then(r => r.json()).catch(() => null),
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'listarDisciplinasCadastradas' }) }).then(r => r.json()).catch(() => null),
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'getDadosMatricula' }) }).then(r => r.json()).catch(() => null),
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'listarConfig', tipo: 'BIMESTRE' }) }).then(r => r.json()).catch(() => null),
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'listarConfig', tipo: 'PONTUACAO' }) }).then(r => r.json()).catch(() => null),
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'buscarOcorrencias', filtros: { ignorarRestricao: true } }) }).then(r => r.json()).catch(() => null),
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'listarPDT' }) }).then(r => r.json()).catch(() => null),
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'listarTodosMapeamentos' }) }).then(r => r.json()).catch(() => null)
      ]);

      if (resFreqSec && resFreqSec.success) {
        salvarRespostaNoCacheInstantaneo('listarFrequenciaSecretaria', { action: 'listarFrequenciaSecretaria' }, JSON.stringify(resFreqSec));
        if (Array.isArray(resFreqSec.series) && resFreqSec.series.length > 0) {
          const seriesNorm = resFreqSec.series.map(s => normalizarSeriePadraoCore(s)).filter(Boolean);
          salvarNoLocalStorageSeguro(window.KEY_SERIES_UNIVERSAL_EEMTI, seriesNorm);
          salvarNoLocalStorageSeguro('cache_ativ_rapido_v3_ser', seriesNorm);
          salvarNoLocalStorageSeguro('cache_ativ_rapido_v2_ser', seriesNorm);
          salvarNoLocalStorageSeguro('cache_mapa_series_v4', seriesNorm);
        }
        if (Array.isArray(resFreqSec.alunosDetalhados) && resFreqSec.alunosDetalhados.length > 0) {
          const alunosNorm = resFreqSec.alunosDetalhados.map(a => ({
            ano: a.ano || "2026",
            nome: String(a.nome || "").replace(/\s+/g, " ").trim().toUpperCase(),
            serie: normalizarSeriePadraoCore(a.serie),
            bolsaFamilia: String(a.bolsaFamilia || "NÃO").trim().toUpperCase(),
            peDeMeia: String(a.peDeMeia || "NÃO").trim().toUpperCase(),
            sexo: String(a.sexo || "-").trim().toUpperCase()
          })).filter(x => x.nome && x.serie && x.serie !== "TRANSFERIDO");

          salvarNoLocalStorageSeguro(window.KEY_ALUNOS_UNIVERSAL_EEMTI, alunosNorm);
          salvarNoLocalStorageSeguro('cache_freq_sec_alunos_det_v4', alunosNorm);
          salvarNoLocalStorageSeguro('cache_ativ_rapido_v3_alunos', alunosNorm);
          salvarNoLocalStorageSeguro('cache_ativ_rapido_v2_alunos', alunosNorm);
        }
        if (resFreqSec.diasLetivosMes) {
          salvarNoLocalStorageSeguro('cache_freq_sec_dias_letivos_v4', resFreqSec.diasLetivosMes);
        }
        if (Array.isArray(resFreqSec.frequencias)) {
          salvarNoLocalStorageSeguro('cache_freq_sec_lancamentos_v4', resFreqSec.frequencias.slice(-2000));
        }
      }

      // Salva também todas as fotos 3x4 que já vieram em Base64 dentro de getFiltrosOcorrencias!
      if (resFiltrosRac && resFiltrosRac.success) {
        if (Array.isArray(resFiltrosRac.ocorrencias) && resFiltrosRac.ocorrencias.length > 0) {
          const catRac = resFiltrosRac.ocorrencias.map(o => ({
            descricao: String(o.descricao || "").trim(),
            gravidade: String(o.gravidade || "GRAU I (INFRAÇÕES LEVES)").trim().toUpperCase()
          })).filter(o => o.descricao);
          salvarNoLocalStorageSeguro('cache_rac_catalogo_v3', catRac);
        }
        if (Array.isArray(resFiltrosRac.alunos)) {
          resFiltrosRac.alunos.forEach(al => {
            if (al && al.nome && al.foto && String(al.foto).startsWith('data:image')) {
              salvarFotoNoIndexedDB('ALUNO_' + String(al.nome).trim().toUpperCase(), {
                success: true,
                nome: al.nome,
                serie: normalizarSeriePadraoCore(al.serie),
                foto: al.foto
              });
            }
          });
        }
      }

      if (resPontosRac && Array.isArray(resPontosRac.lista)) {
        const mapPts = {};
        resPontosRac.lista.forEach(p => {
          if (p.col1) mapPts[String(p.col1).trim().toUpperCase()] = parseFloat(String(p.col2 || 0).replace(',', '.')) || 0;
        });
        salvarNoLocalStorageSeguro(KEY_PONTUACOES_RAC_OFFLINE, mapPts);
      }

      if (Array.isArray(resOcoRac)) {
        salvarNoLocalStorageSeguro(KEY_TODAS_OCORRENCIAS_OFFLINE, resOcoRac.slice(0, 1500));
        if (nomeProfLogado) {
          const minhasOco = resOcoRac.filter(r => {
            const p = String(r.professor || "").trim().toUpperCase();
            return p === nomeProfLogado || p.includes(nomeProfLogado) || nomeProfLogado.includes(p);
          });
          salvarNoLocalStorageSeguro('cache_rac_minhas_oco_' + nomeProfLogado.replace(/\s+/g, '_'), minhasOco.slice(0, 300));
        }
      }

      if (resDisc && resDisc.success && Array.isArray(resDisc.disciplinas) && resDisc.disciplinas.length > 0) {
        salvarNoLocalStorageSeguro('cache_ativ_rapido_v3_disc', resDisc.disciplinas);
        salvarNoLocalStorageSeguro('cache_ativ_rapido_v2_disc', resDisc.disciplinas);
        if (Array.isArray(resDisc.listaDetalhada)) {
          salvarNoLocalStorageSeguro('cache_aba_exclusiva_disciplinas_v2', resDisc.listaDetalhada);
        }
      }

      if (resBim && Array.isArray(resBim.lista)) {
        const bimFormatados = resBim.lista.map(b => ({
          nome: String(b.col1 || "").trim(),
          inicioIso: String(b.col2 || "").includes('-') ? String(b.col2).trim() : "",
          fimIso: String(b.col3 || "").includes('-') ? String(b.col3).trim() : ""
        })).filter(b => b.nome);
        salvarNoLocalStorageSeguro('cache_ativ_rapido_v3_bim', bimFormatados);
        salvarNoLocalStorageSeguro('cache_ativ_rapido_v2_bim', bimFormatados);
      }

      if (resMatElet && resMatElet.success) {
        salvarRespostaNoCacheInstantaneo('getDadosMatricula', { action: 'getDadosMatricula' }, JSON.stringify(resMatElet));
        const catalogoNorm = (resMatElet.catalogo || []).map(c => ({
          id: c.id || "",
          semestre: String(c.ano || c.semestre || "").trim(),
          ano: String(c.ano || c.semestre || "").trim(),
          dia: String(c.dia || "").trim().toUpperCase(),
          turma: normalizarSeriePadraoCore(c.turma || ""),
          serieBase: String(c.serieBase || "").trim().toUpperCase(),
          tempoEletivo: String(c.tempoEletivo || "TEMPO ELETIVO 1").trim().toUpperCase(),
          eletiva: String(c.nome || c.eletiva || "").trim(),
          nome: String(c.nome || c.eletiva || "").trim(),
          professor: String(c.professor || "").trim().toUpperCase(),
          vagasTotal: c.vagasTotal || 45
        }));

        const anosSet = new Set();
        const diasSet = new Set();
        const temposSet = new Set();
        const profsSet = new Set();
        catalogoNorm.forEach(c => {
          if (c.ano) anosSet.add(c.ano);
          if (c.dia) diasSet.add(c.dia);
          if (c.tempoEletivo) temposSet.add(c.tempoEletivo);
          if (c.professor) profsSet.add(c.professor);
        });

        const pacoteFiltrosFrequenciaEletiva = {
          success: true,
          anos: Array.from(anosSet).sort().reverse(),
          dias: Array.from(diasSet).sort(),
          tempos: Array.from(temposSet).sort(),
          professores: Array.from(profsSet).sort(),
          catalogo: catalogoNorm
        };

        salvarNoLocalStorageSeguro(KEY_CATALOGO_ELETIVAS_OFFLINE, pacoteFiltrosFrequenciaEletiva);
        salvarNoLocalStorageSeguro('cache_ativ_rapido_v3_elet', catalogoNorm);
        salvarNoLocalStorageSeguro('cache_ativ_rapido_v2_elet', catalogoNorm);

        if (Array.isArray(resMatElet.historico)) {
          const matriculasLeves = resMatElet.historico.map(m => ({
            linha: m.linha || 0,
            ano: String(m.ano || "").trim(),
            dia: String(m.dia || "").trim().toUpperCase(),
            eletiva: String(m.eletiva || "").trim().toUpperCase(),
            codigo: extrairCodigoEletivaCore(m.eletiva),
            aluno: String(m.aluno || "").replace(/\s+/g, " ").trim().toUpperCase(),
            serie: normalizarSeriePadraoCore(m.serie || m.serieBase || ""),
            serieBase: String(m.serieBase || "").trim().toUpperCase(),
            tempoEletivo: String(m.tempoEletivo || "").trim().toUpperCase(),
            nota: m.nota || ""
          })).filter(m => m.aluno && m.eletiva);

          salvarNoLocalStorageSeguro(KEY_MATRICULAS_ELETIVAS_OFFLINE, matriculasLeves);

          const mapaPorEletivaAtiv = {};
          matriculasLeves.forEach(m => {
            const ch = `${m.ano}|${m.eletiva}`;
            if (!mapaPorEletivaAtiv[ch]) mapaPorEletivaAtiv[ch] = [];
            if (!mapaPorEletivaAtiv[ch].some(x => x.nome === m.aluno)) {
              mapaPorEletivaAtiv[ch].push({ nome: m.aluno, serie: m.serie });
            }
          });
          salvarNoLocalStorageSeguro('cache_ativ_rapido_v3_al_elet', mapaPorEletivaAtiv);
          salvarNoLocalStorageSeguro('cache_ativ_rapido_v2_al_elet', mapaPorEletivaAtiv);
        }
      }

      if (resPdt && Array.isArray(resPdt.lista)) {
        const novoMapaPdt = {};
        resPdt.lista.forEach(item => {
          const s = normalizarSeriePadraoCore(item.serie);
          const p = String(item.professor || "").trim().toUpperCase();
          if (s && p) novoMapaPdt[s] = p;
        });
        salvarNoLocalStorageSeguro('cache_mapa_pdt_v4', novoMapaPdt);
      }

      if (resMapas && Array.isArray(resMapas.lista)) {
        const mapaConsolidado = {};
        resMapas.lista.forEach(item => {
          const sNorm = normalizarSeriePadraoCore(item.serie);
          if (sNorm) {
            mapaConsolidado[sNorm] = {
              serie: sNorm,
              pdt: item.pdt || "NÃO ATRIBUÍDO",
              colunas: Number(item.colunas) || 6,
              linhas: Number(item.linhas) || 7,
              posicoes: item.posicoes || {},
              ultimaAtualizacao: item.ultimaAtualizacao || "-"
            };
          }
        });
        salvarNoLocalStorageSeguro('cache_todos_mapas_salvos_v4', mapaConsolidado);
      }

      Promise.all([
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'getAlunosParaPainelSuspensao' }) }).then(r => r.text()).then(t => salvarRespostaNoCacheInstantaneo('getAlunosParaPainelSuspensao', { action: 'getAlunosParaPainelSuspensao' }, t)).catch(() => {}),
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'listarAtendimentosAlunos' }) }).then(r => r.text()).then(t => salvarRespostaNoCacheInstantaneo('listarAtendimentosAlunos', { action: 'listarAtendimentosAlunos' }, t)).catch(() => {}),
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'listarAtividadesUnificadas' }) }).then(r => r.text()).then(t => salvarRespostaNoCacheInstantaneo('listarAtividadesUnificadas', { action: 'listarAtividadesUnificadas' }, t)).catch(() => {}),
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'buscarFrequenciasGerenciamento', mes: '', semestre: '', eletiva: '', professor: '' }) }).then(r => r.json()).then(arr => { if (Array.isArray(arr)) salvarNoLocalStorageSeguro(KEY_FREQ_ELETIVAS_LANCAMENTOS, arr.slice(0, 1500)); }).catch(() => {}),
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'listarSituacaoAlunos' }) }).then(r => r.text()).then(t => salvarRespostaNoCacheInstantaneo('listarSituacaoAlunos', { action: 'listarSituacaoAlunos' }, t)).catch(() => {}),
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'listarAee' }) }).then(r => r.text()).then(t => salvarRespostaNoCacheInstantaneo('listarAee', { action: 'listarAee' }, t)).catch(() => {}),
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'listarBuscaAtiva' }) }).then(r => r.text()).then(t => salvarRespostaNoCacheInstantaneo('listarBuscaAtiva', { action: 'listarBuscaAtiva' }, t)).catch(() => {}),
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'listarLivrosBiblioteca' }) }).then(r => r.text()).then(t => salvarRespostaNoCacheInstantaneo('listarLivrosBiblioteca', { action: 'listarLivrosBiblioteca' }, t)).catch(() => {}),
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'listarDadosEmprestimosBiblioteca' }) }).then(r => r.text()).then(t => salvarRespostaNoCacheInstantaneo('listarDadosEmprestimosBiblioteca', { action: 'listarDadosEmprestimosBiblioteca' }, t)).catch(() => {})
      ]).catch(() => {});

      sessionStorage.setItem(SESSAO_JA_SINCRONIZADA_KEY, 'SIM');
      registrarDataHoraAtualizacaoBanco();
    } catch (errPrefetch) {
      atualizarSeloTopoSincronizacao();
    } finally {
      prefetchEmAndamento = false;
    }
  };

  function construirRespostaOfflineInteligente(action, bodyObj) {
    if (action === 'getDadosHistorico') {
      const nomeBusca = String(bodyObj.nome || "").replace(/\s+/g, " ").trim().toUpperCase();
      const alunos = JSON.parse(localStorage.getItem(window.KEY_ALUNOS_UNIVERSAL_EEMTI) || '[]');
      const todasOco = JSON.parse(localStorage.getItem(KEY_TODAS_OCORRENCIAS_OFFLINE) || '[]');
      const bims = JSON.parse(localStorage.getItem('cache_ativ_rapido_v3_bim') || '[]');
      const mapPontos = JSON.parse(localStorage.getItem(KEY_PONTUACOES_RAC_OFFLINE) || '{}');

      if (alunos.length === 0 && todasOco.length === 0) return null;

      const alEncontrado = alunos.find(a => a.nome === nomeBusca) || { nome: nomeBusca, serie: "-" };
      const fotoSalvaObj = mapaFotosAlunosCacheMemoria['ALUNO_' + nomeBusca];
      const fotoFinal = (fotoSalvaObj && fotoSalvaObj.foto) ? fotoSalvaObj.foto : (alEncontrado.foto || "");

      const listaBimestres = bims.map(b => {
        const tsI = converterDataParaTimestampLocal(b.inicioIso);
        const tsF = converterDataParaTimestampLocal(b.fimIso);
        return {
          nome: b.nome,
          inicio: tsI > 0 ? new Date(tsI).setHours(0, 0, 0, 0) : 0,
          fim: tsF > 0 ? new Date(tsF).setHours(23, 59, 59, 999) : 0,
          inicioIso: b.inicioIso,
          fimIso: b.fimIso
        };
      });

      const ocorrenciasAluno = todasOco
        .filter(o => String(o.aluno || "").replace(/\s+/g, " ").trim().toUpperCase() === nomeBusca)
        .map(o => {
          const ts = converterDataParaTimestampLocal(o.data);
          let bimNome = "Fora do Bimestre";
          for (let i = 0; i < listaBimestres.length; i++) {
            if (ts > 0 && listaBimestres[i].inicio > 0 && listaBimestres[i].fim > 0) {
              if (ts >= listaBimestres[i].inicio && ts <= listaBimestres[i].fim) {
                bimNome = listaBimestres[i].nome;
                break;
              }
            }
          }
          return {
            id: o.id || "",
            serie: window.abreviarSerieParaExibicao(normalizarSeriePadraoCore(o.serie || alEncontrado.serie)),
            data: o.data || "",
            timestamp: ts,
            bimestre: bimNome,
            professor: o.professor || "",
            ocorrencia: o.ocorrencia || "",
            observacoes: o.obs || o.observacoes || "",
            gravidade: o.gravidade || ""
          };
        })
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      return JSON.stringify({
        success: true,
        aluno: { nome: alEncontrado.nome, serie: window.abreviarSerieParaExibicao(alEncontrado.serie), foto: fotoFinal },
        ocorrencias: ocorrenciasAluno,
        bimestres: listaBimestres,
        pontuacoes: mapPontos
      });
    }

    if (action === 'getHistoricoEletivasAluno') {
      const termoBusca = String(bodyObj.aluno || "").replace(/\s+/g, " ").trim().toUpperCase();
      const alunos = JSON.parse(localStorage.getItem(window.KEY_ALUNOS_UNIVERSAL_EEMTI) || '[]');
      const matSalvas = JSON.parse(localStorage.getItem(KEY_MATRICULAS_ELETIVAS_OFFLINE) || '[]');
      const catSalvo = JSON.parse(localStorage.getItem(KEY_CATALOGO_ELETIVAS_OFFLINE) || 'null');
      const freqsElet = JSON.parse(localStorage.getItem(KEY_FREQ_ELETIVAS_LANCAMENTOS) || '[]');

      if (matSalvas.length === 0) return null;

      const alInfo = alunos.find(a => a.nome === termoBusca) || { nome: termoBusca, serie: "-", foto: "" };
      const fotoSalvaObj = mapaFotosAlunosCacheMemoria['ALUNO_' + termoBusca];
      const fotoFinal = (fotoSalvaObj && fotoSalvaObj.foto) ? fotoSalvaObj.foto : (alInfo.foto || "");
      const catalogo = (catSalvo && Array.isArray(catSalvo.catalogo)) ? catSalvo.catalogo : [];

      const historico = matSalvas
        .filter(m => m.aluno === termoBusca)
        .map(m => {
          const catMatch = catalogo.find(c => c.ano === m.ano && (c.nome.toUpperCase() === m.eletiva || extrairCodigoEletivaCore(c.nome) === m.codigo)) || {};
          const chValor = 40;
          let diasComFalta = 0;
          const datasFaltas = [];
          const datasAulasSet = new Set();

          freqsElet.forEach(f => {
            const mesmaElet = String(f.eletiva || "").toUpperCase() === m.eletiva || extrairCodigoEletivaCore(f.eletiva) === m.codigo;
            if (String(f.semestre || "") === m.ano && mesmaElet) {
              if (f.data) datasAulasSet.add(f.data);
              const faltososArr = String(f.faltosos || "").toUpperCase().split(',').map(s => s.replace(/\s+/g, " ").trim());
              if (faltososArr.includes(termoBusca)) {
                diasComFalta++;
                if (f.data && !datasFaltas.includes(f.data)) datasFaltas.push(f.data);
              }
            }
          });

          const totalFaltas = diasComFalta * 2;
          const totalAulasReg = datasAulasSet.size * 2;
          const baseCalc = Math.max(chValor, totalAulasReg || chValor);
          const perc = Math.max(0, Math.min(100, Math.round(((baseCalc - totalFaltas) / baseCalc) * 100)));

          return {
            anoLetivo: String(m.ano || "").split('.')[0] || m.ano,
            semestre: m.ano || "-",
            dia: m.dia || catMatch.dia || "-",
            tempoEletivo: m.tempoEletivo || catMatch.tempoEletivo || "-",
            serie: window.abreviarSerieParaExibicao(m.serie || alInfo.serie || "-"),
            eletiva: m.eletiva,
            professor: catMatch.professor || "NÃO INFORMADO",
            ch: chValor,
            nota: m.nota || "",
            diasFaltosos: diasComFalta,
            faltas: totalFaltas,
            datasFaltas: datasFaltas.join(", "),
            aulasRegistradas: totalAulasReg,
            frequenciaPercentual: perc + "%"
          };
        });

      return JSON.stringify({
        success: true,
        aluno: { nome: alInfo.nome, serie: window.abreviarSerieParaExibicao(alInfo.serie), foto: fotoFinal, matricula: "" },
        historico: historico
      });
    }

    if (action === 'pesquisarAlunoGlobal') {
      const termo = String(bodyObj.nome || "").trim().toUpperCase();
      const matSalvas = JSON.parse(localStorage.getItem(KEY_MATRICULAS_ELETIVAS_OFFLINE) || '[]');
      if (matSalvas.length === 0) return null;
      const res = matSalvas
        .filter(m => m.aluno.includes(termo))
        .map(m => ({
          linha: m.linha || 0,
          ano: m.ano,
          dia: m.dia || "",
          tempoEletivo: m.tempoEletivo || "",
          serie: window.abreviarSerieParaExibicao(m.serie),
          eletiva: m.eletiva,
          aluno: m.aluno,
          nota: m.nota || ""
        }));
      return JSON.stringify(res);
    }

    if (action === 'getRelatorioMatriculas') {
      const anoB = String(bodyObj.ano || "").trim();
      const serieB = normalizarSeriePadraoCore(bodyObj.serie || "");
      const matSalvas = JSON.parse(localStorage.getItem(KEY_MATRICULAS_ELETIVAS_OFFLINE) || '[]');
      const catSalvo = JSON.parse(localStorage.getItem(KEY_CATALOGO_ELETIVAS_OFFLINE) || 'null');
      if (matSalvas.length === 0) return null;

      const catalogo = (catSalvo && Array.isArray(catSalvo.catalogo)) ? catSalvo.catalogo : [];
      const rel = matSalvas
        .filter(m => (!anoB || m.ano === anoB) && (!serieB || m.serie === serieB || m.serieBase === serieB))
        .map(m => {
          const catMatch = catalogo.find(c => c.ano === m.ano && (c.nome.toUpperCase() === m.eletiva || extrairCodigoEletivaCore(c.nome) === m.codigo)) || {};
          const diaF = m.dia || catMatch.dia || "";
          const tempoF = m.tempoEletivo || catMatch.tempoEletivo || "";
          return {
            aluno: m.aluno,
            serie: window.abreviarSerieParaExibicao(m.serie),
            diaSemana: diaF,
            tempoEletivo: tempoF,
            dia: diaF ? `${diaF}${tempoF ? ' - ' + tempoF : ''}` : (tempoF || '-'),
            eletiva: m.eletiva
          };
        })
        .sort((a, b) => a.aluno.localeCompare(b.aluno, 'pt-BR'));

      return JSON.stringify(rel);
    }

    if (action === 'buscarOcorrencias') {
      const f = bodyObj.filtros || {};
      const serieB = normalizarSeriePadraoCore(f.serie || "");
      const alunoB = String(f.aluno || "").trim().toUpperCase();
      const profB = String(f.professorLogado || "").trim().toUpperCase();
      const ignorarProf = f.ignorarRestricao === true;

      const todasSalvas = JSON.parse(localStorage.getItem(KEY_TODAS_OCORRENCIAS_OFFLINE) || '[]');
      if (todasSalvas.length === 0) return null;
      const filtradas = todasSalvas.filter(r => {
        const bateSerie = !serieB || normalizarSeriePadraoCore(r.serie) === serieB;
        const bateAluno = !alunoB || String(r.aluno || "").toUpperCase().includes(alunoB);
        const bateProf = ignorarProf || !profB || String(r.professor || "").toUpperCase().includes(profB);
        return bateSerie && bateAluno && bateProf;
      });
      return JSON.stringify(filtradas);
    }

    if (action === 'getFiltrosFrequencia' || action === 'getFiltrosIniciais') {
      const catSalvo = JSON.parse(localStorage.getItem(KEY_CATALOGO_ELETIVAS_OFFLINE) || 'null');
      if (catSalvo) return JSON.stringify(catSalvo);
    }

    if (action === 'getEletivasProfessor' || action === 'getEletivasPorAno') {
      const catSalvo = JSON.parse(localStorage.getItem(KEY_CATALOGO_ELETIVAS_OFFLINE) || 'null');
      if (catSalvo && Array.isArray(catSalvo.catalogo)) {
        const anoB = String(bodyObj.ano || "").trim();
        const profB = String(bodyObj.professor || "").trim().toUpperCase();
        const filtradas = catSalvo.catalogo
          .filter(c => (!anoB || c.ano === anoB) && (!profB || c.professor.includes(profB) || profB.includes(c.professor)))
          .map(c => c.nome);
        return JSON.stringify(Array.from(new Set(filtradas)).sort());
      }
    }

    if (action === 'getAlunosFrequencia' || action === 'buscarAlunos') {
      const matSalvas = JSON.parse(localStorage.getItem(KEY_MATRICULAS_ELETIVAS_OFFLINE) || '[]');
      if (matSalvas.length === 0) return null;
      const anoB = String(bodyObj.ano || "").trim();
      const eletB = String(bodyObj.eletiva || "").trim().toUpperCase();
      const codB = extrairCodigoEletivaCore(eletB);

      const encontradosMap = {};
      matSalvas.forEach(m => {
        const bateAno = !anoB || m.ano === anoB;
        const bateElet = !eletB || m.eletiva === eletB || m.eletiva.includes(eletB) || (codB && m.codigo === codB);
        if (bateAno && bateElet) {
          encontradosMap[m.aluno] = {
            linha: m.linha || 0,
            nome: m.aluno,
            aluno: m.aluno,
            turma: window.abreviarSerieParaExibicao(m.serie),
            serieTurma: window.abreviarSerieParaExibicao(m.serie),
            serieBase: m.serieBase,
            tempoEletivo: m.tempoEletivo,
            semestre: m.ano,
            eletiva: m.eletiva,
            notaAtual: m.nota || ""
          };
        }
      });
      const listaFinal = Object.values(encontradosMap).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      if (listaFinal.length > 0) return JSON.stringify(listaFinal);
    }

    if (action === 'getFiltrosOcorrencias') {
      const series = JSON.parse(localStorage.getItem(window.KEY_SERIES_UNIVERSAL_EEMTI) || '[]');
      const alunos = JSON.parse(localStorage.getItem(window.KEY_ALUNOS_UNIVERSAL_EEMTI) || '[]');
      const ocorrencias = JSON.parse(localStorage.getItem('cache_rac_catalogo_v3') || '[]');
      if (series.length > 0 && alunos.length > 0) {
        // Anexa as fotos do IndexedDB aos alunos para que المapeamento de Sala e Biblioteca tenham fotos 3x4 offline!
        const alunosComFoto = alunos.map(a => {
          const fMem = mapaFotosAlunosCacheMemoria['ALUNO_' + a.nome];
          return fMem && fMem.foto ? Object.assign({}, a, { foto: fMem.foto }) : a;
        });
        return JSON.stringify({ success: true, series: series, alunos: alunosComFoto, ocorrencias: ocorrencias });
      }
    }

    if (action === 'listarFrequenciaSecretaria') {
      const series = JSON.parse(localStorage.getItem(window.KEY_SERIES_UNIVERSAL_EEMTI) || '[]');
      const alunos = JSON.parse(localStorage.getItem('cache_freq_sec_alunos_det_v4') || localStorage.getItem(window.KEY_ALUNOS_UNIVERSAL_EEMTI) || '[]');
      const frequencias = JSON.parse(localStorage.getItem('cache_freq_sec_lancamentos_v4') || '[]');
      const diasLetivos = JSON.parse(localStorage.getItem('cache_freq_sec_dias_letivos_v4') || 'null');
      if (series.length > 0 && alunos.length > 0) {
        return JSON.stringify({
          success: true,
          series: series,
          alunosDetalhados: alunos,
          frequencias: frequencias,
          diasLetivosMes: diasLetivos
        });
      }
    }

    if (action === 'listarDisciplinasCadastradas') {
      const disc = JSON.parse(localStorage.getItem('cache_ativ_rapido_v3_disc') || '[]');
      const det = JSON.parse(localStorage.getItem('cache_aba_exclusiva_disciplinas_v2') || '[]');
      if (disc.length > 0) {
        return JSON.stringify({ success: true, disciplinas: disc, listaDetalhada: det });
      }
    }

    if (action === 'listarPDT') {
      const mapaPdt = JSON.parse(localStorage.getItem('cache_mapa_pdt_v4') || '{}');
      const chaves = Object.keys(mapaPdt);
      if (chaves.length > 0) {
        return JSON.stringify({ success: true, lista: chaves.map((s, idx) => ({ linha: idx + 2, serie: s, professor: mapaPdt[s] })) });
      }
    }

    if (action === 'listarTodosMapeamentos') {
      const mapaSalvos = JSON.parse(localStorage.getItem('cache_todos_mapas_salvos_v4') || '{}');
      const vals = Object.values(mapaSalvos);
      if (vals.length > 0) {
        return JSON.stringify({ success: true, lista: vals });
      }
    }

    if (action === 'buscarMapeamentoSala') {
      const sAlvo = normalizarSeriePadraoCore(bodyObj.serie || "");
      const mapaSalvos = JSON.parse(localStorage.getItem('cache_todos_mapas_salvos_v4') || '{}');
      if (mapaSalvos[sAlvo]) {
        return JSON.stringify({ success: true, encontrado: true, dados: mapaSalvos[sAlvo] });
      }
    }

    return null;
  }

  async function espelharFilaParaIndexedDB(filaArray) {
    const db = await abrirBancoSyncIDB();
    if (!db) return;
    try {
      await new Promise(resolve => {
        const tx = db.transaction('fila_pendente', 'readwrite');
        const store = tx.objectStore('fila_pendente');
        store.clear();
        (filaArray || []).forEach(item => store.put(item));
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch (e) {}

    if ('serviceWorker' in navigator && filaArray && filaArray.length > 0) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if ('SyncManager' in window) {
          await reg.sync.register('sync-fila-eemti');
        }
        if ('periodicSync' in reg) {
          try { await reg.periodicSync.register('periodic-sync-fila-eemti', { minInterval: 60000 }); } catch (e) {}
        }
      } catch (e) {}
    }
  }

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
              reqRel.result.forEach(r => {
                itensDoBackground.push(r.resumoHtml || r);
              });
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

    const logLocal = JSON.parse(localStorage.getItem(LOG_SINCRONIZADOS_KEY) || '[]');
    if (logLocal.length > 0) {
      itensDoBackground = itensDoBackground.concat(logLocal);
      localStorage.removeItem(LOG_SINCRONIZADOS_KEY);
    }

    if (itensDoBackground.length > 0) {
      sincronizacaoEmAndamento = false;
      window.atualizarBadgeStatusConexaoGlobal();
      registrarDataHoraAtualizacaoBanco();
      exibirAvisoFinalDeDadosSincronizados(itensDoBackground);
      setTimeout(() => window.executarPreCarregamentoTotalOffline(true), 500);
      return true;
    }
    return false;
  }

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
  // 4. INTERCEPTADOR DE FETCH (RESPOSTAS EM 1ms + SÉRIES ABREVIADAS NOS HISTÓRICOS)
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
    const serieCurta = window.abreviarSerieParaExibicao(d.serie || d.semestre || '-');
    if (act === 'salvarOcorrencia') {
      return `<li><b>Ocorrência RAC:</b> ${d.aluno || '-'} (${serieCurta}) — <i>${d.ocorrencia || '-'}</i></li>`;
    }
    if (act === 'salvarAtividadeDisciplinas' || act === 'salvarAtividadeEletivas') {
      return `<li><b>Atividade (${d.disciplina || d.eletiva || '-'}):</b> Turma ${serieCurta} (${d.data || '-'})</li>`;
    }
    if (act === 'salvarFrequenciaSecretaria') {
      return `<li><b>Frequência Secretaria:</b> Turma ${serieCurta} • Turno ${d.turno || '-'} (${d.data || '-'})</li>`;
    }
    if (act === 'salvarFrequencia') {
      return `<li><b>Frequência Eletiva:</b> ${d.eletiva || '-'} (${d.data || '-'} • ${d.semestre || '-'})</li>`;
    }
    if (act === 'salvarMapeamentoSala') {
      return `<li><b>Mapeamento de Sala:</b> Turma ${serieCurta} (PDT: ${d.pdt || '-'})</li>`;
    }
    return `<li><b>${ACOES_GRAVACAO_OFFLINE[act] || act}:</b> Sincronizado com sucesso</li>`;
  }

  const _fetchNativo = window.fetch;
  window.fetch = async function(url, options) {
    if (options && options.method === 'POST' && typeof options.body === 'string' && String(url).includes('script.google.com')) {
      let bodyObj = {};
      try {
        bodyObj = JSON.parse(options.body);
        const nomeAutor = obterNomeUsuarioLogadoCore();
        if (nomeAutor && !bodyObj.usuarioLogado) bodyObj.usuarioLogado = nomeAutor;
        options.body = JSON.stringify(bodyObj);
      } catch (e) {}

      const action = bodyObj.action || '';
      const ehReservaDeAmbiente = ACOES_EXCLUSIVAS_ONLINE_RESERVAS.includes(action);

      // 1. MODO OFFLINE
      if (!navigator.onLine) {
        if (ehReservaDeAmbiente) {
          return new Response(JSON.stringify({
            success: false,
            error: 'O módulo de Reservas de Ambientes exige conexão com a internet em tempo real.'
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        if (ACOES_GRAVACAO_OFFLINE[action]) {
          window.enfileirarOperacaoOfflineGlobal(url, bodyObj);
          return new Response(JSON.stringify({
            success: true,
            offline: true,
            msg: 'Salvo no Modo Offline! O envio para o banco de dados ocorrerá automaticamente em segundo plano assim que houver internet.'
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        const respostaCache = obterRespostaDoCacheInstantaneo(action, bodyObj);
        if (respostaCache) {
          return new Response(respostaCache, { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
      }

      // 2. RESPOSTA EM 1 MILISSEGUNDO DIRETO DO CACHE (INCLUINDO FOTOS E HISTÓRICOS!)
      if (!ehReservaDeAmbiente && (ACOES_LEITURA_CACHE_PURO.includes(action) || action === 'obterCapaLivroDrive' || action === 'obterAnexoBuscaAtivaDrive')) {
        const cacheImediato = obterRespostaDoCacheInstantaneo(action, bodyObj);
        if (cacheImediato) {
          return new Response(cacheImediato, { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
      }

      // 3. EXECUÇÃO ONLINE (Quando é gravação ou 1ª leitura ainda não presente no cache)
      try {
        const response = await fetchComTimeoutSeguranca(url, options, 18000);
        const clone = response.clone();

        clone.text().then(textoResp => {
          if (textoResp && (textoResp.startsWith('{') || textoResp.startsWith('['))) {
            salvarRespostaNoCacheInstantaneo(action, bodyObj, textoResp);

            try {
              const resJson = JSON.parse(textoResp);
              if (action === 'fazerLogin' || ACOES_MUTACAO_CADASTROS.includes(action)) {
                if (resJson && (resJson.success || resJson.msg)) {
                  setTimeout(() => window.executarPreCarregamentoTotalOffline(true), 300);
                }
              }
            } catch (e) {}
          }
        }).catch(() => {});

        return response;
      } catch (errRede) {
        if (!ehReservaDeAmbiente && ACOES_GRAVACAO_OFFLINE[action]) {
          window.enfileirarOperacaoOfflineGlobal(url, bodyObj);
          return new Response(JSON.stringify({
            success: true,
            offline: true,
            msg: 'Conexão instável! Salvo na fila e será enviado automaticamente em segundo plano.'
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        const fallbackPreCarregado = obterRespostaDoCacheInstantaneo(action, bodyObj);
        if (fallbackPreCarregado) {
          return new Response(fallbackPreCarregado, { status: 200, headers: { 'Content-Type': 'application/json' } });
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
  // 5. ENVIO EM SEGUNDO PLANO SILENCIOSO
  // =========================================================================
  function exibirAvisoFinalDeDadosSincronizados(listaHtmlSincronizados) {
    if (!listaHtmlSincronizados || listaHtmlSincronizados.length === 0) return;
    if (typeof Swal === 'undefined') return;

    Swal.fire({
      title: 'Dados Enviados ao Banco de Dados!',
      html: `
        <p class="small text-muted mb-2">As seguintes informações salvas offline já foram sincronizadas com sucesso na planilha:</p>
        <ul class="text-start small bg-light p-3 rounded border mb-0" style="max-height: 240px; overflow-y: auto;">
          ${listaHtmlSincronizados.join('')}
        </ul>
      `,
      icon: 'success',
      confirmButtonColor: '#15438c',
      confirmButtonText: 'OK, Ciente!'
    });
  }

  window.sincronizarFilaOfflineGlobal = async function() {
    if (sincronizacaoEmAndamento || !navigator.onLine) return;

    const jaFoiEnviadoPeloSW = await verificarSincronizacoesFeitasComAppFechado();
    if (jaFoiEnviadoPeloSW) return;

    const filaInicial = unificarFilasOfflineNoStorage();
    if (filaInicial.length === 0) {
      window.atualizarBadgeStatusConexaoGlobal();
      return;
    }

    sincronizacaoEmAndamento = true;
    const sincronizadosHtml = [];

    try {
      for (let i = 0; i < filaInicial.length; i++) {
        if (!navigator.onLine) break;
        const item = filaInicial[i];

        try {
          const res = await fetchComTimeoutSeguranca(item.url || API_PADRAO_URL, {
            method: 'POST',
            body: JSON.stringify(item.payload)
          }, 15000);

          const texto = await res.text();
          let json = null;
          try { json = JSON.parse(texto); } catch (e) {}

          if ((json && (json.success || json.msg || json.jaExiste)) || (res.ok && texto.includes('"success"'))) {
            sincronizadosHtml.push(item.resumoHtml);
            const filaAtual = JSON.parse(localStorage.getItem(FILA_GLOBAL_KEY) || '[]')
              .filter(f => f.idFila !== item.idFila);
            localStorage.setItem(FILA_GLOBAL_KEY, JSON.stringify(filaAtual));
            await espelharFilaParaIndexedDB(filaAtual);
          }
        } catch (e) {
          break;
        }
      }
    } finally {
      sincronizacaoEmAndamento = false;
      window.atualizarBadgeStatusConexaoGlobal();
    }

    if (sincronizadosHtml.length > 0) {
      registrarDataHoraAtualizacaoBanco();
      setTimeout(() => window.executarPreCarregamentoTotalOffline(true), 400);

      window.dispatchEvent(new CustomEvent('eemti-fila-sincronizada'));
      if (document.visibilityState === 'visible' && typeof Swal !== 'undefined') {
        exibirAvisoFinalDeDadosSincronizados(sincronizadosHtml);
      } else {
        const logAnt = JSON.parse(localStorage.getItem(LOG_SINCRONIZADOS_KEY) || '[]');
        localStorage.setItem(LOG_SINCRONIZADOS_KEY, JSON.stringify(logAnt.concat(sincronizadosHtml)));
      }
    }
  };

  window.atualizarBadgeStatusConexaoGlobal = function() {
    let badge = document.getElementById('badgeStatusOfflineGlobal');
    const fila = unificarFilasOfflineNoStorage();
    if (!badge && document.body) {
      badge = document.createElement('div');
      badge.id = 'badgeStatusOfflineGlobal';
      badge.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:99999;padding:9px 15px;border-radius:30px;font-weight:800;font-size:0.78rem;box-shadow:0 6px 18px rgba(0,0,0,0.2);cursor:pointer;transition:all 0.2s;pointer-events:auto;display:none;';
      badge.onclick = () => window.sincronizarFilaOfflineGlobal();
      document.body.appendChild(badge);
    }
    if (!badge) return;

    if (!navigator.onLine) {
      badge.style.display = 'block';
      badge.style.backgroundColor = '#dc2626';
      badge.style.color = '#ffffff';
      badge.innerHTML = `<i class="bi bi-wifi-off me-2"></i>Modo Offline (${fila.length} pendente${fila.length === 1 ? '' : 's'})`;
    } else {
      badge.style.display = 'none';
    }
  };

  window.addEventListener('online', () => {
    atualizarSeloTopoSincronizacao();
    window.atualizarBadgeStatusConexaoGlobal();
    setTimeout(window.sincronizarFilaOfflineGlobal, 300);
  });

  window.addEventListener('offline', () => {
    atualizarSeloTopoSincronizacao('OFFLINE');
    window.atualizarBadgeStatusConexaoGlobal();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'DISPARAR_SYNC_AGORA' });
      }
    } else if (document.visibilityState === 'visible') {
      verificarSincronizacoesFeitasComAppFechado();
    }
  });

  window.addEventListener('DOMContentLoaded', async () => {
    injetarResponsividadeGlobalEEMTI();
    configurarImagensENavegacaoTopo();
    iniciarObservadorVisualDOM();

    await carregarTodasFotosDoIndexedDBParaMemoria();
    const jaEnviouFechado = await verificarSincronizacoesFeitasComAppFechado();
    unificarFilasOfflineNoStorage();
    window.atualizarBadgeStatusConexaoGlobal();

    if (navigator.onLine) {
      if (!jaEnviouFechado) {
        setTimeout(window.sincronizarFilaOfflineGlobal, 250);
      }
      setTimeout(() => window.executarPreCarregamentoTotalOffline(false), 500);
    }
  });

  // =========================================================================
  // 6. GERADOR UNIVERSAL DE CABEÇALHO PADRÃO COM BRASÃO E FOTO 3×4 PARA PDF
  // =========================================================================
  window.converterImagemParaDataUrlPdf = function(srcOuBase64, larg = 300, alt = 400) {
    return new Promise(resolve => {
      if (!srcOuBase64) return resolve(null);
      if (String(srcOuBase64).startsWith('data:image')) return resolve(srcOuBase64);
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
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = srcOuBase64;
    });
  };

  window.desenharCabecalhoPadraoEEMTI = async function(doc, opcoes = {}) {
    const largPagina = doc.internal.pageSize.getWidth();
    const margemEsq = 14;
    const margemDir = largPagina - 14;
    const temFotoAluno = Boolean(opcoes.exibirMolduraFoto || opcoes.fotoAlunoBase64);

    const b64BrasaoSalvo = localStorage.getItem('cache_brasao_oficial_eemti_b64');
    const imgLogoDom = document.getElementById('logoEscola') || document.querySelector('.brand-escola img');
    const srcLogo = b64BrasaoSalvo || ((imgLogoDom && imgLogoDom.src && !imgLogoDom.src.includes('2941658.png')) ? imgLogoDom.src : 'brasaoestado.png.png');
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
