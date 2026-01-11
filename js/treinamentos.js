(function () {
  // Tabs
  const tabs = document.querySelectorAll(".t-tabs__tab");
  const panels = {
    cadastro: document.getElementById("tab-cadastro"),
    controle: document.getElementById("tab-controle"),
  };

  function activateTab(key) {
    tabs.forEach(t => t.classList.toggle("is-active", t.dataset.tab === key));
    Object.entries(panels).forEach(([k, el]) => el.classList.toggle("is-active", k === key));
  }

  tabs.forEach(btn => btn.addEventListener("click", () => activateTab(btn.dataset.tab)));

  // Modal helpers
  function openModal(sel) {
    const modal = document.querySelector(sel);
    if (!modal) return;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }

  // Open buttons
  document.querySelectorAll("[data-open]").forEach(btn => {
    btn.addEventListener("click", () => openModal(btn.getAttribute("data-open")));
  });

  // Close (buttons/backdrop)
  document.querySelectorAll(".t-modal").forEach(modal => {
    modal.addEventListener("click", (e) => {
      if (e.target.matches("[data-close]")) closeModal(modal);
    });
  });

  // ESC closes any open modal
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    document.querySelectorAll(".t-modal.is-open").forEach(closeModal);
  });

  // Aplicabilidade: mostrar/esconder departamentos (modal cadastro)
  const aplicRadios = document.querySelectorAll('input[name="aplic"]');
  const deptBox = document.querySelector("[data-depts]");
  if (aplicRadios.length && deptBox) {
    function syncAplic() {
      const val = document.querySelector('input[name="aplic"]:checked')?.value;
      deptBox.hidden = (val !== "especificos");
    }
    aplicRadios.forEach(r => r.addEventListener("change", syncAplic));
    syncAplic();
  }
})();
