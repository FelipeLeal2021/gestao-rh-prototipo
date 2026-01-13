/* js/recrutamento-selecao.js */
(() => {
  const STORAGE_KEY = "rs_vagas_v1";
  const $ = (sel) => document.querySelector(sel);

  const elViewList = $("#view-list");
  const elViewForm = $("#view-form");

  const btnIncluir = $("#btn-incluir");
  const btnVoltar = $("#btn-voltar");
  const btnEditar = $("#btn-editar");
  const btnCancelar = $("#btn-cancelar");

  const formTitle = $("#form-title");
  const formSubtitle = $("#form-subtitle");
  const formFooter = $("#form-footer");

  const form = $("#form-vaga");
  const tbody = $("#tbody-vagas");
  const emptyState = $("#empty-state");

  const filtroBusca = $("#filtro-busca");
  const filtroStatus = $("#filtro-status");
  const filtroPrioridade = $("#filtro-prioridade");
  const btnLimpar = $("#btn-limpar");

  const inputStatus = $("#statusVaga");
  const inputDataAbertura = $("#dataAbertura");
  const inputDiasEmAberto = $("#diasEmAberto");

  let vagas = loadVagas();
  let editingId = null;
  let currentMode = "create"; // create | edit | view

  function uid() {
    if (window.crypto?.randomUUID) return crypto.randomUUID();
    return "id_" + Math.random().toString(16).slice(2) + "_" + Date.now();
  }

  function seedData() {
    // Dados de exemplo (como na sua “TELA PRINCIPAL”)
    return [
      {
        id: uid(),
        codigoVaga: "0001",
        nomeCargo: "Assistente Administrativo",
        departamento: "Administrativo",
        gestorSolicitante: "Marcelo Ribeiro",
        tipoVaga: "substituição",
        motivoAbertura: "desligamento",
        numeroVagas: 1,
        prioridadeVaga: "baixa",
        dataSolicitacao: "2025-12-14",
        statusVaga: "cancelada",
        dataAbertura: "2025-12-16",
        dataFechamento: "",
        observacao: ""
      },
      {
        id: uid(),
        codigoVaga: "0002",
        nomeCargo: "Analista de DP",
        departamento: "Departamento Pessoal",
        gestorSolicitante: "Marcelo Ribeiro",
        tipoVaga: "nova vaga",
        motivoAbertura: "crescimento",
        numeroVagas: 2,
        prioridadeVaga: "alta",
        dataSolicitacao: "2025-12-14",
        statusVaga: "encerrada",
        dataAbertura: "2025-12-23",
        dataFechamento: "2026-01-04",
        observacao: ""
      },
      {
        id: uid(),
        codigoVaga: "0003",
        nomeCargo: "Consultor Comercial",
        departamento: "Vendas",
        gestorSolicitante: "Marcelo Ribeiro",
        tipoVaga: "nova vaga",
        motivoAbertura: "crescimento",
        numeroVagas: 1,
        prioridadeVaga: "média",
        dataSolicitacao: "2026-01-03",
        statusVaga: "aberta",
        dataAbertura: "2026-01-09",
        dataFechamento: "",
        observacao: ""
      },
      {
        id: uid(),
        codigoVaga: "0004",
        nomeCargo: "Coordenador Fiscal",
        departamento: "Fiscal",
        gestorSolicitante: "Marcelo Ribeiro",
        tipoVaga: "substituição",
        motivoAbertura: "afastamento",
        numeroVagas: 1,
        prioridadeVaga: "alta",
        dataSolicitacao: "2026-01-09",
        statusVaga: "solicitada",
        dataAbertura: "2026-01-09",
        dataFechamento: "",
        observacao: ""
      }
    ];
  }

  function loadVagas() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];

      if (!Array.isArray(arr) || arr.length === 0) {
        const seeded = seedData();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
        return seeded;
      }
      return arr;
    } catch {
      const seeded = seedData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
  }

  function saveVagas() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vagas));
  }

  function show(view) {
    if (view === "list") {
      elViewList.classList.add("is-active");
      elViewForm.classList.remove("is-active");
      render();
    } else {
      elViewList.classList.remove("is-active");
      elViewForm.classList.add("is-active");
    }
  }

  function setMode(mode) {
    currentMode = mode;

    const inputs = form.querySelectorAll("input, select, textarea");
    const disable = mode === "view";

    inputs.forEach((el) => {
      // diasEmAberto já é disabled por padrão
      if (el.id === "diasEmAberto") return;
      el.disabled = disable;
    });

    if (mode === "create") {
      formTitle.textContent = "Incluir vaga";
      formSubtitle.textContent = "Preencha os dados da vaga e o acompanhamento do recrutamento.";
      btnEditar.classList.add("is-hidden");
      formFooter.classList.remove("is-hidden");
    }

    if (mode === "edit") {
      formTitle.textContent = "Editar vaga";
      formSubtitle.textContent = "Atualize as informações da vaga.";
      btnEditar.classList.add("is-hidden");
      formFooter.classList.remove("is-hidden");
    }

    if (mode === "view") {
      formTitle.textContent = "Visualizar vaga";
      formSubtitle.textContent = "Visualização somente leitura.";
      btnEditar.classList.remove("is-hidden");
      formFooter.classList.add("is-hidden");
    }

    updateDiasEmAberto();
  }

  function nowAtMidnight(d = new Date()) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function parseISODateToMidnight(iso) {
    if (!iso) return null;
    const [y, m, dd] = iso.split("-").map(Number);
    if (!y || !m || !dd) return null;
    return new Date(y, m - 1, dd);
  }

  function calcDiasEmAberto(dataAberturaISO) {
    const ab = parseISODateToMidnight(dataAberturaISO);
    if (!ab) return "";
    const today = nowAtMidnight();
    const diffMs = today - ab;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Number.isFinite(days) ? String(Math.max(0, days)) : "";
  }

  function updateDiasEmAberto() {
    // mostra dias apenas quando status = aberta (para evitar “número gigante” em encerradas/canceladas)
    const status = (inputStatus.value || "").toLowerCase();
    if (status !== "aberta") {
      inputDiasEmAberto.value = "";
      return;
    }
    inputDiasEmAberto.value = calcDiasEmAberto(inputDataAbertura.value);
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function fmtDateBR(iso) {
    if (!iso) return "-";
    const d = parseISODateToMidnight(iso);
    if (!d) return "-";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear();
    return `${dd}/${mm}/${yy}`;
  }

  function statusPill(status) {
    const s = (status || "").toLowerCase();
    const label =
      s === "solicitada" ? "Solicitada" :
      s === "aberta" ? "Aberta" :
      s === "encerrada" ? "Encerrada" :
      s === "cancelada" ? "Cancelada" :
      (status || "-");

    return `
      <span class="rs-pill" title="${label}">
        <span class="rs-dot" aria-hidden="true"></span>
        ${label}
      </span>
    `;
  }

  function matchesFilters(v) {
    const q = (filtroBusca.value || "").trim().toLowerCase();
    const st = (filtroStatus.value || "").trim().toLowerCase();
    const pr = (filtroPrioridade.value || "").trim().toLowerCase();

    const hay = [
      v.codigoVaga, v.nomeCargo, v.departamento, v.gestorSolicitante,
      v.tipoVaga, v.motivoAbertura, v.prioridadeVaga, v.statusVaga
    ].join(" ").toLowerCase();

    const okQ = !q || hay.includes(q);
    const okSt = !st || (v.statusVaga || "").toLowerCase() === st;
    const okPr = !pr || (v.prioridadeVaga || "").toLowerCase() === pr;

    return okQ && okSt && okPr;
  }

  function render() {
    const list = vagas.filter(matchesFilters);

    tbody.innerHTML = list.map((v) => {
      const status = (v.statusVaga || "").toLowerCase();
      const dias = status === "aberta" ? calcDiasEmAberto(v.dataAbertura) : "";

      return `
        <tr>
          <td><b>${escapeHtml(v.codigoVaga || "-")}</b></td>
          <td>${escapeHtml(v.nomeCargo || "-")}</td>
          <td>${escapeHtml(v.departamento || "-")}</td>
          <td>${escapeHtml(v.gestorSolicitante || "-")}</td>
          <td>${escapeHtml(v.tipoVaga || "-")}</td>
          <td>${escapeHtml(v.motivoAbertura || "-")}</td>
          <td class="t-center">${escapeHtml(String(v.numeroVagas ?? "-"))}</td>
          <td>${escapeHtml(v.prioridadeVaga || "-")}</td>
          <td>${statusPill(v.statusVaga)}</td>
          <td class="t-center">${fmtDateBR(v.dataAbertura)}</td>
          <td class="t-center"><b>${dias || "-"}</b></td>
          <td class="t-center">${fmtDateBR(v.dataFechamento)}</td>
          <td class="t-right">
            <span class="rs-row-actions">
              <button class="rs-actionbtn" type="button" data-action="view" data-id="${v.id}">Visualizar</button>
              <button class="rs-actionbtn" type="button" data-action="edit" data-id="${v.id}">Editar</button>
            </span>
          </td>
        </tr>
      `;
    }).join("");

    emptyState.hidden = vagas.length > 0;
  }

  function resetForm() {
    form.reset();
    editingId = null;
    $("#diasEmAberto").value = "";
  }

  function fillForm(v) {
    $("#codigoVaga").value = v.codigoVaga || "";
    $("#nomeCargo").value = v.nomeCargo || "";
    $("#departamento").value = v.departamento || "";
    $("#gestorSolicitante").value = v.gestorSolicitante || "";
    $("#tipoVaga").value = v.tipoVaga || "";
    $("#motivoAbertura").value = v.motivoAbertura || "";
    $("#numeroVagas").value = v.numeroVagas ?? "";
    $("#prioridadeVaga").value = v.prioridadeVaga || "";
    $("#dataSolicitacao").value = v.dataSolicitacao || "";

    $("#statusVaga").value = v.statusVaga || "";
    $("#dataAbertura").value = v.dataAbertura || "";
    $("#dataFechamento").value = v.dataFechamento || "";
    $("#observacao").value = v.observacao || "";

    updateDiasEmAberto();
  }

  // ===== Eventos =====
  btnIncluir.addEventListener("click", () => {
    resetForm();
    setMode("create");
    show("form");
  });

  btnVoltar.addEventListener("click", () => {
    resetForm();
    show("list");
  });

  btnCancelar.addEventListener("click", () => {
    resetForm();
    show("list");
  });

  btnEditar.addEventListener("click", () => {
    // sai do modo visualização e entra no modo edição da mesma vaga
    if (!editingId) return;
    setMode("edit");
  });

  btnLimpar.addEventListener("click", () => {
    filtroBusca.value = "";
    filtroStatus.value = "";
    filtroPrioridade.value = "";
    render();
  });

  [filtroBusca, filtroStatus, filtroPrioridade].forEach((el) => {
    el.addEventListener("input", render);
    el.addEventListener("change", render);
  });

  inputDataAbertura.addEventListener("change", updateDiasEmAberto);
  inputStatus.addEventListener("change", updateDiasEmAberto);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (currentMode === "view") return;

    const data = {
      codigoVaga: $("#codigoVaga").value.trim(),
      nomeCargo: $("#nomeCargo").value.trim(),
      departamento: $("#departamento").value.trim(),
      gestorSolicitante: $("#gestorSolicitante").value.trim(),
      tipoVaga: $("#tipoVaga").value,
      motivoAbertura: $("#motivoAbertura").value,
      numeroVagas: Number($("#numeroVagas").value),
      prioridadeVaga: $("#prioridadeVaga").value,
      dataSolicitacao: $("#dataSolicitacao").value,

      statusVaga: $("#statusVaga").value,
      dataAbertura: $("#dataAbertura").value,
      dataFechamento: $("#dataFechamento").value,
      observacao: $("#observacao").value.trim(),
    };

    const requiredOk =
      data.codigoVaga &&
      data.nomeCargo &&
      data.departamento &&
      data.gestorSolicitante &&
      data.tipoVaga &&
      data.motivoAbertura &&
      data.numeroVagas >= 1 &&
      data.prioridadeVaga &&
      data.dataSolicitacao &&
      data.statusVaga;

    if (!requiredOk) {
      alert("Preencha os campos obrigatórios (*) antes de salvar.");
      return;
    }

    if (editingId) {
      vagas = vagas.map((v) => (v.id === editingId ? { ...v, ...data } : v));
    } else {
      vagas.unshift({ id: uid(), ...data, createdAt: new Date().toISOString() });
    }

    saveVagas();
    resetForm();
    show("list");
  });

  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const id = btn.getAttribute("data-id");
    const action = btn.getAttribute("data-action");
    const vaga = vagas.find((v) => v.id === id);
    if (!vaga) return;

    editingId = id;
    fillForm(vaga);

    if (action === "view") {
      setMode("view");
      show("form");
    }

    if (action === "edit") {
      setMode("edit");
      show("form");
    }
  });

  // Inicial
  render();
})();
