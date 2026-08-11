import { renderLibraryPage } from "./pages/library.js";
import { renderClipDetailPage } from "./pages/clip-detail.js";
import { renderSettingsPage } from "./pages/settings.js";

const routes = {
  "/library": renderLibraryPage,
  "/settings": renderSettingsPage,
  "/dashboard": (container) => {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📊</span>
        <h3>Dashboard de Analytics</h3>
        <p>Em breve no Marco 8!</p>
      </div>
    `;
  },
};

function handleRoute() {
  const container = document.getElementById("app-container");
  if (!container) return;

  const hash = window.location.hash.replace("#", "") || "/library";

  if (hash.startsWith("/clip/")) {
    const clipId = hash.split("/clip/")[1];
    renderClipDetailPage(container, clipId);
    document.querySelectorAll(".nav-item a").forEach((link) => link.classList.remove("active"));
    return;
  }

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
