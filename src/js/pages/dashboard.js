import { api } from "../bridge.js";
import { createBarChart, createDoughnutChart } from "../components/chart.js";
import { showToast } from "../components/toast.js";

export async function renderDashboardPage(container) {
  container.innerHTML = `
    <div class="dashboard-header">
      <div class="header-text">
        <h2>Dashboard de Analytics</h2>
        <p class="muted-text">Visão geral do desempenho dos seus clipes e redes sociais.</p>
      </div>
      <button id="sync-all-btn" class="btn btn-primary">Atualizar Analytics</button>
    </div>

    <div id="dashboard-metrics-row" class="dashboard-metrics-grid">
      <div class="dash-metric-card">
        <div class="dash-metric-content">
          <span id="stat-total-clips" class="dash-value">--</span>
          <span class="dash-label">Total de Clipes</span>
        </div>
      </div>
      <div class="dash-metric-card">
        <div class="dash-metric-content">
          <span id="stat-total-views" class="dash-value">--</span>
          <span class="dash-label">Visualizações Totais</span>
        </div>
      </div>
      <div class="dash-metric-card">
        <div class="dash-metric-content">
          <span id="stat-avg-likes" class="dash-value">--</span>
          <span class="dash-label">Média de Likes</span>
        </div>
      </div>
      <div class="dash-metric-card">
        <div class="dash-metric-content">
          <span id="stat-top-clip" class="dash-value" style="font-size: 1rem;">--</span>
          <span class="dash-label">Clipe Mais Visto</span>
        </div>
      </div>
    </div>

    <div class="dashboard-charts-grid">
      <div class="dash-chart-card">
        <h3>Top Clipes por Visualizações</h3>
        <div class="chart-wrapper">
          <canvas id="top-clips-chart"></canvas>
        </div>
      </div>

      <div class="dash-chart-card">
        <h3>Distribuição por Status</h3>
        <div class="chart-wrapper">
          <canvas id="status-chart"></canvas>
        </div>
      </div>
    </div>

    <div class="dash-table-card">
      <h3>Ranking dos 5 Clipes Mais Vistos</h3>
      <div id="top-clips-table-container">
        <p class="muted-text">Carregando dados...</p>
      </div>
    </div>
  `;

  document.getElementById("sync-all-btn")?.addEventListener("click", async () => {
    showToast("Sincronizando analytics de todos os clipes...", "info");
    try {
      const res = await api.fetchAllAnalytics();
      showToast(`Sincronização concluída! ${res.length} clipes atualizados.`, "success");
      await loadDashboardData();
    } catch (err) {
      showToast(`Erro ao sincronizar: ${err}`, "error");
    }
  });

  await loadDashboardData();
}

async function loadDashboardData() {
  try {
    const stats = await api.getDashboardStats();
    document.getElementById("stat-total-clips").innerText = stats.total_clips;
    document.getElementById("stat-total-views").innerText = stats.total_views.toLocaleString();
    document.getElementById("stat-avg-likes").innerText = Math.round(stats.avg_likes).toLocaleString();
    document.getElementById("stat-top-clip").innerText = stats.top_clip_title
      ? `${stats.top_clip_title} (${stats.top_clip_views.toLocaleString()} views)`
      : "Nenhum ainda";

    const statusCounts = await api.getClipsByStatusCount();
    const statusLabels = statusCounts.map(s => s.status.toUpperCase());
    const statusData = statusCounts.map(s => s.count);
    createDoughnutChart("status-chart", statusLabels, statusData);

    const topClips = await api.getTopClips(5);
    const clipLabels = topClips.map(c => c.title.length > 15 ? c.title.substring(0, 15) + "..." : c.title);
    const clipViews = topClips.map(c => c.views);
    createBarChart("top-clips-chart", clipLabels, clipViews, "Views");

    renderTopClipsTable(topClips);
  } catch (err) {
    console.error("Error loading dashboard data", err);
    showToast(`Erro ao carregar dashboard: ${err}`, "error");
  }
}

function renderTopClipsTable(topClips) {
  const container = document.getElementById("top-clips-table-container");
  if (!container) return;

  if (topClips.length === 0) {
    container.innerHTML = `<p class="muted-text">Adicione links do YouTube e sincronize o analytics para ver o ranking aqui.</p>`;
    return;
  }

  container.innerHTML = `
    <table class="clips-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Título</th>
          <th>Visualizações</th>
          <th>Likes</th>
          <th>Status</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${topClips.map((c, index) => `
          <tr>
            <td><strong>#${index + 1}</strong></td>
            <td>${c.title}</td>
            <td><strong>${c.views.toLocaleString()} views</strong></td>
            <td>${c.likes.toLocaleString()} likes</td>
            <td><span class="category-tag category-none">${c.status}</span></td>
            <td><a href="#/clip/${c.id}" class="btn-icon">Detalhes</a></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}
