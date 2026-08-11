import * as api from '../bridge.js';
import { renderStatusBadge } from '../components/status-badge.js';
import { renderCategoryTag } from '../components/category-tag.js';
import { showModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

let currentClip = null;
let allCategories = [];

export async function renderClipDetail(container, clipId) {
  try {
    currentClip = await api.getClip(clipId);
    allCategories = await api.getCategories();
  } catch(e) {
    container.innerHTML = '<p class="text-error">Erro ao carregar clipe</p>';
    return;
  }

  if(!currentClip) {
    container.innerHTML = '<p class="text-error">Clipe não encontrado</p>';
    return;
  }

  const clipCategories = allCategories.filter(c => currentClip.category_ids && currentClip.category_ids.includes(c.id));

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
              <input type="text" class="form-input" value="${currentClip.original_url || ''}" readonly>
              <a href="${currentClip.original_url}" target="_blank" class="btn btn-secondary">Abrir</a>
              <button class="btn btn-secondary copy-btn" data-val="${currentClip.original_url}">Copiar</button>
            </div>
          </div>

          <div class="form-group">
            <label>Link Shorts/TikTok (Postado)</label>
            <div class="d-flex gap-2">
              <input type="text" id="clip-post-url" class="form-input" value="${currentClip.post_url || ''}">
              ${currentClip.post_url ? `<a href="${currentClip.post_url}" target="_blank" class="btn btn-secondary">Abrir</a>` : ''}
            </div>
          </div>

          <div class="form-group">
            <label>Anotações</label>
            <textarea id="clip-notes" class="form-input" rows="5">${currentClip.notes || ''}</textarea>
          </div>
        </div>

        <div class="section-card">
          <h3>Métricas</h3>
          <p class="section-desc">Estatísticas sincronizadas das plataformas</p>
          <div class="metrics-row mb-3">
            <div class="metric-card"><div class="metric-label">Visualizações</div><div class="metric-value">${currentClip.views || 0}</div></div>
            <div class="metric-card"><div class="metric-label">Curtidas</div><div class="metric-value">${currentClip.likes || 0}</div></div>
            <div class="metric-card"><div class="metric-label">Comentários</div><div class="metric-value">${currentClip.comments || 0}</div></div>
          </div>
          <button id="btn-sync-stats" class="btn btn-secondary">Sincronizar Estatísticas</button>
        </div>
      </div>

      <div class="sidebar-column">
        <div class="section-card mb-4">
          <h3>Informações</h3>
          <div class="info-list text-sm">
            <div class="mb-2"><strong>ID:</strong> ${currentClip.id}</div>
            <div class="mb-2"><strong>Plataforma Base:</strong> ${currentClip.platform || 'Manual'}</div>
            <div class="mb-2"><strong>Criado em:</strong> ${new Date(currentClip.created_at).toLocaleString('pt-BR')}</div>
            <div class="mb-2"><strong>Game:</strong> ${currentClip.game_id || '-'}</div>
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
          <h3>Partida Valorant</h3>
          <div id="valorant-match-container">
            ${currentClip.match_id ? 
              `<div class="text-sm mb-3">Vinculado à partida: <br><code class="mt-1 block">${currentClip.match_id}</code></div>
               <button id="btn-unlink-match" class="btn btn-secondary btn-sm w-100">Desvincular</button>` :
              `<p class="text-sm text-muted mb-3">Nenhuma partida vinculada.</p>
               <button id="btn-link-match" class="btn btn-secondary w-100">Vincular Partida Recente</button>`
            }
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
      await api.updateClip(clipId, {
        title: document.getElementById('clip-title').value,
        status: document.getElementById('clip-status').value,
        post_url: document.getElementById('clip-post-url').value,
        notes: document.getElementById('clip-notes').value
      });
      // Silent save
    } catch(e) {
      showToast('Erro ao salvar', 'error');
    }
  };

  ['clip-title', 'clip-status', 'clip-post-url'].forEach(id => {
    document.getElementById(id).addEventListener('change', saveChanges);
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
  document.getElementById('btn-sync-stats').addEventListener('click', async () => {
    try {
      showToast('Sincronizando estatísticas...', 'info');
      await api.syncClipAnalytics(clipId);
      showToast('Estatísticas atualizadas', 'success');
      renderClipDetail(document.getElementById('app-container'), clipId);
    } catch(e) {
      showToast('Erro ao sincronizar', 'error');
    }
  });

  // Categories
  document.getElementById('btn-manage-categories').addEventListener('click', () => {
    const options = allCategories.map(c => {
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
          const selected = Array.from(document.querySelectorAll('.cat-checkbox:checked')).map(cb => parseInt(cb.value));
          try {
            await api.updateClipCategories(clipId, selected);
            showToast('Categorias atualizadas', 'success');
            modal.close();
            renderClipDetail(document.getElementById('app-container'), clipId);
          } catch(e) {
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
        title: 'Vincular Partida',
        body: '<p>Buscando últimas partidas...</p>',
        buttons: [{ text: 'Cancelar', class: 'btn btn-secondary', close: true }]
      });
      
      try {
        const matches = await api.getRecentValorantMatches();
        const modalBody = document.querySelector('.modal-body');
        if(matches && matches.length > 0) {
          modalBody.innerHTML = `
            <div class="list-group">
              ${matches.map(m => `
                <button class="list-group-item match-select-btn text-left" data-id="${m.meta.id}">
                  <strong>${m.meta.map.name}</strong> - ${m.stats.character.name} <br>
                  <span class="text-sm text-muted">KDA: ${m.stats.kills}/${m.stats.deaths}/${m.stats.assists} | ${new Date(m.meta.started_at).toLocaleString('pt-BR')}</span>
                </button>
              `).join('')}
            </div>
          `;
          document.querySelectorAll('.match-select-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              const matchId = e.currentTarget.getAttribute('data-id');
              try {
                await api.linkValorantMatch(clipId, matchId);
                showToast('Partida vinculada', 'success');
                document.querySelector('.modal-overlay').remove(); // close modal
                renderClipDetail(document.getElementById('app-container'), clipId);
              } catch(err) {
                showToast('Erro ao vincular', 'error');
              }
            });
          });
        } else {
          modalBody.innerHTML = '<p>Nenhuma partida recente encontrada.</p>';
        }
      } catch(e) {
        document.querySelector('.modal-body').innerHTML = '<p class="text-error">Erro ao buscar partidas. Verifique suas credenciais nas configurações.</p>';
      }
    });
  }

  const unlinkBtn = document.getElementById('btn-unlink-match');
  if(unlinkBtn) {
    unlinkBtn.addEventListener('click', async () => {
      try {
        await api.unlinkValorantMatch(clipId);
        showToast('Partida desvinculada', 'success');
        renderClipDetail(document.getElementById('app-container'), clipId);
      } catch(e) {
        showToast('Erro ao desvincular', 'error');
      }
    });
  }
}
