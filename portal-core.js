// =========================================================================
// MOTOR CENTRAL UNIFICADO (PORTAL-CORE.JS) - VERSÃO ULTRA-RÁPIDA (CACHE-FIRST)
// 1. ABERTURA E FILTROS INSTANTÂNEOS (0ms) + ATUALIZAÇÃO SILENCIOSA EM 2º PLANO
// 2. TODAS AS PÁGINAS FUNCIONAM OFFLINE (EXCETO RESERVAS DE AMBIENTES)
// 3. SELO "ATUALIZADO COM O BANCO: DATA/HORA" + BOTÃO "VOLTAR" (MEMÓRIA DO ÚLTIMO MÓDULO)
// 4. FIM DO LOOP DE SINCRONIZAÇÃO INFINITA + TIMEOUT DE SEGURANÇA (15s)
// 5. RESPONSIVIDADE UNIVERSAL (CELULAR, TABLET E PC) + CABEÇALHO PDF PADRÃO
// =========================================================================
(function() {
  const FILA_GLOBAL_KEY = 'fila_offline_eemti_v1';
  const LOG_SINCRONIZADOS_KEY = 'log_recem_sincronizados_eemti_v1';
  const TIMESTAMP_PREFETCH_KEY = 'ultimo_prefetch_completo_eemti_ts';
  const ULTIMA_ATUALIZACAO_STR_KEY = 'ultima_atualizacao_banco_eemti_str';
  const ULTIMO_TOPICO_COLMEIA_KEY = 'ultimo_topico_colmeia_selecionado_eemti';
  const CACHE_UNIVERSAL_ACTIONS_KEY = 'cache_universal_actions_eemti_v1';
  const IDB_SYNC_NAME = 'EEMTI_BackgroundSync_DB';
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
  const KEY_AMBIENTES_OFFLINE = 'cache_ambientes_escola_v1';

  // Todas as ações de gravação que funcionam Offline (exceto Reservas de Ambientes)
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

  // Ações da página de Reservas de Ambientes (sempre exigem tempo real online)
  const ACOES_EXCLUSIVAS_ONLINE_RESERVAS = [
    'listarReservas',
    'salvarReserva',
    'excluirReserva'
  ];

  // Ações de cadastro/edição que disparam atualização silenciosa do banco em 2º plano
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

  // Ações de leitura que devem abrir INSTANTANEAMENTE do cache local (0ms) e atualizar em 2º plano!
  const ACOES_LEITURA_INSTANTANEA = [
    'getFiltrosOcorrencias', 'buscarOcorrencias',
    'listarFrequenciaSecretaria', 'getFiltrosFrequencia', 'getFiltrosIniciais',
    'getEletivasProfessor', 'getEletivasPorAno', 'getAlunosFrequencia', 'buscarAlunos',
    'listarDisciplinasCadastradas', 'listarAtividadesUnificadas',
    'listarPDT', 'listarTodosMapeamentos', 'buscarMapeamentoSala',
    'getAlunosParaPainelSuspensao', 'listarAtendimentosAlunos',
    'getDadosMatricula', 'getRelatorioMatriculas', 'getAlunosComNotas',
    'listarConfig', 'listarSituacaoAlunos', 'listarAee', 'listarBuscaAtiva',
    'listarLivrosBiblioteca', 'listarDadosEmprestimosBiblioteca',
    'buscarDadosSimulados', 'getMonitoramentoEletivas', 'listarFuncionarios',
    'getProfessores', 'buscarEletivasCadastradas', 'getAlunosParaEdicao',
    'getDadosHistorico', 'getHistoricoEletivasAluno', 'obterFotoAlunoIndividual'
  ];

  let sincronizacaoEmAndamento = false;
  let prefetchEmAndamento = false;

  // =========================================================================
  // 0. RESPONSIVIDADE GLOBAL + BARRA SUPERIOR COM "ATUALIZADO EM" E "VOLTAR"
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
      .table-responsive {
        width: 100% !important;
        max-width: 100% !important;
        overflow-x: auto !important;
        -webkit-overflow-scrolling: touch;
      }
      .badge-sync-header-eemti {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 0.68rem;
        font-weight: 700;
        color: #0f766e;
        background: #f0fdfa;
        border: 1px solid #99f6e4;
        padding: 4px 10px;
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
      @media (max-width: 1024px) {
        .top-header {
          padding: 14px 16px 8px 16px !important;
          justify-content: center !important;
        }
        .main-container {
          padding: 12px 10px 30px 10px !important;
        }
        .card {
          padding: 14px !important;
        }
        table th, table td {
          padding: 6px 5px !important;
          font-size: 0.76rem !important;
          word-break: break-word !important;
          overflow-wrap: anywhere !important;
          white-space: normal !important;
        }
      }
      @media (max-width: 768px) {
        .top-header {
          flex-direction: column !important;
          align-items: center !important;
          text-align: center !important;
          padding: 12px 10px 6px 10px !important;
          gap: 10px !important;
        }
        .brand-escola {
          flex-direction: row !important;
          justify-content: center !important;
          text-align: left !important;
          gap: 10px !important;
        }
        .brand-escola img {
          height: 62px !important;
        }
        .brand-titulo-principal {
          font-size: 1.42rem !important;
        }
        .brand-subtitulo {
          font-size: 0.58rem !important;
        }
        .brand-slogan {
          font-size: 1.12rem !important;
        }
        .user-bar {
          flex-wrap: wrap !important;
          justify-content: center !important;
          width: 100% !important;
          padding: 7px 10px !important;
          border-radius: 16px !important;
          gap: 6px !important;
        }
        .badge-sync-header-eemti {
          font-size: 0.62rem !important;
          padding: 3px 8px !important;
        }
        .main-container {
          padding: 8px 6px 28px 6px !important;
        }
        .card {
          padding: 12px 10px !important;
          border-radius: 12px !important;
          margin-bottom: 14px !important;
        }
        .card-header-custom {
          flex-direction: column !important;
          align-items: stretch !important;
          gap: 8px !important;
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
          font-size: 0.76rem !important;
          padding: 8px 10px !important;
          text-align: center !important;
          width: 100% !important;
        }
        table.table {
          width: 100% !important;
          table-layout: fixed !important;
          margin-bottom: 0 !important;
        }
        table.table th {
          font-size: 0.62rem !important;
          padding: 6px 3px !important;
          line-height: 1.1 !important;
          word-break: break-word !important;
          overflow-wrap: anywhere !important;
          white-space: normal !important;
          vertical-align: middle !important;
        }
        table.table td {
          font-size: 0.68rem !important;
          padding: 6px 3px !important;
          line-height: 1.15 !important;
          word-break: break-word !important;
          overflow-wrap: anywhere !important;
          white-space: normal !important;
          vertical-align: middle !important;
        }
        table.table td.text-nowrap,
        table.table td:last-child {
          white-space: normal !important;
        }
        table.table td .btn {
          font-size: 0.65rem !important;
          padding: 4px 6px !important;
          margin: 2px 0 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        table.table td input[type="date"],
        table.table td input[type="number"],
        table.table td select {
          max-width: 100% !important;
          min-width: 0 !important;
          font-size: 0.66rem !important;
          padding: 3px 4px !important;
        }
        table.table td .badge {
          font-size: 0.6rem !important;
          padding: 3px 5px !important;
          white-space: normal !important;
        }
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  injetarResponsividadeGlobalEEMTI();

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
      selo.title = 'Clique para atualizar os dados com a planilha em 2º plano';
      selo.onclick = () => {
        if (navigator.onLine) {
          atualizarSeloTopoSincronizacao('SINCRONIZANDO');
          window.sincronizarFilaOfflineGlobal();
          window.executarPreCarregamentoTotalOffline(true);
        } else {
          atualizarSeloTopoSincronizacao('OFFLINE');
        }
      };
      userBar.insertBefore(selo, userBar.firstChild);
    }

    const ultStr = localStorage.getItem(ULTIMA_ATUALIZACAO_STR_KEY) || 'Aguardando...';

    if (!navigator.onLine || estadoEspecial === 'OFFLINE') {
      selo.className = 'badge-sync-header-eemti offline';
      selo.innerHTML = `<i class="bi bi-wifi-off"></i> Offline (Base: ${ultStr})`;
    } else if (estadoEspecial === 'SINCRONIZANDO') {
      selo.className = 'badge-sync-header-eemti sincronizando';
      selo.innerHTML = `<span class="spinner-border spinner-border-sm" style="width:0.65rem;height:0.65rem;"></span> Sincronizando banco...`;
    } else {
      selo.className = 'badge-sync-header-eemti';
      selo.innerHTML = `<i class="bi bi-cloud-check-fill"></i> Atualizado: ${ultStr}`;
    }
  }

  // Injeta o botão "Voltar" ao lado do botão Início/Sair e restaura o último módulo da colmeia no index.html!
  function configurarNavegacaoInteligenteEBotaoVoltar() {
    const path = window.location.pathname.toLowerCase();
    const estaNaHome = path.endsWith('index.html') || path.endsWith('/') || path === '';
    const estaNoLogin = path.endsWith('login.html');
    if (estaNoLogin) return;

    // 1. Garante que a Logo oficial (LOGO-removebg-preview.png) apareça com cache-busting inteligente
    document.querySelectorAll('img[src*="LOGO-removebg-preview.png"], .brand-escola img').forEach(img => {
      const b64Salva = localStorage.getItem('cache_logo_oficial_eemti_b64');
      if (!navigator.onLine && b64Salva) {
        img.src = b64Salva;
      } else if (navigator.onLine && img.getAttribute('src') && img.getAttribute('src').includes('LOGO-removebg-preview.png')) {
        // Faz download silencioso e guarda a nova logo para funcionar offline e atualizar o cache
        window.converterImagemParaDataUrlPdf('LOGO-removebg-preview.png?v=' + new Date().toISOString().slice(0, 13), 300, 300).then(b64 => {
          if (b64) {
            try { localStorage.setItem('cache_logo_oficial_eemti_b64', b64); } catch (e) {}
            img.src = b64;
          }
        });
      }
    });

    atualizarSeloTopoSincronizacao();

    // 2. Se estiver na Home (index.html): memoriza qualquer clique nos hexágonos e reabre o último tópico ao voltar!
    if (estaNaHome) {
      const fnOrig = window.selecionarTopicoColmeia;
      if (typeof fnOrig === 'function' && !fnOrig._eemtiWrapped) {
        const novaFn = function(elementoHex, chaveTopico) {
          const jaAtivo = elementoHex && elementoHex.classList && elementoHex.classList.contains('ativo');
          fnOrig.apply(this, arguments);
          if (jaAtivo) {
            sessionStorage.removeItem(ULTIMO_TOPICO_COLMEIA_KEY);
          } else if (chaveTopico) {
            sessionStorage.setItem(ULTIMO_TOPICO_COLMEIA_KEY, chaveTopico);
          }
        };
        novaFn._eemtiWrapped = true;
        window.selecionarTopicoColmeia = novaFn;
      }

      const fnFecharOrig = window.fecharPainelTopico;
      if (typeof fnFecharOrig === 'function' && !fnFecharOrig._eemtiWrapped) {
        const novaFechar = function() {
          sessionStorage.removeItem(ULTIMO_TOPICO_COLMEIA_KEY);
          fnFecharOrig.apply(this, arguments);
        };
        novaFechar._eemtiWrapped = true;
        window.fecharPainelTopico = novaFechar;
      }

      // Se o professor acabou de voltar de uma subpágina, reabre automaticamente a gaveta do módulo que ele estava usando!
      const ultimoTopico = sessionStorage.getItem(ULTIMO_TOPICO_COLMEIA_KEY);
      if (ultimoTopico) {
        setTimeout(() => {
          const seletores = Array.from(document.querySelectorAll('.hex-node'));
          const hexAlvo = seletores.find(el => {
            const onc = el.getAttribute('onclick') || '';
            return onc.includes(`'${ultimoTopico}'`) && el.offsetParent !== null;
          }) || seletores.find(el => (el.getAttribute('onclick') || '').includes(`'${ultimoTopico}'`));

          if (hexAlvo && typeof window.selecionarTopicoColmeia === 'function' && !hexAlvo.classList.contains('ativo')) {
            window.selecionarTopicoColmeia(hexAlvo, ultimoTopico);
          }
        }, 120);
      }
      return;
    }

    // 3. Se estiver em qualquer subpágina: adiciona o botão "Voltar" ao lado do botão Início/Sair!
    const userBar = document.querySelector('.user-bar');
    if (userBar && !document.getElementById('btnVoltarPaginaAnteriorEEMTI')) {
      const btnVoltar = document.createElement('button');
      btnVoltar.type = 'button';
      btnVoltar.id = 'btnVoltarPaginaAnteriorEEMTI';
      btnVoltar.className = 'btn btn-outline-primary btn-sm rounded-pill px-3 fw-bold';
      btnVoltar.innerHTML = `<i class="bi bi-arrow-left-circle-fill me-1"></i>Voltar`;
      btnVoltar.title = 'Voltar para a página ou função anterior';
      btnVoltar.onclick = function() {
        if (document.referrer && document.referrer.includes(window.location.host) && window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = 'index.html';
        }
      };

      const btnInicioOuSair = userBar.querySelector('a[href*="index.html"], button.btn-outline-danger');
      if (btnInicioOuSair) {
        userBar.insertBefore(btnVoltar, btnInicioOuSair);
      } else {
        userBar.appendChild(btnVoltar);
      }
    }
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
    const m = str.match(/^([123])[ºª°oA]?\s*(?:ANO|SÉRIE|SERIE)\s*([A-Z0-9].*)$/i);
    return m ? `${m[1]}ª SÉRIE ${m[2].trim()}` : str;
  }

  function extrairCodigoEletivaCore(nome) {
    const str = String(nome || "").trim().toUpperCase();
    const m = str.match(/^([A-Z]{2,4}\d{2,4})\s*[-|]/);
    return m ? m[1] : str;
  }

  function liberarEspacoStorageAntigo() {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('cache_api_eemti_') || k.startsWith('cache_acervo_bib_')) {
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

  // Salva e recupera respostas completas por chave de requisição para que TODAS as páginas funcionem offline e abram em 0ms!
  function gerarChaveCacheRequisicao(action, bodyObj) {
    const copia = Object.assign({}, bodyObj || {});
    delete copia.usuarioLogado;
    return `cache_req_v2_${action}_${JSON.stringify(copia).slice(0, 180)}`;
  }

  function salvarRespostaNoCacheInstantaneo(action, bodyObj, textoJson) {
    if (!ACOES_LEITURA_INSTANTANEA.includes(action)) return;
    if (!textoJson || textoJson.length > 350000) return; // Evita estourar quota com imagens gigantes
    try {
      const ch = gerarChaveCacheRequisicao(action, bodyObj);
      localStorage.setItem(ch, textoJson);
    } catch (e) {
      liberarEspacoStorageAntigo();
    }
  }

  function obterRespostaDoCacheInstantaneo(action, bodyObj) {
    if (!ACOES_LEITURA_INSTANTANEA.includes(action)) return null;
    try {
      const ch = gerarChaveCacheRequisicao(action, bodyObj);
      const direto = localStorage.getItem(ch);
      if (direto) return direto;
    } catch (e) {}
    return construirRespostaOfflineInteligente(action, bodyObj);
  }

  // Fetch com Timeout de Segurança (evita travar infinitamente se a rede oscilar)
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
  // 1. MOTOR DE PRÉ-CARREGAMENTO TOTAL EM SEGUNDO PLANO (PRE-FETCH OFFLINE)
  // Baixa os dados de todas as páginas principais para uso imediato e offline!
  // =========================================================================
  window.executarPreCarregamentoTotalOffline = async function(forcarImediato = false) {
    if (!navigator.onLine || prefetchEmAndamento) return;

    const uLog = JSON.parse(localStorage.getItem('usuarioLogado') || 'null');
    if (!uLog) return;
    const nomeProfLogado = obterNomeUsuarioLogadoCore();

    const agora = Date.now();
    const ultimoTs = Number(localStorage.getItem(TIMESTAMP_PREFETCH_KEY) || 0);
    const jaTemAlunos = Boolean(localStorage.getItem(window.KEY_ALUNOS_UNIVERSAL_EEMTI));
    const jaTemEletivas = Boolean(localStorage.getItem(KEY_MATRICULAS_ELETIVAS_OFFLINE));

    if (!forcarImediato && jaTemAlunos && jaTemEletivas && (agora - ultimoTs < 300000)) {
      atualizarSeloTopoSincronizacao();
      return;
    }

    prefetchEmAndamento = true;
    atualizarSeloTopoSincronizacao('SINCRONIZANDO');

    try {
      // Lote 1: Bases essenciais (Alunos, Séries, Ocorrências, Disciplinas, Eletivas, Bimestres, PDT e Mapeamentos)
      const [
        resFreqSec,
        resFiltrosRac,
        resDisc,
        resMatElet,
        resBim,
        resOcoRac,
        resPdt,
        resMapas
      ] = await Promise.all([
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'listarFrequenciaSecretaria' }) }).then(r => r.json()).catch(() => null),
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'getFiltrosOcorrencias' }) }).then(r => r.json()).catch(() => null),
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'listarDisciplinasCadastradas' }) }).then(r => r.json()).catch(() => null),
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'getDadosMatricula' }) }).then(r => r.json()).catch(() => null),
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'listarConfig', tipo: 'BIMESTRE' }) }).then(r => r.json()).catch(() => null),
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

      if (resFiltrosRac && resFiltrosRac.success) {
        if (Array.isArray(resFiltrosRac.ocorrencias) && resFiltrosRac.ocorrencias.length > 0) {
          const catRac = resFiltrosRac.ocorrencias.map(o => ({
            descricao: String(o.descricao || "").trim(),
            gravidade: String(o.gravidade || "GRAU I (INFRAÇÕES LEVES)").trim().toUpperCase()
          })).filter(o => o.descricao);
          salvarNoLocalStorageSeguro('cache_rac_catalogo_v3', catRac);
        }
      }

      if (Array.isArray(resOcoRac)) {
        salvarNoLocalStorageSeguro(KEY_TODAS_OCORRENCIAS_OFFLINE, resOcoRac.slice(0, 800));
        if (nomeProfLogado) {
          const minhasOco = resOcoRac.filter(r => {
            const p = String(r.professor || "").trim().toUpperCase();
            return p === nomeProfLogado || p.includes(nomeProfLogado) || nomeProfLogado.includes(p);
          });
          salvarNoLocalStorageSeguro('cache_rac_minhas_oco_' + nomeProfLogado.replace(/\s+/g, '_'), minhasOco.slice(0, 250));
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
          professor: String(c.professor || "").trim().toUpperCase()
        }));

        const anosSet = new Set();
        const profsSet = new Set();
        catalogoNorm.forEach(c => {
          if (c.ano) anosSet.add(c.ano);
          if (c.professor) profsSet.add(c.professor);
        });

        const pacoteFiltrosFrequenciaEletiva = {
          success: true,
          anos: Array.from(anosSet).sort().reverse(),
          professores: Array.from(profsSet).sort(),
          catalogo: catalogoNorm
        };

        salvarNoLocalStorageSeguro(KEY_CATALOGO_ELETIVAS_OFFLINE, pacoteFiltrosFrequenciaEletiva);
        salvarNoLocalStorageSeguro('cache_ativ_rapido_v3_elet', catalogoNorm);
        salvarNoLocalStorageSeguro('cache_ativ_rapido_v2_elet', catalogoNorm);

        if (Array.isArray(resMatElet.historico)) {
          const matriculasLeves = resMatElet.historico.map(m => ({
            ano: String(m.ano || "").trim(),
            eletiva: String(m.eletiva || "").trim().toUpperCase(),
            codigo: extrairCodigoEletivaCore(m.eletiva),
            aluno: String(m.aluno || "").replace(/\s+/g, " ").trim().toUpperCase(),
            serie: normalizarSeriePadraoCore(m.serie || m.serieBase || ""),
            serieBase: String(m.serieBase || "").trim().toUpperCase(),
            tempoEletivo: String(m.tempoEletivo || "").trim().toUpperCase()
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

      // Lote 2 em segundo plano: Suspensões/Atendimentos, Atividades, Situação/AEE/Busca Ativa e Biblioteca
      Promise.all([
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'getAlunosParaPainelSuspensao' }) }).then(r => r.text()).then(t => salvarRespostaNoCacheInstantaneo('getAlunosParaPainelSuspensao', { action: 'getAlunosParaPainelSuspensao' }, t)).catch(() => {}),
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'listarAtendimentosAlunos' }) }).then(r => r.text()).then(t => salvarRespostaNoCacheInstantaneo('listarAtendimentosAlunos', { action: 'listarAtendimentosAlunos' }, t)).catch(() => {}),
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'listarAtividadesUnificadas' }) }).then(r => r.text()).then(t => salvarRespostaNoCacheInstantaneo('listarAtividadesUnificadas', { action: 'listarAtividadesUnificadas' }, t)).catch(() => {}),
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'listarSituacaoAlunos' }) }).then(r => r.text()).then(t => salvarRespostaNoCacheInstantaneo('listarSituacaoAlunos', { action: 'listarSituacaoAlunos' }, t)).catch(() => {}),
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'listarAee' }) }).then(r => r.text()).then(t => salvarRespostaNoCacheInstantaneo('listarAee', { action: 'listarAee' }, t)).catch(() => {}),
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'listarBuscaAtiva' }) }).then(r => r.text()).then(t => salvarRespostaNoCacheInstantaneo('listarBuscaAtiva', { action: 'listarBuscaAtiva' }, t)).catch(() => {})
      ]).catch(() => {});

      localStorage.setItem(TIMESTAMP_PREFETCH_KEY, String(Date.now()));
      registrarDataHoraAtualizacaoBanco();
    } catch (errPrefetch) {
      atualizarSeloTopoSincronizacao();
    } finally {
      prefetchEmAndamento = false;
    }
  };

  function construirRespostaOfflineInteligente(action, bodyObj) {
    if (action === 'buscarOcorrencias') {
      const f = bodyObj.filtros || {};
      const serieB = normalizarSeriePadraoCore(f.serie || "");
      const alunoB = String(f.aluno || "").trim().toUpperCase();
      const profB = String(f.professorLogado || "").trim().toUpperCase();
      const ignorarProf = f.ignorarRestricao === true;

      const todasSalvas = JSON.parse(localStorage.getItem(KEY_TODAS_OCORRENCIAS_OFFLINE) || '[]');
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
      const anoB = String(bodyObj.ano || "").trim();
      const eletB = String(bodyObj.eletiva || "").trim().toUpperCase();
      const codB = extrairCodigoEletivaCore(eletB);

      const encontradosMap = {};
      matSalvas.forEach(m => {
        const bateAno = !anoB || m.ano === anoB;
        const bateElet = !eletB || m.eletiva === eletB || m.eletiva.includes(eletB) || (codB && m.codigo === codB);
        if (bateAno && bateElet) {
          encontradosMap[m.aluno] = {
            nome: m.aluno,
            aluno: m.aluno,
            turma: m.serie,
            serieTurma: m.serie,
            serieBase: m.serieBase,
            tempoEletivo: m.tempoEletivo,
            semestre: m.ano,
            eletiva: m.eletiva
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
      if (series.length > 0 || alunos.length > 0) {
        return JSON.stringify({ success: true, series: series, alunos: alunos, ocorrencias: ocorrencias });
      }
    }

    if (action === 'listarFrequenciaSecretaria') {
      const series = JSON.parse(localStorage.getItem(window.KEY_SERIES_UNIVERSAL_EEMTI) || '[]');
      const alunos = JSON.parse(localStorage.getItem('cache_freq_sec_alunos_det_v4') || localStorage.getItem(window.KEY_ALUNOS_UNIVERSAL_EEMTI) || '[]');
      const frequencias = JSON.parse(localStorage.getItem('cache_freq_sec_lancamentos_v4') || '[]');
      const diasLetivos = JSON.parse(localStorage.getItem('cache_freq_sec_dias_letivos_v4') || 'null');
      if (series.length > 0 || alunos.length > 0) {
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

    if (action === 'obterFotoAlunoIndividual') {
      // Se já tiver no cache universal, responde rápido sem travar o PDF de Suspensão!
      const chFoto = gerarChaveCacheRequisicao(action, bodyObj);
      const salvo = localStorage.getItem(chFoto);
      if (salvo) return salvo;
      if (!navigator.onLine) {
        return JSON.stringify({ success: true, foto: "" });
      }
    }

    return null;
  }

  // =========================================================================
  // 2. PONTE INDEXEDDB E BACKGROUND SYNC (SEM TRAVAMENTO INFINITO)
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
      setTimeout(() => window.executarPreCarregamentoTotalOffline(true), 600);
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
  // 3. INTERCEPTADOR DE FETCH ULTRA-RÁPIDO (STALE-WHILE-REVALIDATE)
  // Abre imediatamente do cache (0ms) e atualiza em 2º plano sem travar a tela!
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

      // 1. MODO OFFLINE (Todas as páginas funcionam Offline, exceto Reservas de Ambientes)
      if (!navigator.onLine) {
        if (ehReservaDeAmbiente) {
          return new Response(JSON.stringify({
            success: false,
            error: 'O módulo de Reservas de Ambientes exige conexão com a internet em tempo real para verificar conflitos de horário.'
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        if (ACOES_GRAVACAO_OFFLINE[action]) {
          window.enfileirarOperacaoOfflineGlobal(url, bodyObj);
          return new Response(JSON.stringify({
            success: true,
            offline: true,
            msg: 'Salvo no Modo Offline! A sincronização ocorrerá automaticamente em segundo plano assim que houver internet.'
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        const respostaCache = obterRespostaDoCacheInstantaneo(action, bodyObj);
        if (respostaCache) {
          return new Response(respostaCache, { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
      }

      // 2. ABERTURA E FILTRO INSTANTÂNEO (0ms) QUANDO JÁ TEM CACHE LOCAL!
      // Se for uma ação de leitura/filtro (e não for Reservas), entrega na mesma hora o que já está no cache
      // e atualiza em segundo plano para nunca travar a tela do professor!
      if (!ehReservaDeAmbiente && ACOES_LEITURA_INSTANTANEA.includes(action)) {
        const cacheImediato = obterRespostaDoCacheInstantaneo(action, bodyObj);
        if (cacheImediato) {
          // Atualiza em 2º plano de forma invisível!
          fetchComTimeoutSeguranca(url, options, 15000).then(resBg => resBg.text()).then(txtBg => {
            if (txtBg && (txtBg.startsWith('{') || txtBg.startsWith('['))) {
              salvarRespostaNoCacheInstantaneo(action, bodyObj, txtBg);
              registrarDataHoraAtualizacaoBanco();
            }
          }).catch(() => {});

          return new Response(cacheImediato, { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
      }

      // 3. EXECUÇÃO ONLINE DIRETA (Quando é Gravação, Login, Reserva ou 1ª leitura sem cache)
      try {
        atualizarSeloTopoSincronizacao('SINCRONIZANDO');
        const response = await fetchComTimeoutSeguranca(url, options, 18000);
        const clone = response.clone();

        clone.text().then(textoResp => {
          if (textoResp && (textoResp.startsWith('{') || textoResp.startsWith('['))) {
            salvarRespostaNoCacheInstantaneo(action, bodyObj, textoResp);
            registrarDataHoraAtualizacaoBanco();

            try {
              const resJson = JSON.parse(textoResp);
              if (action === 'buscarOcorrencias' && Array.isArray(resJson)) {
                const f = bodyObj.filtros || {};
                if (f.ignorarRestricao === true && !f.serie && !f.aluno) {
                  salvarNoLocalStorageSeguro(KEY_TODAS_OCORRENCIAS_OFFLINE, resJson.slice(0, 800));
                }
              }
              if (action === 'fazerLogin' || ACOES_MUTACAO_CADASTROS.includes(action)) {
                if (resJson && (resJson.success || resJson.msg)) {
                  localStorage.removeItem(TIMESTAMP_PREFETCH_KEY);
                  setTimeout(() => window.executarPreCarregamentoTotalOffline(true), 300);
                }
              }
            } catch (e) {}
          } else {
            atualizarSeloTopoSincronizacao();
          }
        }).catch(() => atualizarSeloTopoSincronizacao());

        return response;
      } catch (errRede) {
        atualizarSeloTopoSincronizacao();
        if (!ehReservaDeAmbiente && ACOES_GRAVACAO_OFFLINE[action]) {
          window.enfileirarOperacaoOfflineGlobal(url, bodyObj);
          return new Response(JSON.stringify({
            success: true,
            offline: true,
            msg: 'Conexão instável! Salvo na fila e será sincronizado em segundo plano sem interromper seu uso.'
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
  // 4. SINCRONIZAÇÃO EM 2º PLANO (COM PROTEÇÃO CONTRA LOOP INFINITO!)
  // =========================================================================
  function exibirAvisoFinalDeDadosSincronizados(listaHtmlSincronizados) {
    if (!listaHtmlSincronizados || listaHtmlSincronizados.length === 0) return;
    if (typeof Swal === 'undefined') return;

    Swal.fire({
      title: 'Dados Offline Sincronizados!',
      html: `
        <p class="small text-muted mb-2">A sincronização em segundo plano foi concluída! Os seguintes registros já estão salvos na planilha:</p>
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

    const jaFoiEnviadoPeloSW = await verificarSincronizacoesFeitasComAppFechado();
    if (jaFoiEnviadoPeloSW) return;

    const filaInicial = unificarFilasOfflineNoStorage();
    if (filaInicial.length === 0) {
      window.atualizarBadgeStatusConexaoGlobal();
      return;
    }

    sincronizacaoEmAndamento = true;
    const totalParaEnviar = filaInicial.length;
    const sincronizadosHtml = [];

    try {
      window.atualizarBadgeStatusConexaoGlobal(`Sincronizando em 2º plano (0/${totalParaEnviar})...`);

      for (let i = 0; i < filaInicial.length; i++) {
        if (!navigator.onLine) break;
        const item = filaInicial[i];
        window.atualizarBadgeStatusConexaoGlobal(`Sincronizando em 2º plano (${i + 1}/${totalParaEnviar})...`);

        try {
          const res = await fetchComTimeoutSeguranca(item.url || API_PADRAO_URL, {
            method: 'POST',
            body: JSON.stringify(item.payload)
          }, 15000);

          const texto = await res.text();
          let json = null;
          try { json = JSON.parse(texto); } catch (e) {}

          // Se gravou com sucesso OU se a resposta HTTP foi 200 OK do Apps Script, remove imediatamente da fila para nunca ficar em loop!
          if ((json && (json.success || json.msg || json.jaExiste)) || (res.ok && texto.includes('"success"'))) {
            sincronizadosHtml.push(item.resumoHtml);
            const filaAtual = JSON.parse(localStorage.getItem(FILA_GLOBAL_KEY) || '[]')
              .filter(f => f.idFila !== item.idFila);
            localStorage.setItem(FILA_GLOBAL_KEY, JSON.stringify(filaAtual));
            await espelharFilaParaIndexedDB(filaAtual);
          }
        } catch (e) {
          // Se der timeout, para o ciclo atual e oculta o spinner até a próxima tentativa
          break;
        }
      }
    } finally {
      // GARANTIA ABSOLUTA: Sempre desliga o spinner ao terminar!
      sincronizacaoEmAndamento = false;
      window.atualizarBadgeStatusConexaoGlobal();
    }

    if (sincronizadosHtml.length > 0) {
      registrarDataHoraAtualizacaoBanco();
      localStorage.removeItem(TIMESTAMP_PREFETCH_KEY);
      setTimeout(() => window.executarPreCarregamentoTotalOffline(true), 300);

      window.dispatchEvent(new CustomEvent('eemti-fila-sincronizada'));
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

    if (textoProgressoEmSegundoPlano && sincronizacaoEmAndamento) {
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
      badge.innerHTML = `<i class="bi bi-cloud-arrow-up-fill me-2"></i>Na fila (${fila.length}) — Clique para enviar`;
    } else {
      badge.style.display = 'none';
    }
  };

  window.addEventListener('online', () => {
    atualizarSeloTopoSincronizacao();
    window.atualizarBadgeStatusConexaoGlobal();
    setTimeout(window.sincronizarFilaOfflineGlobal, 300);
    window.executarPreCarregamentoTotalOffline(false);
  });

  window.addEventListener('offline', () => {
    atualizarSeloTopoSincronizacao('OFFLINE');
    window.atualizarBadgeStatusConexaoGlobal();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      verificarSincronizacoesFeitasComAppFechado();
    }
  });

  window.addEventListener('DOMContentLoaded', async () => {
    injetarResponsividadeGlobalEEMTI();
    configurarNavegacaoInteligenteEBotaoVoltar();

    const jaEnviouFechado = await verificarSincronizacoesFeitasComAppFechado();
    unificarFilasOfflineNoStorage();
    window.atualizarBadgeStatusConexaoGlobal();

    if (navigator.onLine) {
      if (!jaEnviouFechado) {
        setTimeout(window.sincronizarFilaOfflineGlobal, 300);
      }
      setTimeout(() => window.executarPreCarregamentoTotalOffline(false), 700);
    }
  });

  // =========================================================================
  // 5. GERADOR UNIVERSAL DE CABEÇALHO PADRÃO COM BRASÃO E FOTO 3×4 PARA PDF
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

    const b64CacheLogo = localStorage.getItem('cache_logo_oficial_eemti_b64');
    const imgLogoDom = document.getElementById('logoEscola') || document.querySelector('.brand-escola img');
    const srcLogo = b64CacheLogo || ((imgLogoDom && imgLogoDom.src) ? imgLogoDom.src : 'LOGO-removebg-preview.png');
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
