// js/pdi.js
(function () {
  const $ = (sel) => document.querySelector(sel);

  const viewLista = $("#view-lista");
  const viewDetalhe = $("#view-detalhe");

  const tbodyColab = $("#tbody-colaboradores");
  const tbodyAtiv = $("#tbody-atividades");

  const totalColab = $("#total-colab");
  const totalAtiv = $("#total-ativ");

  const searchColab = $("#search-colab");
  const searchAtiv = $("#search-ativ");
  const statusChecks = Array.from(document.querySelectorAll(".filter-status"));

  const btnVoltar = $("#btn-voltar");
  const btnIncluirAtiv = $("#btn-incluir-atividade");
  const btnNovoColab = $("#btn-novo-colab");

  const modal = $("#modal");
  const formAtiv = $("#form-atividade");
  const modalTitle = $("#modal-title");

  // Detalhe header
  const dAvatar = $("#detalhe-avatar");
  const dNome = $("#detalhe-nome");
  const dCargo = $("#detalhe-cargo");
  const dDepto = $("#detalhe-depto");
  const dLider = $("#detalhe-lider");

  // Protótipo de dados
  const colaboradores = [
    {
      id: 1,
      nome: "Ana Paula Souza",
      cargo: "Assistente Administrativo",
      depto: "Financeiro",
      lider: "Mariana Teixeira",
      status: "Em andamento",
      ultima: "15/01/2024",
      atividades: [
        { id: 11, ciclo: "2024 - 2º Semestre", comp: "Comunicação", inicio: "01/07/2024", prazo: "10/11/2024", status: "Em andamento" },
        { id: 12, ciclo: "2024 - 1º Semestre", comp: "Organização", inicio: "10/01/2024", prazo: "10/06/2024", status: "Concluído" },
        { id: 13, ciclo: "2023 - 2º Semestre", comp: "Excel Avançado", inicio: "05/08/2023", prazo: "05/12/2023", status: "Concluído" },
        { id: 14, ciclo: "2023 - 1º Semestre", comp: "Gestão de Tempo", inicio: "10/02/2023", prazo: "15/06/2023", status: "Não iniciado" },
      ],
    },
    {
      id: 2,
      nome: "Diego Fernandes",
      cargo: "Analista de Marketing",
      depto: "Marketing",
      lider: "Paulo Sérgio Alves",
      status: "Em andamento",
      ultima: "Hoje",
      atividades: [
        { id: 21, ciclo: "2024 - 2º Semestre", comp: "Planejamento", inicio: "02/07/2024", prazo: "30/10/2024", status: "Em andamento" },
      ],
    },
    {
      id: 3,
      nome: "Mariana Oliveira",
      cargo: "Analista de RH",
      depto: "Recursos Humanos",
      lider: "Luciana Andrade",
      status: "Concluído",
      ultima: "10/04/2024",
      atividades: [
        { id: 31, ciclo: "2024 - 1º Semestre", comp: "Gestão de Conflitos", inicio: "15/01/2024", prazo: "01/04/2024", status: "Concluído" },
      ],
    },
    {
      id: 4,
      nome: "João Santos",
      cargo: "Vendedor",
      depto: "Vendas",
      lider: "Marcos Oliveira",
      status: "Em andamento",
      ultima: "05/04/2024",
      atividades: [
        { id: 41, ciclo: "2024 - 1º Semestre", comp: "Negociação", inicio: "01/02/2024", prazo: "30/05/2024", status: "Em andamento" },
      ],
    },
    {
      id: 5,
      nome: "Camila Ribeiro",
      cargo: "Coordenadora de Projetos",
      depto: "Projetos",
      lider: "Mariana Teixeira",
      status: "Não iniciado",
      ultima: "--",
      atividades: [],
    },
  ];

  let selectedId = null;
  let editingActivityId = null;

  function initials(name) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
  }

  function getStatusBadge(status) {
    if (status === "Concluído") return `<span class="badge badge--ok">Concluído</span>`;
    if (status === "Em andamento") return `<span class="badge badge--warn">Em andamento</span>`;
    return `<span class="badge badge--neutral">Não iniciado</span>`;
  }

  function currentStatusFilters() {
    return statusChecks.filter(c => c.checked).map(c => c.value);
  }

  function renderLista() {
    const q = (searchColab.value || "").toLowerCase();
    const allowed = currentStatusFilters();

    const filtered = colaboradores.filter(c => {
      const matchText =
        c.nome.toLowerCase().includes(q) ||
        c.cargo.toLowerCase().includes(q) ||
        c.depto.toLowerCase().includes(q);

      const matchStatus = allowed.includes(c.status);
      return matchText && matchStatus;
    });

    tbodyColab.innerHTML = filtered.map(c => `
      <tr>
        <td>
          <div class="person-cell">
            <div class="avatar">${initials(c.nome)}</div>
            <div>
              <div class="person-name">${c.nome}</div>
              <div class="person-meta">${c.cargo}</div>
            </div>
          </div>
        </td>
        <td>${c.cargo}</td>
        <td>${c.depto}</td>
        <td>${getStatusBadge(c.status)}</td>
        <td>${c.ultima}</td>
        <td class="col-actions">
          <button class="btnp btnp--sm btnp--primary" type="button" data-open="${c.id}">
            ${c.status === "Concluído" ? "Consultar" : "Editar"}
          </button>
        </td>
      </tr>
    `).join("");

    totalColab.textContent = `Total: ${filtered.length} colaboradores`;
  }

  function renderDetalhe() {
    const c = colaboradores.find(x => x.id === selectedId);
    if (!c) return;

    dAvatar.textContent = initials(c.nome);
    dNome.textContent = `PDI — ${c.nome}`;
    dCargo.textContent = c.cargo;
    dDepto.textContent = c.depto;
    dLider.textContent = c.lider || "—";

    const q = (searchAtiv.value || "").toLowerCase();

    const atividades = (c.atividades || []).filter(a => {
      const hay = `${a.ciclo} ${a.comp} ${a.status}`.toLowerCase();
      return hay.includes(q);
    });

    tbodyAtiv.innerHTML = atividades.map(a => `
      <tr>
        <td>${a.ciclo}</td>
        <td><strong>${a.comp}</strong></td>
        <td>${a.inicio || "—"}</td>
        <td>${a.prazo || "—"}</td>
        <td>${getStatusBadge(a.status)}</td>
        <td class="col-actions">
          <button class="btnp btnp--sm btnp--ghost" type="button" data-edit="${a.id}">
            ${a.status === "Concluído" ? "Consultar" : "Editar"}
          </button>
        </td>
      </tr>
    `).join("");

    totalAtiv.textContent = `Total: ${atividades.length} atividades`;
  }

  function openDetalhe(id) {
    selectedId = id;

    viewLista.classList.add("is-hidden");
    viewDetalhe.classList.remove("is-hidden");

    searchAtiv.value = "";
    renderDetalhe();
  }

  function backToLista() {
    selectedId = null;
    viewDetalhe.classList.add("is-hidden");
    viewLista.classList.remove("is-hidden");
    renderLista();
  }

  function openModal(mode, activityId = null) {
    editingActivityId = activityId;
    modalTitle.textContent = mode === "edit" ? "Editar atividade" : "Incluir atividade";

    // reset
    formAtiv.reset();

    // default: hoje no cadastro
    const today = new Date().toISOString().slice(0, 10);
    $("#f-data-cadastro").value = today;

    // carregar dados se for editar
    if (mode === "edit") {
      const c = colaboradores.find(x => x.id === selectedId);
      const a = c?.atividades?.find(x => x.id === activityId);
      if (a) {
        // datas no formato dd/mm/aaaa -> converter pra yyyy-mm-dd (best effort)
        const toISO = (br) => {
          if (!br || !br.includes("/")) return "";
          const [dd, mm, yyyy] = br.split("/");
          return `${yyyy}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}`;
        };

        $("#f-ciclo").value = a.ciclo || "";
        $("#f-competencia").value = a.comp || "";
        $("#f-inicio").value = toISO(a.inicio);
        $("#f-prazo").value = toISO(a.prazo);
        $("#f-status").value = a.status || "Não iniciado";
      }
    }

    modal.classList.remove("is-hidden");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    modal.classList.add("is-hidden");
    modal.setAttribute("aria-hidden", "true");
  }

  function brDateFromISO(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }

  // Eventos
  searchColab.addEventListener("input", renderLista);
  statusChecks.forEach(c => c.addEventListener("change", renderLista));

  btnVoltar.addEventListener("click", backToLista);

  btnIncluirAtiv.addEventListener("click", () => openModal("new"));

  btnNovoColab.addEventListener("click", () => alert("Protótipo: inclusão de colaborador ainda não implementada."));

  searchAtiv.addEventListener("input", renderDetalhe);

  tbodyColab.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-open]");
    if (!btn) return;
    openDetalhe(Number(btn.getAttribute("data-open")));
  });

  tbodyAtiv.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-edit]");
    if (!btn) return;
    openModal("edit", Number(btn.getAttribute("data-edit")));
  });

  modal.addEventListener("click", (e) => {
    if (e.target && e.target.getAttribute("data-close") === "1") closeModal();
  });

  formAtiv.addEventListener("submit", (e) => {
    e.preventDefault();

    const c = colaboradores.find(x => x.id === selectedId);
    if (!c) return;

    const data = new FormData(formAtiv);
    const atividade = {
      id: editingActivityId || Math.floor(Math.random() * 100000),
      ciclo: data.get("ciclo") || "",
      comp: data.get("competencia") || "",
      inicio: brDateFromISO(data.get("inicio")),
      prazo: brDateFromISO(data.get("prazo")),
      status: data.get("status") || "Não iniciado",
    };

    if (editingActivityId) {
      const idx = c.atividades.findIndex(x => x.id === editingActivityId);
      if (idx >= 0) c.atividades[idx] = { ...c.atividades[idx], ...atividade };
    } else {
      c.atividades.unshift(atividade);
    }

    // atualizar status do PDI por regra simples
    if (c.atividades.length === 0) c.status = "Não iniciado";
    else if (c.atividades.every(a => a.status === "Concluído")) c.status = "Concluído";
    else if (c.atividades.some(a => a.status === "Em andamento")) c.status = "Em andamento";
    else c.status = "Não iniciado";

    c.ultima = "Hoje";

    closeModal();
    renderDetalhe();
    renderLista();

    alert("Salvo (protótipo).");
  });

  // init
  renderLista();
})();

