/* js/reunioes-alinhamentos.js */
(() => {
  const STORAGE_KEY = "ra_reunioes_v1";
  const $ = (sel) => document.querySelector(sel);

  const viewList = $("#view-list");
  const viewForm = $("#view-form");

  const btnIncluir = $("#btn-incluir");
  const btnLimpar = $("#btn-limpar");

  const btnVoltar = $("#btn-voltar");
  const btnCancelar = $("#btn-cancelar");
  const btnEditar = $("#btn-editar");

  const tbody = $("#tbody-reunioes");
  const emptyState = $("#empty-state");

  const form = $("#form-ra");
  const formTitle = $("#form-title");
  const formSub = $("#form-sub");
  const formFooter = $("#form-footer");

  // filtros (colunas)
  const fCodigo = $("#f-codigo");
  const fTipo = $("#f-tipo");
  const fData = $("#f-data");
  const fArea = $("#f-area");
  const fResp = $("#f-resp");
  const fPart = $("#f-part");
  const fObj = $("#f-obj");
  const fStatus = $("#f-status");

  // campos form
  const codigo = $("#codigo");
  const tipo = $("#tipo");
  const data = $("#data");
  const area = $("#area");
  const responsavel = $("#responsavel");
  const participantes = $("#participantes");
  const objetivo = $("#objetivo");

  const status = $("#status");
  const resumo = $("#resumo");
  const pontos = $("#pontos");
  const decisoes = $("#decisoes");
  const pendencias = $("#pendencias");

  let reunioes = loadData();
  let editingId = null;
  let mode = "create"; // create | edit | view

  function uid() {
    if (window.crypto?.randomUUID) return crypto.randomUUID();
    return "id_" + Math.random().toString(16).slice(2) + "_" + Date.now();
  }

  function seed() {
    // exemplos iniciais
    return [
      {
        id: uid(),
        codigo: "REU-0001",
        tipo: "reunião de alinhamento",
        data: todayPlus(-2),
        area: "RH",
        responsavel: "Marcelo Ribeiro",
        participantes: "Ana, João, Bianca",
        objetivo: "Alinhar prioridades da semana e responsáveis.",
        status: "realizada",
        resumo: "Revisamos prioridades e ajustamos prazos.",
        pontos: "Ponto A alinhado; Ponto B validado.",
        decisoes: "Prioridade no projeto X.",
        pendencias: "João enviar checklist até sexta."
      },
      {
        id: uid(),
        codigo: "REU-0002",
        tipo: "reunião de equipe",
        data: todayPlus(3),
        area: "Vendas",
        responsavel: "Marcelo Ribeiro",
        participantes: "Time Comercial",
        objetivo: "Revisar pipeline e metas do mês.",
        status: "agendada",
        resumo: "",
        pontos: "",
        decisoes: "",
        pendencias: ""
      },
      {
        id: uid(),
        codigo: "REU-0003",
        tipo: "reunião de resultados",
        data: todayPlus(8),
        area: "Financeiro",
        responsavel: "Carla Souza",
        participantes: "Carla, Pedro, Luciana",
        objetivo: "Apresentar resultados do fechamento.",
        status: "agendada",
        resumo: "",
        pontos: "",
        decisoes: "",
        pendencias: ""
      },
      {
        id: uid(),
        codigo: "REU-0004",
        tipo: "reunião de lideranças",
        data: todayPlus(-10),
        area: "Diretoria",
        responsavel: "Fernanda Lima",
        participantes: "Lideranças",
        objetivo: "Definir diretrizes trimestrais.",
        status: "cancelada",
        resumo: "",
        pontos: "",
        decisoes: "",
        pendencias: ""
      }
    ];
  }

  function todayPlus(deltaDays) {
    const d = new Date();
    d.setDate(d.getDate() + deltaDays);
    return toISO(d);
  }

  function toISO(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }

  function fromISO(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function fmtBR(iso) {
    if (!iso) return "-";
    const d = fromISO(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear();
    return `${dd}/${mm}/${yy}`;
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr) || arr.length === 0) {
        const seeded = seed();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
        return seeded;
      }
      return arr;
    } catch {
      const seeded = seed();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reunioes));
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function statusPill(st) {
    const s = (st || "").toLowerCase();
    const label =
      s === "agendada" ? "Agendada" :
      s === "realizada" ? "Realizada" :
      s === "cancelada" ? "Cancelada" :
      s === "não realizada" ? "Não realizada" : (st || "-");

    const cls =
      s === "agendada" ? "ra-pill ra-pill--agendada" :
      s === "realizada" ? "ra-pill ra-pill--realizada" :
      s === "cancelada" ? "ra-pill ra-pill--cancelada" :
      "ra-pill ra-pill--nao";

    return `<span class="${cls}"><span class="ra-dot"></span>${label}</span>`;
  }

  function matchesFilters(r) {
    const qCod = (fCodigo.value || "").trim().toLowerCase();
    const qTipo = (fTipo.value || "").trim().toLowerCase();
    const qData = (fData.value || "").trim();
    const qArea = (fArea.value || "").trim().toLowerCase();
    const qResp = (fResp.value || "").trim().toLowerCase();
    const qPart = (fPart.value || "").trim().toLowerCase();
    const qObj = (fObj.value || "").trim().toLowerCase();
    const qStatus = (fStatus.value || "").trim().toLowerCase();

    const okCod = !qCod || (r.codigo || "").toLowerCase().includes(qCod);
    const okTipo = !qTipo || (r.tipo || "").toLowerCase() === qTipo;
    const okData = !qData || (r.data || "") === qData;
    const okArea = !qArea || (r.area || "").toLowerCase().includes(qArea);
    const okResp = !qResp || (r.responsavel || "").toLowerCase().includes(qResp);
    const okPart = !qPart || (r.participantes || "").toLowerCase().includes(qPart);
    const okObj = !qObj || (r.objetivo || "").toLowerCase().includes(qObj);
    const okStatus = !qStatus || (r.status || "").toLowerCase() === qStatus;

    return okCod && okTipo && okData && okArea && okResp && okPart && okObj && okStatus;
  }

  function render() {
    const list = reunioes.filter(matchesFilters);

    tbody.innerHTML = list.map(r => `
      <tr>
        <td><b>${escapeHtml(r.codigo || "-")}</b></td>
        <td>${escapeHtml(cap(r.tipo || "-"))}</td>
        <td class="t-center">${fmtBR(r.data)}</td>
        <td>${escapeHtml(r.area || "-")}</td>
        <td>${escapeHtml(r.responsavel || "-")}</td>
        <td>${escapeHtml(r.participantes || "-")}</td>
        <td>${escapeHtml(short(r.objetivo || "-", 55))}</td>
        <td>${statusPill(r.status)}</td>
        <td class="t-right">
          <span class="ra-row-actions">
            <button class="ra-actionbtn" type="button" data-action="view" data-id="${r.id}">Visualizar</button>
            <button class="ra-actionbtn" type="button" data-action="edit" data-id="${r.id}">Editar</button>
            <button class="ra-actionbtn" type="button" data-action="del" data-id="${r.id}">Excluir</button>
          </span>
        </td>
      </tr>
    `).join("");

    emptyState.hidden = reunioes.length > 0;
  }

  function cap(s) {
    const t = (s || "").trim();
    return t ? (t.charAt(0).toUpperCase() + t.slice(1)) : "-";
  }

  function short(s, n){
    const t = (s || "").trim();
    if (t.length <= n) return t;
    return t.slice(0, n - 1) + "…";
  }

  function show(which) {
    if (which === "list") {
      viewList.classList.add("is-active");
      viewForm.classList.remove("is-active");
      render();
    } else {
      viewList.classList.remove("is-active");
      viewForm.classList.add("is-active");
    }
  }

  function setMode(newMode) {
    mode = newMode;

    const inputs = form.querySelectorAll("input, select, textarea");
    const readOnly = mode === "view";

    inputs.forEach(el => el.disabled = readOnly);

    if (mode === "create") {
      formTitle.textContent = "Incluir reunião";
      formSub.textContent = "Preencha os dados de identificação e o registro da reunião.";
      btnEditar.classList.add("is-hidden");
      formFooter.classList.remove("is-hidden");
    }

    if (mode === "edit") {
      formTitle.textContent = "Editar reunião";
      formSub.textContent = "Atualize os dados e o registro da reunião.";
      btnEditar.classList.add("is-hidden");
      formFooter.classList.remove("is-hidden");
    }

    if (mode === "view") {
      formTitle.textContent = "Visualizar reunião";
      formSub.textContent = "Visualização somente leitura.";
      btnEditar.classList.remove("is-hidden");
      formFooter.classList.add("is-hidden");
    }
  }

  function resetForm() {
    form.reset();
    editingId = null;
  }

  function fillForm(r) {
    codigo.value = r.codigo || "";
    tipo.value = r.tipo || "";
    data.value = r.data || "";
    area.value = r.area || "";
    responsavel.value = r.responsavel || "";
    participantes.value = r.participantes || "";
    objetivo.value = r.objetivo || "";

    status.value = r.status || "";
    resumo.value = r.resumo || "";
    pontos.value = r.pontos || "";
    decisoes.value = r.decisoes || "";
    pendencias.value = r.pendencias || "";
  }

  // ===== eventos =====
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
    if (!editingId) return;
    setMode("edit");
  });

  btnLimpar.addEventListener("click", () => {
    [fCodigo, fTipo, fData, fArea, fResp, fPart, fObj, fStatus].forEach(el => {
      if (el.tagName === "SELECT") el.value = "";
      else el.value = "";
    });
    render();
  });

  [fCodigo, fTipo, fData, fArea, fResp, fPart, fObj, fStatus].forEach(el => {
    el.addEventListener("input", render);
    el.addEventListener("change", render);
  });

  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const id = btn.getAttribute("data-id");
    const action = btn.getAttribute("data-action");
    const r = reunioes.find(x => x.id === id);
    if (!r) return;

    if (action === "del") {
      const ok = confirm(`Excluir a reunião "${r.codigo}"?`);
      if (!ok) return;
      reunioes = reunioes.filter(x => x.id !== id);
      saveData();
      render();
      return;
    }

    editingId = id;
    fillForm(r);

    if (action === "view") {
      setMode("view");
      show("form");
    }

    if (action === "edit") {
      setMode("edit");
      show("form");
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (mode === "view") return;

    const payload = {
      codigo: codigo.value.trim(),
      tipo: tipo.value,
      data: data.value,
      area: area.value.trim(),
      responsavel: responsavel.value.trim(),
      participantes: participantes.value.trim(),
      objetivo: objetivo.value.trim(),
      status: status.value,

      resumo: resumo.value.trim(),
      pontos: pontos.value.trim(),
      decisoes: decisoes.value.trim(),
      pendencias: pendencias.value.trim(),
    };

    const requiredOk =
      payload.codigo &&
      payload.tipo &&
      payload.data &&
      payload.area &&
      payload.responsavel &&
      payload.participantes &&
      payload.objetivo &&
      payload.status;

    if (!requiredOk) {
      alert("Preencha todos os campos obrigatórios (*) antes de salvar.");
      return;
    }

    if (editingId) {
      reunioes = reunioes.map(x => x.id === editingId ? { ...x, ...payload, updatedAt: new Date().toISOString() } : x);
    } else {
      reunioes.unshift({ id: uid(), ...payload, createdAt: new Date().toISOString() });
    }

    saveData();
    resetForm();
    show("list");
  });

  // init
  render();
})();
