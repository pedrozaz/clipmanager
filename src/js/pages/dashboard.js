import { api } from '../bridge.js';
import { createDoughnutChart } from '../components/chart.js';
import { showToast } from '../components/toast.js';

let statusChart = null;

export async function renderDashboard(container) {
  container.innerHTML = `
    <div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-start;">
      <div>
        <h2>Dashboard</h2>
        <p class="page-subtitle">Visão geral do pipeline de produção dos seus clipes</p>
      </div>
      <button id="sync-analytics-btn" class="btn btn-secondary btn-sm">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
        Sincronizar YouTube
      </button>
    </div>

    <div class="dash-kpi-row" id="dash-kpis">
      <div class="kpi-card kpi-loading"><div class="kpi-skeleton"></div></div>
      <div class="kpi-card kpi-loading"><div class="kpi-skeleton"></div></div>
      <div class="kpi-card kpi-loading"><div class="kpi-skeleton"></div></div>
      <div class="kpi-card kpi-loading"><div class="kpi-skeleton"></div></div>
      <div class="kpi-card kpi-loading"><div class="kpi-skeleton"></div></div>
      <div class="kpi-card kpi-loading"><div class="kpi-skeleton"></div></div>
    </div>

    <div class="dash-body">
      <div class="dash-main">
        <div class="section-card" style="padding: var(--space-5); margin-bottom: var(--space-5);">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom: var(--space-4);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9146ff" stroke-width="2"><path d="M21 2H3v16h5v4l4-4h5l4-4V2zm-10 9V7m5 4V7"/></svg>
            <h3 style="margin:0; font-size: 15px;">Top Clipes — Twitch Views</h3>
          </div>
          <div id="top-clips-list">
            <p class="text-muted text-sm">Carregando...</p>
          </div>
        </div>

        <div class="section-card" style="padding: var(--space-5);">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom: var(--space-4);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#ff4444"><path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.2 2.8 12 2.8 12 2.8s-4.2 0-6.8.1c-.6.1-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.2v2c0 2.1.3 4.2.3 4.2s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.2 21.6 12 21.6 12 21.6s4.2 0 6.8-.2c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.1.3-4.2v-2C23.3 9.1 23 7 23 7zM9.7 15.5V8.4l8.1 3.6-8.1 3.5z"/></svg>
            <h3 style="margin:0; font-size: 15px;">Top Clipes — YouTube Shorts</h3>
            <span style="font-size:11px; color:var(--text-muted); margin-left:auto;">cliques em "Sincronizar YouTube" para atualizar</span>
          </div>
          <div id="top-yt-list">
            <p class="text-muted text-sm">Carregando...</p>
          </div>
        </div>
      </div>

      <div class="dash-side">
        <div class="section-card" style="padding: var(--space-5); margin-bottom: var(--space-5);">
          <h3 style="margin-bottom: var(--space-4); font-size: 15px;">Status dos Clipes</h3>
          <div style="position:relative; height:220px; width:100%;">
            <canvas id="status-chart"></canvas>
          </div>
          <div id="status-legend" style="margin-top: var(--space-4);"></div>
        </div>

        <div class="section-card" style="padding: var(--space-5);">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: var(--space-4);">
            <h3 style="margin:0; font-size: 15px;">Desempenho no Valorant</h3>
            <span style="font-size:11px; color:var(--text-muted);">clipes vinculados</span>
          </div>
          <div id="val-stats-container">
            <p class="text-muted text-sm">Carregando estatísticas do Valorant...</p>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('sync-analytics-btn').addEventListener('click', async () => {
    try {
      showToast('Sincronizando métricas do YouTube...', 'info');
      await api.fetchAllAnalytics();
      showToast('Métricas sincronizadas', 'success');
      await loadDashboardData();
    } catch (err) {
      const msg = typeof err === 'string' ? err : (err?.message || JSON.stringify(err));
      showToast('Erro: ' + msg, 'error');
    }
  });

  await loadDashboardData();
}

async function loadDashboardData() {
  try {
    const [stats, statusCounts] = await Promise.all([
      api.getDashboardStats(),
      api.getClipsByStatusCount(),
    ]);

    const postedCount = statusCounts.find(s => s.status?.toLowerCase() === 'postado')?.count || 0;
    const newCount = statusCounts.find(s => s.status?.toLowerCase() === 'novo')?.count || 0;
    const editingCount = (statusCounts.find(s => s.status?.toLowerCase() === 'editando')?.count || 0)
                       + (statusCounts.find(s => s.status?.toLowerCase() === 'editado')?.count || 0);

    // KPI cards
    document.getElementById('dash-kpis').innerHTML = `
      <div class="kpi-card">
        <div class="kpi-icon" style="background: rgba(124,58,237,0.15); color: #a78bfa;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/><path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/><path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/><path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/><path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"/><path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/><path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z"/><path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z"/></svg>
        </div>
        <div>
          <div class="kpi-value">${stats.total_clips || 0}</div>
          <div class="kpi-label">Total de Clipes</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background: rgba(91,141,239,0.15); color: #5b8def;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </div>
        <div>
          <div class="kpi-value">${(stats.total_views || 0).toLocaleString('pt-BR')}</div>
          <div class="kpi-label">Views (Twitch)</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background: rgba(239,68,68,0.15); color: #ff4444;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#ff4444"><path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.2 2.8 12 2.8 12 2.8s-4.2 0-6.8.1c-.6.1-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.2v2c0 2.1.3 4.2.3 4.2s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.2 21.6 12 21.6 12 21.6s4.2 0 6.8-.2c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.1.3-4.2v-2C23.3 9.1 23 7 23 7zM9.7 15.5V8.4l8.1 3.6-8.1 3.5z"/></svg>
        </div>
        <div>
          <div class="kpi-value">${(stats.youtube_views || 0).toLocaleString('pt-BR')}</div>
          <div class="kpi-label">Views (YouTube)</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background: rgba(52,211,153,0.15); color: #34d399;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
        </div>
        <div>
          <div class="kpi-value">${postedCount}</div>
          <div class="kpi-label">Postados</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background: rgba(240,160,48,0.15); color: #f0a030;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div>
          <div class="kpi-value">${editingCount}</div>
          <div class="kpi-label">Em Edição</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background: rgba(91,141,239,0.15); color: #5b8def;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15V6"/><path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/><path d="M12 12H3"/><path d="M16 6H3"/><path d="M12 18H3"/></svg>
        </div>
        <div>
          <div class="kpi-value">${newCount}</div>
          <div class="kpi-label">Aguardando Edição</div>
        </div>
      </div>
    `;

    // Status donut chart
    const statusOrder = ['Novo', 'Editando', 'Editado', 'Postado', 'Descartado'];
    const colorMap = {
      Novo: '#5b8def',
      Editando: '#f0a030',
      Editado: '#a78bfa',
      Postado: '#34d399',
      Descartado: '#6b7280',
    };

    // Normalize status counts: group case-insensitively into Title Case buckets
    const normalizedCounts = {};
    statusCounts.forEach(sc => {
      const key = sc.status
        ? sc.status.charAt(0).toUpperCase() + sc.status.slice(1).toLowerCase()
        : 'Novo';
      normalizedCounts[key] = (normalizedCounts[key] || 0) + (sc.count || 0);
    });

    const labels = statusOrder.filter(s => normalizedCounts[s] > 0);
    const data = labels.map(s => normalizedCounts[s] || 0);
    const colors = labels.map(s => colorMap[s] || '#6b7280');

    if (statusChart) statusChart.destroy();
    const ctx = document.getElementById('status-chart')?.getContext('2d');
    if (ctx && typeof Chart !== 'undefined' && labels.length > 0) {
      statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{ data, backgroundColor: colors, borderColor: '#0f0f12', borderWidth: 3, hoverOffset: 6 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (c) => ` ${c.label}: ${c.raw} clipes`,
              },
            },
          },
        },
      });
    } else if (ctx && labels.length === 0) {
      document.getElementById('status-legend').innerHTML = '<p class="text-muted text-sm">Sem clipes ainda.</p>';
    }

    // Status legend
    document.getElementById('status-legend').innerHTML = labels.map((s, i) => `
      <div style="display:flex; align-items:center; justify-content:space-between; padding: 6px 0; border-bottom: 1px solid var(--border-subtle);">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="width:10px; height:10px; border-radius:50%; background:${colors[i]}; flex-shrink:0;"></span>
          <span style="font-size:13px; color:var(--text-secondary);">${s}</span>
        </div>
        <span style="font-size:13px; font-weight:600; color:var(--text-primary);">${data[i]}</span>
      </div>
    `).join('');

    // Valorant stats
    const valStatsEl = document.getElementById('val-stats-container');
    if (valStatsEl) {
      try {
        const valStats = await api.getValorantStats();
        if (valStats && valStats.total_matches > 0) {
          const wrColor = valStats.win_rate >= 50 ? '#34d399' : '#f87171';
          valStatsEl.innerHTML = `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
              <div style="background: var(--bg-surface); padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); text-align:center;">
                <div style="font-size:11px; color:var(--text-muted);">Taxa de Vitória</div>
                <div style="font-size:18px; font-weight:700; color:${wrColor};">${valStats.win_rate.toFixed(1)}%</div>
                <div style="font-size:10px; color:var(--text-muted); margin-top:2px;">${valStats.wins}V / ${valStats.losses}D</div>
              </div>
              <div style="background: var(--bg-surface); padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); text-align:center;">
                <div style="font-size:11px; color:var(--text-muted);">K/D Ratio</div>
                <div style="font-size:18px; font-weight:700; color:var(--text-primary);">${valStats.kd_ratio.toFixed(2)}</div>
                <div style="font-size:10px; color:var(--text-muted); margin-top:2px;">${valStats.total_matches} partidas</div>
              </div>
            </div>

            <div style="background: var(--bg-surface); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
              <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom: 6px; border-bottom: 1px solid var(--border-subtle); margin-bottom: 6px;">
                <span style="font-size:12px; color:var(--text-muted);">Abates (Kills):</span>
                <strong style="font-size:13px; color:var(--text-primary);">${valStats.kills.toLocaleString('pt-BR')}</strong>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom: 6px; border-bottom: 1px solid var(--border-subtle); margin-bottom: 6px;">
                <span style="font-size:12px; color:var(--text-muted);">Mortes (Deaths):</span>
                <strong style="font-size:13px; color:var(--text-primary);">${valStats.deaths.toLocaleString('pt-BR')}</strong>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom: 6px; border-bottom: 1px solid var(--border-subtle); margin-bottom: 6px;">
                <span style="font-size:12px; color:var(--text-muted);">Assistências:</span>
                <strong style="font-size:13px; color:var(--text-primary);">${valStats.assists.toLocaleString('pt-BR')}</strong>
              </div>
              ${valStats.most_played_agent ? `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:12px; color:var(--text-muted);">Agente Favorito:</span>
                  <strong style="font-size:13px; color:var(--accent-secondary);">${valStats.most_played_agent}</strong>
                </div>
              ` : ''}
            </div>
          `;
        } else {
          valStatsEl.innerHTML = `<p class="text-muted text-sm" style="margin:0;">Vincule partidas do Valorant aos seus clipes na biblioteca para ver a somatória de K/D, abates e taxa de vitória aqui.</p>`;
        }
      } catch(e) {
        valStatsEl.innerHTML = `<p class="text-muted text-sm" style="margin:0;">Sem estatísticas de partidas.</p>`;
      }
    }

    // Top clips by Twitch views
    const allClips = await api.listClips({ sortBy: 'views', sortOrder: 'desc' });
    const clipsArr = Array.isArray(allClips) ? allClips : [];
    const topClips = clipsArr.filter(c => c.views > 0).slice(0, 7);

    const topEl = document.getElementById('top-clips-list');
    if (topClips.length > 0) {
      const maxViews = topClips[0].views || 1;
      topEl.innerHTML = topClips.map((clip, i) => `
        <div style="display:flex; align-items:center; gap:12px; padding: 10px 0; ${i < topClips.length - 1 ? 'border-bottom: 1px solid var(--border-subtle);' : ''}">
          <span style="font-size:12px; font-weight:700; color:var(--text-muted); width:16px; text-align:center;">${i + 1}</span>
          <div style="flex:1; min-width:0;">
            <div style="font-size:13px; font-weight:600; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${clip.title}</div>
            <div style="margin-top:4px; height:4px; background:var(--bg-hover); border-radius:2px; overflow:hidden;">
              <div style="height:100%; width:${Math.round((clip.views / maxViews) * 100)}%; background: linear-gradient(90deg, #7c3aed, #5b8def); border-radius:2px;"></div>
            </div>
          </div>
          <span style="font-size:12px; font-weight:600; color:var(--text-secondary); white-space:nowrap;">${clip.views.toLocaleString('pt-BR')} views</span>
        </div>
      `).join('');
    } else {
      topEl.innerHTML = `<p class="text-muted text-sm">Importe clipes da Twitch para ver estatísticas de visualizações.</p>`;
    }

    // Top clips by YouTube analytics
    const ytEl = document.getElementById('top-yt-list');
    try {
      const ytTopClips = await api.getTopClips(7);
      const ytClips = Array.isArray(ytTopClips) ? ytTopClips : [];
      if (ytClips.length > 0) {
        const maxYtViews = ytClips[0].views || 1;
        ytEl.innerHTML = ytClips.map((clip, i) => `
          <div style="display:flex; align-items:center; gap:12px; padding: 10px 0; ${i < ytClips.length - 1 ? 'border-bottom: 1px solid var(--border-subtle);' : ''}">
            <span style="font-size:12px; font-weight:700; color:var(--text-muted); width:16px; text-align:center;">${i + 1}</span>
            <div style="flex:1; min-width:0;">
              <div style="font-size:13px; font-weight:600; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${clip.title}</div>
              <div style="margin-top:4px; height:4px; background:var(--bg-hover); border-radius:2px; overflow:hidden;">
                <div style="height:100%; width:${Math.round((clip.views / maxYtViews) * 100)}%; background: linear-gradient(90deg, #ff4444, #ff8800); border-radius:2px;"></div>
              </div>
            </div>
            <div style="text-align:right; white-space:nowrap;">
              <div style="font-size:12px; font-weight:600; color:var(--text-secondary);">${clip.views.toLocaleString('pt-BR')} views</div>
              ${clip.likes > 0 ? `<div style="font-size:11px; color:var(--text-muted);">♥ ${clip.likes.toLocaleString('pt-BR')}</div>` : ''}
            </div>
          </div>
        `).join('');
      } else {
        ytEl.innerHTML = `<p class="text-muted text-sm">Nenhum dado de YouTube ainda. Adicione links de Shorts nos clipes e clique em "Sincronizar YouTube".</p>`;
      }
    } catch (_) {
      ytEl.innerHTML = `<p class="text-muted text-sm">Sincronize para ver métricas do YouTube.</p>`;
    }

  } catch (err) {
    const msg = typeof err === 'string' ? err : (err?.message || JSON.stringify(err));
    console.error('Dashboard error:', msg, err);
    showToast('Erro ao carregar dashboard: ' + msg, 'error');
  }
}
