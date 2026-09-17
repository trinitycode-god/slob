/* ==========================================================================
   SLOB CONTROL — Lógica da aplicação
   ========================================================================== */

(function () {
  "use strict";

  const state = {
    banco: null,
    historico: null,
    destino: null,
    arquivoAtual: null,
    graficos: {}
  };

  const PAGINAS = {
    dashboard: { titulo: "Dashboard", sub: "Posição atual dos itens SLOB" },
    atualizar: { titulo: "Atualizar SLOB", sub: "Importar a planilha mensal e comparar com a posição anterior" },
    banco: { titulo: "Banco de Dados", sub: "Todos os itens atualmente parados no SLOB" },
    historico: { titulo: "Histórico", sub: "Itens que já saíram do SLOB" },
    destino: { titulo: "Destino", sub: "Definição do destino dos itens que saíram" }
  };

  /* ---------------------------------------------------------------- utils */

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  function mostrarToast(msg, tipo) {
    const toast = $("#toast");
    toast.textContent = msg;
    toast.className = "toast mostrar" + (tipo ? " " + tipo : "");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("mostrar"), 3800);
  }

  function paraNumero(v) {
    if (v === null || v === undefined || v === "") return 0;
    if (typeof v === "number") return v;
    let s = String(v).trim().replace(/[^\d,.\-]/g, "");
    if (s.indexOf(",") > -1 && s.indexOf(".") > -1) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else if (s.indexOf(",") > -1) {
      s = s.replace(",", ".");
    }
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  function formatarMoeda(v) {
    return paraNumero(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function formatarValorCelula(coluna, valor) {
    if (valor === null || valor === undefined) return "";
    if (valor instanceof Date) return valor.toLocaleDateString("pt-BR");
    if (["C Unitario", "Custo Total", "Valor Total Parado", "Valor Unitário", "Valor Total", "Quantidade"].includes(coluna) &&
        !["Verificação", "Condição"].includes(coluna) && valor !== "" && !isNaN(paraNumero(valor)) &&
        /valor|custo|unitario|unitário/i.test(coluna)) {
      return formatarMoeda(valor);
    }
    return String(valor);
  }

  function classeBadgeFaixa(faixa) {
    if (!faixa) return "badge--cinza";
    if (/> ?60|48-60/i.test(faixa)) return "badge--alerta";
    if (/36-48|24-36/i.test(faixa)) return "badge--laranja";
    return "badge--cinza";
  }

  function classeBadgeStatus(status) {
    if (status === "Concluído") return "badge--ok";
    if (status === "Definido") return "badge--laranja";
    return "badge--cinza";
  }

  /* ---------------------------------------------------------------- API */

  function urlConfigurada() {
    return CONFIG.APPS_SCRIPT_URL && !CONFIG.APPS_SCRIPT_URL.startsWith("COLE_AQUI");
  }

  async function apiGet(action) {
    if (!urlConfigurada()) throw new Error("Configure a URL do Apps Script em config.js antes de usar o sistema.");
    const resp = await fetch(`${CONFIG.APPS_SCRIPT_URL}?action=${encodeURIComponent(action)}`);
    const json = await resp.json();
    if (!json.ok) throw new Error(json.erro || "Erro ao buscar dados.");
    return json.dados;
  }

  async function apiPost(action, payload) {
    if (!urlConfigurada()) throw new Error("Configure a URL do Apps Script em config.js antes de usar o sistema.");
    const resp = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: "POST",
      // text/plain evita o preflight OPTIONS, que o Apps Script não trata bem.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(Object.assign({ action }, payload))
    });
    const json = await resp.json();
    if (!json.ok) throw new Error(json.erro || "Erro ao salvar dados.");
    return json;
  }

  /* ---------------------------------------------------------------- rotas */

  function irPara(pagina, forcarRecarga) {
    $$(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.view === pagina));
    $$(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + pagina));
    $("#tituloPagina").textContent = PAGINAS[pagina].titulo;
    $("#subtituloPagina").textContent = PAGINAS[pagina].sub;
    $("#sidebar").classList.remove("aberta");

    if (pagina === "dashboard") carregarDashboard(forcarRecarga);
    if (pagina === "banco") carregarBanco(forcarRecarga);
    if (pagina === "historico") carregarHistorico(forcarRecarga);
    if (pagina === "destino") carregarDestino(forcarRecarga);
  }

  $$(".nav-item").forEach((btn) => btn.addEventListener("click", () => irPara(btn.dataset.view)));

  $("#menuToggle").addEventListener("click", () => $("#sidebar").classList.toggle("aberta"));

  $("#btnAtualizarDados").addEventListener("click", () => {
    const ativo = $(".nav-item.active").dataset.view;
    if (ativo === "atualizar") return;
    irPara(ativo, true);
  });

  /* ---------------------------------------------------------------- dashboard */

  async function carregarDashboard(forcar) {
    if (state.banco && !forcar) return renderDashboard(state.banco);
    const alvo = $("#view-dashboard");
    try {
      const dados = await apiGet("banco");
      state.banco = dados;
      renderDashboard(dados);
    } catch (e) {
      mostrarToast(e.message, "erro");
    }
  }

  function renderDashboard(itens) {
    const total = itens.length;
    const valorTotal = itens.reduce((s, i) => s + paraNumero(i["Valor Total Parado"]), 0);
    const acimaLimite = itens.filter((i) => paraNumero(i["Meses sem Movimentação"]) > CONFIG.LIMITE_MESES_CARD).length;
    const maior = itens.reduce((m, i) => (paraNumero(i["Valor Total Parado"]) > paraNumero(m?.["Valor Total Parado"] || 0) ? i : m), null);

    $("#cardItensSlob").textContent = total.toLocaleString("pt-BR");
    $("#cardValorParado").textContent = formatarMoeda(valorTotal);
    $("#cardLimiteLabel").textContent = `Itens > ${CONFIG.LIMITE_MESES_CARD} meses`;
    $("#cardItensLimite").textContent = acimaLimite.toLocaleString("pt-BR");
    $("#cardMaiorValor").textContent = maior ? `${maior["Produto"]} — ${maior["Descrição"] || ""}` : "—";
    $("#cardMaiorValorNum").textContent = maior ? formatarMoeda(maior["Valor Total Parado"]) : "";

    construirGraficos(itens);
  }

  function agruparSoma(itens, campoChave, campoValor) {
    const mapa = {};
    itens.forEach((i) => {
      const chave = i[campoChave] || "Não informado";
      mapa[chave] = (mapa[chave] || 0) + paraNumero(i[campoValor]);
    });
    return mapa;
  }

  function agruparContagem(itens, campoChave) {
    const mapa = {};
    itens.forEach((i) => {
      const chave = i[campoChave] || "Não informado";
      mapa[chave] = (mapa[chave] || 0) + 1;
    });
    return mapa;
  }

  function destruirGrafico(id) {
    if (state.graficos[id]) {
      state.graficos[id].destroy();
      delete state.graficos[id];
    }
  }

  function paletaGrafico(qtd) {
    const base = [CONFIG.CORES.laranja, CONFIG.CORES.preto, CONFIG.CORES.cinza, CONFIG.CORES.bege, CONFIG.CORES.cinzaClaro, CONFIG.CORES.laranjaEscuro];
    const cores = [];
    for (let i = 0; i < qtd; i++) cores.push(base[i % base.length]);
    return cores;
  }

  function construirGraficos(itens) {
    // 1) SLOB por faixa de tempo (quantidade)
    const contagemFaixa = agruparContagem(itens, "Faixa Tempo Parado");
    const faixasOrdem = CONFIG.FAIXAS_TEMPO_PARADO.filter((f) => contagemFaixa[f] !== undefined)
      .concat(Object.keys(contagemFaixa).filter((f) => !CONFIG.FAIXAS_TEMPO_PARADO.includes(f)));

    destruirGrafico("faixaQtd");
    state.graficos.faixaQtd = new Chart($("#chartFaixaQtd"), {
      type: "doughnut",
      data: {
        labels: faixasOrdem,
        datasets: [{ data: faixasOrdem.map((f) => contagemFaixa[f]), backgroundColor: paletaGrafico(faixasOrdem.length), borderWidth: 0 }]
      },
      options: { plugins: { legend: { position: "right", labels: { boxWidth: 12, font: { family: "Montserrat" } } } }, cutout: "62%" }
    });

    // 2) Valor parado por faixa
    const valorFaixa = agruparSoma(itens, "Faixa Tempo Parado", "Valor Total Parado");
    const faixasValorOrdem = CONFIG.FAIXAS_TEMPO_PARADO.filter((f) => valorFaixa[f] !== undefined)
      .concat(Object.keys(valorFaixa).filter((f) => !CONFIG.FAIXAS_TEMPO_PARADO.includes(f)));

    destruirGrafico("faixaValor");
    state.graficos.faixaValor = new Chart($("#chartFaixaValor"), {
      type: "bar",
      data: {
        labels: faixasValorOrdem,
        datasets: [{ label: "Valor parado", data: faixasValorOrdem.map((f) => valorFaixa[f]), backgroundColor: CONFIG.CORES.laranja, borderRadius: 5, maxBarThickness: 46 }]
      },
      options: {
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => formatarMoeda(c.raw) } } },
        scales: { y: { ticks: { callback: (v) => "R$ " + Number(v).toLocaleString("pt-BR") }, grid: { color: "#F0EBDF" } }, x: { grid: { display: false } } }
      }
    });

    // 3) SLOB por armazém (quantidade)
    const contagemArmazem = agruparContagem(itens, "Armazem");
    const armazens = Object.keys(contagemArmazem).sort();

    destruirGrafico("armazemQtd");
    state.graficos.armazemQtd = new Chart($("#chartArmazemQtd"), {
      type: "bar",
      data: { labels: armazens, datasets: [{ label: "Itens", data: armazens.map((a) => contagemArmazem[a]), backgroundColor: CONFIG.CORES.preto, borderRadius: 5, maxBarThickness: 30 }] },
      options: {
        indexAxis: "y",
        plugins: { legend: { display: false } },
        scales: { x: { grid: { color: "#F0EBDF" } }, y: { grid: { display: false } } }
      }
    });

    // 4) Valor parado por armazém
    const valorArmazem = agruparSoma(itens, "Armazem", "Valor Total Parado");

    destruirGrafico("armazemValor");
    state.graficos.armazemValor = new Chart($("#chartArmazemValor"), {
      type: "bar",
      data: { labels: armazens, datasets: [{ label: "Valor parado", data: armazens.map((a) => valorArmazem[a]), backgroundColor: CONFIG.CORES.cinza, borderRadius: 5, maxBarThickness: 30 }] },
      options: {
        indexAxis: "y",
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => formatarMoeda(c.raw) } } },
        scales: { x: { ticks: { callback: (v) => "R$ " + Number(v).toLocaleString("pt-BR") }, grid: { color: "#F0EBDF" } }, y: { grid: { display: false } } }
      }
    });

    // 5) Top 10 itens por valor parado
    const top10 = [...itens].sort((a, b) => paraNumero(b["Valor Total Parado"]) - paraNumero(a["Valor Total Parado"])).slice(0, 10);

    destruirGrafico("top10");
    state.graficos.top10 = new Chart($("#chartTop10"), {
      type: "bar",
      data: {
        labels: top10.map((i) => i["Produto"]),
        datasets: [{ label: "Valor parado", data: top10.map((i) => paraNumero(i["Valor Total Parado"])), backgroundColor: CONFIG.CORES.laranja, borderRadius: 5, maxBarThickness: 34 }]
      },
      options: {
        indexAxis: "y",
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => formatarMoeda(c.raw) } } },
        scales: { x: { ticks: { callback: (v) => "R$ " + Number(v).toLocaleString("pt-BR") }, grid: { color: "#F0EBDF" } }, y: { grid: { display: false } } }
      }
    });
  }

  /* ---------------------------------------------------------------- tabela genérica */

  function renderTabela(idTabela, colunas, linhas, opcoes) {
    opcoes = opcoes || {};
    const tabela = $("#" + idTabela);
    const thead = tabela.querySelector("thead");
    const tbody = tabela.querySelector("tbody");

    thead.innerHTML = "<tr>" + colunas.map((c) => `<th>${c.rotulo}</th>`).join("") + "</tr>";

    if (!linhas.length) {
      tbody.innerHTML = `<tr><td colspan="${colunas.length}" style="text-align:center; padding:40px; color:var(--cinza);">Nenhum registro encontrado.</td></tr>`;
      return;
    }

    tbody.innerHTML = linhas.map((linha, idx) => {
      return "<tr>" + colunas.map((c) => c.render ? c.render(linha, idx) : `<td>${formatarValorCelula(c.campo, linha[c.campo])}</td>`).join("") + "</tr>";
    }).join("");

    if (opcoes.aposRender) opcoes.aposRender(tbody, linhas);
  }

  function filtrarPorTexto(linhas, texto, campos) {
    if (!texto) return linhas;
    const t = texto.toLowerCase();
    return linhas.filter((l) => campos.some((c) => String(l[c] || "").toLowerCase().includes(t)));
  }

  function popularSelect(select, valores, manterPrimeira) {
    const atual = select.value;
    const primeira = manterPrimeira ? select.options[0].outerHTML : "";
    select.innerHTML = primeira + valores.map((v) => `<option value="${v}">${v}</option>`).join("");
    if (valores.includes(atual)) select.value = atual;
  }

  /* ---------------------------------------------------------------- Banco de Dados */

  const colunasBanco = CONFIG.COLUNAS_BANCO_DE_DADOS.map((c) => ({
    campo: c,
    rotulo: c,
    render: c === "Faixa Tempo Parado"
      ? (l) => `<td><span class="badge ${classeBadgeFaixa(l[c])}">${l[c] || ""}</span></td>`
      : c === "Classificacao SLOB"
      ? (l) => `<td><span class="badge badge--laranja">${l[c] || ""}</span></td>`
      : undefined
  }));

  async function carregarBanco(forcar) {
    if (state.banco && !forcar) return exibirBanco();
    try {
      state.banco = await apiGet("banco");
      exibirBanco();
    } catch (e) {
      mostrarToast(e.message, "erro");
    }
  }

  function exibirBanco() {
    const armazens = [...new Set(state.banco.map((i) => i["Armazem"]).filter(Boolean))].sort();
    popularSelect($("#filtroArmazemBanco"), armazens, true);
    popularSelect($("#filtroFaixaBanco"), CONFIG.FAIXAS_TEMPO_PARADO, true);
    aplicarFiltroBanco();
  }

  function aplicarFiltroBanco() {
    let linhas = state.banco || [];
    linhas = filtrarPorTexto(linhas, $("#buscaBanco").value, ["Produto", "Descrição", "Armazem"]);
    const armazem = $("#filtroArmazemBanco").value;
    if (armazem) linhas = linhas.filter((l) => l["Armazem"] === armazem);
    const faixa = $("#filtroFaixaBanco").value;
    if (faixa) linhas = linhas.filter((l) => l["Faixa Tempo Parado"] === faixa);
    $("#totalBanco").textContent = `${linhas.length} item(ns)`;
    renderTabela("tabelaBanco", colunasBanco, linhas);
  }

  ["input", "change"].forEach((ev) => {
    $("#buscaBanco").addEventListener(ev, aplicarFiltroBanco);
    $("#filtroArmazemBanco").addEventListener(ev, aplicarFiltroBanco);
    $("#filtroFaixaBanco").addEventListener(ev, aplicarFiltroBanco);
  });

  /* ---------------------------------------------------------------- Histórico */

  const colunasHistorico = [{ campo: "Data da Atualização", rotulo: "Data Atualização" }]
    .concat(CONFIG.COLUNAS_BANCO_DE_DADOS.map((c) => ({ campo: c, rotulo: c })))
    .concat([{ campo: "Motivo", rotulo: "Motivo", render: (l) => `<td>${l["Motivo"] ? `<span class="badge badge--ok">${l["Motivo"]}</span>` : '<span class="badge badge--cinza">Pendente</span>'}</td>` }]);

  async function carregarHistorico(forcar) {
    if (state.historico && !forcar) return exibirHistorico();
    try {
      state.historico = await apiGet("historico");
      exibirHistorico();
    } catch (e) {
      mostrarToast(e.message, "erro");
    }
  }

  function exibirHistorico() {
    const datas = [...new Set(state.historico.map((i) => i["Data da Atualização"]).filter(Boolean))];
    popularSelect($("#filtroDataHistorico"), datas, true);
    aplicarFiltroHistorico();
  }

  function aplicarFiltroHistorico() {
    let linhas = state.historico || [];
    linhas = filtrarPorTexto(linhas, $("#buscaHistorico").value, ["Produto", "Descrição", "Armazem"]);
    const data = $("#filtroDataHistorico").value;
    if (data) linhas = linhas.filter((l) => l["Data da Atualização"] === data);
    $("#totalHistorico").textContent = `${linhas.length} item(ns)`;
    renderTabela("tabelaHistorico", colunasHistorico, linhas);
  }

  ["input", "change"].forEach((ev) => {
    $("#buscaHistorico").addEventListener(ev, aplicarFiltroHistorico);
    $("#filtroDataHistorico").addEventListener(ev, aplicarFiltroHistorico);
  });

  /* ---------------------------------------------------------------- Destino */

  const colunasDestinoFixas = [
    { campo: "Produto", rotulo: "Produto" },
    { campo: "Armazem", rotulo: "Armazém" },
    { campo: "Descrição", rotulo: "Descrição" },
    { campo: "Quantidade", rotulo: "Qtde" },
    { campo: "Valor Total", rotulo: "Valor Total" },
    { campo: "Data Saída SLOB", rotulo: "Saída SLOB" }
  ];

  function linhaEditavelDestino(item, idx) {
    const opcoesDestino = CONFIG.DESTINOS_SUGERIDOS.map((d) => `<option value="${d}" ${item["Destino"] === d ? "selected" : ""}>${d}</option>`).join("");
    return `
      <td><select class="campo-destino" data-campo="Destino" data-idx="${idx}">
        <option value=""></option>${opcoesDestino}
      </select></td>
      <td><input class="campo-destino" data-campo="Responsável" data-idx="${idx}" type="text" value="${item["Responsável"] || ""}"></td>
      <td><input class="campo-destino" data-campo="Observação" data-idx="${idx}" type="text" value="${item["Observação"] || ""}"></td>
      <td><select class="campo-destino" data-campo="Status" data-idx="${idx}">
        <option value="Pendente" ${item["Status"] === "Pendente" ? "selected" : ""}>Pendente</option>
        <option value="Definido" ${item["Status"] === "Definido" ? "selected" : ""}>Definido</option>
        <option value="Concluído" ${item["Status"] === "Concluído" ? "selected" : ""}>Concluído</option>
      </select></td>
      <td><button class="btn btn--pequeno" data-salvar="${idx}">Salvar</button></td>`;
  }

  const colunasDestino = colunasDestinoFixas.concat([
    { campo: "_editavel", rotulo: "Destino", render: (l, i) => linhaEditavelDestino(l, i).split("</td>")[0] + "</td>" }
  ]);

  async function carregarDestino(forcar) {
    if (state.destino && !forcar) return exibirDestino();
    try {
      state.destino = await apiGet("destino");
      exibirDestino();
    } catch (e) {
      mostrarToast(e.message, "erro");
    }
  }

  function exibirDestino() {
    aplicarFiltroDestino();
  }

  function aplicarFiltroDestino() {
    let linhas = (state.destino || []).map((l, i) => Object.assign({ __idxOriginal: i }, l));
    linhas = filtrarPorTexto(linhas, $("#buscaDestino").value, ["Produto", "Descrição", "Armazem"]);
    const status = $("#filtroStatusDestino").value;
    if (status) linhas = linhas.filter((l) => (l["Status"] || "Pendente") === status);
    $("#totalDestino").textContent = `${linhas.length} item(ns)`;

    const colunas = colunasDestinoFixas.concat([
      { campo: "Responsável", rotulo: "Responsável" },
      { campo: "Observação", rotulo: "Observação" },
      { campo: "Status", rotulo: "Status" },
      { campo: "Ações", rotulo: "" }
    ]);

    renderTabela("tabelaDestino", colunas.map((c) => ({
      campo: c.campo,
      rotulo: c.rotulo,
      render: (l) => {
        if (c.campo === "Ações") return linhaEditavelDestino(l, l.__idxOriginal);
        if (c.campo === "Status") return `<td><span class="badge ${classeBadgeStatus(l["Status"] || "Pendente")}">${l["Status"] || "Pendente"}</span></td>`;
        return `<td>${formatarValorCelula(c.campo, l[c.campo])}</td>`;
      }
    })), linhas, {
      aposRender: (tbody) => {
        $$(".btn[data-salvar]", tbody).forEach((btn) => btn.addEventListener("click", () => salvarDestino(btn.dataset.salvar)));
      }
    });
  }

  async function salvarDestino(idx) {
    const linha = tbodyValoresDestino(idx);
    const item = state.destino[idx];
    try {
      await apiPost("atualizarDestino", {
        _row: item._row,
        Produto: item["Produto"],
        "Data Saída SLOB": item["Data Saída SLOB"],
        Destino: linha.Destino,
        "Responsável": linha["Responsável"],
        "Data Definição": new Date().toLocaleDateString("pt-BR"),
        "Observação": linha["Observação"],
        Status: linha.Status
      });
      Object.assign(item, { Destino: linha.Destino, "Responsável": linha["Responsável"], "Observação": linha["Observação"], Status: linha.Status });
      mostrarToast("Destino atualizado.", "sucesso");
      aplicarFiltroDestino();
    } catch (e) {
      mostrarToast(e.message, "erro");
    }
  }

  function tbodyValoresDestino(idx) {
    const campos = {};
    $$(`.campo-destino[data-idx="${idx}"]`).forEach((el) => (campos[el.dataset.campo] = el.value));
    return campos;
  }

  ["input", "change"].forEach((ev) => {
    $("#buscaDestino").addEventListener(ev, aplicarFiltroDestino);
    $("#filtroStatusDestino").addEventListener(ev, aplicarFiltroDestino);
  });

  /* ---------------------------------------------------------------- Importação */

  const dropzone = $("#dropzone");
  const inputArquivo = $("#inputArquivo");

  $("#btnSelecionarArquivo").addEventListener("click", (e) => { e.stopPropagation(); inputArquivo.click(); });
  dropzone.addEventListener("click", () => inputArquivo.click());

  ["dragover", "dragenter"].forEach((ev) => dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add("dragover"); }));
  ["dragleave", "drop"].forEach((ev) => dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.remove("dragover"); }));
  dropzone.addEventListener("drop", (e) => { if (e.dataTransfer.files[0]) processarArquivo(e.dataTransfer.files[0]); });
  inputArquivo.addEventListener("change", (e) => { if (e.target.files[0]) processarArquivo(e.target.files[0]); });

  function processarArquivo(arquivo) {
    const leitor = new FileReader();
    leitor.onload = (e) => {
      try {
        const dados = new Uint8Array(e.target.result);
        const planilha = XLSX.read(dados, { type: "array", cellDates: true });
        const primeiraAba = planilha.Sheets[planilha.SheetNames[0]];
        const linhas = XLSX.utils.sheet_to_json(primeiraAba, { defval: "" });

        const colunasEsperadas = CONFIG.COLUNAS_BANCO_DE_DADOS;
        const colunasArquivo = linhas.length ? Object.keys(linhas[0]) : [];
        const faltando = colunasEsperadas.filter((c) => !colunasArquivo.includes(c));
        if (faltando.length) {
          mostrarToast("Colunas não encontradas no arquivo: " + faltando.join(", "), "erro");
          return;
        }

        state.arquivoAtual = linhas.map((l) => {
          const item = {};
          colunasEsperadas.forEach((c) => {
            let v = l[c];
            if (v instanceof Date) v = v.toLocaleDateString("pt-BR");
            item[c] = v;
          });
          return item;
        });

        $("#nomeArquivoSelecionado").textContent = arquivo.name;
        $("#qtdLinhasArquivo").textContent = `${linhas.length} linha(s)`;
        $("#areaPreImportacao").style.display = "block";
        $("#areaResultadoImportacao").style.display = "none";
        renderTabela("tabelaPreview", colunasEsperadas.map((c) => ({ campo: c, rotulo: c })), state.arquivoAtual.slice(0, 25));
      } catch (err) {
        mostrarToast("Não foi possível ler o arquivo: " + err.message, "erro");
      }
    };
    leitor.readAsArrayBuffer(arquivo);
  }

  $("#btnCancelarImportacao").addEventListener("click", () => {
    state.arquivoAtual = null;
    inputArquivo.value = "";
    $("#areaPreImportacao").style.display = "none";
  });

  $("#btnConfirmarImportacao").addEventListener("click", async () => {
    if (!state.arquivoAtual || !state.arquivoAtual.length) return;
    const btn = $("#btnConfirmarImportacao");
    btn.disabled = true;
    btn.textContent = "Importando...";
    try {
      const resultado = await apiPost("importar", { itens: state.arquivoAtual });
      $("#resMantidos").textContent = resultado.resumo.mantidos;
      $("#resNovos").textContent = resultado.resumo.novos;
      $("#resSaidas").textContent = resultado.resumo.saidas;
      $("#areaResultadoImportacao").style.display = "block";
      $("#areaPreImportacao").style.display = "none";
      inputArquivo.value = "";
      state.arquivoAtual = null;
      // Invalida o cache para forçar releitura na próxima visita a cada aba.
      state.banco = null; state.historico = null; state.destino = null;
      mostrarToast("Importação concluída com sucesso.", "sucesso");
    } catch (e) {
      mostrarToast(e.message, "erro");
    } finally {
      btn.disabled = false;
      btn.textContent = "Confirmar importação";
    }
  });

  /* ---------------------------------------------------------------- init */

  if (!urlConfigurada()) {
    mostrarToast("Configure a URL do Apps Script em config.js para conectar à planilha.", "erro");
  }

  irPara("dashboard");
})();
