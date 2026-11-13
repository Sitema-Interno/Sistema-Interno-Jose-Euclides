// =========================================================================
// MOTOR CENTRAL UNIFICADO (PORTAL-CORE.JS) - VERSÃO DEFINITIVA EEMTI
// 1. CONSULTA OCORRÊNCIAS: ALUNO -> SÉRIE ABAIXO -> PROFESSOR ABAIXO DA SÉRIE
// 2. AEE CORRIGIDO: NOME -> PAI E MÃE ABAIXO -> DATA NASC. + MATRÍCULA NA FRENTE
// 3. RESERVAS PDF: ABRE SELETOR DE PERÍODO (DATA INICIAL E FINAL) AO CLICAR EM PDF
// 4. SUSPENSÕES PDT (4 COLUNAS SEMPRE ALINHADAS):
//    COL 1: ALUNO + SÉRIE + PDT | COL 2: ORIGEM ACIMA + DATA + ÚLT. ABAIXO | COL 3: MOTIVO | COL 4: AÇÕES
// 5. TODOS OS PDFS USAM "brasaoestado.png" + PESQUISA VIVA EM 1ms
// =========================================================================
(function() {
  const FILA_GLOBAL_KEY = 'fila_offline_eemti_v1';
  const LOG_SINCRONIZADOS_KEY = 'log_recem_sincronizados_eemti_v1';
  const SESSAO_JA_SINCRONIZADA_KEY = 'sessao_inicial_sincronizada_eemti_v1';
  const ULTIMA_ATUALIZACAO_STR_KEY = 'ultima_atualizacao_banco_eemti_str';
  const ULTIMO_TOPICO_COLMEIA_KEY = 'ultimo_topico_colmeia_selecionado_eemti';
  const IDB_SYNC_NAME = 'EEMTI_BackgroundSync_DB';
  const IDB_VERSION = 2;
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
  const KEY_LIVROS_BIBLIOTECA_OFFLINE = 'cache_livros_biblioteca_global_v1';

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
  let filtroExclusivoAlunoSelecionado = '';
  let cacheUltimasReservasCarregadas = [];

  // =========================================================================
  // 0. ESTILOS GLOBAIS: SEM ROLAGEM LATERAL E COM DISTRIBUIÇÃO PROPORCIONAL
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
      .main-container, .container, .container-fluid, .card, .table-responsive {
        max-width: 100% !important;
        overflow-x: hidden !important;
        box-sizing: border-box !important;
      }

      table.table, .tabela-enquadrada {
        width: 100% !important;
        max-width: 100% !important;
        table-layout: auto !important;
        border-collapse: collapse !important;
      }
      table.table th, table.table td, .tabela-enquadrada th, .tabela-enquadrada td {
        word-break: normal !important;
        overflow-wrap: break-word !important;
        white-space: normal !important;
        vertical-align: middle !important;
      }

      table.table td .badge {
        white-space: normal !important;
        line-height: 1.2 !important;
        text-align: center !important;
        display: inline-block !important;
        max-width: 100% !important;
      }

      .col-oculta-eemti {
        display: none !important;
      }

      tr.linha-tabela-clicavel-eemti {
        cursor: pointer;
        transition: background-color 0.15s ease;
      }
      tr.linha-tabela-clicavel-eemti:hover {
        background-color: #eff6ff !important;
      }

      .btn-chamada-compacto {
        flex: 0 0 auto !important;
        width: auto !important;
        min-width: 30px !important;
        max-width: 38px !important;
        height: 28px !important;
        padding: 0 7px !important;
        font-weight: 800 !important;
        font-size: 0.74rem !important;
        border-radius: 6px !important;
        line-height: 1 !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        margin: 1px !important;
      }

      td:has(.btn-chamada-compacto),
      th.col-status-compacta-eemti {
        width: 1% !important;
        white-space: nowrap !important;
        text-align: center !important;
      }
      td .d-flex:has(.btn-chamada-compacto),
      td .btn-group:has(.btn-chamada-compacto),
      td div:has(> .btn-chamada-compacto) {
        display: inline-flex !important;
        flex-wrap: nowrap !important;
        justify-content: center !important;
        align-items: center !important;
        gap: 4px !important;
        width: auto !important;
      }

      th.col-nome-larga-eemti,
      td.col-nome-larga-eemti {
        width: 40% !important;
        min-width: 135px !important;
        text-align: left !important;
      }

      th.col-secundaria-larga-eemti,
      td.col-secundaria-larga-eemti {
        width: 32% !important;
        min-width: 115px !important;
        text-align: left !important;
      }

      th.col-acoes-visivel-eemti,
      td.col-acoes-visivel-eemti {
        width: 1% !important;
        min-width: 72px !important;
        white-space: nowrap !important;
        text-align: center !important;
      }

      .d-flex.gap-2, .d-flex.gap-3, .btn-group {
        gap: 4px !important;
      }
      td .btn + .btn, td .btn + button {
        margin-left: 2px !important;
      }

      .barra-legenda-compacta-eemti {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        background: #f8fafc;
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        padding: 7px 12px;
        margin-bottom: 10px;
        font-size: 0.74rem;
        font-weight: 700;
        color: #334155;
      }
      .barra-legenda-compacta-eemti .item-leg {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

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

      .menu-autocompletar-eemti {
        position: absolute;
        left: 0;
        right: 0;
        top: 100%;
        z-index: 9999;
        background: #ffffff;
        border: 1px solid #94a3b8;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(15, 23, 42, 0.16);
        max-height: 220px;
        overflow-y: auto;
        margin-top: 3px;
      }
      .menu-autocompletar-eemti .item-auto-eemti {
        padding: 8px 12px;
        font-size: 0.78rem;
        font-weight: 700;
        color: #1e293b;
        border-bottom: 1px solid #f1f5f9;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .menu-autocompletar-eemti .item-auto-eemti:hover {
        background: #eff6ff;
        color: #15438c;
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
          height: 58px !important;
          width: auto !important;
        }
        .brand-titulo-principal {
          font-size: 1.35rem !important;
        }
        .brand-subtitulo {
          font-size: 0.55rem !important;
        }
        .brand-slogan {
          font-size: 1.08rem !important;
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
          padding: 6px 4px 24px 4px !important;
        }
        .card {
          padding: 10px 6px !important;
          border-radius: 12px !important;
          margin-bottom: 12px !important;
        }
        .nav-tabs {
          display: flex !important;
          flex-wrap: wrap !important;
          gap: 3px !important;
        }
        .nav-tabs .nav-item {
          flex: 1 1 auto !important;
        }
        .nav-tabs .nav-link {
          font-size: 0.72rem !important;
          padding: 6px 7px !important;
          text-align: center !important;
        }
        table.table th {
          font-size: 0.61rem !important;
          padding: 5px 2px !important;
          line-height: 1.1 !important;
        }
        table.table td {
          font-size: 0.68rem !important;
          padding: 5px 2px !important;
          line-height: 1.18 !important;
        }
        table.table td .btn:not(.btn-chamada-compacto) {
          font-size: 0.62rem !important;
          padding: 3px 5px !important;
          margin: 1px 0 !important;
        }
        .btn-chamada-compacto {
          min-width: 27px !important;
          max-width: 34px !important;
          height: 26px !important;
          padding: 0 5px !important;
          font-size: 0.7rem !important;
        }
        table.table td .badge {
          font-size: 0.57rem !important;
          padding: 2px 4px !important;
        }
        table.table td img {
          max-width: 38px !important;
          max-height: 50px !important;
        }
        th.col-nome-larga-eemti,
        td.col-nome-larga-eemti {
          width: 36% !important;
          min-width: 105px !important;
        }
        th.col-secundaria-larga-eemti,
        td.col-secundaria-larga-eemti {
          width: 30% !important;
          min-width: 90px !important;
        }
        th.col-acoes-visivel-eemti,
        td.col-acoes-visivel-eemti {
          min-width: 58px !important;
        }
        .col-oculta-mobile-eemti {
          display: none !important;
        }
        .barra-legenda-compacta-eemti {
          font-size: 0.68rem;
          padding: 6px 8px;
          gap: 6px;
        }
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  injetarResponsividadeGlobalEEMTI();

  // =========================================================================
  // 1. SEPARAÇÃO EXATA DAS IMAGENS:
  // - TOPO DAS PÁGINAS E TODOS OS PDFs: "brasaoestado.png"
  // - MARCA D'ÁGUA DE FUNDO (.watermark-brasao-fundo): "LOGO-removebg-preview.png"
  // =========================================================================
  function aplicarImagensOficiaisTopoEMarcaDagua() {
    const b64BrasaoTopo = localStorage.getItem('cache_brasao_estado_topo_b64');
    const b64LogoMarcaDagua = localStorage.getItem('cache_logo_escola_marcadagua_b64');

    document.querySelectorAll('.brand-escola img, header img#logoEscola').forEach(img => {
      img.onerror = function() {
        if (this.src.endsWith('brasaoestado.png') && !this.src.endsWith('brasaoestado.png.png')) {
          this.src = 'brasaoestado.png.png';
        } else if (b64BrasaoTopo && this.src !== b64BrasaoTopo) {
          this.src = b64BrasaoTopo;
        }
      };
      const srcAtual = String(img.getAttribute('src') || '');
      if (!navigator.onLine && b64BrasaoTopo) {
        if (img.src !== b64BrasaoTopo) img.src = b64BrasaoTopo;
      } else if (!srcAtual.includes('brasaoestado.png') && !srcAtual.startsWith('data:image')) {
        img.src = 'brasaoestado.png';
      }
    });

    document.querySelectorAll('img.watermark-brasao-fundo').forEach(img => {
      img.onerror = function() {
        if (b64LogoMarcaDagua && this.src !== b64LogoMarcaDagua) {
          this.src = b64LogoMarcaDagua;
        }
      };
      const srcAtual = String(img.getAttribute('src') || '');
      if (!navigator.onLine && b64LogoMarcaDagua) {
        if (img.src !== b64LogoMarcaDagua) img.src = b64LogoMarcaDagua;
      } else if (!srcAtual.includes('LOGO-removebg-preview.png') && !srcAtual.startsWith('data:image')) {
        img.src = 'LOGO-removebg-preview.png';
      }
    });
  }

  function configurarInterceptadorBrasaoNosPdfs() {
    if (!window.jspdf || !window.jspdf.jsPDF || window.jspdf.jsPDF._eemtiBrasaoHooked) return;
    try {
      const proto = window.jspdf.jsPDF.API || window.jspdf.jsPDF.prototype;
      if (proto && typeof proto.addImage === 'function') {
        const origAddImage = proto.addImage;
        proto.addImage = function(imageData, format, x, y, w, h) {
          const b64BrasaoEstado = localStorage.getItem('cache_brasao_estado_topo_b64');
          const b64LogoAntiga = localStorage.getItem('cache_logo_escola_marcadagua_b64');
          const ehPosicaoLogoCabecalhoPdf = (typeof x === 'number' && x <= 25 && typeof y === 'number' && y <= 20 && Math.abs((w || 0) - (h || 0)) <= 4);
          if (b64BrasaoEstado && (ehPosicaoLogoCabecalhoPdf || (b64LogoAntiga && imageData === b64LogoAntiga))) {
            imageData = b64BrasaoEstado;
          }
          return origAddImage.apply(this, arguments);
        };
        window.jspdf.jsPDF._eemtiBrasaoHooked = true;
      }
    } catch (e) {}
  }

  // =========================================================================
  // 2. RELATÓRIO PDF DE RESERVAS COM SELEÇÃO DE PERÍODO (DATA INICIAL E FINAL)
  // =========================================================================
  function converterDataBrOuIsoParaTimestamp(strData) {
    if (!strData) return 0;
    const s = String(strData).trim();
    const mBr = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (mBr) return new Date(Number(mBr[3]), Number(mBr[2]) - 1, Number(mBr[1]), 12, 0, 0).getTime();
    const mIso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (mIso) return new Date(Number(mIso[1]), Number(mIso[2]) - 1, Number(mIso[3]), 12, 0, 0).getTime();
    return 0;
  }

  window.abrirModalPdfReservasPorPeriodoEEMTI = async function() {
    if (typeof Swal === 'undefined') return;
    const hojeIso = new Date().toISOString().slice(0, 10);
    const inicioMesIso = hojeIso.slice(0, 8) + '01';

    const { value: datasEscolhidas } = await Swal.fire({
      title: '<span style="font-size:1.05rem;font-weight:800;color:#15438c;"><i class="bi bi-file-earmark-pdf-fill text-danger me-2"></i>Relatório de Reservas por Período</span>',
      html: `
        <div class="text-start mt-2" style="font-size:0.85rem;">
          <p class="text-muted small mb-3">Selecione a data inicial e a data final para gerar o relatório em PDF:</p>
          <div class="mb-3">
            <label class="form-label fw-bold text-dark small mb-1">Data Inicial *</label>
            <input type="date" id="swalDataIniReservaPdf" class="form-control fw-bold" value="${inicioMesIso}">
          </div>
          <div class="mb-1">
            <label class="form-label fw-bold text-dark small mb-1">Data Final *</label>
            <input type="date" id="swalDataFimReservaPdf" class="form-control fw-bold" value="${hojeIso}">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: '<i class="bi bi-file-earmark-pdf-fill me-1"></i>Gerar PDF',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const dIni = document.getElementById('swalDataIniReservaPdf').value;
        const dFim = document.getElementById('swalDataFimReservaPdf').value;
        if (!dIni || !dFim) {
          Swal.showValidationMessage('Selecione a Data Inicial e a Data Final!');
          return false;
        }
        if (dIni > dFim) {
          Swal.showValidationMessage('A Data Inicial não pode ser maior que a Data Final!');
          return false;
        }
        return { inicioIso: dIni, fimIso: dFim };
      }
    });

    if (!datasEscolhidas) return;

    const tsIni = new Date(datasEscolhidas.inicioIso + 'T00:00:00').getTime();
    const tsFim = new Date(datasEscolhidas.fimIso + 'T23:59:59').getTime();
    const dtIniBr = datasEscolhidas.inicioIso.split('-').reverse().join('/');
    const dtFimBr = datasEscolhidas.fimIso.split('-').reverse().join('/');

    Swal.fire({ title: 'Gerando Relatório PDF...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      const pathLower = window.location.pathname.toLowerCase();
      const ehReservaLivros = pathLower.includes('reservas-livros');

      if (!window.jspdf || !window.jspdf.jsPDF) {
        Swal.close();
        window.print();
        return;
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('l', 'mm', 'a4');

      if (ehReservaLivros) {
        const resEmp = await _fetchNativo(API_PADRAO_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'listarDadosEmprestimosBiblioteca' }),
          redirect: 'follow'
        }).then(r => r.json()).catch(() => ({ emprestimos: [] }));

        const listaEmp = (resEmp && Array.isArray(resEmp.emprestimos)) ? resEmp.emprestimos : [];
        const filtrados = listaEmp.filter(item => {
          const ts = converterDataBrOuIsoParaTimestamp(item.dataEmprestimo);
          return ts >= tsIni && ts <= tsFim;
        });

        const yStart = await window.desenharCabecalhoPadraoEEMTI(doc, {
          tituloDocumento: 'RELATÓRIO DE EMPRÉSTIMOS E RESERVAS DA BIBLIOTECA',
          subtitulo1: `Período Selecionado: ${dtIniBr} a ${dtFimBr}`,
          subtitulo2: `Total de Registros no Período: ${filtrados.length}`
        });

        const rowsPdf = filtrados.map((it, i) => [
          i + 1,
          it.dataEmprestimo || '-',
          it.aluno || '-',
          window.abreviarSerieParaExibicao(it.serie || '-'),
          it.titulo || '-',
          it.dataPrevista || '-',
          it.status || '-'
        ]);

        doc.autoTable({
          startY: yStart,
          head: [['#', 'DATA EMPRÉSTIMO', 'ALUNO(A)', 'SÉRIE', 'LIVRO / OBRA', 'DEVOLUÇÃO PREV.', 'STATUS']],
          body: rowsPdf.length > 0 ? rowsPdf : [['-', '-', 'Nenhum empréstimo registrado no período selecionado', '-', '-', '-', '-']],
          theme: 'grid',
          styles: { fontSize: 8, cellPadding: 2.2 },
          headStyles: { fillColor: [21, 67, 140], textColor: 255, fontStyle: 'bold' }
        });

        Swal.close();
        doc.save(`Relatorio_Biblioteca_${datasEscolhidas.inicioIso}_a_${datasEscolhidas.fimIso}.pdf`);
        return;
      }

      // Caso padrão: Reservas de Ambientes e Equipamentos (reservas.html)
      let listaRes = cacheUltimasReservasCarregadas;
      if (!Array.isArray(listaRes) || listaRes.length === 0) {
        const rApi = await _fetchNativo(API_PADRAO_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'listarReservas' }),
          redirect: 'follow'
        }).then(r => r.json()).catch(() => ({ lista: [] }));
        listaRes = (rApi && Array.isArray(rApi.lista)) ? rApi.lista : [];
      }

      const reservasNoPeriodo = listaRes
        .filter(item => {
          const ts = converterDataBrOuIsoParaTimestamp(item.data);
          return ts >= tsIni && ts <= tsFim;
        })
        .sort((a, b) => converterDataBrOuIsoParaTimestamp(a.data) - converterDataBrOuIsoParaTimestamp(b.data));

      const yStart = await window.desenharCabecalhoPadraoEEMTI(doc, {
        tituloDocumento: 'RELATÓRIO DE RESERVAS DE AMBIENTES E EQUIPAMENTOS',
        subtitulo1: `Período Selecionado: ${dtIniBr} até ${dtFimBr}`,
        subtitulo2: `Total de Reservas no Período: ${reservasNoPeriodo.length}`
      });

      const corpoTabela = reservasNoPeriodo.map((r, idx) => {
        const aulasFormatadas = Array.isArray(r.aulas)
          ? r.aulas.map((val, i) => val ? `${i + 1}ª Aula (${val})` : '').filter(Boolean).join(', ')
          : '-';
        return [
          idx + 1,
          r.data || '-',
          r.ambiente || '-',
          r.professor || '-',
          aulasFormatadas || 'Reservado'
        ];
      });

      doc.autoTable({
        startY: yStart,
        head: [['#', 'DATA', 'AMBIENTE / EQUIPAMENTO', 'PROFESSOR(A) SOLICITANTE', 'AULAS / HORÁRIOS RESERVADOS']],
        body: corpoTabela.length > 0 ? corpoTabela : [['-', '-', 'Nenhuma reserva encontrada no período selecionado', '-', '-']],
        theme: 'grid',
        styles: { fontSize: 8.5, cellPadding: 2.5 },
        headStyles: { fillColor: [21, 67, 140], textColor: 255, fontStyle: 'bold' }
      });

      Swal.close();
      doc.save(`Relatorio_Reservas_${datasEscolhidas.inicioIso}_a_${datasEscolhidas.fimIso}.pdf`);
    } catch (errPdf) {
      Swal.fire('Erro', 'Não foi possível gerar o PDF: ' + errPdf.message, 'error');
    }
  };

  function vincularBotaoPdfReservasComSeletorDePeriodo() {
    const pathLower = window.location.pathname.toLowerCase();
    if (!pathLower.includes('reservas')) return;

    // Intercepta botões de PDF existentes na página de Reservas ou injeta um botão "Relatório PDF por Período" se não houver
    const botoesPdf = Array.from(document.querySelectorAll('button, a.btn')).filter(b => {
      const txt = (b.textContent || '').toUpperCase();
      const onc = (b.getAttribute('onclick') || '').toUpperCase();
      return txt.includes('PDF') || onc.includes('PDF');
    });

    if (botoesPdf.length > 0) {
      botoesPdf.forEach(btn => {
        if (btn._eemtiReservaPdfBound) return;
        btn._eemtiReservaPdfBound = true;
        btn.removeAttribute('onclick');
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          window.abrirModalPdfReservasPorPeriodoEEMTI();
        }, true);
      });
    } else {
      const cabecalhoCard = document.querySelector('.card-header-custom, .card h5, .card h4');
      if (cabecalhoCard && !document.getElementById('btnPdfReservasPorPeriodoEEMTI')) {
        const btnNovo = document.createElement('button');
        btnNovo.type = 'button';
        btnNovo.id = 'btnPdfReservasPorPeriodoEEMTI';
        btnNovo.className = 'btn btn-danger btn-sm fw-bold rounded-pill px-3 ms-auto';
        btnNovo.innerHTML = `<i class="bi bi-file-earmark-pdf-fill me-1"></i>Relatório PDF (Período)`;
        btnNovo.onclick = () => window.abrirModalPdfReservasPorPeriodoEEMTI();
        cabecalhoCard.appendChild(btnNovo);
      }
    }
  }

  // =========================================================================
  // 3. FUNÇÕES DE FORMATAÇÃO E MODAIS DE DETALHES AO CLICAR NA LINHA
  // =========================================================================
  window.abreviarSerieParaExibicao = function(textoSerie) {
    if (!textoSerie) return "";
    return String(textoSerie)
      .replace(/\b([123][ªº°])\s*(?:SÉRIE|SERIE|ANO)\s*([A-Z])\b/gi, '$1 $2')
      .replace(/\b([123][ªº°])\s*(?:SÉRIE|SERIE)\b/gi, '$1 SÉRIE');
  };

  function extrairApenasCpfFormatado(textoBruto) {
    if (!textoBruto) return "Não informado";
    const str = String(textoBruto);
    const mPontuado = str.match(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/);
    if (mPontuado) return mPontuado[0];

    const todosNumeros = str.match(/\b\d{9,11}\b/g) || [];
    for (let i = 0; i < todosNumeros.length; i++) {
      const n = todosNumeros[i];
      if (n.length === 11) {
        return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9, 11)}`;
      }
    }
    if (todosNumeros.length > 1) return todosNumeros[todosNumeros.length - 1];
    if (todosNumeros.length === 1 && todosNumeros[0].length >= 10) return todosNumeros[0];
    return "Não informado";
  }

  function formatarSexoPorExtenso(sexoBruto) {
    const s = String(sexoBruto || '').trim().toUpperCase();
    if (s.startsWith('M')) return 'Masculino';
    if (s.startsWith('F')) return 'Feminino';
    return '';
  }

  function obterDadosCadastraisAlunoCache(nomeAluno) {
    const nomeLimpo = String(nomeAluno || '').replace(/\s+/g, ' ').trim().toUpperCase();
    const alunosCache = JSON.parse(localStorage.getItem(window.KEY_ALUNOS_UNIVERSAL_EEMTI) || '[]');
    const baseAl = alunosCache.find(a => a.nome === nomeLimpo) || {};
    const det = mapaFotosAlunosCacheMemoria['ALUNO_' + nomeLimpo] || {};
    return Object.assign({}, baseAl, det);
  }

  window.abrirModalFichaCompletaAlunoEEMTI = async function(nomeAlunoClicado, serieHint, extrasLinhaHtml) {
    const nomeLimpo = String(nomeAlunoClicado || "").replace(/\s+/g, " ").trim().toUpperCase();
    if (!nomeLimpo || typeof Swal === 'undefined') return;

    let infoDet = obterDadosCadastraisAlunoCache(nomeLimpo);

    if ((!infoDet.mae && !infoDet.endereco) && navigator.onLine) {
      try {
        const resInd = await Promise.race([
          fetchComTimeoutSeguranca(API_PADRAO_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'obterFotoAlunoIndividual', aluno: nomeLimpo })
          }, 3500).then(r => r.json()),
          new Promise(r => setTimeout(() => r(null), 3500))
        ]);
        if (resInd && resInd.success) {
          infoDet = Object.assign({}, infoDet, resInd);
          salvarFotoNoIndexedDB('ALUNO_' + nomeLimpo, infoDet);
        }
      } catch (e) {}
    }

    const fotoSrc = infoDet.foto || '';
    const serieExib = infoDet.serie || serieHint || '-';
    const anoExib = infoDet.ano || '2026';
    const sexoExib = formatarSexoPorExtenso(infoDet.sexo) || infoDet.sexo || '-';
    const bfExib = String(infoDet.bolsaFamilia || 'NÃO').toUpperCase();
    const pmExib = String(infoDet.peDeMeia || 'NÃO').toUpperCase();
    const maeExib = infoDet.mae || 'NÃO INFORMADO';
    const telMaeExib = infoDet.telMae || '-';
    const paiExib = infoDet.pai || 'NÃO INFORMADO';
    const telPaiExib = infoDet.telPai || '-';
    const locExib = infoDet.localidade || '-';
    const endExib = infoDet.endereco || '-';

    const htmlFoto = fotoSrc && String(fotoSrc).startsWith('data:image')
      ? `<img src="${fotoSrc}" style="width:92px;height:122px;object-fit:cover;border-radius:10px;border:2px solid #15438c;box-shadow:0 4px 10px rgba(0,0,0,0.12);">`
      : `<div style="width:92px;height:122px;border-radius:10px;border:2px dashed #94a3b8;display:flex;align-items:center;justify-content:center;background:#f8fafc;color:#64748b;font-size:2.2rem;"><i class="bi bi-person-bounding-box"></i></div>`;

    Swal.fire({
      title: `<span style="font-size:1.02rem;font-weight:800;color:#15438c;"><i class="bi bi-person-vcard-fill me-2"></i>Ficha Completa do(a) Aluno(a)</span>`,
      html: `
        <div class="text-start mt-2" style="font-size:0.83rem;">
          <div class="d-flex align-items-center gap-3 p-2 rounded bg-light border mb-3">
            <div class="text-center">
              ${htmlFoto}
              <div class="fw-bold text-secondary mt-1" style="font-size:0.7rem;">${sexoExib}</div>
            </div>
            <div>
              <div class="fw-bold text-dark" style="font-size:0.96rem;line-height:1.2;">${nomeLimpo}</div>
              <div class="mt-1">
                <span class="badge bg-primary">${serieExib}</span>
                <span class="badge bg-secondary">Ano: ${anoExib}</span>
              </div>
              <div class="mt-2 d-flex gap-1 flex-wrap">
                <span class="badge ${bfExib === 'SIM' ? 'bg-success' : 'bg-secondary'}">BF (Bolsa Família): ${bfExib}</span>
                <span class="badge ${pmExib === 'SIM' ? 'bg-success' : 'bg-secondary'}">PM (Pé-de-Meia): ${pmExib}</span>
              </div>
            </div>
          </div>

          ${extrasLinhaHtml ? `<div class="p-2 rounded border border-primary-subtle bg-primary-subtle bg-opacity-10 mb-2">${extrasLinhaHtml}</div>` : ''}

          <div class="p-2 rounded border mb-2">
            <div class="fw-bold text-primary small mb-1"><i class="bi bi-people-fill me-1"></i>Filiação e Contatos</div>
            <div><b>Mãe:</b> ${maeExib} • <b>Contato:</b> ${telMaeExib}</div>
            <div class="mt-1"><b>Pai:</b> ${paiExib} • <b>Contato:</b> ${telPaiExib}</div>
          </div>

          <div class="p-2 rounded border">
            <div class="fw-bold text-primary small mb-1"><i class="bi bi-geo-alt-fill me-1"></i>Localidade e Endereço</div>
            <div><b>Localidade:</b> ${locExib}</div>
            <div><b>Endereço:</b> ${endExib}</div>
          </div>
        </div>
      `,
      confirmButtonColor: '#15438c',
      confirmButtonText: 'Fechar'
    });
  };

  function abrirModalGenericoDaLinhaDaTabela(tr) {
    if (typeof Swal === 'undefined') return;
    const pares = tr._dadosOriginaisLinhaEEMTI || [];
    if (pares.length === 0) return;

    const parAluno = pares.find(p => p.titulo.includes('ALUNO') || p.titulo.includes('ESTUDANTE'));
    const path = window.location.pathname.toLowerCase();

    if (parAluno && (path.includes('cadastro-alunos') || path.includes('situacao-aluno') || path.includes('aee') || path.includes('busca-ativa') || path.includes('atendimento'))) {
      const nomeBase = (tr.getAttribute('data-nome-aluno-limpo') || parAluno.valor.split('\n')[0]).trim();
      const parSerie = pares.find(p => p.titulo.includes('SÉRIE') || p.titulo.includes('TURMA'));
      const htmlExtras = pares
        .filter(p => !p.titulo.includes('AÇÕES') && !p.titulo.includes('FOTO') && p.valor)
        .map(p => `<div class="mb-1"><b>${p.titulo}:</b> ${p.valor}</div>`)
        .join('');
      window.abrirModalFichaCompletaAlunoEEMTI(nomeBase, parSerie ? parSerie.valor : '', htmlExtras);
      return;
    }

    const htmlDetalhes = pares
      .filter(p => !p.titulo.includes('AÇÕES') && !p.titulo.includes('PDF') && p.valor !== '')
      .map(p => `
        <div class="p-2 border-bottom">
          <div class="text-uppercase fw-bold text-secondary" style="font-size:0.68rem;">${p.titulo}</div>
          <div class="fw-semibold text-dark mt-1" style="font-size:0.86rem;white-space:pre-wrap;">${p.valor}</div>
        </div>
      `).join('');

    Swal.fire({
      title: `<span style="font-size:1rem;font-weight:800;color:#15438c;"><i class="bi bi-card-list me-2"></i>Detalhes Completos do Registro</span>`,
      html: `<div class="text-start border rounded bg-light mt-2" style="max-height:360px;overflow-y:auto;">${htmlDetalhes}</div>`,
      confirmButtonColor: '#15438c',
      confirmButtonText: 'Fechar'
    });
  }

  // =========================================================================
  // 4. REORGANIZADOR DAS TABELAS E BOTÕES
  // =========================================================================
  function inserirLegendaAcimaDaTabela(tabela, tipoLegenda) {
    if (!tabela || !tabela.parentElement) return;
    const idLegenda = 'legenda_compacta_' + tipoLegenda;
    if (tabela.parentElement.querySelector('#' + idLegenda)) return;

    const divLeg = document.createElement('div');
    divLeg.id = idLegenda;
    divLeg.className = 'barra-legenda-compacta-eemti';

    if (tipoLegenda === 'ATIVIDADES') {
      divLeg.innerHTML = `
        <span class="text-primary fw-bolder"><i class="bi bi-info-circle-fill me-1"></i>Legenda:</span>
        <span class="item-leg"><span class="badge bg-success">R</span> Realizou</span>
        <span class="item-leg"><span class="badge bg-danger">NR</span> Não Realizou</span>
        <span class="item-leg"><span class="badge bg-warning text-dark">A</span> Ausente</span>
      `;
    } else if (tipoLegenda === 'CHAMADA_SEC') {
      divLeg.innerHTML = `
        <span class="text-primary fw-bolder"><i class="bi bi-info-circle-fill me-1"></i>Legenda:</span>
        <span class="item-leg"><span class="badge bg-success">P</span> Presente</span>
        <span class="item-leg"><span class="badge bg-danger">F</span> Falta</span>
        <span class="item-leg"><span class="badge bg-warning text-dark">FJ</span> Falta Justificada</span>
        <span class="item-leg"><span class="badge bg-info text-dark">A</span> Atestado</span>
      `;
    } else if (tipoLegenda === 'GERENCIAR_ALUNOS_BF_PM') {
      divLeg.innerHTML = `
        <span class="text-primary fw-bolder"><i class="bi bi-info-circle-fill me-1"></i>Legenda de Benefícios:</span>
        <span class="item-leg"><span class="badge bg-success">BF</span> Recebe Bolsa Família</span>
        <span class="item-leg"><span class="badge bg-success">PM</span> Recebe Pé-de-Meia</span>
        <span class="item-leg text-muted small">(Cinza = Não recebe • Clique na linha do aluno para abrir a ficha completa)</span>
      `;
    }

    tabela.parentElement.insertBefore(divLeg, tabela);
  }

  function aplicarCompactacaoVisualNasTabelasEBotoes() {
    aplicarImagensOficiaisTopoEMarcaDagua();
    configurarInterceptadorBrasaoNosPdfs();
    vincularBotaoPdfReservasComSeletorDePeriodo();

    let temBotoesAtividade = false;
    let temBotoesChamadaSec = false;
    let tabelaAtividadeAlvo = null;
    let tabelaChamadaSecAlvo = null;

    document.querySelectorAll('table button, table .btn, table label.btn').forEach(btn => {
      const txt = (btn.textContent || '').trim();
      const tbPai = btn.closest('table');

      if (txt === 'Presente (P)' || txt === 'Presente' || txt === 'P') {
        if (txt !== 'P') btn.textContent = 'P';
        btn.title = 'Presente (P)';
        btn.classList.add('btn-chamada-compacto');
        btn.classList.remove('w-100', 'flex-fill', 'flex-grow-1');
        temBotoesChamadaSec = true;
        tabelaChamadaSecAlvo = tbPai;
      } else if (txt === 'Falta (F)' || txt === 'Falta' || (txt === 'F' && btn.classList.contains('btn-chamada-compacto'))) {
        if (txt !== 'F') btn.textContent = 'F';
        btn.title = 'Falta (F)';
        btn.classList.add('btn-chamada-compacto');
        btn.classList.remove('w-100', 'flex-fill', 'flex-grow-1');
        temBotoesChamadaSec = true;
        tabelaChamadaSecAlvo = tbPai;
      } else if (txt === 'Justificada (FJ)' || txt === 'Falta Justificada (FJ)' || txt === 'Justificada' || txt === 'FJ') {
        if (txt !== 'FJ') btn.textContent = 'FJ';
        btn.title = 'Falta Justificada (FJ)';
        btn.classList.add('btn-chamada-compacto');
        btn.classList.remove('w-100', 'flex-fill', 'flex-grow-1');
        temBotoesChamadaSec = true;
        tabelaChamadaSecAlvo = tbPai;
      } else if (txt === 'Atestado (A)' || txt === 'Atestado') {
        btn.textContent = 'A';
        btn.title = 'Atestado (A)';
        btn.classList.add('btn-chamada-compacto');
        btn.classList.remove('w-100', 'flex-fill', 'flex-grow-1');
        temBotoesChamadaSec = true;
        tabelaChamadaSecAlvo = tbPai;
      }

      if (txt === 'Realizou' || (txt === 'R' && btn.classList.contains('btn-chamada-compacto'))) {
        if (txt !== 'R') btn.textContent = 'R';
        btn.title = 'Realizou (R)';
        btn.classList.add('btn-chamada-compacto');
        btn.classList.remove('w-100', 'flex-fill', 'flex-grow-1');
        temBotoesAtividade = true;
        tabelaAtividadeAlvo = tbPai;
      } else if (txt === 'Não Realizou' || txt === 'Nao Realizou' || txt === 'NR') {
        if (txt !== 'NR') btn.textContent = 'NR';
        btn.title = 'Não Realizou (NR)';
        btn.classList.add('btn-chamada-compacto');
        btn.classList.remove('w-100', 'flex-fill', 'flex-grow-1');
        temBotoesAtividade = true;
        tabelaAtividadeAlvo = tbPai;
      } else if (txt === 'Ausente') {
        btn.textContent = 'A';
        btn.title = 'Ausente (A)';
        btn.classList.add('btn-chamada-compacto');
        btn.classList.remove('w-100', 'flex-fill', 'flex-grow-1');
        temBotoesAtividade = true;
        tabelaAtividadeAlvo = tbPai;
      }

      if (txt.includes('Editar / Foto') || txt === 'Editar') {
        btn.innerHTML = `<i class="bi bi-pencil-square"></i>`;
        btn.title = 'Editar';
        btn.classList.add('px-2', 'py-1');
      }
    });

    if (temBotoesAtividade && tabelaAtividadeAlvo) {
      inserirLegendaAcimaDaTabela(tabelaAtividadeAlvo, 'ATIVIDADES');
    }
    if (temBotoesChamadaSec && tabelaChamadaSecAlvo) {
      inserirLegendaAcimaDaTabela(tabelaChamadaSecAlvo, 'CHAMADA_SEC');
    }

    const pathLower = window.location.pathname.toLowerCase();

    document.querySelectorAll('table.table').forEach(tabela => {
      const ths = Array.from(tabela.querySelectorAll('thead th'));
      if (ths.length === 0) return;

      // Guarda os títulos originais de cada coluna antes de qualquer modificação para nunca perder a referência quando a tabela for filtrada!
      if (!tabela._titulosOriginaisThEEMTI) {
        tabela._titulosOriginaisThEEMTI = ths.map(th => (th.textContent || '').replace(/\s+/g, ' ').trim().toUpperCase());
      }
      const titulosOriginais = tabela._titulosOriginaisThEEMTI;

      let idxFoto = -1;
      let idxColStatusFoto = -1;
      let idxBeneficios = -1;
      let idxAluno = -1;
      let idxSerie = -1;
      let idxSeriePdtSusp = -1;
      let idxOrigemSusp = -1;
      let idxInicioSusp = -1;
      let idxMotivoSusp = -1;
      let idxBimestre = -1;
      let idxData = -1;
      let idxDia = -1;
      let idxTempo = -1;
      let idxEletiva = -1;
      let idxProfessor = -1;
      let idxCh = -1;
      let idxNota = -1;
      let idxFaltas = -1;
      let idxFreqPerc = -1;
      let idxOcorrencia = -1;
      let idxGravidade = -1;
      let idxObs = -1;
      let idxMatCpf = -1;
      let idxNascimento = -1;
      let idxDeficiencia = -1;
      let idxLaudo = -1;
      let idxResp = -1;
      let idxMotivoBuscaAtiva = -1;
      let idxStatusBuscaAtiva = -1;
      let idxAcaoBuscaAtiva = -1;
      let idxAcoesBotoes = -1;

      titulosOriginais.forEach((t, idx) => {
        const th = ths[idx];
        if (!th) return;

        if (t.includes('FOTO 3X4') || t === 'FOTO') idxFoto = idx;
        if (t.includes('STATUS DA FOTO') || t === 'STATUS FOTO') idxColStatusFoto = idx;
        if (t.includes('BENEFÍCIOS') || t.includes('BENEFICIOS')) idxBeneficios = idx;
        if (t.includes('ALUNO') || t.includes('ESTUDANTE')) {
          idxAluno = idx;
          th.classList.add('col-nome-larga-eemti');
        }
        if (t === 'STATUS' || t.includes('CATEGORIA DA ATIVIDADE')) {
          th.classList.add('col-status-compacta-eemti');
        }
        if (t.includes('SÉRIE / PDT') || t.includes('SERIE / PDT')) idxSeriePdtSusp = idx;
        if (t === 'ORIGEM') idxOrigemSusp = idx;
        if (t.includes('INÍCIO DA SUSPENSÃO') || t.includes('INICIO DA SUSPENSAO') || t.includes('ORIGEM / INÍCIO')) idxInicioSusp = idx;
        if (t.includes('MOTIVO / CRITÉRIO') || t.includes('MOTIVO / CRITERIO')) idxMotivoSusp = idx;

        if (t === 'SÉRIE' || t === 'SERIE' || t === 'TURMA' || t === 'SÉRIE / TURMA' || t === 'SERIE / TURMA') idxSerie = idx;
        if (t.includes('BIMESTRE')) idxBimestre = idx;
        if (t === 'DATA' || t.includes('DATA / HORA') || t.includes('SEMESTRE') || t.includes('ANO / SEM') || t === 'DATA REG.') idxData = idx;
        if (t.includes('DIA')) idxDia = idx;
        if (t.includes('TEMPO')) idxTempo = idx;
        if (t.includes('ELETIVA')) idxEletiva = idx;
        if (t.includes('PROFESSOR') || t.includes('REGISTRADO POR')) idxProfessor = idx;
        if (t === 'C.H' || t.includes('CARGA')) idxCh = idx;
        if (t.includes('NOTA')) idxNota = idx;
        if (t.includes('FALTA')) idxFaltas = idx;
        if (t.includes('FREQ') && !t.includes('ALIMENTAR')) idxFreqPerc = idx;
        if (t.includes('OCORRÊNCIA') || t.includes('OCORRENCIA')) idxOcorrencia = idx;
        if (t.includes('GRAVIDADE')) idxGravidade = idx;
        if (t.includes('OBSERVA') || t.includes('PARECER')) idxObs = idx;
        if (t.includes('MATRÍCULA') || t.includes('MATRICULA') || t.includes('CPF')) idxMatCpf = idx;
        if (t.includes('NASCIMENTO') || t.includes('DATA NASC') || t === 'NASC.') idxNascimento = idx;
        if (t.includes('DEFICIÊNCIA') || t.includes('DEFICIENCIA') || t.includes('NECESSIDADE')) idxDeficiencia = idx;
        if (t.includes('LAUDO')) idxLaudo = idx;
        if (t.includes('RESPONSÁVEL') || t.includes('RESPONSAVEL')) idxResp = idx;
        if (t.includes('DESCRIÇÃO') || t.includes('DESCRICAO') || t.includes('MOTIVO') || t.includes('SITUAÇÃO')) idxMotivoBuscaAtiva = idx;
        if (t.includes('STATUS') || t.includes('RESULTADO')) idxStatusBuscaAtiva = idx;
        if (t.includes('AÇÃO') || t.includes('ACAO') || t.includes('ENCAMINHAMENTO')) {
          if (!t.includes('AÇÕES') && !t.includes('ACOES')) idxAcaoBuscaAtiva = idx;
        }
        if (t.includes('AÇÕES') || t.includes('ACOES') || t === 'OPÇÕES') {
          idxAcoesBotoes = idx;
          th.classList.add('col-acoes-visivel-eemti');
        }
      });

      // =====================================================================
      // 1. PAINEL DE ALUNOS NECESSITADOS DE SUSPENSÃO (atendimento-alunos.html)
      // Garante 4 colunas perfeitamente alinhadas tanto na 1ª abertura quanto ao trocar o filtro de turma!
      // Col 1: Aluno + Série abaixo + PDT abaixo | Col 2: Origem acima + Data + Últ. abaixo | Col 3: Motivo | Col 4: Ações
      // =====================================================================
      const ehTabelaSuspensaoPdt = (
        tabela.querySelector('#tbodyAlunosSuspensao') !== null ||
        (idxAluno === 0 && idxSeriePdtSusp === 1 && idxOrigemSusp === 2 && idxInicioSusp === 3)
      );
      if (ehTabelaSuspensaoPdt && ths.length >= 6) {
        ths[1].classList.add('col-oculta-eemti'); // Oculta SÉRIE / PDT separada
        ths[2].classList.add('col-oculta-eemti'); // Oculta ORIGEM separada
        ths[0].textContent = 'ALUNO(A) / SÉRIE / PDT';
        ths[0].classList.add('col-nome-larga-eemti');
        ths[0].style.width = '36%';
        ths[3].textContent = 'ORIGEM / INÍCIO (HOJE)';
        ths[3].style.width = '24%';
        ths[4].textContent = 'MOTIVO / CRITÉRIO';
        ths[4].style.width = '22%';
        ths[5].textContent = 'AÇÕES';
        ths[5].style.width = '18%';
      }

      // =====================================================================
      // 2. HISTÓRICO DE ELETIVAS DO ALUNO (historico-eletivas.html)
      // =====================================================================
      const ehTabelaHistoricoEletivas = (
        pathLower.includes('historico-eletivas') ||
        (idxEletiva >= 0 && idxNota >= 0 && (idxFreqPerc >= 0 || idxFaltas >= 0))
      );
      if (ehTabelaHistoricoEletivas && idxEletiva >= 0 && idxSerie >= 0) {
        if (idxData >= 0 && ths[idxData]) ths[idxData].textContent = 'DATA / SEM.';
        if (ths[idxSerie]) ths[idxSerie].textContent = 'SÉRIE / DIA / TEMPO';
        if (ths[idxEletiva]) {
          ths[idxEletiva].textContent = 'ELETIVA / PROFESSOR(A)';
          ths[idxEletiva].classList.add('col-nome-larga-eemti');
        }
        if (idxNota >= 0 && ths[idxNota]) ths[idxNota].textContent = 'NOTA / % FREQ.';

        [idxDia, idxTempo, idxProfessor, idxCh, idxFaltas, idxFreqPerc].forEach(cIdx => {
          if (cIdx >= 0 && cIdx !== idxData && cIdx !== idxSerie && cIdx !== idxEletiva && cIdx !== idxNota && ths[cIdx]) {
            ths[cIdx].classList.add('col-oculta-eemti');
          }
        });
      }

      // =====================================================================
      // 3. GERENCIAR ALUNOS (cadastro-alunos.html)
      // =====================================================================
      const ehTabelaGerenciarAlunos = (idxFoto >= 0 && idxColStatusFoto >= 0);
      if (ehTabelaGerenciarAlunos) {
        inserirLegendaAcimaDaTabela(tabela, 'GERENCIAR_ALUNOS_BF_PM');
        if (ths[idxColStatusFoto]) ths[idxColStatusFoto].classList.add('col-oculta-eemti');
        if (idxBeneficios >= 0 && ths[idxBeneficios]) ths[idxBeneficios].classList.add('col-oculta-eemti');
        if (idxSerie >= 0 && ths[idxSerie]) ths[idxSerie].textContent = 'SÉRIE / BF / PM';
      }

      // =====================================================================
      // 4. SITUAÇÃO DO ALUNO (situacao-aluno.html)
      // =====================================================================
      const ehTabelaSituacao = (idxMatCpf >= 0 && idxAluno >= 0 && pathLower.includes('situacao'));
      if (ehTabelaSituacao) {
        if (ths[idxMatCpf]) ths[idxMatCpf].classList.add('col-oculta-eemti');
        if (idxResp >= 0 && ths[idxResp]) ths[idxResp].classList.add('col-oculta-eemti');
        if (idxSerie >= 0 && ths[idxSerie]) ths[idxSerie].style.width = '12%';
        if (ths[idxAluno]) ths[idxAluno].style.width = '48%';
      }

      // =====================================================================
      // 5. BUSCA ATIVA (busca-ativa.html)
      // =====================================================================
      const ehTabelaBuscaAtiva = (pathLower.includes('busca-ativa') && idxAluno >= 0);
      if (ehTabelaBuscaAtiva) {
        if (idxSerie >= 0 && idxSerie !== idxAluno && ths[idxSerie]) ths[idxSerie].classList.add('col-oculta-eemti');
        if (ths[idxAluno]) {
          ths[idxAluno].textContent = 'ALUNO(A) / SÉRIE';
          ths[idxAluno].classList.add('col-nome-larga-eemti');
        }
        const idxColPrincipalMotivo = idxMotivoBuscaAtiva >= 0 ? idxMotivoBuscaAtiva : (idxStatusBuscaAtiva >= 0 ? idxStatusBuscaAtiva : -1);
        if (idxColPrincipalMotivo >= 0 && ths[idxColPrincipalMotivo]) {
          ths[idxColPrincipalMotivo].textContent = 'MOTIVO / STATUS / AÇÃO';
          ths[idxColPrincipalMotivo].classList.add('col-secundaria-larga-eemti');
        }
        [idxStatusBuscaAtiva, idxAcaoBuscaAtiva, idxResp].forEach(cIdx => {
          if (cIdx >= 0 && cIdx !== idxColPrincipalMotivo && cIdx !== idxAcoesBotoes && ths[cIdx]) {
            ths[cIdx].classList.add('col-oculta-eemti');
          }
        });
      }

      // =====================================================================
      // 6. AEE - ATENDIMENTO EDUCACIONAL ESPECIALIZADO (aee.html)
      // Coluna Aluno Larga: Nome do Aluno -> Pai e Mãe abaixo -> Data Nasc. e Matrícula na frente!
      // Coluna Deficiência Larga: Deficiência/Necessidade -> Laudo -> Observação/Parecer
      // =====================================================================
      const ehTabelaAee = (pathLower.includes('aee') && idxAluno >= 0 && idxDeficiencia >= 0);
      if (ehTabelaAee) {
        if (ths[idxAluno]) {
          ths[idxAluno].textContent = 'ALUNO(A) / FILIAÇÃO / NASC. & MATRÍCULA';
          ths[idxAluno].classList.add('col-nome-larga-eemti');
        }
        if (ths[idxDeficiencia]) {
          ths[idxDeficiencia].textContent = 'DEFICIÊNCIA / LAUDO / PARECER';
          ths[idxDeficiencia].classList.add('col-secundaria-larga-eemti');
        }
        [idxSerie, idxMatCpf, idxNascimento, idxLaudo, idxObs, idxData].forEach(cIdx => {
          if (cIdx >= 0 && cIdx !== idxAluno && cIdx !== idxDeficiencia && cIdx !== idxAcoesBotoes && ths[cIdx]) {
            ths[cIdx].classList.add('col-oculta-eemti');
          }
        });
      }

      // =====================================================================
      // 7. HISTÓRICO INDIVIDUAL E CONSULTA/EDIÇÃO/EXCLUSÃO DE OCORRÊNCIAS
      // =====================================================================
      const ehTabelaHistoricoIndividual = (
        idxOcorrencia >= 0 &&
        idxData >= 0 &&
        idxAluno === -1 &&
        (pathLower.includes('historico-ocorrencias') || pathLower.includes('historico.html') || idxBimestre >= 0)
      );
      if (ehTabelaHistoricoIndividual) {
        if (idxBimestre >= 0 && ths[idxBimestre]) ths[idxBimestre].classList.add('col-oculta-eemti');
        if (idxSerie >= 0 && ths[idxSerie]) ths[idxSerie].classList.add('col-oculta-eemti');
        if (idxGravidade >= 0 && ths[idxGravidade]) ths[idxGravidade].classList.add('col-oculta-eemti');
        if (idxProfessor >= 0 && ths[idxProfessor]) ths[idxProfessor].classList.add('col-oculta-eemti');
      }

      const ehTabelaConsultaOcorrencias = (
        idxOcorrencia >= 0 &&
        idxAluno >= 0 &&
        !ehTabelaHistoricoIndividual &&
        !ehTabelaBuscaAtiva &&
        !ehTabelaSuspensaoPdt
      );
      if (ehTabelaConsultaOcorrencias) {
        if (ths[idxAluno]) {
          ths[idxAluno].textContent = 'ALUNO(A) / SÉRIE / PROFESSOR(A)';
          ths[idxAluno].classList.add('col-nome-larga-eemti');
        }
        if (idxSerie >= 0 && ths[idxSerie]) ths[idxSerie].classList.add('col-oculta-eemti');
        if (idxGravidade >= 0 && ths[idxGravidade]) ths[idxGravidade].classList.add('col-oculta-eemti');
        if (idxProfessor >= 0 && ths[idxProfessor]) ths[idxProfessor].classList.add('col-oculta-eemti');
      }

      // =====================================================================
      // PROCESSAMENTO DAS LINHAS (TBODY TR) DE CADA TABELA
      // =====================================================================
      const linhas = tabela.querySelectorAll('tbody tr');
      linhas.forEach(tr => {
        const tds = tr.children;
        if (!tds || tds.length <= 1) return;

        if (!tr._dadosOriginaisLinhaEEMTI) {
          tr._dadosOriginaisLinhaEEMTI = Array.from(tds).map((td, i) => ({
            titulo: titulosOriginais[i] || `Campo ${i + 1}`,
            valor: (td.innerText || td.textContent || '').replace(/\s+/g, ' ').trim(),
            html: td.innerHTML
          }));
        }

        if (idxAluno >= 0 && tds[idxAluno]) tds[idxAluno].classList.add('col-nome-larga-eemti');
        if (idxAcoesBotoes >= 0 && tds[idxAcoesBotoes]) tds[idxAcoesBotoes].classList.add('col-acoes-visivel-eemti');

        // A) Formata Linha de ALUNOS NECESSITADOS DE SUSPENSÃO (atendimento-alunos.html)
        // Col 0: Nome do Aluno -> Série abaixo -> PDT abaixo
        // Col 3: Origem (Automática/Manual) ACIMA do input de data -> Data (Hoje) -> Última ocorrência abaixo
        // Col 4: Motivo / Critério compacto
        // Col 5: Botões Termo PDF e Atender
        if (ehTabelaSuspensaoPdt && tds.length >= 6 && !tr._eemtiSuspensaoPdtFormatado) {
          tr._eemtiSuspensaoPdtFormatado = true;
          tds[1].classList.add('col-oculta-eemti');
          tds[2].classList.add('col-oculta-eemti');

          const nomeAl = tr._dadosOriginaisLinhaEEMTI[0]?.valor || '-';
          tr.setAttribute('data-nome-aluno-limpo', nomeAl);

          // Extrai Série e PDT da célula 1
          const divSerieEl = tds[1].querySelector('.fw-bold');
          const divPdtEl = tds[1].querySelector('.text-muted');
          const serieTxt = window.abreviarSerieParaExibicao(divSerieEl ? divSerieEl.textContent.trim() : (tr._dadosOriginaisLinhaEEMTI[1]?.valor.split('PDT:')[0] || '').trim());
          const pdtTxt = divPdtEl ? divPdtEl.textContent.replace(/PDT:\s*/i, '').trim() : ((tr._dadosOriginaisLinhaEEMTI[1]?.valor.split('PDT:')[1] || '').trim());

          tds[0].classList.add('col-nome-larga-eemti');
          tds[0].innerHTML = `
            <div class="fw-bold text-dark" style="font-size:0.8rem;line-height:1.22;">${nomeAl}</div>
            <div class="mt-1"><span class="badge bg-primary-subtle text-primary border border-primary-subtle" style="font-size:0.62rem;">${serieTxt}</span></div>
            <div class="text-secondary mt-1" style="font-size:0.65rem;line-height:1.18;"><i class="bi bi-person-badge me-1"></i><b>PDT:</b> ${pdtTxt || 'Não atribuído'}</div>
          `;

          // Coloca o badge de Origem (Automática / Manual) ACIMA do input de data na célula 3 (preservando o input original e seu ID!)
          const tdDataSusp = tds[3];
          const htmlBadgeOrigem = tds[2].innerHTML;
          if (tdDataSusp && htmlBadgeOrigem && !tdDataSusp.querySelector('.div-origem-acima-data-eemti')) {
            const divOrigemTopo = document.createElement('div');
            divOrigemTopo.className = 'div-origem-acima-data-eemti mb-1 text-center';
            divOrigemTopo.innerHTML = htmlBadgeOrigem;
            tdDataSusp.insertBefore(divOrigemTopo, tdDataSusp.firstChild);
          }
          const inpDateEl = tdDataSusp ? tdDataSusp.querySelector('input[type="date"]') : null;
          if (inpDateEl) {
            inpDateEl.style.maxWidth = '112px';
            inpDateEl.style.fontSize = '0.68rem';
            inpDateEl.style.padding = '2px 4px';
          }
        }

        // B) Formata Linha do HISTÓRICO DE ELETIVAS
        if (ehTabelaHistoricoEletivas && idxEletiva >= 0 && idxSerie >= 0 && !tr._eemtiHistEletFormatado) {
          tr._eemtiHistEletFormatado = true;
          [idxDia, idxTempo, idxProfessor, idxCh, idxFaltas, idxFreqPerc].forEach(cIdx => {
            if (cIdx >= 0 && cIdx !== idxData && cIdx !== idxSerie && cIdx !== idxEletiva && cIdx !== idxNota && tds[cIdx]) {
              tds[cIdx].classList.add('col-oculta-eemti');
            }
          });

          const valSerie = window.abreviarSerieParaExibicao(tr._dadosOriginaisLinhaEEMTI[idxSerie]?.valor || '-');
          const valDia = idxDia >= 0 ? (tr._dadosOriginaisLinhaEEMTI[idxDia]?.valor || '') : '';
          const valTempo = idxTempo >= 0 ? (tr._dadosOriginaisLinhaEEMTI[idxTempo]?.valor || '') : '';

          tds[idxSerie].innerHTML = `
            <div class="fw-bold text-primary" style="font-size:0.76rem;">${valSerie}</div>
            ${valDia && valDia !== '-' ? `<div class="text-dark fw-semibold mt-1" style="font-size:0.65rem;">${valDia}</div>` : ''}
            ${valTempo && valTempo !== '-' ? `<div class="text-muted" style="font-size:0.63rem;">${valTempo}</div>` : ''}
          `;

          const valElet = tr._dadosOriginaisLinhaEEMTI[idxEletiva]?.valor || '-';
          const valProf = idxProfessor >= 0 ? (tr._dadosOriginaisLinhaEEMTI[idxProfessor]?.valor || '') : '';

          tds[idxEletiva].classList.add('col-nome-larga-eemti');
          tds[idxEletiva].innerHTML = `
            <div class="fw-bold text-dark" style="font-size:0.78rem;line-height:1.22;">${valElet}</div>
            ${valProf ? `<div class="text-secondary mt-1" style="font-size:0.67rem;"><i class="bi bi-person-workspace me-1"></i><b>Prof.:</b> ${valProf}</div>` : ''}
          `;

          if (idxNota >= 0 && tds[idxNota]) {
            const valNota = tr._dadosOriginaisLinhaEEMTI[idxNota]?.valor || '-';
            let valFreq = idxFreqPerc >= 0 ? (tr._dadosOriginaisLinhaEEMTI[idxFreqPerc]?.valor || '') : '';
            const matchPerc = valFreq.match(/(\d+%)/);
            if (matchPerc) valFreq = matchPerc[1];

            tds[idxNota].innerHTML = `
              <div class="fw-bolder text-dark" style="font-size:0.84rem;">${valNota}</div>
              ${valFreq ? `<div class="mt-1"><span class="badge bg-success-subtle text-success border border-success-subtle" style="font-size:0.63rem;">${valFreq}</span></div>` : ''}
            `;
          }
        }

        // C) Formata Linha do GERENCIAR ALUNOS
        if (ehTabelaGerenciarAlunos && !tr._eemtiGerenciarFormatado) {
          tr._eemtiGerenciarFormatado = true;
          if (tds[idxColStatusFoto]) tds[idxColStatusFoto].classList.add('col-oculta-eemti');
          if (idxBeneficios >= 0 && tds[idxBeneficios]) tds[idxBeneficios].classList.add('col-oculta-eemti');

          const divBoldNome = tds[1].querySelector('.fw-bold, b, strong') || tds[1];
          const nomeExtraido = (divBoldNome.textContent || '').replace(/\s+/g, ' ').trim().toUpperCase();
          tr.setAttribute('data-nome-aluno-limpo', nomeExtraido);

          const infoCad = obterDadosCadastraisAlunoCache(nomeExtraido);
          const sexoExtenso = formatarSexoPorExtenso(infoCad.sexo);

          if (tds[idxFoto] && sexoExtenso && !tds[idxFoto].querySelector('.lbl-sexo-foto-eemti')) {
            const divSexo = document.createElement('div');
            divSexo.className = 'lbl-sexo-foto-eemti fw-bold text-secondary mt-1 text-center';
            divSexo.style.fontSize = '0.62rem';
            divSexo.textContent = sexoExtenso;
            tds[idxFoto].appendChild(divSexo);
          }

          const maeNome = infoCad.mae || '';
          const maeTel = infoCad.telMae || '';
          const paiNome = infoCad.pai || '';
          const paiTel = infoCad.telPai || '';

          const textoOrigCol1 = tr._dadosOriginaisLinhaEEMTI[1]?.valor || '';
          let linhasFiliacaoHtml = '';

          if (paiNome || maeNome) {
            if (paiNome) {
              linhasFiliacaoHtml += `<div class="text-secondary mt-1" style="font-size:0.66rem;line-height:1.2;"><b>Pai:</b> ${paiNome}${paiTel ? ' • <b>Tel:</b> ' + paiTel : ''}</div>`;
            }
            if (maeNome) {
              linhasFiliacaoHtml += `<div class="text-secondary mt-1" style="font-size:0.66rem;line-height:1.2;"><b>Mãe:</b> ${maeNome}${maeTel ? ' • <b>Tel:</b> ' + maeTel : ''}</div>`;
            }
          } else {
            const restoFiliacao = textoOrigCol1.replace(nomeExtraido, '').trim();
            if (restoFiliacao) {
              linhasFiliacaoHtml = `<div class="text-secondary mt-1" style="font-size:0.66rem;line-height:1.2;">${restoFiliacao}</div>`;
            }
          }

          tds[1].innerHTML = `
            <div class="fw-bold text-dark" style="font-size:0.8rem;line-height:1.2;">${nomeExtraido}</div>
            ${linhasFiliacaoHtml}
          `;

          if (idxSerie >= 0 && tds[idxSerie]) {
            const serieCurta = window.abreviarSerieParaExibicao(infoCad.serie || tr._dadosOriginaisLinhaEEMTI[idxSerie]?.valor || '-');
            const textoBenefOrig = idxBeneficios >= 0 ? (tr._dadosOriginaisLinhaEEMTI[idxBeneficios]?.valor || '').toUpperCase() : '';
            const recebeBF = String(infoCad.bolsaFamilia || '').toUpperCase() === 'SIM' || textoBenefOrig.includes('BF: SIM');
            const recebePM = String(infoCad.peDeMeia || '').toUpperCase() === 'SIM' || textoBenefOrig.includes('PM: SIM');

            tds[idxSerie].innerHTML = `
              <div class="mb-1"><span class="badge bg-light text-dark border fw-bold" style="font-size:0.66rem;">${serieCurta}</span></div>
              <div class="d-flex justify-content-center gap-1 flex-wrap">
                <span class="badge ${recebeBF ? 'bg-success text-white' : 'bg-secondary-subtle text-secondary'}" title="Bolsa Família: ${recebeBF ? 'SIM' : 'NÃO'}" style="font-size:0.6rem;">BF</span>
                <span class="badge ${recebePM ? 'bg-success text-white' : 'bg-secondary-subtle text-secondary'}" title="Pé-de-Meia: ${recebePM ? 'SIM' : 'NÃO'}" style="font-size:0.6rem;">PM</span>
              </div>
            `;
          }

          if (filtroExclusivoAlunoSelecionado && nomeExtraido !== filtroExclusivoAlunoSelecionado) {
            tr.style.display = 'none';
          }
        }

        // D) Formata Linha da SITUAÇÃO DO ALUNO
        if (ehTabelaSituacao && !tr._eemtiSituacaoFormatada) {
          tr._eemtiSituacaoFormatada = true;
          if (tds[idxMatCpf]) tds[idxMatCpf].classList.add('col-oculta-eemti');
          if (idxResp >= 0 && tds[idxResp]) tds[idxResp].classList.add('col-oculta-eemti');

          const tdAluno = tds[idxAluno];
          const rawNome = tr._dadosOriginaisLinhaEEMTI[idxAluno] ? tr._dadosOriginaisLinhaEEMTI[idxAluno].valor : '';
          const nomeSozinho = rawNome.split('Resp.:')[0].split('Resp:')[0].trim();
          tr.setAttribute('data-nome-aluno-limpo', nomeSozinho);

          const rawMatCpf = tr._dadosOriginaisLinhaEEMTI[idxMatCpf] ? tr._dadosOriginaisLinhaEEMTI[idxMatCpf].valor : '';
          const rawResp = (idxResp >= 0 && tr._dadosOriginaisLinhaEEMTI[idxResp]) ? tr._dadosOriginaisLinhaEEMTI[idxResp].valor : '';
          const cpfLimpo = extrairApenasCpfFormatado(rawMatCpf || rawNome);

          tdAluno.innerHTML = `
            <div class="fw-bold text-dark" style="font-size:0.78rem;line-height:1.2;">${nomeSozinho}</div>
            <div class="text-secondary mt-1" style="font-size:0.68rem;line-height:1.2;"><b>Resp:</b> ${rawResp || 'Não informado'}</div>
            <div class="text-muted" style="font-size:0.66rem;line-height:1.2;"><b>CPF do aluno:</b> ${cpfLimpo}</div>
          `;
        }

        // E) Formata Linha da BUSCA ATIVA
        if (ehTabelaBuscaAtiva && !tr._eemtiBuscaAtivaFormatada) {
          tr._eemtiBuscaAtivaFormatada = true;
          const idxColPrincipalMotivo = idxMotivoBuscaAtiva >= 0 ? idxMotivoBuscaAtiva : (idxStatusBuscaAtiva >= 0 ? idxStatusBuscaAtiva : -1);

          if (idxSerie >= 0 && idxSerie !== idxAluno && tds[idxSerie]) tds[idxSerie].classList.add('col-oculta-eemti');
          [idxStatusBuscaAtiva, idxAcaoBuscaAtiva, idxResp].forEach(cIdx => {
            if (cIdx >= 0 && cIdx !== idxColPrincipalMotivo && cIdx !== idxAcoesBotoes && tds[cIdx]) {
              tds[cIdx].classList.add('col-oculta-eemti');
            }
          });

          const nomeAl = tr._dadosOriginaisLinhaEEMTI[idxAluno]?.valor || '-';
          tr.setAttribute('data-nome-aluno-limpo', nomeAl);
          const serieAl = idxSerie >= 0 ? window.abreviarSerieParaExibicao(tr._dadosOriginaisLinhaEEMTI[idxSerie]?.valor || '') : '';

          tds[idxAluno].innerHTML = `
            <div class="fw-bold text-dark" style="font-size:0.79rem;line-height:1.2;">${nomeAl}</div>
            ${serieAl ? `<div class="mt-1"><span class="badge bg-primary-subtle text-primary border border-primary-subtle" style="font-size:0.62rem;">${serieAl}</span></div>` : ''}
          `;

          if (idxColPrincipalMotivo >= 0 && tds[idxColPrincipalMotivo]) {
            const motivoTxt = idxMotivoBuscaAtiva >= 0 ? (tr._dadosOriginaisLinhaEEMTI[idxMotivoBuscaAtiva]?.valor || '-') : '-';
            const statusTxt = (idxStatusBuscaAtiva >= 0 && idxStatusBuscaAtiva !== idxMotivoBuscaAtiva)
              ? (tr._dadosOriginaisLinhaEEMTI[idxStatusBuscaAtiva]?.valor || '')
              : '';
            const acaoTxt = (idxAcaoBuscaAtiva >= 0 && idxAcaoBuscaAtiva !== idxMotivoBuscaAtiva && idxAcaoBuscaAtiva !== idxStatusBuscaAtiva)
              ? (tr._dadosOriginaisLinhaEEMTI[idxAcaoBuscaAtiva]?.valor || '')
              : '';

            const corStatus = statusTxt.toUpperCase().includes('RESOLVID') ? 'bg-success' : 'bg-warning text-dark';

            tds[idxColPrincipalMotivo].classList.add('col-secundaria-larga-eemti');
            tds[idxColPrincipalMotivo].innerHTML = `
              <div class="fw-bold text-dark" style="font-size:0.76rem;line-height:1.22;">${motivoTxt}</div>
              <div class="mt-1 d-flex align-items-center flex-wrap gap-1">
                ${statusTxt ? `<span class="badge ${corStatus}" style="font-size:0.6rem;">${statusTxt}</span>` : ''}
                ${acaoTxt ? `<span class="text-secondary small" style="font-size:0.66rem;">• <b>Ação:</b> ${acaoTxt}</span>` : ''}
              </div>
            `;
          }
        }

        // F) Formata Linha do AEE (CORRIGIDO: Nome do Aluno -> Pai e Mãe abaixo -> Data Nasc. e Matrícula na frente!)
        if (ehTabelaAee && !tr._eemtiAeeFormatada) {
          tr._eemtiAeeFormatada = true;
          [idxSerie, idxMatCpf, idxNascimento, idxLaudo, idxObs, idxData].forEach(cIdx => {
            if (cIdx >= 0 && cIdx !== idxAluno && cIdx !== idxDeficiencia && cIdx !== idxAcoesBotoes && tds[cIdx]) {
              tds[cIdx].classList.add('col-oculta-eemti');
            }
          });

          const tdAlOriginal = tds[idxAluno];
          const divBoldAl = tdAlOriginal.querySelector('.fw-bold, b, strong');
          const nomeAl = (divBoldAl ? divBoldAl.textContent : (tr._dadosOriginaisLinhaEEMTI[idxAluno]?.valor || '')).split('Matrícula:')[0].trim().toUpperCase();
          tr.setAttribute('data-nome-aluno-limpo', nomeAl);

          const serieAl = idxSerie >= 0 ? window.abreviarSerieParaExibicao(tr._dadosOriginaisLinhaEEMTI[idxSerie]?.valor || '') : '';

          // Extrai a Matrícula e a Data de Nascimento apenas quando forem realmente números/datas (evita colocar o nome do aluno na matrícula!)
          const textoBrutoLinhaAee = tr._dadosOriginaisLinhaEEMTI.map(x => x.valor).join(' | ');
          const matchDataNasc = textoBrutoLinhaAee.match(/\b(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})\b/);
          const nascAl = (idxNascimento >= 0 && /\d/.test(tr._dadosOriginaisLinhaEEMTI[idxNascimento]?.valor || ''))
            ? tr._dadosOriginaisLinhaEEMTI[idxNascimento].valor
            : (matchDataNasc ? matchDataNasc[1] : '-');

          let matAl = '-';
          if (idxMatCpf >= 0) {
            const valColMat = (tr._dadosOriginaisLinhaEEMTI[idxMatCpf]?.valor || '').replace(/Matrícula:\s*/i, '').trim();
            if (valColMat && valColMat.toUpperCase() !== nomeAl && /\d/.test(valColMat)) {
              matAl = valColMat;
            }
          }
          if (matAl === '-') {
            const matchNumMat = textoBrutoLinhaAee.match(/\b(\d{5,12})\b/);
            if (matchNumMat) matAl = matchNumMat[1];
          }

          // Puxa Nome do Pai e da Mãe do cache cadastral do aluno
          const infoCad = obterDadosCadastraisAlunoCache(nomeAl);
          const paiNome = infoCad.pai || '';
          const maeNome = infoCad.mae || '';
          let htmlPais = '';
          if (paiNome || maeNome) {
            const partesPais = [];
            if (paiNome) partesPais.push(`<b>Pai:</b> ${paiNome}`);
            if (maeNome) partesPais.push(`<b>Mãe:</b> ${maeNome}`);
            htmlPais = `<div class="text-secondary mt-1" style="font-size:0.65rem;line-height:1.2;">${partesPais.join(' • ')}</div>`;
          }

          tds[idxAluno].innerHTML = `
            <div class="fw-bold text-dark" style="font-size:0.79rem;line-height:1.2;">
              ${nomeAl} ${serieAl ? `<span class="badge bg-primary ms-1" style="font-size:0.58rem;">${serieAl}</span>` : ''}
            </div>
            ${htmlPais}
            <div class="text-muted mt-1" style="font-size:0.65rem;line-height:1.2;">
              <b>Data Nasc.:</b> ${nascAl} • <b>Matrícula:</b> ${matAl}
            </div>
          `;

          const defTxt = tr._dadosOriginaisLinhaEEMTI[idxDeficiencia]?.valor || '-';
          const laudoTxt = idxLaudo >= 0 ? (tr._dadosOriginaisLinhaEEMTI[idxLaudo]?.valor || '-') : '-';
          const obsTxt = idxObs >= 0 ? (tr._dadosOriginaisLinhaEEMTI[idxObs]?.valor || '') : '';
          const temLaudoSim = laudoTxt.toUpperCase().includes('SIM');

          tds[idxDeficiencia].classList.add('col-secundaria-larga-eemti');
          tds[idxDeficiencia].innerHTML = `
            <div class="fw-bold text-primary" style="font-size:0.76rem;line-height:1.2;">${defTxt}</div>
            <div class="mt-1"><span class="badge ${temLaudoSim ? 'bg-success' : 'bg-secondary'}" style="font-size:0.6rem;">Laudo: ${laudoTxt}</span></div>
            ${obsTxt && obsTxt !== '-' ? `<div class="text-muted mt-1" style="font-size:0.66rem;line-height:1.22;"><b>Obs./Parecer:</b> ${obsTxt}</div>` : ''}
          `;
        }

        // G) Formata Linha do HISTÓRICO INDIVIDUAL DE OCORRÊNCIAS
        if (ehTabelaHistoricoIndividual && !tr._eemtiHistOcoFormatado) {
          tr._eemtiHistOcoFormatado = true;
          if (idxBimestre >= 0 && tds[idxBimestre]) tds[idxBimestre].classList.add('col-oculta-eemti');
          if (idxSerie >= 0 && tds[idxSerie]) tds[idxSerie].classList.add('col-oculta-eemti');
          if (idxGravidade >= 0 && tds[idxGravidade]) tds[idxGravidade].classList.add('col-oculta-eemti');
          if (idxProfessor >= 0 && tds[idxProfessor]) tds[idxProfessor].classList.add('col-oculta-eemti');

          const tdOco = tds[idxOcorrencia];
          const descOco = tr._dadosOriginaisLinhaEEMTI[idxOcorrencia]?.valor || '-';
          const gravTxt = idxGravidade >= 0 ? (tr._dadosOriginaisLinhaEEMTI[idxGravidade]?.valor || '') : '';
          const profTxt = idxProfessor >= 0 ? (tr._dadosOriginaisLinhaEEMTI[idxProfessor]?.valor || '') : '';

          let corBadgeGrav = 'bg-secondary';
          if (gravTxt.toUpperCase().includes('GRAVÍSSIMA') || gravTxt.toUpperCase().includes('GRAVISSIMA')) corBadgeGrav = 'bg-danger';
          else if (gravTxt.toUpperCase().includes('GRAVE')) corBadgeGrav = 'bg-warning text-dark';
          else if (gravTxt.toUpperCase().includes('MÉDIA') || gravTxt.toUpperCase().includes('MEDIA')) corBadgeGrav = 'bg-info text-dark';
          else if (gravTxt) corBadgeGrav = 'bg-primary-subtle text-primary border border-primary-subtle';

          tdOco.innerHTML = `
            <div class="fw-bold text-dark" style="font-size:0.78rem;line-height:1.22;">${descOco}</div>
            ${gravTxt ? `<div class="mt-1"><span class="badge ${corBadgeGrav}" style="font-size:0.6rem;">${gravTxt}</span></div>` : ''}
            ${profTxt ? `<div class="text-muted mt-1" style="font-size:0.66rem;"><i class="bi bi-person-check me-1"></i><b>Prof.:</b> ${profTxt}</div>` : ''}
          `;
        }

        // H) Formata Linha de CONSULTAR / EDITAR / EXCLUIR OCORRÊNCIAS
        // Coluna Aluno -> Nome do Aluno + Série abaixo + Nome do Professor abaixo da Série!
        if (ehTabelaConsultaOcorrencias && !tr._eemtiConsOcoFormatado) {
          tr._eemtiConsOcoFormatado = true;
          if (idxSerie >= 0 && tds[idxSerie]) tds[idxSerie].classList.add('col-oculta-eemti');
          if (idxGravidade >= 0 && tds[idxGravidade]) tds[idxGravidade].classList.add('col-oculta-eemti');
          if (idxProfessor >= 0 && tds[idxProfessor]) tds[idxProfessor].classList.add('col-oculta-eemti');

          const tdAl = tds[idxAluno];
          const nomeAl = tr._dadosOriginaisLinhaEEMTI[idxAluno]?.valor || '-';
          tr.setAttribute('data-nome-aluno-limpo', nomeAl);
          const serieAl = idxSerie >= 0 ? window.abreviarSerieParaExibicao(tr._dadosOriginaisLinhaEEMTI[idxSerie]?.valor || '') : '';
          const profTxt = idxProfessor >= 0 ? (tr._dadosOriginaisLinhaEEMTI[idxProfessor]?.valor || '') : '';

          tdAl.innerHTML = `
            <div class="fw-bold text-dark" style="font-size:0.78rem;line-height:1.2;">${nomeAl}</div>
            ${serieAl ? `<div class="mt-1"><span class="badge bg-secondary" style="font-size:0.6rem;">${serieAl}</span></div>` : ''}
            ${profTxt ? `<div class="text-muted mt-1" style="font-size:0.64rem;line-height:1.15;"><i class="bi bi-person-badge me-1"></i><b>Prof.:</b> ${profTxt}</div>` : ''}
          `;

          const tdOco = tds[idxOcorrencia];
          const descOco = tr._dadosOriginaisLinhaEEMTI[idxOcorrencia]?.valor || '-';
          const gravTxt = idxGravidade >= 0 ? (tr._dadosOriginaisLinhaEEMTI[idxGravidade]?.valor || '') : '';

          tdOco.innerHTML = `
            <div class="fw-bold text-dark" style="font-size:0.76rem;line-height:1.2;">${descOco}</div>
            ${gravTxt ? `<div class="mt-1"><span class="badge bg-danger-subtle text-danger border border-danger-subtle" style="font-size:0.59rem;">${gravTxt}</span></div>` : ''}
          `;
        }

        const ehLinhaLancamentoRapido = tr.querySelector('.btn-chamada-compacto, input[type="number"]');
        if (!ehLinhaLancamentoRapido && !tr._eemtiClickModalBound) {
          tr._eemtiClickModalBound = true;
          tr.classList.add('linha-tabela-clicavel-eemti');
          tr.title = 'Clique na linha para visualizar todas as informações completas';
          tr.addEventListener('click', function(ev) {
            if (ev.target.closest('button, a, input, select, label, .btn')) return;
            abrirModalGenericoDaLinhaDaTabela(tr);
          });
        }
      });
    });

    // Abrevia "2ª SÉRIE A" para "2ª A" dentro de células de tabelas (mantendo "2ª SÉRIE A" nos <select>)
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

    configurarPesquisaVivaEmTempoRealEmTodosInputs();
  }

  // =========================================================================
  // 5. MOTOR UNIVERSAL DE PESQUISA EM TEMPO REAL + FILTRO EXCLUSIVO DO ALUNO CLICADO
  // =========================================================================
  function limparAcentosComparacao(str) {
    return String(str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
  }

  function filtrarLinhasDaTabelaPorTexto(containerEscopo, termoBusca, igualdadeEstritaNome = false) {
    const termo = limparAcentosComparacao(termoBusca);
    const tabelasAlvo = (containerEscopo || document).querySelectorAll('table.table tbody');

    tabelasAlvo.forEach(tbody => {
      const linhas = tbody.querySelectorAll('tr');
      if (linhas.length <= 1 && linhas[0] && linhas[0].children.length <= 1) return;

      linhas.forEach(tr => {
        if (!termo) {
          tr.style.display = '';
          return;
        }
        const nomeAtributo = limparAcentosComparacao(tr.getAttribute('data-nome-aluno-limpo') || '');
        const textoLinha = limparAcentosComparacao(tr.innerText || tr.textContent || '');

        if (igualdadeEstritaNome && nomeAtributo) {
          tr.style.display = (nomeAtributo === termo) ? '' : 'none';
        } else {
          tr.style.display = textoLinha.includes(termo) ? '' : 'none';
        }
      });
    });
  }

  function configurarPesquisaVivaEmTempoRealEmTodosInputs() {
    const datalists = document.querySelectorAll('datalist');
    const alunosCache = JSON.parse(localStorage.getItem(window.KEY_ALUNOS_UNIVERSAL_EEMTI) || '[]');

    if (alunosCache.length > 0 && datalists.length > 0) {
      const nomesUnicos = Array.from(new Set(alunosCache.map(a => a.nome))).sort((a, b) => a.localeCompare(b, 'pt-BR'));
      datalists.forEach(dl => {
        if (dl.children.length < 5) {
          dl.innerHTML = nomesUnicos.map(n => `<option value="${n}">`).join('');
        }
      });
    }

    const seletoresPesquisa = 'input[type="text"], input[type="search"]';
    document.querySelectorAll(seletoresPesquisa).forEach(inp => {
      if (inp._eemtiLiveFilterBound) return;
      if (inp.readOnly || inp.disabled) return;

      const placeholder = (inp.placeholder || '').toUpperCase();
      const idInp = (inp.id || '').toUpperCase();
      const labelTxt = inp.previousElementSibling ? (inp.previousElementSibling.textContent || '').toUpperCase() : '';

      const ehCampoDePesquisaOuFiltro =
        placeholder.includes('FILTRAR') ||
        placeholder.includes('PESQUISAR') ||
        placeholder.includes('DIGITE O NOME') ||
        placeholder.includes('BUSCAR') ||
        placeholder.includes('CÓDIGO') ||
        placeholder.includes('LIVRO') ||
        idInp.includes('FILTRO') ||
        idInp.includes('BUSCA') ||
        idInp.includes('PESQUISA') ||
        labelTxt.includes('PESQUISAR') ||
        labelTxt.includes('CONSULTAR');

      if (!ehCampoDePesquisaOuFiltro) return;

      inp._eemtiLiveFilterBound = true;

      inp.addEventListener('input', function() {
        const termo = limparAcentosComparacao(this.value);
        if (!termo) {
          filtroExclusivoAlunoSelecionado = '';
        }

        const containerEscopo = this.closest('.tab-pane, .card, .main-container') || document;
        filtrarLinhasDaTabelaPorTexto(containerEscopo, termo, false);

        const ehBuscaDeAluno = placeholder.includes('ALUNO') || placeholder.includes('NOME') || labelTxt.includes('ALUNO') || labelTxt.includes('PESQUISAR NA TURMA');
        if (ehBuscaDeAluno && !inp.getAttribute('list')) {
          mostrarSugestoesAutocompletarAluno(inp, termo);
        }
      });
    });
  }

  function mostrarSugestoesAutocompletarAluno(inp, termoNormalizado) {
    let menu = inp.parentElement.querySelector('.menu-autocompletar-eemti');
    if (!termoNormalizado || termoNormalizado.length < 2) {
      if (menu) menu.remove();
      return;
    }

    const cardPai = inp.closest('.card, .tab-pane') || document;
    const alunosCache = JSON.parse(localStorage.getItem(window.KEY_ALUNOS_UNIVERSAL_EEMTI) || '[]');
    if (alunosCache.length === 0) return;

    const selSerieProximo = cardPai.querySelector('select[id*="Serie"], select[id*="serie"], select[id*="Turma"]');
    const serieFiltro = (selSerieProximo && selSerieProximo.value && !selSerieProximo.value.includes('Todas') && !selSerieProximo.value.includes('Selecione'))
      ? normalizarSeriePadraoCore(selSerieProximo.value)
      : '';

    const encontrados = alunosCache
      .filter(a => {
        if (serieFiltro && normalizarSeriePadraoCore(a.serie) !== serieFiltro) return false;
        return limparAcentosComparacao(a.nome).includes(termoNormalizado);
      })
      .slice(0, 12);

    if (encontrados.length === 0) {
      if (menu) menu.remove();
      return;
    }

    if (getComputedStyle(inp.parentElement).position === 'static') {
      inp.parentElement.style.position = 'relative';
    }

    if (!menu) {
      menu = document.createElement('div');
      menu.className = 'menu-autocompletar-eemti';
      inp.parentElement.appendChild(menu);

      document.addEventListener('click', function fecharMenuFora(e) {
        if (!inp.parentElement.contains(e.target)) {
          menu.remove();
          document.removeEventListener('click', fecharMenuFora);
        }
      });
    }

    menu.innerHTML = encontrados.map(a => `
      <div class="item-auto-eemti" data-nome="${a.nome}" data-serie="${a.serie}">
        <span>${a.nome}</span>
        <span class="badge bg-primary-subtle text-primary">${window.abreviarSerieParaExibicao(a.serie)}</span>
      </div>
    `).join('');

    menu.querySelectorAll('.item-auto-eemti').forEach(item => {
      item.addEventListener('click', function() {
        const nomeEscolhido = this.getAttribute('data-nome');
        const serieEscolhida = this.getAttribute('data-serie');
        inp.value = nomeEscolhido;
        filtroExclusivoAlunoSelecionado = nomeEscolhido;
        menu.remove();

        if (selSerieProximo && serieEscolhida) {
          Array.from(selSerieProximo.options).forEach(opt => {
            if (normalizarSeriePadraoCore(opt.value) === normalizarSeriePadraoCore(serieEscolhida)) {
              selSerieProximo.value = opt.value;
              selSerieProximo.dispatchEvent(new Event('change', { bubbles: true }));
            }
          });
        }

        const btnBuscar = cardPai.querySelector('button[onclick*="buscar"], button[onclick*="Buscar"], button[onclick*="consultar"], button[onclick*="carregar"], button.btn-principal');
        if (btnBuscar) {
          setTimeout(() => {
            btnBuscar.click();
            setTimeout(() => filtrarLinhasDaTabelaPorTexto(cardPai, nomeEscolhido, true), 120);
            setTimeout(() => filtrarLinhasDaTabelaPorTexto(cardPai, nomeEscolhido, true), 350);
          }, 50);
        } else {
          filtrarLinhasDaTabelaPorTexto(cardPai, nomeEscolhido, true);
        }
      });
    });
  }

  let timerCompactacao = null;
  const observerTabelas = new MutationObserver(() => {
    if (timerCompactacao) clearTimeout(timerCompactacao);
    timerCompactacao = setTimeout(aplicarCompactacaoVisualNasTabelasEBotoes, 35);
  });

  function iniciarObservadorVisualDOM() {
    if (!document.body) return;
    aplicarCompactacaoVisualNasTabelasEBotoes();
    observerTabelas.observe(document.body, { childList: true, subtree: true });
  }

  // =========================================================================
  // 6. SELO DE ATUALIZAÇÃO APÓS O BOTÃO SAIR + BOTÕES VOLTAR E INÍCIO
  // =========================================================================
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
      selo.title = 'Clique aqui quando quiser buscar informações novas da planilha e atualizar o cache';
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

    aplicarImagensOficiaisTopoEMarcaDagua();
    configurarInterceptadorBrasaoNosPdfs();

    if (navigator.onLine) {
      window.converterImagemParaDataUrlPdf('brasaoestado.png', 300, 300).then(b64 => {
        if (b64) {
          try {
            localStorage.setItem('cache_brasao_estado_topo_b64', b64);
            localStorage.setItem('cache_brasao_oficial_eemti_b64', b64);
          } catch (e) {}
          aplicarImagensOficiaisTopoEMarcaDagua();
        } else {
          window.converterImagemParaDataUrlPdf('brasaoestado.png.png', 300, 300).then(b64Alt => {
            if (b64Alt) {
              try {
                localStorage.setItem('cache_brasao_estado_topo_b64', b64Alt);
                localStorage.setItem('cache_brasao_oficial_eemti_b64', b64Alt);
              } catch (e) {}
              aplicarImagensOficiaisTopoEMarcaDagua();
            }
          });
        }
      });

      window.converterImagemParaDataUrlPdf('LOGO-removebg-preview.png', 300, 300).then(b64Logo => {
        if (b64Logo) {
          try { localStorage.setItem('cache_logo_escola_marcadagua_b64', b64Logo); } catch (e) {}
          aplicarImagensOficiaisTopoEMarcaDagua();
        }
      });
    }

    if (estaNoLogin) return;

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

      const fnFechar = window.fecharPainelTopico;
      if (typeof fnFechar === 'function' && !fnFechar._eemtiWrapped) {
        const novaFechar = function() {
          sessionStorage.removeItem(ULTIMO_TOPICO_COLMEIA_KEY);
          fnFechar.apply(this, arguments);
        };
        novaFechar._eemtiWrapped = true;
        window.fecharPainelTopico = novaFechar;
      }

      const deveRestaurarTopico = sessionStorage.getItem('restaurar_topico_ao_voltar_eemti') === 'SIM';
      const ultimoTopico = sessionStorage.getItem(ULTIMO_TOPICO_COLMEIA_KEY);

      if (deveRestaurarTopico && ultimoTopico) {
        sessionStorage.removeItem('restaurar_topico_ao_voltar_eemti');
        setTimeout(() => {
          const seletores = Array.from(document.querySelectorAll('.hex-node'));
          const hexAlvo = seletores.find(el => {
            const onc = el.getAttribute('onclick') || '';
            return onc.includes(`'${ultimoTopico}'`) && el.offsetParent !== null;
          }) || seletores.find(el => (el.getAttribute('onclick') || '').includes(`'${ultimoTopico}'`));

          if (hexAlvo && typeof window.selecionarTopicoColmeia === 'function' && !hexAlvo.classList.contains('ativo')) {
            window.selecionarTopicoColmeia(hexAlvo, ultimoTopico);
          }
        }, 100);
      } else {
        if (typeof window.fecharPainelTopico === 'function') {
          window.fecharPainelTopico();
        }
      }
    }

    const userBar = document.querySelector('.user-bar');
    if (userBar) {
      document.querySelectorAll('a[href*="index.html"]').forEach(linkInicio => {
        if (!linkInicio._eemtiInicioBound) {
          linkInicio._eemtiInicioBound = true;
          linkInicio.addEventListener('click', () => {
            sessionStorage.removeItem(ULTIMO_TOPICO_COLMEIA_KEY);
            sessionStorage.removeItem('restaurar_topico_ao_voltar_eemti');
          });
        }
      });

      if (!estaNaHome && !document.getElementById('btnVoltarPaginaAnteriorEEMTI')) {
        const btnVoltar = document.createElement('button');
        btnVoltar.type = 'button';
        btnVoltar.id = 'btnVoltarPaginaAnteriorEEMTI';
        btnVoltar.className = 'btn btn-outline-primary btn-sm rounded-pill px-3 fw-bold';
        btnVoltar.innerHTML = `<i class="bi bi-arrow-left-circle-fill me-1"></i>Voltar`;
        btnVoltar.title = 'Voltar para a página/função anterior selecionada';
        btnVoltar.onclick = function() {
          sessionStorage.setItem('restaurar_topico_ao_voltar_eemti', 'SIM');
          if (document.referrer && document.referrer.includes(window.location.host) && window.history.length > 1) {
            window.history.back();
          } else {
            window.location.href = 'index.html';
          }
        };

        const btnRef = userBar.querySelector('a[href*="index.html"], button.btn-outline-danger');
        if (btnRef) {
          userBar.insertBefore(btnVoltar, btnRef);
        } else {
          userBar.appendChild(btnVoltar);
        }
      }

      const btnSair = userBar.querySelector('button.btn-outline-danger');
      if (btnSair && !btnSair._eemtiCleanBound) {
        btnSair._eemtiCleanBound = true;
        btnSair.addEventListener('click', () => {
          sessionStorage.removeItem(SESSAO_JA_SINCRONIZADA_KEY);
          sessionStorage.removeItem(ULTIMO_TOPICO_COLMEIA_KEY);
          sessionStorage.removeItem('restaurar_topico_ao_voltar_eemti');
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
  // 7. BANCO INDEXEDDB: FILA DE SYNC + CACHE DE FOTOS 3×4 OFFLINE
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

  function ordenarRespostaEmOrdemAlfabetica(action, textoJson) {
    if (!textoJson) return textoJson;
    try {
      const obj = JSON.parse(textoJson);
      const cmp = (a, b) => String(a || '').localeCompare(String(b || ''), 'pt-BR', { numeric: true });

      if (Array.isArray(obj)) {
        if (obj.length > 0 && (obj[0].nome || obj[0].aluno || obj[0].titulo)) {
          obj.sort((x, y) => cmp(x.nome || x.aluno || x.titulo, y.nome || y.aluno || y.titulo));
          return JSON.stringify(obj);
        }
      } else if (obj && typeof obj === 'object') {
        if (Array.isArray(obj.alunos)) {
          obj.alunos.sort((x, y) => cmp(x.nome || x.aluno || x, y.nome || y.aluno || y));
        }
        if (Array.isArray(obj.alunosDetalhados)) {
          obj.alunosDetalhados.sort((x, y) => cmp(x.nome || x.aluno, y.nome || y.aluno));
        }
        if (Array.isArray(obj.lista)) {
          if (action === 'listarLivrosBiblioteca') {
            obj.lista.sort((x, y) => cmp(x.titulo, y.titulo));
          } else if (action === 'listarSituacaoAlunos' || action === 'listarAee' || action === 'listarBuscaAtiva' || action === 'getAlunosParaPainelSuspensao') {
            obj.lista.sort((x, y) => cmp(x.aluno || x.nome, y.aluno || y.nome));
          } else if (action === 'listarFuncionarios') {
            obj.lista.sort((x, y) => cmp(x.nome, y.nome));
          }
        }
        if (Array.isArray(obj.disciplinas)) {
          obj.disciplinas.sort(cmp);
        }
        return JSON.stringify(obj);
      }
    } catch (e) {}
    return textoJson;
  }

  function salvarRespostaNoCacheInstantaneo(action, bodyObj, textoJsonBruto) {
    if (!ACOES_LEITURA_CACHE_PURO.includes(action)) return;
    if (!textoJsonBruto) return;

    const textoJson = ordenarRespostaEmOrdemAlfabetica(action, textoJsonBruto);

    try {
      const parsed = JSON.parse(textoJson);
      if (action === 'obterFotoAlunoIndividual' && parsed && parsed.success && bodyObj.aluno) {
        salvarFotoNoIndexedDB('ALUNO_' + String(bodyObj.aluno).trim().toUpperCase(), parsed);
      } else if (action === 'getAlunosParaEdicao' && Array.isArray(parsed)) {
        const serieChave = normalizarSeriePadraoCore((bodyObj.dados && bodyObj.dados.serie) || bodyObj.serie || '');
        if (serieChave) salvarFotoNoIndexedDB('TURMA_EDICAO_' + serieChave, parsed);
        parsed.forEach(al => {
          if (al && al.nome) {
            const ant = mapaFotosAlunosCacheMemoria['ALUNO_' + String(al.nome).trim().toUpperCase()] || {};
            salvarFotoNoIndexedDB('ALUNO_' + String(al.nome).trim().toUpperCase(), Object.assign({}, ant, al, { success: true }));
          }
        });
      } else if (action === 'listarLivrosBiblioteca' && parsed && Array.isArray(parsed.lista)) {
        salvarNoLocalStorageSeguro(KEY_LIVROS_BIBLIOTECA_OFFLINE, parsed);
      } else if ((action === 'obterCapaLivroDrive' || action === 'obterAnexoBuscaAtivaDrive') && parsed && parsed.success && bodyObj.caminho) {
        salvarFotoNoIndexedDB('ARQ_' + String(bodyObj.caminho).trim(), parsed);
      }
    } catch (e) {}

    if (textoJson.length > 450000) return;
    try {
      const ch = gerarChaveCacheRequisicao(action, bodyObj);
      localStorage.setItem(ch, textoJson);
    } catch (e) {
      liberarEspacoStorageAntigo();
    }
  }

  function obterRespostaDoCacheInstantaneo(action, bodyObj) {
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
    if (action === 'listarLivrosBiblioteca') {
      const livrosSalvos = localStorage.getItem(KEY_LIVROS_BIBLIOTECA_OFFLINE);
      if (livrosSalvos) return livrosSalvos;
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
  // 8. MOTOR DE SINCRONIZAÇÃO GERAL (1 VEZ AO ABRIR ONLINE OU CLICANDO EM ATUALIZAR)
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
          const seriesNorm = resFreqSec.series
            .map(s => normalizarSeriePadraoCore(s))
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));
          salvarNoLocalStorageSeguro(window.KEY_SERIES_UNIVERSAL_EEMTI, seriesNorm);
          salvarNoLocalStorageSeguro('cache_ativ_rapido_v3_ser', seriesNorm);
          salvarNoLocalStorageSeguro('cache_ativ_rapido_v2_ser', seriesNorm);
          salvarNoLocalStorageSeguro('cache_mapa_series_v4', seriesNorm);
        }
        if (Array.isArray(resFreqSec.alunosDetalhados) && resFreqSec.alunosDetalhados.length > 0) {
          const alunosNorm = resFreqSec.alunosDetalhados
            .map(a => ({
              ano: a.ano || "2026",
              nome: String(a.nome || "").replace(/\s+/g, " ").trim().toUpperCase(),
              serie: normalizarSeriePadraoCore(a.serie),
              bolsaFamilia: String(a.bolsaFamilia || "NÃO").trim().toUpperCase(),
              peDeMeia: String(a.peDeMeia || "NÃO").trim().toUpperCase(),
              sexo: String(a.sexo || "-").trim().toUpperCase()
            }))
            .filter(x => x.nome && x.serie && x.serie !== "TRANSFERIDO")
            .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

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
        if (Array.isArray(resFiltrosRac.alunos)) {
          resFiltrosRac.alunos.forEach(al => {
            if (al && al.nome && al.foto && String(al.foto).startsWith('data:image')) {
              const ant = mapaFotosAlunosCacheMemoria['ALUNO_' + String(al.nome).trim().toUpperCase()] || {};
              salvarFotoNoIndexedDB('ALUNO_' + String(al.nome).trim().toUpperCase(), Object.assign({}, ant, {
                success: true,
                nome: al.nome,
                serie: normalizarSeriePadraoCore(al.serie),
                foto: al.foto
              }));
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
        const discOrd = resDisc.disciplinas.slice().sort((a, b) => a.localeCompare(b, 'pt-BR'));
        salvarNoLocalStorageSeguro('cache_ativ_rapido_v3_disc', discOrd);
        salvarNoLocalStorageSeguro('cache_ativ_rapido_v2_disc', discOrd);
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
        const catalogoNorm = (resMatElet.catalogo || [])
          .map(c => ({
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
          }))
          .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

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
          professores: Array.from(profsSet).sort((a, b) => a.localeCompare(b, 'pt-BR')),
          catalogo: catalogoNorm
        };

        salvarNoLocalStorageSeguro(KEY_CATALOGO_ELETIVAS_OFFLINE, pacoteFiltrosFrequenciaEletiva);
        salvarNoLocalStorageSeguro('cache_ativ_rapido_v3_elet', catalogoNorm);
        salvarNoLocalStorageSeguro('cache_ativ_rapido_v2_elet', catalogoNorm);

        if (Array.isArray(resMatElet.historico)) {
          const matriculasLeves = resMatElet.historico
            .map(m => ({
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
            }))
            .filter(m => m.aluno && m.eletiva)
            .sort((a, b) => a.aluno.localeCompare(b.aluno, 'pt-BR'));

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
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'listarLivrosBiblioteca' }) }).then(r => r.text()).then(t => salvarRespostaNoCacheInstantaneo('listarLivrosBiblioteca', { action: 'listarLivrosBiblioteca' }, t)).catch(() => {}),
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'listarDadosEmprestimosBiblioteca' }) }).then(r => r.text()).then(t => salvarRespostaNoCacheInstantaneo('listarDadosEmprestimosBiblioteca', { action: 'listarDadosEmprestimosBiblioteca' }, t)).catch(() => {}),
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'getAlunosParaPainelSuspensao' }) }).then(r => r.text()).then(t => salvarRespostaNoCacheInstantaneo('getAlunosParaPainelSuspensao', { action: 'getAlunosParaPainelSuspensao' }, t)).catch(() => {}),
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'listarAtendimentosAlunos' }) }).then(r => r.text()).then(t => salvarRespostaNoCacheInstantaneo('listarAtendimentosAlunos', { action: 'listarAtendimentosAlunos' }, t)).catch(() => {}),
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'listarAtividadesUnificadas' }) }).then(r => r.text()).then(t => salvarRespostaNoCacheInstantaneo('listarAtividadesUnificadas', { action: 'listarAtividadesUnificadas' }, t)).catch(() => {}),
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'buscarFrequenciasGerenciamento', mes: '', semestre: '', eletiva: '', professor: '' }) }).then(r => r.json()).then(arr => { if (Array.isArray(arr)) salvarNoLocalStorageSeguro(KEY_FREQ_ELETIVAS_LANCAMENTOS, arr.slice(0, 1500)); }).catch(() => {}),
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'listarSituacaoAlunos' }) }).then(r => r.text()).then(t => salvarRespostaNoCacheInstantaneo('listarSituacaoAlunos', { action: 'listarSituacaoAlunos' }, t)).catch(() => {}),
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'listarAee' }) }).then(r => r.text()).then(t => salvarRespostaNoCacheInstantaneo('listarAee', { action: 'listarAee' }, t)).catch(() => {}),
        fetchComTimeoutSeguranca(API_PADRAO_URL, { method: 'POST', body: JSON.stringify({ action: 'listarBuscaAtiva' }) }).then(r => r.text()).then(t => salvarRespostaNoCacheInstantaneo('listarBuscaAtiva', { action: 'listarBuscaAtiva' }, t)).catch(() => {})
      ]).catch(() => {});

      sessionStorage.setItem(SESSAO_JA_SINCRONIZADA_KEY, 'SIM');
      registrarDataHoraAtualizacaoBanco();
      configurarPesquisaVivaEmTempoRealEmTodosInputs();
    } catch (errPrefetch) {
      atualizarSeloTopoSincronizacao();
    } finally {
      prefetchEmAndamento = false;
    }
  };

  function construirRespostaOfflineInteligente(action, bodyObj) {
    if (action === 'getAlunosParaEdicao') {
      const serieAlvo = normalizarSeriePadraoCore((bodyObj.dados && bodyObj.dados.serie) || bodyObj.serie || "");
      const anoAlvo = String((bodyObj.dados && bodyObj.dados.ano) || bodyObj.ano || "2026").trim();

      if (serieAlvo && mapaFotosAlunosCacheMemoria['TURMA_EDICAO_' + serieAlvo]) {
        return JSON.stringify(mapaFotosAlunosCacheMemoria['TURMA_EDICAO_' + serieAlvo]);
      }

      const alunos = JSON.parse(localStorage.getItem(window.KEY_ALUNOS_UNIVERSAL_EEMTI) || '[]');
      if (alunos.length > 0) {
        const daTurma = alunos
          .filter(a => !serieAlvo || normalizarSeriePadraoCore(a.serie) === serieAlvo)
          .map((a, idx) => {
            const det = mapaFotosAlunosCacheMemoria['ALUNO_' + a.nome] || {};
            return {
              linha: det.linha || (idx + 2),
              ano: a.ano || anoAlvo,
              serie: a.serie,
              nome: a.nome,
              fotoCaminho: det.fotoCaminho || "",
              foto: det.foto || a.foto || "",
              temCaminhoFoto: Boolean(det.foto || a.foto),
              bolsaFamilia: det.bolsaFamilia || a.bolsaFamilia || "NÃO",
              peDeMeia: det.peDeMeia || a.peDeMeia || "NÃO",
              sexo: det.sexo || a.sexo || "-",
              mae: det.mae || "",
              telMae: det.telMae || "",
              pai: det.pai || "",
              telPai: det.telPai || "",
              localidade: det.localidade || "",
              endereco: det.endereco || ""
            };
          })
          .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

        if (navigator.onLine && serieAlvo) {
          fetchComTimeoutSeguranca(API_PADRAO_URL, {
            method: 'POST',
            body: JSON.stringify(bodyObj)
          }, 15000).then(r => r.text()).then(txt => {
            if (txt && txt.startsWith('[')) salvarRespostaNoCacheInstantaneo('getAlunosParaEdicao', bodyObj, txt);
          }).catch(() => {});
        }

        return JSON.stringify(daTurma);
      }
    }

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
        }))
        .sort((a, b) => a.aluno.localeCompare(b.aluno, 'pt-BR'));
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
        return JSON.stringify(Array.from(new Set(filtradas)).sort((a, b) => a.localeCompare(b, 'pt-BR')));
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
        const alunosComFoto = alunos
          .map(a => {
            const fMem = mapaFotosAlunosCacheMemoria['ALUNO_' + a.nome];
            return fMem && fMem.foto ? Object.assign({}, a, { foto: fMem.foto }) : a;
          })
          .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
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
          alunosDetalhados: alunos.slice().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
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
  // 9. INTERCEPTADOR DE FETCH
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

      if (!ehReservaDeAmbiente && (ACOES_LEITURA_CACHE_PURO.includes(action) || action === 'obterCapaLivroDrive' || action === 'obterAnexoBuscaAtivaDrive')) {
        const cacheImediato = obterRespostaDoCacheInstantaneo(action, bodyObj);
        if (cacheImediato) {
          return new Response(cacheImediato, { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
      }

      try {
        const response = await fetchComTimeoutSeguranca(url, options, 18000);
        const clone = response.clone();

        clone.text().then(textoResp => {
          if (textoResp && (textoResp.startsWith('{') || textoResp.startsWith('['))) {
            salvarRespostaNoCacheInstantaneo(action, bodyObj, textoResp);

            try {
              const resJson = JSON.parse(textoResp);
              if (action === 'listarReservas' && resJson && Array.isArray(resJson.lista)) {
                cacheUltimasReservasCarregadas = resJson.lista;
              }
              if (action === 'fazerLogin' || ACOES_MUTACAO_CADASTROS.includes(action)) {
                if (resJson && (resJson.success || resJson.msg)) {
                  setTimeout(() => window.executarPreCarregamentoTotalOffline(true), 300);
                }
              }
            } catch (e) {}
          }
        }).catch(() => {});

        const textoOrdenado = await response.text();
        return new Response(ordenarRespostaEmOrdemAlfabetica(action, textoOrdenado), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
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
  // 10. GERADOR UNIVERSAL DE CABEÇALHO PDF (USA SEMPRE "brasaoestado.png"!)
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
    configurarInterceptadorBrasaoNosPdfs();
    const largPagina = doc.internal.pageSize.getWidth();
    const margemEsq = 14;
    const margemDir = largPagina - 14;
    const temFotoAluno = Boolean(opcoes.exibirMolduraFoto || opcoes.fotoAlunoBase64);

    const b64BrasaoEstado = localStorage.getItem('cache_brasao_estado_topo_b64');
    const logoB64 = b64BrasaoEstado ||
                    await window.converterImagemParaDataUrlPdf('brasaoestado.png', 240, 240) ||
                    await window.converterImagemParaDataUrlPdf('brasaoestado.png.png', 240, 240);

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
