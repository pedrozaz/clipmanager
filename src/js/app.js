import { renderLibrary } from "./pages/library.js";
import { renderClipDetail } from "./pages/clip-detail.js";
import { renderSettings } from "./pages/settings.js";
import { renderDashboard } from "./pages/dashboard.js";

const routes = {
  "/library": renderLibrary,
  "/settings": renderSettings,
  "/dashboard": renderDashboard,
};

function handleRoute() {
  const container = document.getElementById("app-container");
  if (!container) return;

  const hash = window.location.hash.replace("#", "") || "/library";

  if (hash.startsWith("/clip/")) {
    const clipId = hash.split("/clip/")[1];
    renderClipDetail(container, clipId);
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
    return;
  }

  const routeHandler = routes[hash] || renderLibrary;

  document.querySelectorAll(".nav-item").forEach((item) => {
    const link = item.getAttribute("href")?.replace("#", "") || "";
    if (link === hash) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  routeHandler(container);
}

window.addEventListener("DOMContentLoaded", () => {
  handleRoute();
  window.addEventListener("hashchange", handleRoute);
});
