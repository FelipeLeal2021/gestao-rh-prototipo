// js/include-menu.js
(async () => {
  const mount = document.getElementById("app-menu");
  if (!mount) return;

  try {
    const res = await fetch("components/menu.html", { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status} ao carregar components/menu.html`);

    mount.innerHTML = await res.text();
  } catch (err) {
    console.error("Erro ao carregar o menu:", err);
  }
})();
