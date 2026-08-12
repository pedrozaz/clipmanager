import { api } from '../bridge.js';
import { renderStatusBadge } from '../components/status-badge.js';
import { renderCategoryTag } from '../components/category-tag.js';
import { showModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

let currentClip = null;
let allCategories = [];

function getTwitchEmbedUrl(clip) {
  const url = clip.embed_url || clip.twitch_url || '';
  if (!url) return null;

  let slug = null;
  const match = url.match(/(?:clips\.twitch\.tv\/|twitch\.tv\/[^\/]+\/clip\/)([A-Za-z0-9_-]+)/);
  if (match && match[1]) {
    slug = match[1];
  } else if (!url.includes('/') && url.length > 5) {
    slug = url;
  }

  if (!slug) return null;

  return `https://clips.twitch.tv/embed?clip=${encodeURIComponent(slug)}&parent=localhost&parent=127.0.0.1&autoplay=false`;
}

function getYoutubeEmbedUrl(youtubeUrl) {
  if (!youtubeUrl) return null;
  const match = youtubeUrl.match(/(?:youtube\.com\/shorts\/|youtu\.be\/|youtube\.com\/watch\?v=)([A-Za-z0-9_-]+)/);
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  return null;
}

export async function renderClipDetail(container, clipId) {
  try {
    currentClip = await api.getClip(clipId);
    allCategories = await api.listCategories();
  } catch(e) {
    container.innerHTML = '<p class="text-error">Erro ao carregar clipe</p>';
    return;
  }

  if(!currentClip) {
    container.innerHTML = '<p class="text-error">Clipe não encontrado</p>';
    return;
  }

  let analyticsHistory = [];
  try {
    analyticsHistory = await api.getAnalyticsHistory(clipId);
  } catch(_) {}

  const latestYt = Array.isArray(analyticsHistory) && analyticsHistory.length > 0
    ? analyticsHistory[analyticsHistory.length - 1]
    : null;

  let matchData = null;
  try {
    matchData = await api.getClipMatchData(clipId);
  } catch(_) {}

  const twitchViews = currentClip.views || 0;
  const youtubeViews = latestYt ? (latestYt.views || 0) : 0;
  const totalViews = twitchViews + youtubeViews;
  const clipCategories = (allCategories || []).filter(c => currentClip.category_ids && currentClip.category_ids.includes(c.id));
  
  const twitchEmbedUrl = getTwitchEmbedUrl(currentClip);
  const ytEmbedUrl = getYoutubeEmbedUrl(currentClip.youtube_url);

  const renderMediaPlayers = () => {
    let html = '';
    if (twitchEmbedUrl) {
      html += `
        <div class="section-card mb-4" style="padding:0; overflow:hidden; border-radius: var(--radius-lg); background:#000; border: 1px solid var(--border-subtle);">
          <div style="position:relative; padding-bottom:56.25%; height:0; width:100%;">
            <iframe src="${twitchEmbedUrl}" height="100%" width="100%" style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" allowfullscreen="true" referrerpolicy="no-referrer"></iframe>
          </div>
          ${currentClip.twitch_url ? `
            <div style="padding:8px 14px; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:space-between; border-top:1px solid var(--border-subtle);">
              <span style="font-size:12px; color:var(--text-muted);">Clipe da Twitch</span>
              <a href="${currentClip.twitch_url}" target="_blank" class="btn btn-sm btn-secondary" style="font-size:11px; padding:3px 10px;">
                Abrir na Twitch ↗
              </a>
            </div>
          ` : ''}
        </div>
      `;
    }
    if (ytEmbedUrl) {
      html += `
        <div class="section-card mb-4" style="padding: 16px; border-radius: var(--radius-lg); background: var(--bg-surface); border: 1px solid var(--border-subtle);">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom: 14px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#ff4444"><path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.2 2.8 12 2.8 12 2.8s-4.2 0-6.8.1c-.6.1-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.2v2c0 2.1.3 4.2.3 4.2s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.2 21.6 12 21.6 12 21.6s4.2 0 6.8-.2c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.1.3-4.2v-2C23.3 9.1 23 7 23 7zM9.7 15.5V8.4l8.1 3.6-8.1 3.5z"/></svg>
            <h3 style="margin:0; font-size: 14px; color: var(--text-primary);">YouTube Shorts</h3>
          </div>
          <div style="max-width: 380px; margin: 0 auto; background:#000; border-radius: var(--radius-md); overflow:hidden; border: 1px solid var(--border-subtle);">
            <div style="position:relative; padding-bottom:177.77%; height:0; width:100%;">
              <iframe src="${ytEmbedUrl}" height="100%" width="100%" style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" allowfullscreen="true"></iframe>
            </div>
          </div>
        </div>
      `;
    }
    return html;
  };

  container.innerHTML = `
    <div class="page-header d-flex justify-content-between">
      <div class="d-flex align-items-center gap-3">
        <button id="btn-back" class="btn btn-secondary">Voltar</button>
        <div>
          <h2>Detalhes do Clipe</h2>
        </div>
      </div>
      <div>
        <button id="btn-delete" class="btn btn-danger">Excluir Clipe</button>
      </div>
    </div>

    <div class="clip-detail-grid">
      <div class="main-column">
        ${renderMediaPlayers()}
        <div class="section-card mb-4">
          <div class="form-group">
            <label>Título do Clipe</label>
            <input type="text" id="clip-title" class="form-input text-lg" value="${currentClip.title}">
          </div>
          <div class="form-group">
            <label>Status</label>
            <select id="clip-status" class="form-select">
              <option value="Novo" ${currentClip.status === 'Novo' ? 'selected' : ''}>Novo</option>
              <option value="Editando" ${currentClip.status === 'Editando' ? 'selected' : ''}>Editando</option>
              <option value="Editado" ${currentClip.status === 'Editado' ? 'selected' : ''}>Editado</option>
              <option value="Postado" ${currentClip.status === 'Postado' ? 'selected' : ''}>Postado</option>
              <option value="Descartado" ${currentClip.status === 'Descartado' ? 'selected' : ''}>Descartado</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>URL Original (Twitch)</label>
            <div class="d-flex gap-2">
              <input type="text" class="form-input" value="${currentClip.twitch_url || ''}" readonly>
              ${currentClip.twitch_url ? `<a href="${currentClip.twitch_url}" target="_blank" class="btn btn-secondary">Abrir</a>` : ''}
              ${currentClip.twitch_url ? `<button class="btn btn-secondary copy-btn" data-val="${currentClip.twitch_url}">Copiar</button>` : ''}
            </div>
          </div>

          <div class="form-group">
            <label>Link YouTube Shorts / TikTok (Postado)</label>
            <div class="d-flex gap-2">
              <input type="text" id="clip-youtube-url" class="form-input" value="${currentClip.youtube_url || ''}" placeholder="https://youtube.com/shorts/...">
              ${currentClip.youtube_url ? `<a href="${currentClip.youtube_url}" target="_blank" class="btn btn-secondary">Abrir</a>` : ''}
            </div>
          </div>

          <div class="form-group">
            <label>Anotações</label>
            <textarea id="clip-notes" class="form-input" rows="5">${currentClip.notes || ''}</textarea>
          </div>
        </div>

        <div class="section-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: var(--space-4);">
            <div>
              <h3 style="margin:0;">Métricas de Desempenho</h3>
              <p class="section-desc" style="margin:0;">Estatísticas consolidadas por plataforma</p>
            </div>
            ${currentClip.youtube_url ? `
              <button id="btn-sync-stats" class="btn btn-secondary btn-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                Sincronizar YouTube
              </button>
            ` : ''}
          </div>

          <div class="metrics-row mb-4">
            <div class="metric-card" style="border-left: 3px solid var(--accent-primary);">
              <div class="metric-label">Total Acumulado</div>
              <div class="metric-value">${totalViews.toLocaleString('pt-BR')} <span style="font-size:12px; font-weight:normal; color:var(--text-muted);">views</span></div>
            </div>
            <div class="metric-card" style="border-left: 3px solid #9146ff;">
              <div class="metric-label">Views (Twitch)</div>
              <div class="metric-value">${twitchViews.toLocaleString('pt-BR')}</div>
            </div>
            <div class="metric-card" style="border-left: 3px solid #ff4444;">
              <div class="metric-label">Views (YouTube)</div>
              <div class="metric-value">${latestYt ? youtubeViews.toLocaleString('pt-BR') : (currentClip.youtube_url ? '0' : '-')}</div>
            </div>
          </div>

          ${currentClip.youtube_url ? `
            <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: var(--space-4);">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom: 12px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#ff4444"><path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.2 2.8 12 2.8 12 2.8s-4.2 0-6.8.1c-.6.1-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.2v2c0 2.1.3 4.2.3 4.2s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.2 21.6 12 21.6 12 21.6s4.2 0 6.8-.2c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.1.3-4.2v-2C23.3 9.1 23 7 23 7zM9.7 15.5V8.4l8.1 3.6-8.1 3.5z"/></svg>
                <span style="font-size:13px; font-weight:600; color:var(--text-primary);">Métricas do YouTube Shorts</span>
                ${latestYt?.fetched_at ? `<span style="font-size:11px; color:var(--text-muted); margin-left:auto;">Sincronizado em ${new Date(latestYt.fetched_at).toLocaleString('pt-BR')}</span>` : ''}
              </div>
              <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap: 12px; text-align:center;">
                <div>
                  <div style="font-size:11px; color:var(--text-muted);">Visualizações</div>
                  <div style="font-size:16px; font-weight:700; color:var(--text-primary);">${latestYt ? (latestYt.views || 0).toLocaleString('pt-BR') : 0}</div>
                </div>
                <div>
                  <div style="font-size:11px; color:var(--text-muted);">Curtidas</div>
                  <div style="font-size:16px; font-weight:700; color:var(--text-primary);">${latestYt ? (latestYt.likes || 0).toLocaleString('pt-BR') : 0}</div>
                </div>
                <div>
                  <div style="font-size:11px; color:var(--text-muted);">Comentários</div>
                  <div style="font-size:16px; font-weight:700; color:var(--text-primary);">${latestYt ? (latestYt.comments || 0).toLocaleString('pt-BR') : 0}</div>
                </div>
              </div>
            </div>
          ` : `
            <p class="text-muted text-sm" style="margin:0;">Vinculando um link de YouTube Shorts acima, você poderá sincronizar e acompanhar curtidas, comentários e métricas do YouTube.</p>
          `}
        </div>
      </div>

      <div class="sidebar-column">
        <div class="section-card mb-4">
          <h3>Informações</h3>
          <div class="info-list text-sm">
            <div class="mb-2"><strong>ID:</strong> ${currentClip.id}</div>
            <div class="mb-2"><strong>Plataforma Base:</strong> ${currentClip.platform || 'Manual'}</div>
            <div class="mb-2"><strong>Criado em:</strong> ${new Date(currentClip.created_at).toLocaleString('pt-BR')}</div>
            <div class="mb-2"><strong>Game:</strong> ${currentClip.game_name || currentClip.game_id || '-'}</div>
          </div>
        </div>

        <div class="section-card mb-4">
          <h3>Categorias</h3>
          <div id="clip-categories-container" class="mb-3 d-flex flex-wrap gap-2">
            ${clipCategories.length ? clipCategories.map(c => renderCategoryTag(c)).join('') : '<span class="text-muted text-sm">Nenhuma categoria</span>'}
          </div>
          <button id="btn-manage-categories" class="btn btn-secondary w-100">Gerenciar Categorias</button>
        </div>

        <div class="section-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: var(--space-3);">
            <h3 style="margin:0;">Partida Valorant</h3>
            ${matchData?.result ? `<span class="valo-badge ${matchData.result.toLowerCase().includes('vitória') || matchData.result.toLowerCase().includes('win') ? 'win' : 'loss'}">${matchData.result}</span>` : ''}
          </div>
          <div id="valorant-match-container">
            ${matchData ? `
              <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: var(--space-3); margin-bottom: var(--space-3);">
                <div style="font-weight:700; font-size:14px; color:var(--text-primary); margin-bottom:4px;">
                  ${matchData.map} — <span style="color:var(--accent-secondary);">${matchData.agent}</span>
                </div>
                <div style="font-size:12px; color:var(--text-muted); margin-bottom:2px;">Placar: <strong style="color:var(--text-primary);">${matchData.score}</strong></div>
                <div style="font-size:12px; color:var(--text-muted);">KDA: <strong style="color:var(--text-primary);">${matchData.kda}</strong></div>
              </div>
              <button id="btn-unlink-match" class="btn btn-secondary btn-sm w-100">Desvincular Partida</button>
            ` : `
              <p class="text-sm text-muted mb-3">Nenhuma partida vinculada.</p>
              <button id="btn-link-match" class="btn btn-secondary w-100">Vincular Partida Recente</button>
            `}
          </div>
        </div>
      </div>
    </div>
  `;

  setupEventListeners(clipId);
}

function setupEventListeners(clipId) {
  // Back
  document.getElementById('btn-back').addEventListener('click', () => {
    window.location.hash = '#/library';
  });

  // Delete
  document.getElementById('btn-delete').addEventListener('click', async () => {
    if(confirm('Tem certeza que deseja excluir este clipe permanentemente?')) {
      try {
        await api.deleteClip(clipId);
        showToast('Clipe excluído', 'success');
        window.location.hash = '#/library';
      } catch(e) {
        showToast('Erro ao excluir', 'error');
      }
    }
  });

  // Auto-save logic
  const saveChanges = async () => {
    try {
      const updated = await api.updateClip({
        id: Number(clipId),
        title: document.getElementById('clip-title').value,
        status: document.getElementById('clip-status').value,
        youtubeUrl: document.getElementById('clip-youtube-url').value || null,
        twitchUrl: currentClip.twitch_url || null,
        instagramUrl: currentClip.instagram_url || null,
        thumbnailUrl: currentClip.thumbnail_url || null,
        duration: currentClip.duration || null,
        clipDate: currentClip.clip_date || null,
        notes: document.getElementById('clip-notes').value || null,
      });
      // If backend auto-promoted status (e.g. youtube_url set → Postado), reflect it in UI
      if (updated && updated.status) {
        const sel = document.getElementById('clip-status');
        if (sel && sel.value !== updated.status) {
          sel.value = updated.status;
          currentClip.status = updated.status;
          showToast(`Status atualizado para "${updated.status}"`, 'info');
        }
      }
    } catch(e) {
      const msg = typeof e === 'string' ? e : (e?.message || JSON.stringify(e));
      console.error('Auto-save error:', msg);
      showToast('Erro ao salvar: ' + msg, 'error');
    }
  };

  ['clip-title', 'clip-status', 'clip-youtube-url'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', saveChanges);
  });
  
  let typingTimer;
  document.getElementById('clip-notes').addEventListener('keyup', () => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(saveChanges, 1000);
  });

  // Copy buttons
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const val = e.target.getAttribute('data-val');
      if(val) {
        navigator.clipboard.writeText(val);
        showToast('Copiado para área de transferência', 'info');
      }
    });
  });

  // Sync Stats
  document.getElementById('btn-sync-stats')?.addEventListener('click', async () => {
    try {
      showToast('Sincronizando estatísticas...', 'info');
      await api.fetchYoutubeAnalytics(clipId);
      showToast('Estatísticas atualizadas', 'success');
      renderClipDetail(document.getElementById('app-container'), clipId);
    } catch(e) {
      console.error('Sync stats error:', e);
      showToast('Erro ao sincronizar', 'error');
    }
  });

  // Categories
  document.getElementById('btn-manage-categories').addEventListener('click', () => {
    const options = (allCategories || []).map(c => {
      const isChecked = currentClip.category_ids && currentClip.category_ids.includes(c.id);
      return `
        <label class="d-flex align-items-center gap-2 mb-2">
          <input type="checkbox" class="cat-checkbox" value="${c.id}" ${isChecked ? 'checked' : ''}>
          <span style="color: ${c.color}">${c.name}</span>
        </label>
      `;
    }).join('');

    showModal({
      title: 'Categorias do Clipe',
      body: `<div class="form-group">${options || 'Nenhuma categoria cadastrada nas configurações.'}</div>`,
      buttons: [
        { text: 'Cancelar', class: 'btn btn-secondary', close: true },
        { text: 'Salvar', class: 'btn btn-primary', onClick: async (modal) => {
          const selectedIds = Array.from(document.querySelectorAll('.cat-checkbox:checked')).map(cb => parseInt(cb.value));
          const currentIds = currentClip.category_ids || [];
          try {
            // Add missing
            for (const id of selectedIds) {
              if (!currentIds.includes(id)) {
                await api.addCategoryToClip(clipId, id);
              }
            }
            // Remove unselected
            for (const id of currentIds) {
              if (!selectedIds.includes(id)) {
                await api.removeCategoryFromClip(clipId, id);
              }
            }
            showToast('Categorias atualizadas', 'success');
            modal.close();
            renderClipDetail(document.getElementById('app-container'), clipId);
          } catch(e) {
            console.error('Update categories error:', e);
            showToast('Erro ao atualizar categorias', 'error');
          }
        }}
      ]
    });
  });

  // Valorant Match
  const linkBtn = document.getElementById('btn-link-match');
  if(linkBtn) {
    linkBtn.addEventListener('click', async () => {
      showModal({
        title: 'Vincular Partida do Valorant',
        body: `
          <p class="text-sm text-muted mb-3">Últimas 20 partidas competitivas encontradas para sua conta:</p>
          <div id="val-matches-list" style="max-height: 420px; overflow-y: auto; padding-right: 4px;">
            <p class="text-muted text-sm">Buscando partidas no servidor da Riot...</p>
          </div>
        `,
        buttons: [{ text: 'Cancelar', class: 'btn btn-secondary', close: true }]
      });

      const listEl = document.getElementById('val-matches-list');
      try {
        const matches = await api.fetchRecentMatches(20, 0, 'competitive');
        if (matches && matches.length > 0) {
          listEl.innerHTML = matches.map(m => {
            const isWin = m.result?.toLowerCase().includes('vitória') || m.result?.toLowerCase().includes('win');
            const resColor = isWin ? '#34d399' : '#f87171';
            const resBg = isWin ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)';
            return `
              <div class="match-select-btn"
                style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 14px 16px; margin-bottom: 12px; cursor: pointer; transition: all 120ms ease; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;"
                data-id="${m.match_id}" data-agent="${m.agent}" data-map="${m.map}" data-score="${m.score}" data-kda="${m.kda}" data-result="${m.result}">
                <div style="min-width:0; flex:1;">
                  <div style="font-weight:600; font-size:14px; color:var(--text-primary); margin-bottom:4px;">
                    ${m.map} — <span style="color:var(--accent-secondary);">${m.agent}</span>
                  </div>
                  <div style="font-size:12px; color:var(--text-muted);">
                    KDA: <strong style="color:var(--text-primary);">${m.kda}</strong> | Placar: <strong>${m.score}</strong> ${m.started_at ? `| <span style="color:var(--text-secondary);">${m.started_at}</span>` : ''}
                  </div>
                </div>
                <span style="font-size:12px; font-weight:700; color:${resColor}; background:${resBg}; padding: 4px 12px; border-radius: 999px; border: 1px solid ${resColor}33; white-space:nowrap;">
                  ${m.result}
                </span>
              </div>
            `;
          }).join('');

          listEl.querySelectorAll('.match-select-btn').forEach(card => {
            card.addEventListener('mouseover', () => { card.style.borderColor = 'var(--accent-primary)'; card.style.transform = 'translateY(-2px)'; });
            card.addEventListener('mouseout', () => { card.style.borderColor = 'var(--border-subtle)'; card.style.transform = 'none'; });
            card.addEventListener('click', async () => {
              try {
                await api.linkMatchToClip({
                  clipId: clipId,
                  matchId: card.getAttribute('data-id'),
                  agent: card.getAttribute('data-agent'),
                  map: card.getAttribute('data-map'),
                  score: card.getAttribute('data-score'),
                  kda: card.getAttribute('data-kda'),
                  result: card.getAttribute('data-result')
                });
                showToast('Partida vinculada com sucesso', 'success');
                document.querySelector('.modal-overlay')?.remove();
                renderClipDetail(document.getElementById('app-container'), clipId);
              } catch(err) {
                const msg = typeof err === 'string' ? err : (err?.message || JSON.stringify(err));
                showToast('Erro ao vincular: ' + msg, 'error');
              }
            });
          });
        } else {
          listEl.innerHTML = '<p class="text-muted text-sm">Nenhuma partida competitiva recente encontrada.</p>';
        }
      } catch(e) {
        const msg = typeof e === 'string' ? e : (e?.message || JSON.stringify(e));
        if (listEl) listEl.innerHTML = `<p class="text-error text-sm">Erro ao buscar partidas: ${msg}</p>`;
      }
    });
  }

  const unlinkBtn = document.getElementById('btn-unlink-match');
  if(unlinkBtn) {
    unlinkBtn.addEventListener('click', async () => {
      try {
        await api.unlinkMatchFromClip(clipId);
        showToast('Partida desvinculada', 'success');
        renderClipDetail(document.getElementById('app-container'), clipId);
      } catch(e) {
        console.error('Unlink match error:', e);
        showToast('Erro ao desvincular', 'error');
      }
    });
  }
}
