/* js/marketing-endomarketing.js */
(() => {
  const STORAGE_KEY = "me_calendar_v1";
  const $ = (sel) => document.querySelector(sel);

  const viewList = $("#view-list");
  const viewForm = $("#view-form");

  const tbody = $("#tbody-dias");
  const emptyState = $("#empty-state");

  // filtros
  const fMes = $("#f-mes");
  const fAno = $("#f-ano");
  const fBusca = $("#f-busca");
  const fTipo = $("#f-tipo");
  const fAcao = $("#f-acao");
  const fStatus = $("#f-status");
  const btnLimpar = $("#btn-limpar");
  const btnHoje = $("#btn-hoje");

  // form
  const form = $("#form-dia");
  const formTitle = $("#form-title");
  const formSub = $("#form-sub");
  const btnVoltar = $("#btn-voltar");
  const btnCancelar = $("#btn-cancelar");

  const fdDia = $("#fd-dia");
  const fdSemana = $("#fd-semana");
  const fdNome = $("#fd-nome");
  const fdTipo = $("#fd-tipo");
  const fdAcao = $("#fd-acao");

  const blockAcao = $("#block-acao");
  const faTipo = $("#fa-tipo");
  const faDesc = $("#fa-desc");
  const faObj = $("#fa-obj");
  const faResp = $("#fa-resp");
  const faStatus = $("#fa-status");
  const faObs = $("#fa-obs");

  let store = loadStore();
  let currentDateISO = null; // YYYY-MM-DD
  let mode = "plan"; // plan | edit

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

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      return (obj && typeof obj === "object") ? obj : {};
    } catch {
      return {};
    }
  }

  function saveStore() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function pad2(n){ return String(n).padStart(2, "0"); }

  function isoFromDate(d){
    return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
  }

  function brDateFromISO(iso){
    const [y,m,d] = iso.split("-").map(Number);
    return `${pad2(d)}/${pad2(m)}/${y}`;
  }

  function weekdayPt(d){
    const txt = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(d);
    // Capitaliza
    return txt.charAt(0).toUpperCase() + txt.slice(1);
  }

  function daysInMonth(year, monthIndex){
    return new Date(year, monthIndex + 1, 0).getDate();
  }

  // Feriados nacionais (fixos) – base simples
  function nationalFixedHolidaysMap(year){
    // chave MM-DD
    return {
      "01-01": { nome: "Confraternização Universal", tipo: "feriado nacional" },
      "04-21": { nome: "Tiradentes", tipo: "feriado nacional" },
      "05-01": { nome: "Dia do Trabalho", tipo: "feriado nacional" },
      "09-07": { nome: "Independência do Brasil", tipo: "feriado nacional" },
      "10-12": { nome: "Nossa Senhora Aparecida", tipo: "feriado nacional" },
      "11-02": { nome: "Finados", tipo: "feriado nacional" },
      "11-15": { nome: "Proclamação da República", tipo: "feriado nacional" },
      "11-20": { nome: "Consciência Negra", tipo: "feriado nacional" },
      "12-25": { nome: "Natal", tipo: "feriado nacional" },
    };
  }

  // (Opcional) Datas móveis como "comemorativa" – você pode mudar o tipo no editar
  function easterDate(year){
    // algoritmo gregoriano (Meeus/Jones/Butcher)
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19*a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2*e + 2*i - h - k) % 7;
    const m = Math.floor((a + 11*h + 22*l) / 451);
    const month = Math.floor((h + l - 7*m + 114) / 31); // 3=Mar, 4=Apr
    const day = ((h + l - 7*m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  }

  function addDays(date, delta){
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    return d;
  }

  function movableDates(year){
    const easter = easterDate(year);
    const carnivalTue = addDays(easter, -47);
    const goodFriday = addDays(easter, -2);
    const corpusChristi = addDays(easter, 60);

    const out = {};
    out[`${pad2(carnivalTue.getMonth()+1)}-${pad2(carnivalTue.getDate())}`] =
      { nome: "Carnaval", tipo: "comemorativa" };
    out[`${pad2(goodFriday.getMonth()+1)}-${pad2(goodFriday.getDate())}`] =
      { nome: "Sexta-feira Santa", tipo: "comemorativa" };
    out[`${pad2(corpusChristi.getMonth()+1)}-${pad2(corpusChristi.getDate())}`] =
      { nome: "Corpus Christi", tipo: "comemorativa" };

    return out;
  }

  function buildMonthRows(year, monthIndex){
    const total = daysInMonth(year, monthIndex);
    const fixed = nationalFixedHolidaysMap(year);
    const movable = movableDates(year);

    const rows = [];
    for (let day = 1; day <= total; day++){
      const d = new Date(year, monthIndex, day);
      const iso = isoFromDate(d);
      const mmdd = `${pad2(monthIndex+1)}-${pad2(day)}`;

      const saved = store[iso] || null;

      // Base do dia
      let base = {
        dateISO: iso,
        nomeData: "",
        tipo: "dia normal",
        haveraAcao: "nao",
        statusAcao: "",
        acaoTipo: "",
        descricao: "",
        objetivo: "",
        responsavel: "",
        observacao: ""
      };

      // Se não tem nada salvo, tenta preencher feriado nacional fixo/móvel
      if (!saved) {
        const h = fixed[mmdd] || movable[mmdd];
        if (h) {
          base.nomeData = h.nome;
          base.tipo = h.tipo;
        }
      }

      const merged = saved ? { ...base, ...saved, dateISO: iso } : base;
      rows.push(merged);
    }
    return rows;
  }

  function matchesFilters(row){
    const q = (fBusca.value || "").trim().toLowerCase();
    const tipo = (fTipo.value || "").trim().toLowerCase();
    const acao = (fAcao.value || "").trim().toLowerCase();
    const status = (fStatus.value || "").trim().toLowerCase();

    const hay = [
      row.nomeData,
      row.responsavel,
      row.descricao,
      row.objetivo,
      row.observacao,
      row.tipo,
      row.statusAcao
    ].join(" ").toLowerCase();

    const okQ = !q || hay.includes(q);
    const okTipo = !tipo || (row.tipo || "").toLowerCase() === tipo;

    const hasAction = (row.haveraAcao || "nao").toLowerCase() === "sim";
    const okAcao = !acao || (acao === "sim" ? hasAction : !hasAction);

    const okStatus = !status || ((row.statusAcao || "").toLowerCase() === status);

    // se filtrar status, faz sentido mostrar apenas datas com ação
    if (status && !hasAction) return false;

    return okQ && okTipo && okAcao && okStatus;
  }

  function typePill(tipo){
    const t = (tipo || "dia normal").toLowerCase();
    const label =
      t === "feriado nacional" ? "Feriado nacional" :
      t === "feriado municipal" ? "Feriado municipal" :
      t === "comemorativa" ? "Comemorativa" :
      t === "estratégica" ? "Estratégica" :
      "Dia normal";

    const cls =
      t === "feriado nacional" ? "me-pill me-pill--nat" :
      t === "feriado municipal" ? "me-pill me-pill--mun" :
      t === "comemorativa" ? "me-pill me-pill--com" :
      t === "estratégica" ? "me-pill me-pill--est" :
      "me-pill me-pill--nor";

    return `<span class="${cls}">${label}</span>`;
  }

  function render(){
    const year = Number(fAno.value);
    const monthIndex = Number(fMes.value); // 0..11
    const rows = buildMonthRows(year, monthIndex).filter(matchesFilters);

    tbody.innerHTML = rows.map((r) => {
      const [yy, mm, dd] = r.dateISO.split("-").map(Number);
      const d = new Date(yy, mm-1, dd);

      const nome = (r.nomeData || "").trim() ? r.nomeData.trim() : "-";
      const havera = (r.haveraAcao || "nao").toLowerCase() === "sim";
      const status = havera ? (r.statusAcao || "não iniciada") : "-";

      return `
        <tr>
          <td class="t-center"><b>${brDateFromISO(r.dateISO)}</b></td>
          <td>${weekdayPt(d)}</td>
          <td>${escapeHtml(nome)}</td>
          <td>${typePill(r.tipo)}</td>
          <td class="t-center"><b>${havera ? "Sim" : "Não"}</b></td>
          <td>${escapeHtml(status)}</td>
          <td class="t-right">
            <span class="me-row-actions">
              <button class="me-actionbtn" type="button" data-action="plan" data-date="${r.dateISO}">Planejar</button>
              <button class="me-actionbtn" type="button" data-action="edit" data-date="${r.dateISO}">Editar</button>
            </span>
          </td>
        </tr>
      `;
    }).join("");

    emptyState.hidden = rows.length > 0;
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setActionBlockState(){
    const havera = (fdAcao.value || "nao").toLowerCase() === "sim";
    if (havera) {
      blockAcao.classList.remove("is-disabled");
      [faTipo, faDesc, faObj, faResp, faStatus, faObs].forEach(el => el.disabled = false);
    } else {
      blockAcao.classList.add("is-disabled");
      [faTipo, faDesc, faObj, faResp, faStatus, faObs].forEach(el => el.disabled = true);
    }
  }

  function openForm(dateISO, openMode){
    currentDateISO = dateISO;
    mode = openMode;

    const [yy, mm, dd] = dateISO.split("-").map(Number);
    const d = new Date(yy, mm-1, dd);

    const base = store[dateISO] || { dateISO };

    fdDia.value = brDateFromISO(dateISO);
    fdSemana.value = weekdayPt(d);

    // se não tiver salvo, tenta preencher com feriados nacionais do mês
    const fixed = nationalFixedHolidaysMap(yy);
    const movable = movableDates(yy);
    const mmdd = `${pad2(mm)}-${pad2(dd)}`;
    const holiday = fixed[mmdd] || movable[mmdd];

    fdNome.value = (base.nomeData ?? (holiday?.nome ?? "")).toString();
    fdTipo.value = (base.tipo ?? (holiday?.tipo ?? "dia normal")).toLowerCase();
    fdAcao.value = (base.haveraAcao ?? "nao").toLowerCase();

    faTipo.value = base.acaoTipo ?? "";
    faDesc.value = base.descricao ?? "";
    faObj.value = base.objetivo ?? "";
    faResp.value = base.responsavel ?? "";
    faStatus.value = (base.statusAcao ?? "não iniciada").toLowerCase();
    faObs.value = base.observacao ?? "";

    formTitle.textContent = openMode === "edit" ? "Editar ação" : "Planejar ação";
    formSub.textContent = openMode === "edit"
      ? "Edite as informações da data e do planejamento."
      : "Defina o tipo da data e, se houver ação, preencha o planejamento abaixo.";

    setActionBlockState();
    show("form");
  }

  // popula selects de mês/ano
  function initSelectors(){
    const meses = [
      "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
      "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
    ];

    fMes.innerHTML = meses.map((m, idx) => `<option value="${idx}">${m}</option>`).join("");

    const now = new Date();
    const year = now.getFullYear();
    const years = [year-1, year, year+1, year+2];
    fAno.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join("");

    fMes.value = String(now.getMonth());
    fAno.value = String(year);
  }

  // eventos
  $("#btn-limpar").addEventListener("click", () => {
    fBusca.value = "";
    fTipo.value = "";
    fAcao.value = "";
    fStatus.value = "";
    render();
  });

  btnHoje.addEventListener("click", () => {
    const now = new Date();
    fMes.value = String(now.getMonth());
    fAno.value = String(now.getFullYear());
    render();
  });

  [fMes, fAno, fBusca, fTipo, fAcao, fStatus].forEach((el) => {
    el.addEventListener("change", render);
    el.addEventListener("input", render);
  });

  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const dateISO = btn.getAttribute("data-date");
    const action = btn.getAttribute("data-action");
    openForm(dateISO, action === "edit" ? "edit" : "plan");
  });

  btnVoltar.addEventListener("click", () => show("list"));
  btnCancelar.addEventListener("click", () => show("list"));

  fdAcao.addEventListener("change", setActionBlockState);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!currentDateISO) return;

    const havera = (fdAcao.value || "nao").toLowerCase();

    const payload = {
      dateISO: currentDateISO,
      nomeData: fdNome.value.trim(),
      tipo: (fdTipo.value || "dia normal").toLowerCase(),
      haveraAcao: havera,
      statusAcao: havera === "sim" ? (faStatus.value || "não iniciada") : "",
      acaoTipo: havera === "sim" ? (faTipo.value || "") : "",
      descricao: havera === "sim" ? faDesc.value.trim() : "",
      objetivo: havera === "sim" ? faObj.value.trim() : "",
      responsavel: havera === "sim" ? faResp.value.trim() : "",
      observacao: havera === "sim" ? faObs.value.trim() : "",
      updatedAt: new Date().toISOString()
    };

    // se houver ação, exige pelo menos tipo de ação ou descrição (pra evitar salvar vazio)
    if (havera === "sim") {
      const ok = payload.acaoTipo || payload.descricao || payload.objetivo || payload.responsavel;
      if (!ok) {
        alert("Se houver ação, preencha ao menos Tipo de ação, Descrição, Objetivo ou Responsável.");
        return;
      }
    }

    store[currentDateISO] = payload;
    saveStore();
    show("list");
  });

  // init
  initSelectors();
  render();
})();
