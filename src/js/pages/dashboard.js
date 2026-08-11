import * as api from '../bridge.js';
import { createBarChart, createDoughnutChart } from '../components/chart.js';
import { showToast } from '../components/toast.js';

let viewCountChart = null;
let statusChart = null;

export async function renderDashboard(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h2>Dashboard</h2>
        <p class="page-subtitle">Visão geral do desempenho dos seus clipes</p>
      </div>
      <button id="sync-analytics-btn" class="btn btn-primary">Sincronizar Métricas</button>
    </div>

    <div class="panel-container mb-6">
      <div class="panel-header">
        <h3>Resumo do Canal</h3>
      </div>
      <div class="panel-body">
        <div class="stream-summary-stats" id="dashboard-metrics">
          <div class="stat-item"><div class="stat-label">Total de Clipes</div><div class="stat-value">0</div></div>
          <div class="stat-item"><div class="stat-label">Visualizações totais</div><div class="stat-value">0</div></div>
          <div class="stat-item"><div class="stat-label">Curtidas totais</div><div class="stat-value">0</div></div>
          <div class="stat-item"><div class="stat-label">Clipes Postados</div><div class="stat-value">0</div></div>
        </div>
      </div>
    </div>

    <div class="charts-row">
      <div class="chart-card">
        <h3>Visualizações por Dia</h3>
        <canvas id="view-count-chart"></canvas>
      </div>
      <div class="chart-card">
        <h3>Status dos Clipes</h3>
        <canvas id="status-chart"></canvas>
      </div>
    </div>

    <div class="table-card">
      <h3>Top Clipes (Mais Visualizados)</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Status</th>
            <th>Plataforma</th>
            <th>Visualizações</th>
          </tr>
        </thead>
        <tbody id="top-clips-table">
          <tr><td colspan="4" class="text-center">Carregando...</td></tr>
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('sync-analytics-btn').addEventListener('click', async () => {
    try {
      showToast('Sincronizando métricas...', 'info');
      await api.fetchAllAnalytics();
      showToast('Métricas sincronizadas com sucesso', 'success');
      await loadDashboardData();
    } catch (err) {
      showToast('Erro ao sincronizar métricas: ' + err.message, 'error');
    }
  });

  await loadDashboardData();
}

async function loadDashboardData() {
  try {
    const stats = await api.getDashboardStats();
    
    document.getElementById('dashboard-metrics').innerHTML = `
      <div class="stat-item"><div class="stat-label">Total de Clipes</div><div class="stat-value">${stats.totalClips || 0}</div></div>
      <div class="stat-item"><div class="stat-label">Visualizações totais</div><div class="stat-value">${stats.totalViews || 0}</div></div>
      <div class="stat-item"><div class="stat-label">Curtidas totais</div><div class="stat-value">${stats.totalLikes || 0}</div></div>
      <div class="stat-item"><div class="stat-label">Clipes Postados</div><div class="stat-value">${stats.postedClips || 0}</div></div>
    `;

    // Charts
    const statusCounts = await api.getClipsByStatusCount();
    const statusLabels = Object.keys(statusCounts);
    const statusData = Object.values(statusCounts);
    
    if (statusChart) statusChart.destroy();
    statusChart = createDoughnutChart('status-chart', statusLabels, statusData);

    // Mock bar chart data since we don't have historical views API yet
    if (viewCountChart) viewCountChart.destroy();
    viewCountChart = createBarChart('view-count-chart', ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'], [12, 19, 3, 5, 2, 3, 7], 'Visualizações');

    // Table
    const topClips = await api.getTopClips(5);
    const tbody = document.getElementById('top-clips-table');
    if (topClips && topClips.length > 0) {
      tbody.innerHTML = topClips.map(clip => `
        <tr>
          <td>${clip.title}</td>
          <td>${clip.status}</td>
          <td>${clip.platform || '-'}</td>
          <td>${clip.views || 0}</td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Nenhum clipe encontrado</td></tr>`;
    }
  } catch (err) {
    console.error('Failed to load dashboard data', err);
    showToast('Erro ao carregar dados do dashboard', 'error');
  }
}
