// =========================================================================
// MOTOR CENTRAL UNIFICADO (PORTAL-CORE.JS) - VERSÃO DEFINITIVA COMPLETA
// 1. PRÉ-CARREGAMENTO TOTAL NO LOGIN (ALUNOS, SÉRIES, DISCIPLINAS, ELETIVAS,
//    MATRÍCULAS, OCORRÊNCIAS, PDT E MAPEAMENTOS DE SALA)
// 2. GRAVA EM TODAS AS CHAVES (V1, V2, V3, V4) + RESPONDE FETCH OFFLINE
// 3. ATUALIZA AUTOMATICAMENTE AO CADASTRAR ALUNO, MATRÍCULA, DISCIPLINA, AMBIENTE, ETC.
// 4. SINCRONIZAÇÃO COM O APP FECHADO (SW.JS + INDEXEDDB) E EM 2º PLANO SEM TRAVAR A TELA
// 5. CABEÇALHO INSTITUCIONAL PADRÃO COM BRASÃO E FOTO 3×4 PARA PDF
// =========================================================================
(function() {
  const FILA_GLOBAL_KEY = 'fila_offline_eemti_v1';
  const LOG_SINCRONIZADOS_KEY = 'log_recem_sincronizados_eemti_v1';
  const TIMESTAMP_PREFETCH_KEY = 'ultimo_prefetch_completo_eemti_ts';
  const IDB_SYNC_NAME = 'EEMTI_BackgroundSync_DB';
  const API_PADRAO_URL = "https://script.google.com/macros/s/AKfycbzERHqBAca1K2wCMcqfVXCrulET5ZyMFOyYkXyBcdPyjPnjS28Roga43Sj90O8s5_Om/exec";

  const FILAS_LEGADAS = [
    'fila_offline_rac_eemti_v1',
    'fila_offline_atividades_eemti_v1',
    'fila_offline_mapeamento_v1'
  ];

  // Chaves universais compartilhadas entre todas as páginas offline
  window.KEY_ALUNOS_UNIVERSAL_EEMTI = 'cache_rac_alunos_leve_v3';
  window.KEY_SERIES_UNIVERSAL_EEMTI = 'cache_rac_series_v3';
  const KEY_MATRICULAS_ELETIVAS_OFFLINE = 'cache_matriculas_eletivas_global_v1';
  const KEY_CATALOGO_ELETIVAS_OFFLINE = 'cache_catalogo_eletivas_global_v1';
  const KEY_TODAS_OCORRENCIAS_OFFLINE = 'cache_rac_todas_ocorrencias_v1';
  const KEY_AMBIENTES_OFFLINE = 'cache_ambientes_escola_v1';

  // Ações que podem ser lançadas Offline pelos professores
  const ACOES_GRAVACAO_OFFLINE = {
    'salvarOcorrencia': 'Ocorrência Disciplinar (RAC)',
    'salvarAtividadeDisciplinas': 'Atividade Contínua (Disciplina/Eletiva)',
    'salvarAtividadeEletivas': 'Atividade de Eletiva',
    'salvarFrequenciaSecretaria': 'Frequência da Secretaria (Manhã/Tarde)',
    'salvarFrequencia': 'Frequência de Eletiva',
    'salvarMapeamentoSala': 'Mapeamento de Sala de Aula'
  };

  // Todas as ações de cadastro, edição ou exclusão que disparam atualização imediata da base offline!
  const ACOES_MUTACAO_CADASTROS = [
    'salvarOcorrencia', 'excluirOcorrencia',
    'salvarAtividadeDisciplinas', 'salvarAtividadeEletivas',
    'salvarFrequenciaSecretaria', 'salvarFrequencia', 'excluirFrequencia',
    'salvarAtendimentoAluno', 'salvarSuspensaoManual',
    'salvarAlunoIndividual', 'salvarAlunosLote', 'atualizarAluno', 'editarAluno',
    'excluirAluno', 'migrarAlunosSelecionados', 'salvarMatricula', 'cadastrarEletiva',
    'atualizarEletiva', 'editarEletiva', 'excluirEletiva', 'salvarDisciplinaCadastro',
    'excluirDisciplinaCadastro', 'salvarConfig', 'excluirConfig', 'salvarPDT', 'excluirPDT',
    'salvarMapeamentoSala', 'salvarReserva', 'excluirReserva', 'salvarDiasLetivosMes'
  ];

  let sincronizacaoEmAndamento = false;
  let prefetchEmAndamento = false;

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

  // =========================================================================
  // 1. BANCO INDEXEDDB OFICIAL (PONTE ENTRE O APP FECHADO E ABERTO)
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

  async function adicionarItemNoIndexedDB(itemObj) {
    const db = await abrirBancoSyncIDB();
    if (!db) return;
    await new Promise(resolve => {
      try {
        const tx = db.transaction('fila_pendente', 'readwrite');
        tx.objectStore('fila_pendente').put(itemObj);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch (e) {
        resolve();
      }
    });

    if ('serviceWorker' in navigator) {
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

  async function removerItemDoIndexedDB(idFila) {
    const db = await abrirBancoSyncIDB();
    if (!db) return;
    return new Promise(resolve => {
      try {
        const tx = db.transaction('fila_pendente', 'readwrite');
        tx.objectStore('fila_pendente').delete(idFila);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch (e) {
        resolve();
      }
    });
  }

  async function reconciliarEstadoComServiceWorkerAoAbrir() {
    const db = await abrirBancoSyncIDB();
    let itensEnviadosComAppFechado = [];
    let idsJaEnviadosSet = new Set();

    if (db) {
      await new Promise(resolve => {
        try {
          const tx = db.transaction(['relatorio_concluido', 'fila_pendente'], 'readwrite');
          const storeRel = tx.objectStore('relatorio_concluido');
          const storeFila = tx.objectStore('fila_pendente');

          const reqRel = storeRel.getAll();
          const reqFila = storeFila.getAll();

          tx.oncomplete = () => {
            const relatorios = Array.isArray(reqRel.result) ? reqRel.result : [];
            const filaNoIDB = Array.isArray(reqFila.result) ? reqFila.result : [];

            if (relatorios.length > 0) {
              relatorios.forEach(r => {
                if (r.resumoHtml) itensEnviadosComAppFechado.push(r.resumoHtml);
                if (r.idFila) idsJaEnviadosSet.add(r.idFila);
              });
              const txClear = db.transaction('relatorio_concluido', 'readwrite');
              txClear.objectStore('relatorio_concluido').clear();
            }

            let filaLocal = JSON.parse(localStorage.getItem(FILA_GLOBAL_KEY) || '[]');
            if (idsJaEnviadosSet.size > 0 || relatorios.length > 0) {
              const idsAindaPendentesNoIDB = new Set(filaNoIDB.map(x => x.idFila));
              filaLocal = filaLocal.filter(item => idsAindaPendentesNoIDB.has(item.idFila) && !idsJaEnviadosSet.has(item.idFila));
              localStorage.setItem(FILA_GLOBAL_KEY, JSON.stringify(filaLocal));
            } else if (filaLocal.length > 0 && filaNoIDB.length === 0) {
              const txSync = db.transaction('fila_pendente', 'readwrite');
              filaLocal.forEach(it => txSync.objectStore('fila_pendente').put(it));
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
      itensEnviadosComAppFechado = itensEnviadosComAppFechado.concat(logLocal);
      localStorage.removeItem(LOG_SINCRONIZADOS_KEY);
    }

    if (itensEnviadosComAppFechado.length > 0) {
      window.atualizarBadgeStatusConexaoGlobal();
      window.dispatchEvent(new CustomEvent('eemti-fila-sincronizada'));
      exibirAvisoFinalDeDadosSincronizados(itensEnviadosComAppFechado, true);
      setTimeout(() => window.executarPreCarregamentoTotalOffline(true), 500);
      return true;
    }
    return false;
  }

  // =========================================================================
  // 2. MOTOR DE PRÉ-CARREGAMENTO TOTAL NO LOGIN / INÍCIO (PRE-FETCH OFFLINE)
  // Baixa e salva em TODAS as chaves usadas por:
  // - Ocorrências RAC
  // - Frequência da Secretaria
  // - Frequência de Eletivas
  // - Atividades (Disciplinas e Eletivas)
  // - Mapeamento de Sala e PDT
  // - Ambientes e Bimestres
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
    const jaTemMapas = Boolean(localStorage.getItem('cache_todos_mapas_salvos_v4'));

    // Se já baixou tudo há menos de 5 minutos e não foi forçado por novo cadastro, mantém o cache atual
    if (!forcarImediato && jaTemAlunos && jaTemEletivas && jaTemMapas && (agora - ultimoTs < 300000)) {
      return;
    }

    prefetchEmAndamento = true;
    const filaPendenteAgora = unificarFilasOfflineNoStorage();
    if (filaPendenteAgora.length === 0) {
      window.atualizarBadgeStatusConexaoGlobal("Preparando base offline...");
    }

    try {
      const [
        resFreqSec,
        resFiltrosRac,
        resDisc,
        resMatElet,
        resBim,
        resOcoRac,
        resPdt,
        resMapas,
        resAmbientes
      ] = await Promise.all([
        _fetchNativo(API_PADRAO_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'listarFrequenciaSecretaria' }), redirect: 'follow' }).then(r => r.json()).catch(() => null),
        _fetchNativo(API_PADRAO_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'getFiltrosOcorrencias' }), redirect: 'follow' }).then(r => r.json()).catch(() => null),
        _fetchNativo(API_PADRAO_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'listarDisciplinasCadastradas' }), redirect: 'follow' }).then(r => r.json()).catch(() => null),
        _fetchNativo(API_PADRAO_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'getDadosMatricula' }), redirect: 'follow' }).then(r => r.json()).catch(() => null),
        _fetchNativo(API_PADRAO_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'listarConfig', tipo: 'BIMESTRE' }), redirect: 'follow' }).then(r => r.json()).catch(() => null),
        _fetchNativo(API_PADRAO_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'buscarOcorrencias', filtros: { ignorarRestricao: true } }), redirect: 'follow' }).then(r => r.json()).catch(() => null),
        _fetchNativo(API_PADRAO_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'listarPDT' }), redirect: 'follow' }).then(r => r.json()).catch(() => null),
        _fetchNativo(API_PADRAO_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'listarTodosMapeamentos' }), redirect: 'follow' }).then(r => r.json()).catch(() => null),
        _fetchNativo(API_PADRAO_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'listarConfig', tipo: 'AMBIENTE' }), redirect: 'follow' }).then(r => r.json()).catch(() => null)
      ]);

      // 1. SÉRIES E ALUNOS (Salva em TODAS as chaves v2, v3 e v4 para Ocorrências, Secretaria, Atividades e Mapeamento!)
      let series Consolidadas = [];
      let alunosConsolidados = [];

      if (resFreqSec && resFreqSec.success) {
        if (Array.isArray(resFreqSec.series) && resFreqSec.series.length > 0) {
          seriesConsolidadas = resFreqSec.series.map(s => normalizarSeriePadraoCore(s)).filter(Boolean);
        }
        if (Array.isArray(resFreqSec.alunosDetalhados) && resFreqSec.alunosDetalhados.length > 0) {
          alunosConsolidados = resFreqSec.alunosDetalhados.map(a => ({
            ano: a.ano || "2026",
            nome: String(a.nome || "").replace(/\s+/g, " ").trim().toUpperCase(),
            serie: normalizarSeriePadraoCore(a.serie),
            bolsaFamilia: String(a.bolsaFamilia || "NÃO").trim().toUpperCase(),
            peDeMeia: String(a.peDeMeia || "NÃO").trim().toUpperCase(),
            sexo: String(a.sexo || "-").trim().toUpperCase()
          })).filter(x => x.nome && x.serie && x.serie !== "TRANSFERIDO");
        }
        if (resFreqSec.diasLetivosMes) {
          salvarNoLocalStorageSeguro('cache_freq_sec_dias_letivos_v4', resFreqSec.diasLetivosMes);
        }
        if (Array.isArray(resFreqSec.frequencias)) {
          salvarNoLocalStorageSeguro('cache_freq_sec_lancamentos_v4', resFreqSec.frequencias.slice(-2000));
          salvarNoLocalStorageSeguro('cache_freq_sec_hist_v3', resFreqSec.frequencias.slice(-1500));
        }
      }

      if (resFiltrosRac && resFiltrosRac.success) {
        if (seriesConsolidadas.length === 0 && Array.isArray(resFiltrosRac.series)) {
          seriesConsolidadas = resFiltrosRac.series.map(s => normalizarSeriePadraoCore(s)).filter(Boolean);
        }
        if (alunosConsolidados.length === 0 && Array.isArray(resFiltrosRac.alunos)) {
          alunosConsolidados = resFiltrosRac.alunos.map(a => ({
            ano: a.ano || "2026",
            nome: String(a.nome || "").replace(/\s+/g, " ").trim().toUpperCase(),
            serie: normalizarSeriePadraoCore(a.serie),
            bolsaFamilia: "NÃO",
            peDeMeia: "NÃO",
            sexo: "-"
          })).filter(x => x.nome && x.serie && x.serie !== "TRANSFERIDO");
        }
        if (Array.isArray(resFiltrosRac.ocorrencias) && resFiltrosRac.ocorrencias.length > 0) {
          const catRac = resFiltrosRac.ocorrencias.map(o => ({
            descricao: String(o.descricao || "").trim(),
            gravidade: String(o.gravidade || "GRAU I (INFRAÇÕES LEVES)").trim().toUpperCase()
          })).filter(o => o.descricao);
          salvarNoLocalStorageSeguro('cache_rac_catalogo_v3', catRac);
        }
      }

      if (seriesConsolidadas.length > 0) {
        salvarNoLocalStorageSeguro(window.KEY_SERIES_UNIVERSAL_EEMTI, seriesConsolidadas);
        salvarNoLocalStorageSeguro('cache_ativ_rapido_v3_ser', seriesConsolidadas);
        salvarNoLocalStorageSeguro('cache_ativ_rapido_v2_ser', seriesConsolidadas);
        salvarNoLocalStorageSeguro('cache_mapa_series_v4', seriesConsolidadas);
      }

      if (alunosConsolidados.length > 0) {
        salvarNoLocalStorageSeguro(window.KEY_ALUNOS_UNIVERSAL_EEMTI, alunosConsolidados);
        salvarNoLocalStorageSeguro('cache_freq_sec_alunos_det_v4', alunosConsolidados);
        salvarNoLocalStorageSeguro('cache_ativ_rapido_v3_alunos', alunosConsolidados);
        salvarNoLocalStorageSeguro('cache_ativ_rapido_v2_alunos', alunosConsolidados);
      }

      // 2. OCORRÊNCIAS REGISTRADAS (GERAL + DO PROFESSOR LOGADO)
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

      // 3. DISCIPLINAS CURRICULARES (Salva em v2 e v3 para Atividades e Cadastro de Disciplinas)
      if (resDisc && resDisc.success && Array.isArray(resDisc.disciplinas) && resDisc.disciplinas.length > 0) {
        salvarNoLocalStorageSeguro('cache_ativ_rapido_v3_disc', resDisc.disciplinas);
        salvarNoLocalStorageSeguro('cache_ativ_rapido_v2_disc', resDisc.disciplinas);
        if (Array.isArray(resDisc.listaDetalhada)) {
          salvarNoLocalStorageSeguro('cache_aba_exclusiva_disciplinas_v2', resDisc.listaDetalhada);
          salvarNoLocalStorageSeguro('cache_lista_disciplinas_det_v1', resDisc.listaDetalhada);
        }
      }

      // 4. BIMESTRES (Salva em v2, v3 e v4)
      if (resBim && Array.isArray(resBim.lista)) {
        const bimFormatados = resBim.lista.map(b => ({
          nome: String(b.col1 || "").trim(),
          inicioIso: String(b.col2 || "").includes('-') ? String(b.col2).trim() : "",
          fimIso: String(b.col3 || "").includes('-') ? String(b.col3).trim() : ""
        })).filter(b => b.nome);
        salvarNoLocalStorageSeguro('cache_ativ_rapido_v3_bim', bimFormatados);
        salvarNoLocalStorageSeguro('cache_ativ_rapido_v2_bim', bimFormatados);
      }

      // 5. ELETIVAS E MATRÍCULAS EM ELETIVAS (Para Frequência Eletiva e Atividades de Eletivas!)
      if (resMatElet && resMatElet.success) {
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
            const ch1 = `${m.ano}|${m.eletiva}`;
            if (!mapaPorEletivaAtiv[ch1]) mapaPorEletivaAtiv[ch1] = [];
            if (!mapaPorEletivaAtiv[ch1].some(x => x.nome === m.aluno)) {
              mapaPorEletivaAtiv[ch1].push({ nome: m.aluno, serie: m.serie });
            }
          });
          salvarNoLocalStorageSeguro('cache_ativ_rapido_v3_al_elet', mapaPorEletivaAtiv);
          salvarNoLocalStorageSeguro('cache_ativ_rapido_v2_al_elet', mapaPorEletivaAtiv);
        }
      }

      // 6. PDT E MAPEAMENTOS DE SALA (Para Mapeamento de Sala e Atendimento PDT!)
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

      // 7. AMBIENTES E MATERIAIS (Aba AMBIENTE/MATERIAL)
      if (resAmbientes && Array.isArray(resAmbientes.lista)) {
        salvarNoLocalStorageSeguro(KEY_AMBIENTES_OFFLINE, resAmbientes.lista);
      }

      localStorage.setItem(TIMESTAMP_PREFETCH_KEY, String(Date.now()));

      // Mostra um aviso rápido e discreto no canto inferior confirmando que a base offline está pronta!
      if (unificarFilasOfflineNoStorage().length === 0) {
        window.atualizarBadgeStatusConexaoGlobal("✓ Base offline atualizada!", "#16a34a");
        setTimeout(() => window.atualizarBadgeStatusConexaoGlobal(), 2200);
      }
    } catch (errPrefetch) {
      window.atualizarBadgeStatusConexaoGlobal();
    } finally {
      prefetchEmAndamento = false;
    }
  };

  // =========================================================================
  // 3. CONSTRUTOR DE RESPOSTAS OFFLINE PARA TODAS AS PÁGINAS DO PORTAL
  // =========================================================================
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
      return JSON.stringify(listaFinal);
    }

    if (action === 'getAlunosParaEdicao') {
      const serieAlvo = normalizarSeriePadraoCore((bodyObj.dados && bodyObj.dados.serie) || bodyObj.serie || "");
      const alunos = JSON.parse(localStorage.getItem(window.KEY_ALUNOS_UNIVERSAL_EEMTI) || '[]');
      const daTurma = alunos
        .filter(a => !serieAlvo || normalizarSeriePadraoCore(a.serie) === serieAlvo)
        .map(a => ({ nome: a.nome, serie: a.serie, foto: "" }));
      return JSON.stringify(daTurma);
    }

    if (action === 'getFiltrosOcorrencias') {
      const series = JSON.parse(localStorage.getItem(window.KEY_SERIES_UNIVERSAL_EEMTI) || '[]');
      const alunos = JSON.parse(localStorage.getItem(window.KEY_ALUNOS_UNIVERSAL_EEMTI) || '[]');
      const ocorrencias = JSON.parse(localStorage.getItem('cache_rac_catalogo_v3') || '[]');
      return JSON.stringify({ success: true, series: series, alunos: alunos, ocorrencias: ocorrencias });
    }

    if (action === 'listarFrequenciaSecretaria') {
      const series = JSON.parse(localStorage.getItem(window.KEY_SERIES_UNIVERSAL_EEMTI) || '[]');
      const alunos = JSON.parse(localStorage.getItem('cache_freq_sec_alunos_det_v4') || localStorage.getItem(window.KEY_ALUNOS_UNIVERSAL_EEMTI) || '[]');
      const frequencias = JSON.parse(localStorage.getItem('cache_freq_sec_lancamentos_v4') || '[]');
      const diasLetivos = JSON.parse(localStorage.getItem('cache_freq_sec_dias_letivos_v4') || 'null');
      return JSON.stringify({
        success: true,
        series: series,
        alunosDetalhados: alunos,
        frequencias: frequencias,
        diasLetivosMes: diasLetivos
      });
    }

    if (action === 'listarDisciplinasCadastradas') {
      const disc = JSON.parse(localStorage.getItem('cache_ativ_rapido_v3_disc') || '[]');
      const det = JSON.parse(localStorage.getItem('cache_aba_exclusiva_disciplinas_v2') || '[]');
      return JSON.stringify({ success: true, disciplinas: disc, listaDetalhada: det });
    }

    if (action === 'listarPDT') {
      const mapaPdt = JSON.parse(localStorage.getItem('cache_mapa_pdt_v4') || '{}');
      const lista = Object.keys(mapaPdt).map((s, idx) => ({ linha: idx + 2, serie: s, professor: mapaPdt[s] }));
      return JSON.stringify({ success: true, lista: lista });
    }

    if (action === 'listarTodosMapeamentos') {
      const mapaSalvos = JSON.parse(localStorage.getItem('cache_todos_mapas_salvos_v4') || '{}');
      return JSON.stringify({ success: true, lista: Object.values(mapaSalvos) });
    }

    if (action === 'buscarMapeamentoSala') {
      const sAlvo = normalizarSeriePadraoCore(bodyObj.serie || "");
      const mapaSalvos = JSON.parse(localStorage.getItem('cache_todos_mapas_salvos_v4') || '{}');
      if (mapaSalvos[sAlvo]) {
        return JSON.stringify({ success: true, encontrado: true, dados: mapaSalvos[sAlvo] });
      }
      return JSON.stringify({ success: true, encontrado: false });
    }

    if (action === 'listarConfig') {
      const t = String(bodyObj.tipo || "").toUpperCase();
      if (t === 'BIMESTRE') {
        const bims = JSON.parse(localStorage.getItem('cache_ativ_rapido_v3_bim') || '[]');
        return JSON.stringify({ success: true, lista: bims.map((b, i) => ({ linha: i + 2, col1: b.nome, col2: b.inicioIso, col3: b.fimIso })) });
      }
      if (t === 'SERIE' || t === 'SÉRIE') {
        const sers = JSON.parse(localStorage.getItem(window.KEY_SERIES_UNIVERSAL_EEMTI) || '[]');
        return JSON.stringify({ success: true, lista: sers.map((s, i) => ({ linha: i + 2, col1: s, col2: s })) });
      }
      if (t === 'AMBIENTE' || t === 'AMBIENTE/MATERIAL') {
        const ambs = JSON.parse(localStorage.getItem(KEY_AMBIENTES_OFFLINE) || '[]');
        return JSON.stringify({ success: true, lista: ambs });
      }
    }

    return null;
  }

  // =========================================================================
  // 4. REGISTRO DO SERVICE WORKER E UNIFICAÇÃO DE FILAS
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
          reconciliarEstadoComServiceWorkerAoAbrir();
        }
      });
    });
  }

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
            const novoItem = {
              idFila: item.idFila || item.idTemp || item.idLocal || (Date.now() + '_' + Math.random().toString(36).slice(2, 6)),
              dataHora: item.dataHora || new Date().toLocaleString('pt-BR'),
              url: item.url || API_PADRAO_URL,
              payload: payloadUnificado,
              resumoHtml: item.resumoHtml || (`<li>${item.resumo || resumirItemSincronizado(payloadUnificado)}</li>`)
            };
            filaGlobal.push(novoItem);
            adicionarItemNoIndexedDB(novoItem);
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

      if (!navigator.onLine) {
        if (ACOES_GRAVACAO_OFFLINE[action]) {
          window.enfileirarOperacaoOfflineGlobal(url, bodyObj);
          return new Response(JSON.stringify({
            success: true,
            offline: true,
            msg: 'Salvo no Modo Offline! O envio para a planilha será feito automaticamente em segundo plano assim que o aparelho conectar à internet (mesmo com o aplicativo fechado).'
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        const respostaPreCarregada = construirRespostaOfflineInteligente(action, bodyObj);
        if (respostaPreCarregada) {
          return new Response(respostaPreCarregada, { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
      }

      try {
        const response = await _fetchNativo(url, options);
        const clone = response.clone();

        if (action === 'buscarOcorrencias') {
          clone.json().then(listaOco => {
            if (Array.isArray(listaOco)) {
              const f = bodyObj.filtros || {};
              if (f.ignorarRestricao === true && !f.serie && !f.aluno) {
                salvarNoLocalStorageSeguro(KEY_TODAS_OCORRENCIAS_OFFLINE, listaOco.slice(0, 800));
              }
              const nomeProf = obterNomeUsuarioLogadoCore();
              if (nomeProf) {
                const minhas = listaOco.filter(r => {
                  const p = String(r.professor || "").trim().toUpperCase();
                  return p === nomeProf || p.includes(nomeProf) || nomeProf.includes(p);
                });
                if (minhas.length > 0 || !f.ignorarRestricao) {
                  salvarNoLocalStorageSeguro('cache_rac_minhas_oco_' + nomeProf.replace(/\s+/g, '_'), minhas.slice(0, 250));
                }
              }
            }
          }).catch(() => {});
        }

        // Quando faz Login ou cadastra/edita Aluno, Matrícula, Disciplina, Ambiente, Ocorrência, etc.:
        // Força imediatamente a atualização de toda a base offline!
        if (action === 'fazerLogin' || ACOES_MUTACAO_CADASTROS.includes(action)) {
          clone.json().then(resJson => {
            if (resJson && (resJson.success || resJson.msg)) {
              localStorage.removeItem(TIMESTAMP_PREFETCH_KEY);
              setTimeout(() => window.executarPreCarregamentoTotalOffline(true), 250);
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
            msg: 'Conexão instável! Salvo na fila e será sincronizado automaticamente em segundo plano.'
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        const fallbackPreCarregado = construirRespostaOfflineInteligente(action, bodyObj);
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
    const novoItem = {
      idFila: Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      dataHora: new Date().toLocaleString('pt-BR'),
      url: url || API_PADRAO_URL,
      payload: payload,
      resumoHtml: resumoCustomizado ? `<li>${resumoCustomizado}</li>` : resumirItemSincronizado(payload)
    };
    fila.push(novoItem);
    localStorage.setItem(FILA_GLOBAL_KEY, JSON.stringify(fila));
    adicionarItemNoIndexedDB(novoItem);
    window.atualizarBadgeStatusConexaoGlobal();
  };

  window.obterFilaOfflineGlobal = function() {
    return unificarFilasOfflineNoStorage();
  };

  // =========================================================================
  // 5. EXIBIÇÃO DO AVISO DE DADOS ENVIADOS E SINCRONIZAÇÃO EM 2º PLANO
  // =========================================================================
  function exibirAvisoFinalDeDadosSincronizados(listaHtmlSincronizados, enviadoComAppFechado = false) {
    if (!listaHtmlSincronizados || listaHtmlSincronizados.length === 0) return;
    if (typeof Swal === 'undefined') return;

    const subtitulo = enviadoComAppFechado
      ? 'Enquanto o aplicativo estava fechado, a conexão retornou e as seguintes informações já foram enviadas automaticamente para a planilha:'
      : 'A sincronização em segundo plano foi concluída! As seguintes informações foram enviadas para a planilha:';

    Swal.fire({
      title: 'Informações Sincronizadas!',
      html: `
        <p class="small text-muted mb-2">${subtitulo}</p>
        <ul class="text-start small bg-light p-3 rounded border mb-0" style="max-height: 240px; overflow-y: auto;">
          ${listaHtmlSincronizados.join('')}
        </ul>
      `,
      icon: 'success',
      confirmButtonColor: '#15438c',
      confirmButtonText: 'Ciente, Obrigado!'
    });
  }

  window.sincronizarFilaOfflineGlobal = async function() {
    if (sincronizacaoEmAndamento || !navigator.onLine) return;

    const jaSincronizouNoSW = await reconciliarEstadoComServiceWorkerAoAbrir();
    if (jaSincronizouNoSW) return;

    const filaInicial = unificarFilasOfflineNoStorage();
    if (filaInicial.length === 0) {
      window.atualizarBadgeStatusConexaoGlobal();
      return;
    }

    sincronizacaoEmAndamento = true;
    const totalParaEnviar = filaInicial.length;
    const sincronizadosHtml = [];

    window.atualizarBadgeStatusConexaoGlobal(`Sincronizando em 2º plano (0/${totalParaEnviar})...`);

    for (let i = 0; i < filaInicial.length; i++) {
      if (!navigator.onLine) break;
      const item = filaInicial[i];
      window.atualizarBadgeStatusConexaoGlobal(`Sincronizando em 2º plano (${i + 1}/${totalParaEnviar})...`);

      try {
        const res = await _fetchNativo(item.url || API_PADRAO_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(item.payload),
          redirect: 'follow'
        });
        const json = await res.json();

        if (json && (json.success || json.msg)) {
          sincronizadosHtml.push(item.resumoHtml);
          const filaAtual = JSON.parse(localStorage.getItem(FILA_GLOBAL_KEY) || '[]')
            .filter(f => f.idFila !== item.idFila);
          localStorage.setItem(FILA_GLOBAL_KEY, JSON.stringify(filaAtual));
          await removerItemDoIndexedDB(item.idFila);
        }
      } catch (e) {}
    }

    sincronizacaoEmAndamento = false;
    window.atualizarBadgeStatusConexaoGlobal();

    if (sincronizadosHtml.length > 0) {
      localStorage.removeItem(TIMESTAMP_PREFETCH_KEY);
      setTimeout(() => window.executarPreCarregamentoTotalOffline(true), 300);

      window.dispatchEvent(new CustomEvent('eemti-fila-sincronizada'));
      if (document.visibilityState === 'visible' && typeof Swal !== 'undefined') {
        exibirAvisoFinalDeDadosSincronizados(sincronizadosHtml, false);
      } else {
        const logAnt = JSON.parse(localStorage.getItem(LOG_SINCRONIZADOS_KEY) || '[]');
        localStorage.setItem(LOG_SINCRONIZADOS_KEY, JSON.stringify(logAnt.concat(sincronizadosHtml)));
      }
    }
  };

  window.atualizarBadgeStatusConexaoGlobal = function(textoProgressoEmSegundoPlano, corFundoCustomizada) {
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
      badge.style.backgroundColor = corFundoCustomizada || '#15438c';
      badge.style.color = '#ffffff';
      const iconeHtml = corFundoCustomizada
        ? ''
        : `<span class="spinner-border spinner-border-sm me-2" style="width:0.85rem;height:0.85rem;"></span>`;
      badge.innerHTML = `${iconeHtml}${textoProgressoEmSegundoPlano}`;
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
    window.executarPreCarregamentoTotalOffline(false);
  });
  window.addEventListener('offline', () => {
    window.atualizarBadgeStatusConexaoGlobal();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      reconciliarEstadoComServiceWorkerAoAbrir();
    }
  });

  window.addEventListener('DOMContentLoaded', async () => {
    unificarFilasOfflineNoStorage();

    // 1º PASSO: Verifica se o Service Worker já enviou itens com o app fechado
    const jaEnviouFechado = await reconciliarEstadoComServiceWorkerAoAbrir();
    window.atualizarBadgeStatusConexaoGlobal();

    if (navigator.onLine) {
      if (!jaEnviouFechado) {
        setTimeout(window.sincronizarFilaOfflineGlobal, 200);
      }
      // 2º PASSO: Se estiver na tela inicial (index.html) ou se faltar qualquer cache, força o download completo para uso Offline!
      const estaNaHome = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
      setTimeout(() => window.executarPreCarregamentoTotalOffline(estaNaHome), 450);
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
