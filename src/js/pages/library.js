import { api } from '../bridge.js';
import { renderFilterBar } from '../components/filter-bar.js';
import { renderClipCard, renderClipRow } from '../components/clip-card.js';
import { showModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

let clips = [];
let categoriesMap = {};
let currentViewMode = 'grid'; // 'grid' or 'list'
let currentFilters = { search: '', status: '', categoryId: '', sortBy: 'date_desc' };

export async function renderLibrary(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h2>Biblioteca</h2>
        <p class="page-subtitle">Organize e gerencie seus clipes de stream</p>
      </div>
      <div>
        <button id="btn-delete-all" class="btn btn-danger btn-sm" title="Apagar todos os clipes">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          Apagar Todos
        </button>
      </div>
    </div>
    <div id="filter-bar-container"></div>
    <div id="clips-display-container" class="clips-grid mt-4">
      <p class="text-muted">Carregando clipes...</p>
    </div>
  `;

  await loadCategoriesMap();
  
  renderFilterBar(document.getElementById('filter-bar-container'), {
    onSearch: (val) => { currentFilters.search = val; applyFilters(); },
    onFilterStatus: (val) => { currentFilters.status = val; applyFilters(); },
    onFilterCategory: (val) => { currentFilters.categoryId = val; applyFilters(); },
    onSort: (val) => { currentFilters.sortBy = val; applyFilters(); },
    onViewToggle: (mode) => { currentViewMode = mode; applyFilters(); },
    onImportTwitch: handleImportTwitch,
    onNewClip: handleNewClip,
    categories: Object.values(categoriesMap)
  });

  document.getElementById('btn-delete-all').addEventListener('click', async () => {
    if (confirm(`Tem certeza que deseja APAGAR todos os ${clips.length} clipes? Esta ação não pode ser desfeita.`)) {
      try {
        await api.deleteAllClips();
        showToast('Todos os clipes foram apagados', 'success');
        await loadClips();
      } catch(e) {
        const msg = typeof e === 'string' ? e : (e?.message || JSON.stringify(e));
        showToast('Erro ao apagar clipes: ' + msg, 'error');
      }
    }
  });

  await loadClips();
}

async function loadCategoriesMap() {
  try {
    const cats = await api.listCategories();
    categoriesMap = {};
    if (Array.isArray(cats)) {
      cats.forEach(c => categoriesMap[c.id] = c);
    }
  } catch(e) {
    console.error('Failed to load categories map', e);
  }
}

async function loadClips() {
  try {
    const res = await api.listClips();
    clips = Array.isArray(res) ? res : [];
    applyFilters();
  } catch(e) {
    console.error('Failed to load clips:', e);
    document.getElementById('clips-display-container').innerHTML = '<p class="text-error">Erro ao carregar clipes</p>';
  }
}

function applyFilters() {
  let filtered = [...clips];
  
  if (currentFilters.search) {
    const q = currentFilters.search.toLowerCase();
    filtered = filtered.filter(c => c.title.toLowerCase().includes(q) || (c.notes && c.notes.toLowerCase().includes(q)));
  }
  
  if (currentFilters.status) {
    filtered = filtered.filter(c => c.status === currentFilters.status);
  }

  if (currentFilters.categoryId) {
    filtered = filtered.filter(c => c.category_ids && c.category_ids.includes(parseInt(currentFilters.categoryId)));
  }

  filtered.sort((a, b) => {
    switch(currentFilters.sortBy) {
      case 'date_asc': return new Date(a.created_at) - new Date(b.created_at);
      case 'date_desc': return new Date(b.created_at) - new Date(a.created_at);
      case 'title_asc': return a.title.localeCompare(b.title);
      case 'views_desc': return (b.views || 0) - (a.views || 0);
      default: return 0;
    }
  });

  renderClipsDisplay(filtered);
}

function renderClipsDisplay(filteredClips) {
  const container = document.getElementById('clips-display-container');
  
  if (filteredClips.length === 0) {
    container.innerHTML = '<p class="text-muted">Nenhum clipe encontrado com os filtros atuais.</p>';
    container.className = 'mt-4';
    return;
  }

  if (currentViewMode === 'grid') {
    container.className = 'clips-grid grid-view';
    container.innerHTML = filteredClips.map(clip => renderClipCard(clip, categoriesMap)).join('');
  } else {
    container.className = 'clips-list table-container';
    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Miniatura</th>
            <th>Título</th>
            <th>Status</th>
            <th>Data</th>
            <th>Visualizações</th>
          </tr>
        </thead>
        <tbody>
          ${filteredClips.map(clip => renderClipRow(clip, categoriesMap)).join('')}
        </tbody>
      </table>
    `;
  }

  // Setup click handlers for navigating to detail
  container.querySelectorAll('.clip-item-link').forEach(el => {
    el.addEventListener('click', (e) => {
      // Don't navigate if delete button was clicked
      if (e.target.closest('.card-delete-btn')) return;
      const id = el.getAttribute('data-id');
      window.location.hash = '#/clip/' + id;
    });
  });

  // Quick-delete handlers
  container.querySelectorAll('.card-delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const clip = clips.find(c => String(c.id) === String(id));
      const name = clip ? `"${clip.title}"` : 'este clipe';
      if (confirm(`Excluir ${name}?`)) {
        try {
          await api.deleteClip(id);
          showToast('Clipe excluído', 'success');
          await loadClips();
        } catch(err) {
          const msg = typeof err === 'string' ? err : (err?.message || JSON.stringify(err));
          showToast('Erro ao excluir: ' + msg, 'error');
        }
      }
    });
  });
} // end renderClipsDisplay

function handleImportTwitch() {
  showModal({
    title: 'Importar da Twitch',
    body: `
      <p class="text-sm mb-3">Busca os clipes mais recentes do canal configurado.</p>
      <div class="form-group">
        <label>Quantidade limite</label>
        <input type="number" id="twitch-import-limit" class="form-input" value="20" min="1" max="100">
      </div>
    `,
    buttons: [
      { text: 'Cancelar', class: 'btn btn-secondary', close: true },
      { text: 'Importar', class: 'btn btn-primary', onClick: async (modal) => {
        try {
          const limit = document.getElementById('twitch-import-limit').value;
          showToast('Iniciando importação...', 'info');
          modal.close();
          const result = await api.importTwitchClips(parseInt(limit));
          const count = result ? (result.imported ?? result.count ?? 0) : 0;
          showToast(`Importação concluída: ${count} novos clipes`, 'success');
          await loadCategoriesMap();
          await loadClips();
        } catch(e) {
          console.error('Import Twitch error:', e);
          const errorMsg = typeof e === 'string' ? e : (e?.message || JSON.stringify(e));
          showToast('Erro na importação: ' + errorMsg, 'error');
        }
      }}
    ]
  });
}

function handleNewClip() {
  showModal({
    title: 'Adicionar Clipe Manual',
    body: `
      <div class="form-group mb-3">
        <label class="form-label">Título do Clipe</label>
        <input type="text" id="manual-clip-title" class="form-input" placeholder="Ex: Jogada incrível no Valorant">
      </div>
      <div class="form-group mb-3">
        <label class="form-label">URL do Clipe (Twitch ou YouTube)</label>
        <input type="text" id="manual-clip-url" class="form-input" placeholder="https://clips.twitch.tv/... ou https://youtube.com/shorts/...">
      </div>
    `,
    buttons: [
      { text: 'Cancelar', class: 'btn btn-secondary', close: true },
      { text: 'Criar Clipe', class: 'btn btn-primary', onClick: async (modal) => {
        const title = (document.getElementById('manual-clip-title').value || '').trim();
        const url = (document.getElementById('manual-clip-url').value || '').trim();
        if(!title) {
          showToast('Informe o título do clipe', 'error');
          return;
        }

        let twitch_url = null;
        let youtube_url = null;
        let thumbnail_url = null;

        if (url) {
          if (url.includes('youtube.com') || url.includes('youtu.be')) {
            youtube_url = url;
            const ytMatch = url.match(/(?:youtube\.com\/shorts\/|youtu\.be\/|youtube\.com\/watch\?v=)([A-Za-z0-9_-]+)/);
            if (ytMatch && ytMatch[1]) {
              thumbnail_url = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
            }
          } else {
            twitch_url = url;
          }
        }

        try {
          await api.createClip({
            title,
            twitch_url,
            youtube_url,
            thumbnail_url,
            status: 'Novo'
          });
          showToast('Clipe criado com sucesso', 'success');
          modal.close();
          await loadCategoriesMap();
          await loadClips();
        } catch(e) {
          console.error('Error creating clip:', e);
          showToast('Erro ao criar clipe: ' + (e.message || e), 'error');
        }
      }}
    ]
  });
}
