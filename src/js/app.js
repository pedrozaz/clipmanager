import { renderLibraryPage } from "./pages/library.js";

const routes = {
  "/library": renderLibraryPage,
  "/dashboard": (container) => {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📊</span>
        <h3>Dashboard de Analytics</h3>
        <p>Em breve no Marco 8!</p>
      </div>
    `;
  },
  "/settings": (container) => {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">⚙️</span>
        <h3>Configurações</h3>
        <p>Em breve no Marco 5!</p>
      </div>
    `;
  },
};

function handleRoute() {
  const container = document.getElementById("app-container");
  if (!container) return;

  const hash = window.location.hash.replace("#", "") || "/library";
  const routeHandler = routes[hash] || renderLibraryPage;

  document.querySelectorAll(".nav-item a").forEach((link) => {
    const linkHash = link.getAttribute("href").replace("#", "");
    if (linkHash === hash) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  routeHandler(container);
}

window.addEventListener("DOMContentLoaded", () => {
  handleRoute();
  window.addEventListener("hashchange", handleRoute);
});
