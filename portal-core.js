// =========================================================================
// MOTOR CENTRAL UNIFICADO (PORTAL-CORE.JS) - VERSÃO DEFINITIVA EEMTI
// 1. ATIVIDADES (R, NR, A) E CHAMADA (P, F, FJ, A) COM LEGENDA AUTOMÁTICA ACIMA DA TABELA
// 2. SITUAÇÃO DO ALUNO COMPACTA: CPF, MATRÍCULA E RESPONSÁVEL ABAIXO DO NOME (-2 COLUNAS)
// 3. ORDEM ALFABÉTICA (A-Z) GARANTIDA EM TODOS OS ALUNOS, LIVROS, SELECTS E PESQUISAS
// 4. CACHE 100% INSTANTÂNEO (1ms): ATUALIZA 1 VEZ AO ABRIR E SÓ RECARREGA SE CLICAR EM ATUALIZAR
// 5. TOPO: "brasaoestado.png" | MARCA D'ÁGUA E PDF: "LOGO-removebg-preview.png"
// 6. GERENCIAR ALUNOS: SEM COLUNA STATUS FOTO + MODAL COMPLETO AO CLICAR NA LINHA
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

  // =========================================================================
  // 0. RESPONSIVIDADE TOTAL SEM ROLAGEM HORIZONTAL NO CELULAR
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

      /* Tabelas ajustadas na tela sem quebrar letras na vertical e sem barra de rolagem horizontal */
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

      .col-oculta-eemti {
        display: none !important;
      }

      tr.linha-aluno-clicavel {
        cursor: pointer;
        transition: background-color 0.15s ease;
      }
      tr.linha-aluno-clicavel:hover {
        background-color: #eff6ff !important;
      }

      .d-flex.gap-2, .d-flex.gap-3, .btn-group {
        gap: 4px !important;
      }
      td .btn + .btn, td .btn + button {
        margin-left: 2px !important;
      }

      /* Barra de Legenda Explicativa acima das tabelas (R/NR/A e P/F/FJ/A) */
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
        font-size: 0.75rem;
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

      .btn-chamada-compacto {
        min-width: 34px !important;
        padding: 4px 8px !important;
        font-weight: 800 !important;
        font-size: 0.74rem !important;
        border-radius: 6px !important;
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
          padding: 10px 7px !important;
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
          font-size: 0.62rem !important;
          padding: 5px 3px !important;
          line-height: 1.1 !important;
        }
        table.table td {
          font-size: 0.69rem !important;
          padding: 5px 3px !important;
          line-height: 1.18 !important;
        }
        table.table td .btn {
          font-size: 0.65rem !important;
          padding: 3px 6px !important;
          margin: 1px !important;
        }
        table.table td .badge {
          font-size: 0.6rem !important;
          padding: 2px 4px !important;
        }
        table.table td img {
          max-width: 38px !important;
          max-height: 50px !important;
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
  // 1. SEPARAÇÃO EXATA DAS DUAS IMAGENS:
  // - TOPO DAS PÁGINAS (.brand-escola img): "brasaoestado.png"
  // - MARCA D'ÁGUA DE FUNDO (.watermark-brasao-fundo) E PDF: "LOGO-removebg-preview.png"
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

  // =========================================================================
  // 2. OTIMIZADOR DE TABELAS:
  // - Atividades: R, NR, A + Legenda Acima da Tabela
  // - Frequência Secretaria: P, F, FJ, A + Legenda Acima da Tabela
  // - Situação do Aluno: Retira colunas Matrícula/CPF e Responsável, colocando-os abaixo do Nome do Aluno!
  // - Ordem Alfabética (A-Z) automática em selects/datalists de alunos e livros
  // =========================================================================
  window.abreviarSerieParaExibicao = function(textoSerie) {
    if (!textoSerie) return "";
    return String(textoSerie)
      .replace(/\b([123][ªº°])\s*(?:SÉRIE|SERIE|ANO)\s*([A-Z])\b/gi, '$1 $2')
      .replace(/\b([123][ªº°])\s*(?:SÉRIE|SERIE)\b/gi, '$1 SÉRIE');
  };

  window.abrirModalFichaCompletaAlunoEEMTI = async function(nomeAlunoClicado, serieHint) {
    const nomeLimpo = String(nomeAlunoClicado || "").replace(/\s+/g, " ").trim().toUpperCase();
    if (!nomeLimpo || typeof Swal === 'undefined') return;

    const alunosCache = JSON.parse(localStorage.getItem(window.KEY_ALUNOS_UNIVERSAL_EEMTI) || '[]');
    const baseAl = alunosCache.find(a => a.nome === nomeLimpo) || {};
    let infoDet = mapaFotosAlunosCacheMemoria['ALUNO_' + nomeLimpo] || {};

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
          infoDet = resInd;
          salvarFotoNoIndexedDB('ALUNO_' + nomeLimpo, resInd);
        }
      } catch (e) {}
    }

    const fotoSrc = infoDet.foto || baseAl.foto || '';
    const serieExib = infoDet.serie || baseAl.serie || serieHint || '-';
    const anoExib = infoDet.ano || baseAl.ano || '2026';
    const sexoExib = infoDet.sexo || baseAl.sexo || '-';
    const bfExib = infoDet.bolsaFamilia || baseAl.bolsaFamilia || 'NÃO';
    const pmExib = infoDet.peDeMeia || baseAl.peDeMeia || 'NÃO';
    const maeExib = infoDet.mae || baseAl.mae || 'NÃO INFORMADO';
    const telMaeExib = infoDet.telMae || baseAl.telMae || '-';
    const paiExib = infoDet.pai || baseAl.pai || 'NÃO INFORMADO';
    const telPaiExib = infoDet.telPai || baseAl.telPai || '-';
    const locExib = infoDet.localidade || baseAl.localidade || '-';
    const endExib = infoDet.endereco || baseAl.endereco || '-';

    const htmlFoto = fotoSrc && String(fotoSrc).startsWith('data:image')
      ? `<img src="${fotoSrc}" style="width:95px;height:126px;object-fit:cover;border-radius:10px;border:2px solid #15438c;box-shadow:0 4px 10px rgba(0,0,0,0.12);">`
      : `<div style="width:95px;height:126px;border-radius:10px;border:2px dashed #94a3b8;display:flex;align-items:center;justify-content:center;background:#f8fafc;color:#64748b;font-size:2.2rem;"><i class="bi bi-person-bounding-box"></i></div>`;

    Swal.fire({
      title: `<span style="font-size:1.05rem;font-weight:800;color:#15438c;"><i class="bi bi-person-vcard-fill me-2"></i>Ficha Completa do(a) Aluno(a)</span>`,
      html: `
        <div class="text-start mt-2" style="font-size:0.84rem;">
          <div class="d-flex align-items-center gap-3 p-2 rounded bg-light border mb-3">
            ${htmlFoto}
            <div>
              <div class="fw-bold text-dark" style="font-size:0.98rem;line-height:1.2;">${nomeLimpo}</div>
              <div class="mt-1">
                <span class="badge bg-primary">${serieExib}</span>
                <span class="badge bg-secondary">Ano: ${anoExib}</span>
                <span class="badge bg-info text-dark">Sexo: ${sexoExib}</span>
              </div>
              <div class="mt-2 d-flex gap-1 flex-wrap">
                <span class="badge ${bfExib === 'SIM' ? 'bg-success' : 'bg-secondary'}">Bolsa Família: ${bfExib}</span>
                <span class="badge ${pmExib === 'SIM' ? 'bg-success' : 'bg-secondary'}">Pé-de-Meia: ${pmExib}</span>
              </div>
            </div>
          </div>

          <div class="p-2 rounded border mb-2">
            <div class="fw-bold text-primary small mb-1"><i class="bi bi-people-fill me-1"></i>Filiação e Contatos</div>
            <div><b>Mãe:</b> ${maeExib}</div>
            <div><b>Tel. Mãe:</b> ${telMaeExib}</div>
            <hr class="my-1">
            <div><b>Pai:</b> ${paiExib}</div>
            <div><b>Tel. Pai:</b> ${telPaiExib}</div>
          </div>

          <div class="p-2 rounded border">
            <div class="fw-bold text-primary small mb-1"><i class="bi bi-geo-alt-fill me-1"></i>Localidade e Endereço</div>
            <div><b>Localidade:</b> ${locExib}</div>
            <div><b>Endereço:</b> ${endExib}</div>
          </div>
        </div>
      `,
      confirmButtonColor: '#15438c',
      confirmButtonText: 'Fechar Ficha'
    });
  };

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
    }

    tabela.parentElement.insertBefore(divLeg, tabela);
  }

  function aplicarCompactacaoVisualNasTabelasEBotoes() {
    aplicarImagensOficiaisTopoEMarcaDagua();

    let temBotoesAtividade = false;
    let temBotoesChamadaSec = false;
    let tabelaAtividadeAlvo = null;
    let tabelaChamadaSecAlvo = null;

    // A) Compacta botões de Frequência da Secretaria (P, F, FJ, A) e de Atividades (R, NR, A)
    document.querySelectorAll('table button, table .btn, table label.btn').forEach(btn => {
      const txt = (btn.textContent || '').trim();
      const tbPai = btn.closest('table');

      // Botões de Chamada da Secretaria
      if (txt === 'Presente (P)' || txt === 'Presente') {
        btn.textContent = 'P';
        btn.title = 'Presente (P)';
        btn.classList.add('btn-chamada-compacto');
        temBotoesChamadaSec = true;
        tabelaChamadaSecAlvo = tbPai;
      } else if (txt === 'Falta (F)' || txt === 'Falta') {
        btn.textContent = 'F';
        btn.title = 'Falta (F)';
        btn.classList.add('btn-chamada-compacto');
        temBotoesChamadaSec = true;
        tabelaChamadaSecAlvo = tbPai;
      } else if (txt === 'Justificada (FJ)' || txt === 'Falta Justificada (FJ)' || txt === 'Justificada') {
        btn.textContent = 'FJ';
        btn.title = 'Falta Justificada (FJ)';
        btn.classList.add('btn-chamada-compacto');
        temBotoesChamadaSec = true;
        tabelaChamadaSecAlvo = tbPai;
      } else if (txt === 'Atestado (A)' || txt === 'Atestado') {
        btn.textContent = 'A';
        btn.title = 'Atestado (A)';
        btn.classList.add('btn-chamada-compacto');
        temBotoesChamadaSec = true;
        tabelaChamadaSecAlvo = tbPai;
      }

      // Botões de Lançamento de Atividades (R, NR, A)
      if (txt === 'Realizou') {
        btn.textContent = 'R';
        btn.title = 'Realizou (R)';
        btn.classList.add('btn-chamada-compacto');
        temBotoesAtividade = true;
        tabelaAtividadeAlvo = tbPai;
      } else if (txt === 'Não Realizou' || txt === 'Nao Realizou') {
        btn.textContent = 'NR';
        btn.title = 'Não Realizou (NR)';
        btn.classList.add('btn-chamada-compacto');
        temBotoesAtividade = true;
        tabelaAtividadeAlvo = tbPai;
      } else if (txt === 'Ausente') {
        btn.textContent = 'A';
        btn.title = 'Ausente (A)';
        btn.classList.add('btn-chamada-compacto');
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

    // B) Otimização estrutural das Tabelas (Gerenciar Alunos + Situação do Aluno + Colunas Mobile)
    document.querySelectorAll('table.table').forEach(tabela => {
      const ths = Array.from(tabela.querySelectorAll('thead th'));
      let idxColStatusFoto = -1;
      let idxSituacaoNome = -1;
      let idxSituacaoMatCpf = -1;
      let idxSituacaoResp = -1;
      const indicesOcultarNoMobile = [];

      ths.forEach((th, idx) => {
        const tituloCol = (th.textContent || '').replace(/\s+/g, ' ').trim().toUpperCase();

        // 1. Gerenciar Alunos: oculta "Status da Foto"
        if (tituloCol.includes('STATUS DA FOTO') || tituloCol === 'STATUS FOTO') {
          idxColStatusFoto = idx;
          th.classList.add('col-oculta-eemti');
        }

        // 2. Situação do Aluno: identifica colunas Aluno, Matrícula/CPF e Responsável para mesclar!
        if (tituloCol.includes('ALUNO')) idxSituacaoNome = idx;
        if (tituloCol.includes('MATRÍCULA') || tituloCol.includes('MATRICULA') || tituloCol.includes('CPF')) {
          idxSituacaoMatCpf = idx;
        }
        if (tituloCol.includes('RESPONSÁVEL') || tituloCol.includes('RESPONSAVEL')) {
          idxSituacaoResp = idx;
        }

        // 3. Colunas secundárias para ocultar em telas de celular
        if (
          tituloCol.includes('BENEFÍCIOS') ||
          tituloCol.includes('BENEFICIOS') ||
          tituloCol === 'C.H' ||
          tituloCol === 'ID' ||
          tituloCol.includes('EDIÇÃO') ||
          tituloCol.includes('EDITORA') ||
          tituloCol.includes('BACKUP')
        ) {
          indicesOcultarNoMobile.push(idx);
          th.classList.add('col-oculta-mobile-eemti');
        }
      });

      // Se for a tabela da página Situação do Aluno (possui Matrícula/CPF e Responsável):
      // Oculta as 2 colunas (Matrícula/CPF e Responsável) e coloca CPF + Responsável abaixo do Nome do Aluno!
      const ehTabelaSituacaoAluno = (idxSituacaoMatCpf >= 0 && idxSituacaoNome >= 0 && window.location.pathname.toLowerCase().includes('situacao'));
      if (ehTabelaSituacaoAluno) {
        if (ths[idxSituacaoMatCpf]) ths[idxSituacaoMatCpf].classList.add('col-oculta-eemti');
        if (idxSituacaoResp >= 0 && ths[idxSituacaoResp]) ths[idxSituacaoResp].classList.add('col-oculta-eemti');
      }

      const linhas = tabela.querySelectorAll('tbody tr');
      linhas.forEach(tr => {
        const tds = tr.children;
        if (!tds || tds.length <= 1) return;

        if (idxColStatusFoto >= 0 && tds[idxColStatusFoto]) {
          tds[idxColStatusFoto].classList.add('col-oculta-eemti');
        }
        indicesOcultarNoMobile.forEach(iMob => {
          if (tds[iMob]) tds[iMob].classList.add('col-oculta-mobile-eemti');
        });

        // Mescla Matrícula/CPF e Nome do Responsável abaixo do Nome do Aluno na página Situação do Aluno
        if (ehTabelaSituacaoAluno) {
          if (tds[idxSituacaoMatCpf]) tds[idxSituacaoMatCpf].classList.add('col-oculta-eemti');
          if (idxSituacaoResp >= 0 && tds[idxSituacaoResp]) tds[idxSituacaoResp].classList.add('col-oculta-eemti');

          const tdAluno = tds[idxSituacaoNome];
          if (tdAluno && !tr._eemtiSituacaoMesclada) {
            tr._eemtiSituacaoMesclada = true;
            const nomeAlTxt = (tdAluno.textContent || '').replace(/\s+/g, ' ').trim();
            const matCpfTxt = tds[idxSituacaoMatCpf] ? (tds[idxSituacaoMatCpf].textContent || '').replace(/\s+/g, ' ').trim() : '';
            const respTxt = (idxSituacaoResp >= 0 && tds[idxSituacaoResp]) ? (tds[idxSituacaoResp].textContent || '').replace(/\s+/g, ' ').trim() : '';

            let subInfo = [];
            if (respTxt && respTxt !== '-') subInfo.push(`<b>Resp.:</b> ${respTxt}`);
            if (matCpfTxt && matCpfTxt !== '-') subInfo.push(`${matCpfTxt}`);

            tdAluno.innerHTML = `
              <div class="fw-bold text-dark">${nomeAlTxt}</div>
              ${subInfo.length > 0 ? `<div class="text-muted" style="font-size:0.68rem;line-height:1.25;margin-top:2px;">${subInfo.join(' • ')}</div>` : ''}
            `;
          }
        }

        // Gerenciar Alunos: Linha clicável que abre a Ficha Completa
        if (idxColStatusFoto >= 0 && tds[1] && !tr._eemtiFichaBound) {
          tr._eemtiFichaBound = true;
          tr.classList.add('linha-aluno-clicavel');
          tr.title = 'Toque na linha para ver todas as informações do(a) aluno(a)';

          const divBoldNome = tds[1].querySelector('.fw-bold, b, strong') || tds[1];
          const nomeExtraido = (divBoldNome.textContent || '').replace(/\s+/g, ' ').trim();
          const serieExtraida = tds[2] ? (tds[2].textContent || '').trim() : '';

          if (nomeExtraido) {
            tds[1].innerHTML = `
              <div class="fw-bold text-dark">${nomeExtraido}</div>
              <small class="text-primary" style="font-size:0.65rem;"><i class="bi bi-info-circle me-1"></i>Toque p/ ver ficha</small>
            `;
          }

          tr.addEventListener('click', function(ev) {
            if (ev.target.closest('button, a, input, select, .btn')) return;
            window.abrirModalFichaCompletaAlunoEEMTI(nomeExtraido, serieExtraida);
          });
        }
      });
    });

    // C) Abrevia "2ª SÉRIE A" para "2ª A" dentro de células de tabelas (mantendo "2ª SÉRIE A" nos <select>)
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

    // D) Garante que qualquer <datalist> de pesquisa de alunos na página tenha todos os alunos em Ordem Alfabética (A-Z)
    preencherDatalistsDePesquisaEmOrdemAlfabetica();
  }

  function preencherDatalistsDePesquisaEmOrdemAlfabetica() {
    const datalists = document.querySelectorAll('datalist');
    if (datalists.length === 0) return;

    const alunosCache = JSON.parse(localStorage.getItem(window.KEY_ALUNOS_UNIVERSAL_EEMTI) || '[]');
    if (alunosCache.length === 0) return;

    datalists.forEach(dl => {
      const idDl = (dl.id || '').toLowerCase();
      if ((idDl.includes('aluno') || idDl.includes('estudante') || idDl.includes('nomes')) && dl.children.length < 5) {
        const nomesUnicos = Array.from(new Set(alunosCache.map(a => a.nome))).sort((a, b) => a.localeCompare(b, 'pt-BR'));
        dl.innerHTML = nomesUnicos.map(n => `<option value="${n}">`).join('');
      }
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
  // 3. SELO DE ATUALIZAÇÃO APÓS O BOTÃO SAIR + BOTÕES VOLTAR E INÍCIO
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

    if (navigator.onLine) {
      window.converterImagemParaDataUrlPdf('brasaoestado.png', 300, 300).then(b64 => {
        if (b64) {
          try { localStorage.setItem('cache_brasao_estado_topo_b64', b64); } catch (e) {}
          aplicarImagensOficiaisTopoEMarcaDagua();
        } else {
          window.converterImagemParaDataUrlPdf('brasaoestado.png.png', 300, 300).then(b64Alt => {
            if (b64Alt) {
              try { localStorage.setItem('cache_brasao_estado_topo_b64', b64Alt); } catch (e) {}
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
  // 4. BANCO INDEXEDDB: FILA DE SYNC + CACHE DE FOTOS 3×4 OFFLINE
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

  // Ordena em Ordem Alfabética (A-Z) qualquer lista de alunos, livros ou séries antes de salvar no cache!
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
  // 5. MOTOR DE SINCRONIZAÇÃO GERAL (RODA 1 ÚNICA VEZ AO ABRIR O SISTEMA ONLINE,
  //    OU QUANDO O PROFESSOR CLICAR EM "ATUALIZADO EM..." PARA ATUALIZAR!)
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

      // Lote 2 em segundo plano: Livros da Biblioteca (em Ordem Alfabética), Suspensões, Atividades, Situação, AEE e Busca Ativa
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
      preencherDatalistsDePesquisaEmOrdemAlfabetica();
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
  // 6. INTERCEPTADOR DE FETCH (100% CACHE LOCAL NAS PESQUISAS — ZERO TRAVAMENTO!)
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

      // Entrega em 1ms direto do cache (sem disparar rede a cada busca!)
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
  // 7. GERADOR UNIVERSAL DE CABEÇALHO PDF (USA EXCLUSIVAMENTE A LOGO DA ESCOLA!)
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

    const b64LogoEscola = localStorage.getItem('cache_logo_escola_marcadagua_b64');
    const logoB64 = b64LogoEscola || await window.converterImagemParaDataUrlPdf('LOGO-removebg-preview.png', 200, 200);

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
