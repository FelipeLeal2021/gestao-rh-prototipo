(function () {
  const STORAGE_KEY = "gestao_rh_feedbacks_v1";

  // ======= DADOS (exemplo) =======
  const seed = [
    {
      id: uid(),
      data: "2026-01-09",
      colaborador: "Ana Paula Souza",
      cargo: "Assistente Administrativo",
      departamento: "Financeiro",
      tipo: "Orientativo",
      assunto: "Organização",
      detalhamento:
        "Foi orientado a atenção sobre deixar as ferramentas fora do lugar. É orientado a cuidar melhor do equipamento e etc. Foi elogiado pelo atingimento da meta e pelo esforço.",
      responsavel: "Mariana Teixeira",
      status: "Em acompanhamento",
    },
    {
      id: uid(),
      data: "2026-01-15",
      colaborador: "João Victor Martins",
      cargo: "Operador de Produção",
      departamento: "Produção",
      tipo: "Positivo",
      assunto: "Metas",
      detalhamento:
        "Foi elogiado pelo atingimento da meta e pelo esforço demonstrado nas entregas.",
      responsavel: "Paulo Sérgio Alves",
      status: "Encerrado",
    },
    {
      id: uid(),
      data: "2026-01-22",
      colaborador: "Thiago Moreira",
      cargo: "Operador de Produção",
      departamento: "Produção",
      tipo: "Corretivo",
      assunto: "Pontualidade",
      detalhamento:
        "Foi questionado pelos atrasos frequentes. É orientado a cumprir os horários adequadamente e não vai ser admitido formalmente.",
      responsavel: "Mariana Teixeira",
      status: "Em acompanhamento",
    },
    {
      id: uid(),
      data: "2026-01-30",
      colaborador: "Fernanda Rocha",
      cargo: "Analista Financeiro",
      departamento: "Financeiro",
      tipo: "Orientativo",
      assunto: "Comunicação",
      detalhamento:
        "Orientado a melhorar a comunicação com a equipe para ter melhores interações e deixar o trabalho mais leve.",
      responsavel: "Paulo Sérgio Alves",
      status: "Encerrado",
    },
  ];

  let rows = load() || seed.slice();
  let sort = { key: "data", dir: "desc" };
  let lastViewedId = null;

  // ======= ELEMENTOS =======
  const tbody = byId("fbTbody");
  const countEl = byId("fbCount");

  const globalSearch = byId("globalSearch");
  const fData = byId("fData");
  const fColaborador = byId("fColaborador");
  const fCargo = byId("fCargo");
  const fDepartamento = byId("fDepartamento");
  const fTipo = byId("fTipo");
  const fAssunto = byId("fAssunto");
  const fResponsavel = byId("fResponsavel");
  const fStatus = byId("fStatus");

  const btnOpenCreate = byId("btnOpenCreate");
  const btnClearFilters = byId("btnClearFilters");

  const modalForm = byId("modalForm");
  const modalView = byId("modalView");

  const fbForm = byId("fbForm");
  const modalFormTitle = byId("modalFormTitle");

  const fbId = byId("fbId");
  const fbData = byId("fbData");
  const fbColaborador = byId("fbColaborador");
  const fbCargo = byId("fbCargo");
  const fbDepartamento = byId("fbDepartamento");
  const fbTipo = byId("fbTipo");
  const fbAssunto = byId("fbAssunto");
  const fbDetalhamento = byId("fbDetalhamento");
  const fbResponsavel = byId("fbResponsavel");
  const fbStatus = byId("fbStatus");

  const vData = byId("vData");
  const vColaborador = byId("vColaborador");
  const vCargo = byId("vCargo");
  const vDepartamento = byId("vDepartamento");
  const vTipo = byId("vTipo");
  const vAssunto = byId("vAssunto");
  const vResponsavel = byId("vResponsavel");
  const vStatus = byId("vStatus");
  const vDetalhamento = byId("vDetalhamento");
  const btnEditFromView = byId("btnEditFromView");

  // ======= EVENTOS =======
  [globalSearch, fData, fColaborador, fCargo, fDepartamento, fTipo, fAssunto, fResponsavel, fStatus]
    .forEach(el => el.addEventListener("input", render));

  btnOpenCreate.addEventListener("click", () => openCreate());
  btnClearFilters.addEventListener("click", () => clearFilters());

  // ordenação clicando no header
  document.querySelectorAll(".head-row th[data-sort]").forEach(th => {
    th.addEventListener("click", () => {
      const key = th.getAttribute("data-sort");
      if (sort.key === key) sort.dir = sort.dir === "asc" ? "desc" : "asc";
      else { sort.key = key; sort.dir = "asc"; }
      render();
    });
  });

  // fechar modais
  document.querySelectorAll("[data-close]").forEach(el => {
    el.addEventListener("click", () => {
      closeModal(modalForm);
      closeModal(modalView);
    });
  });

  // ESC fecha
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal(modalForm);
      closeModal(modalView);
    }
  });

  // submit form
  fbForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const payload = {
      id: fbId.value || uid(),
      data: fbData.value,
      colaborador: fbColaborador.value.trim(),
      cargo: fbCargo.value.trim(),
      departamento: fbDepartamento.value.trim(),
      tipo: fbTipo.value,
      assunto: fbAssunto.value.trim(),
      detalhamento: fbDetalhamento.value.trim(),
      responsavel: fbResponsavel.value.trim(),
      status: fbStatus.value,
    };

    const idx = rows.findIndex(r => r.id === payload.id);
    if (idx >= 0) rows[idx] = payload;
    else rows.unshift(payload);

    save(rows);
    closeModal(modalForm);
    render();
  });

  btnEditFromView.addEventListener("click", () => {
    if (!lastViewedId) return;
    const row = rows.find(r => r.id === lastViewedId);
    if (!row) return;
    closeModal(modalView);
    openEdit(row);
  });

  // ======= RENDER =======
  function render() {
    const filtered = applyFilters(rows.slice());
    const sorted = applySort(filtered);

    tbody.innerHTML = sorted.map(r => rowHtml(r)).join("");
    countEl.textContent = `Mostrando ${sorted.length} resultado(s)`;

    // bind actions
    tbody.querySelectorAll("[data-view]").forEach(btn => {
      btn.addEventListener("click", () => openView(btn.getAttribute("data-view")));
    });
    tbody.querySelectorAll("[data-edit]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-edit");
        const row = rows.find(x => x.id === id);
        if (row) openEdit(row);
      });
    });
  }

  function applyFilters(list) {
    const q = (globalSearch.value || "").toLowerCase().trim();

    const colab = (fColaborador.value || "").toLowerCase().trim();
    const cargo = (fCargo.value || "").toLowerCase().trim();
    const dep = (fDepartamento.value || "").toLowerCase().trim();
    const tipo = (fTipo.value || "").trim();
    const assunto = (fAssunto.value || "").toLowerCase().trim();
    const resp = (fResponsavel.value || "").toLowerCase().trim();
    const status = (fStatus.value || "").trim();
    const data = (fData.value || "").trim(); // yyyy-mm-dd

    return list.filter(r => {
      const hay = `${r.data} ${r.colaborador} ${r.cargo} ${r.departamento} ${r.tipo} ${r.assunto} ${r.responsavel} ${r.status} ${r.detalhamento}`.toLowerCase();

      if (q && !hay.includes(q)) return false;
      if (data && r.data !== data) return false;
      if (colab && !r.colaborador.toLowerCase().includes(colab)) return false;
      if (cargo && !r.cargo.toLowerCase().includes(cargo)) return false;
      if (dep && !r.departamento.toLowerCase().includes(dep)) return false;
      if (tipo && r.tipo !== tipo) return false;
      if (assunto && !r.assunto.toLowerCase().includes(assunto)) return false;
      if (resp && !r.responsavel.toLowerCase().includes(resp)) return false;
      if (status && r.status !== status) return false;

      return true;
    });
  }

  function applySort(list) {
    const dir = sort.dir === "asc" ? 1 : -1;
    const key = sort.key;

    const get = (r) => {
      if (key === "data") return r.data;
      return (r[key] || "").toString().toLowerCase();
    };

    return list.sort((a, b) => {
      const av = get(a);
      const bv = get(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return  1 * dir;
      return 0;
    });
  }

  function rowHtml(r) {
    const statusClass = r.status === "Encerrado" ? "pill--ok" : "pill--warn";
    return `
      <tr>
        <td>${fmtDate(r.data)}</td>
        <td class="strong">${escapeHtml(r.colaborador)}</td>
        <td>${escapeHtml(r.cargo)}</td>
        <td>${escapeHtml(r.departamento)}</td>
        <td>${escapeHtml(r.tipo)}</td>
        <td>${escapeHtml(r.assunto)}</td>
        <td>${escapeHtml(r.responsavel)}</td>
        <td class="col-status">
          <span class="pill ${statusClass}">
            <span class="pill__dot" aria-hidden="true"></span>
            ${escapeHtml(r.status)}
          </span>
        </td>
        <td class="col-actions">
          <div class="row-actions">
            <button class="link-btn" type="button" data-view="${r.id}">Ver mais</button>
            <button class="ghost-btn" type="button" data-edit="${r.id}">Editar</button>
          </div>
        </td>
      </tr>
    `;
  }

  // ======= MODAIS =======
  function openCreate() {
    modalFormTitle.textContent = "Incluir Feedback";
    fbForm.reset();
    fbId.value = "";
    fbData.value = todayISO();
    openModal(modalForm);
  }

  function openEdit(row) {
    modalFormTitle.textContent = "Editar Feedback";

    fbId.value = row.id;
    fbData.value = row.data;
    fbColaborador.value = row.colaborador;
    fbCargo.value = row.cargo;
    fbDepartamento.value = row.departamento;
    fbTipo.value = row.tipo;
    fbAssunto.value = row.assunto;
    fbDetalhamento.value = row.detalhamento;
    fbResponsavel.value = row.responsavel;
    fbStatus.value = row.status;

    openModal(modalForm);
  }

  function openView(id) {
    const row = rows.find(r => r.id === id);
    if (!row) return;

    lastViewedId = id;

    vData.textContent = fmtDate(row.data);
    vColaborador.textContent = row.colaborador;
    vCargo.textContent = row.cargo;
    vDepartamento.textContent = row.departamento;
    vTipo.textContent = row.tipo;
    vAssunto.textContent = row.assunto;
    vResponsavel.textContent = row.responsavel;
    vStatus.textContent = row.status;
    vDetalhamento.textContent = row.detalhamento;

    openModal(modalView);
  }

  function openModal(modal) {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal(modal) {
    if (!modal.classList.contains("is-open")) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  // ======= UTIL =======
  function clearFilters() {
    globalSearch.value = "";
    fData.value = "";
    fColaborador.value = "";
    fCargo.value = "";
    fDepartamento.value = "";
    fTipo.value = "";
    fAssunto.value = "";
    fResponsavel.value = "";
    fStatus.value = "";
    render();
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  function save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }

  function uid() {
    return "fb_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  function todayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function fmtDate(iso) {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    if (!y || !m || !d) return iso;
    return `${d}/${m}/${y}`;
  }

  function escapeHtml(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function byId(id){ return document.getElementById(id); }

  // inicial
  save(rows); // garante persistência na primeira carga
  render();
})();
