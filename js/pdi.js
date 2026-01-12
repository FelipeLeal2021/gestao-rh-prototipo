// js/pdi.js
(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  const viewLista = $("#view-lista");
  const viewDetalhe = $("#view-detalhe");

  const tbodyColabs = $("#tbody-colaboradores");
  const totalColab = $("#total-colab");

  const tbodyAtiv = $("#tbody-atividades");
  const totalAtiv = $("#total-ativ");

  const searchColab = $("#search-colab");
  const searchAtiv = $("#search-ativ");

  const btnVoltar = $("#btn-voltar");
  const btnIncluirAtiv = $("#btn-incluir-atividade");
  const btnClearAtivFilters = $("#btnClearAtivFilters");

  const detalheAvatar = $("#detalhe-avatar");
  const detalheNome = $("#detalhe-nome");
  const detalheCargo = $("#detalhe-cargo");
  const detalheDepto = $("#detalhe-depto");
  const detalheLider = $("#detalhe-lider");

  // Modal
  const modal = $("#modal");
  const form = $("#form-atividade");
  const modalTitle = $("#modal-title");

  const fId = $("#f-id");
  const fDataCadastro = $("#f-data-cadastro");
  const fCiclo = $("#f-ciclo");
  const fCompetencia = $("#f-competencia");
  const fPorque = $("#f-porque");
  const fOnde = $("#f-onde");
  const fOque = $("#f-oque");
  const fResponsavel = $("#f-responsavel");
  const fQuanto = $("#f-quanto");
  const fInicio = $("#f-inicio");
  const fPrazo = $("#f-prazo");
  const fConclusao = $("#f-conclusao");
  const fStatus = $("#f-status");

  // ===== Mock =====
  const DB = [
    {
      id: "1",
      nome: "Ana Paula Souza",
      cargo: "Assistente Administrativo",
      depto: "Financeiro",
      lider: "Mariana Teixeira",
      atividades: [
        { id:"a1", ciclo:"2024 - 2º Semestre", competencia:"Comunicação", inicio:"2024-07-01", prazo:"2024-11-10", status:"Em andamento" },
        { id:"a2", ciclo:"2024 - 1º Semestre", competencia:"Organização", inicio:"2024-01-10", prazo:"2024-06-10", status:"Concluído" },
        { id:"a3", ciclo:"2023 - 2º Semestre", competencia:"Excel Avançado", inicio:"2023-08-05", prazo:"2023-12-05", status:"Concluído" },
        { id:"a4", ciclo:"2023 - 1º Semestre", competencia:"Gestão de Tempo", inicio:"2023-02-10", prazo:"2023-08-15", status:"Não iniciado" },
      ],
      updatedAt: "2024-11-10",
    },
    {
      id: "2",
      nome: "Lucas Andrade",
      cargo: "Analista Administrativo Júnior",
      depto: "Administrativo",
      lider: "Diretoria",
      atividades: [
        { id:"b1", ciclo:"2024 - 2º Semestre", competencia:"Foco", inicio:"2024-08-01", prazo:"2024-12-01", status:"Não iniciado" },
      ],
      updatedAt: "2024-08-01",
    },
  ];

  function fmt(iso){
    if (!iso) return "—";
    const [y,m,d] = String(iso).split("-");
    if (y && m && d) return `${d}/${m}/${y}`;
    return iso;
  }

  function computePdiStatus(colab){
    const list = colab.atividades || [];
    if (!list.length) return "Não iniciado";
    if (list.some(a => a.status === "Em andamento")) return "Em andamento";
    if (list.every(a => a.status === "Concluído")) return "Concluído";
    if (list.some(a => a.status === "Não iniciado")) return "Não iniciado";
    return "Não iniciado";
  }

  function badgeClass(status){
    if (status === "Concluído") return "badge badge--ok";
    if (status === "Em andamento") return "badge badge--warn";
    return "badge badge--neutral";
  }

  function setView(detailOn){
    viewLista.classList.toggle("is-hidden", detailOn);
    viewDetalhe.classList.toggle("is-hidden", !detailOn);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ===== Render lista =====
  function getColabFilters(){
    const statuses = [...$$(".filter-colab-status:checked")].map(i => i.value);
    const q = (searchColab.value || "").toLowerCase().trim();
    return { statuses, q };
  }

  function renderColabs(){
    const { statuses, q } = getColabFilters();

    const rows = DB.filter(c => {
      const st = computePdiStatus(c);
      const matchStatus = statuses.includes(st);
      const text = `${c.nome} ${c.cargo} ${c.depto}`.toLowerCase();
      const matchQ = !q || text.includes(q);
      return matchStatus && matchQ;
    });

    tbodyColabs.innerHTML = rows.map(c => {
      const st = computePdiStatus(c);
      return `
        <tr>
          <td><strong>${c.nome}</strong></td>
          <td>${c.cargo}</td>
          <td>${c.depto}</td>
          <td><span class="${badgeClass(st)}">${st}</span></td>
          <td>${fmt(c.updatedAt)}</td>
          <td class="col-actions">
            <div class="row-actions">
              <button class="action-btn" type="button" data-open="${c.id}">Abrir</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    totalColab.textContent = `Total: ${rows.length} colaboradores`;

    tbodyColabs.querySelectorAll("[data-open]").forEach(btn => {
      btn.addEventListener("click", () => openDetail(btn.getAttribute("data-open")));
    });
  }

  // ===== Detalhe =====
  let currentColab = null;

  function getAtivFilters(){
    const statuses = [...$$(".filter-ativ-status:checked")].map(i => i.value);
    const q = (searchAtiv.value || "").toLowerCase().trim();
    return { statuses, q };
  }

  function renderAtividades(){
    if (!currentColab) return;

    const { statuses, q } = getz
    const rows = (currentColab.atividades || []).filter(a => {
      const matchStatus = statuses.includes(a.status);
      // ✅ busca por competência (texto + placeholder)
      const text = `${a.competencia}`.toLowerCase();
      const matchQ = !q || text.includes(q);
      return matchStatus && matchQ;
    });

    tbodyAtiv.innerHTML = rows.map(a => {
      const actionLabel = (a.status === "Concluído") ? "Consultar" : "Editar";
      return `
        <tr>
          <td>${a.ciclo}</td>
          <td><strong>${a.competencia}</strong></td>
          <td>${fmt(a.inicio)}</td>
          <td>${fmt(a.prazo)}</td>
          <td><span class="${badgeClass(a.status)}">${a.status}</span></td>
          <td class="col-actions">
            <div class="row-actions">
              <button class="action-btn" type="button" data-edit="${a.id}">${actionLabel}</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    totalAtiv.textContent = `Total: ${rows.length} atividades`;

    tbodyAtiv.querySelectorAll("[data-edit]").forEach(btn => {
      btn.addEventListener("click", () => openModalEdit(btn.getAttribute("data-edit")));
    });
  }

  function openDetail(id){
    currentColab = DB.find(c => c.id === id) || DB[0];

    const initial = (currentColab.nome || "C").trim().slice(0,1).toUpperCase();
    detalheAvatar.textContent = initial;
    detalheNome.textContent = `PDI — ${currentColab.nome}`;
    detalheCargo.textContent = currentColab.cargo || "—";
    detalheDepto.textContent = currentColab.depto || "—";
    detalheLider.textContent = currentColab.lider || "—";

    // reset busca e filtros (mantém todos ligados)
    searchAtiv.value = "";
    $$(".filter-ativ-status").forEach(i => i.checked = true);

    renderAtividades();
    setView(true);
  }

  // ===== Modal =====
  function openModal(){
    modal.classList.remove("is-hidden");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeModal(){
    modal.classList.add("is-hidden");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  function resetForm(){
    form.reset();
    fId.value = "";
    // hoje
    const today = new Date();
    fDataCadastro.valueAsDate = today;
  }

  function openModalCreate(){
    modalTitle.textContent = "Incluir atividade";
    resetForm();
    openModal();
  }

  function openModalEdit(ativId){
    if (!currentColab) return;
    const a = (currentColab.atividades || []).find(x => x.id === ativId);
    if (!a) return;

    modalTitle.textContent = "Editar atividade";
    resetForm();

    fId.value = a.id;
    fCiclo.value = a.ciclo || "";
    fCompetencia.value = a.competencia || "";
    fInicio.value = a.inicio || "";
    fPrazo.value = a.prazo || "";
    fStatus.value = a.status || "Não iniciado";

    openModal();
  }

  // Close modal handlers
  modal.addEventListener("click", (e) => {
    if (e.target && e.target.getAttribute("data-close")) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("is-hidden")) closeModal();
  });

  // Save
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!currentColab) return;

    const id = (fId.value || "").trim();
    const payload = {
      id: id || `x${Math.random().toString(16).slice(2)}`,
      ciclo: fCiclo.value.trim(),
      competencia: fCompetencia.value.trim(),
      inicio: fInicio.value || "",
      prazo: fPrazo.value || "",
      status: fStatus.value || "Não iniciado",
      dataCadastro: fDataCadastro.value || "",
      porque: fPorque.value || "",
      onde: fOnde.value || "",
      oque: fOque.value || "",
      responsavel: fResponsavel.value || "",
      quanto: fQuanto.value || "",
      conclusao: fConclusao.value || "",
    };

    const list = currentColab.atividades || [];
    const idx = list.findIndex(a => a.id === payload.id);

    if (idx >= 0) list[idx] = { ...list[idx], ...payload };
    else currentColab.atividades = [payload, ...list];

    // atualiza "ultima atualização"
    currentColab.updatedAt = payload.prazo || payload.inicio || payload.dataCadastro || currentColab.updatedAt;

    renderAtividades();
    renderColabs();
    closeModal();
    alert("Salvo (protótipo) — ainda não grava em banco.");
  });

  // ===== Eventos =====
  btnVoltar.addEventListener("click", () => setView(false));
  btnIncluirAtiv.addEventListener("click", openModalCreate);

  searchColab.addEventListener("input", renderColabs);
  $$(".filter-colab-status").forEach(i => i.addEventListener("change", renderColabs));

  searchAtiv.addEventListener("input", renderAtividades);
  $$(".filter-ativ-status").forEach(i => i.addEventListener("change", renderAtividades));

  btnClearAtivFilters.addEventListener("click", () => {
    searchAtiv.value = "";
    $$(".filter-ativ-status").forEach(i => i.checked = true);
    renderAtividades();
  });

  // init
  renderColabs();
})();
