import * as api from '../bridge.js';
import { showModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

export async function renderSettings(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h2>Configurações</h2>
        <p class="page-subtitle">Gerencie conexões, credenciais e categorias do app</p>
      </div>
    </div>

    <div class="settings-grid">
      <div class="section-card">
        <h3>Twitch</h3>
        <p class="section-desc">Conecte para importar clipes automaticamente</p>
        <div class="form-group">
          <label>Client ID</label>
          <input type="password" id="twitch-client-id" class="form-input">
        </div>
        <div class="form-group">
          <label>Client Secret</label>
          <input type="password" id="twitch-client-secret" class="form-input">
        </div>
        <div class="form-group">
          <label>Nome do Canal (Broadcaster)</label>
          <input type="text" id="twitch-broadcaster" class="form-input">
        </div>
        <div class="button-row mt-4">
          <button id="save-twitch-btn" class="btn btn-primary">Salvar Twitch</button>
        </div>
      </div>

      <div class="section-card">
        <h3>YouTube</h3>
        <p class="section-desc">Conecte para atualizar métricas de Shorts</p>
        <div class="form-group">
          <label>API Key</label>
          <input type="password" id="youtube-api-key" class="form-input">
        </div>
        <div class="form-group">
          <label>ID do Canal</label>
          <input type="text" id="youtube-channel-id" class="form-input">
        </div>
        <div class="button-row mt-4">
          <button id="save-youtube-btn" class="btn btn-primary">Salvar YouTube</button>
        </div>
      </div>

      <div class="section-card">
        <h3>Valorant</h3>
        <p class="section-desc">Integração para vincular partidas aos clipes</p>
        <div class="form-group">
          <label>Henrik API Key <a href="https://api.henrikdev.xyz/" target="_blank" class="text-sm">(Obter chave)</a></label>
          <input type="password" id="valorant-api-key" class="form-input">
        </div>
        <div class="form-group">
          <label>Riot ID (Nome)</label>
          <input type="text" id="valorant-name" class="form-input" placeholder="Ex: Faker">
        </div>
        <div class="form-group">
          <label>Riot Tag</label>
          <input type="text" id="valorant-tag" class="form-input" placeholder="Ex: BR1">
        </div>
        <div class="button-row mt-4">
          <button id="save-valorant-btn" class="btn btn-primary">Salvar Valorant</button>
        </div>
      </div>
    </div>

    <div class="section-card full-width mt-4">
      <h3>Categorias</h3>
      <p class="section-desc">Gerencie as tags usadas para classificar seus clipes</p>
      <div class="button-row mb-3">
        <button id="add-category-btn" class="btn btn-secondary">Nova Categoria</button>
      </div>
      <div id="categories-grid" class="category-grid">
        <p class="text-muted">Carregando categorias...</p>
      </div>
    </div>

    <div class="section-card full-width mt-4">
      <h3>Backup & Dados</h3>
      <p class="section-desc">Gerencie o banco de dados local</p>
      <div class="button-row">
        <button id="export-db-btn" class="btn btn-secondary">Exportar Banco</button>
        <button id="import-db-btn" class="btn btn-secondary">Importar Banco</button>
      </div>
    </div>
  `;

  await loadSettingsData();

  // Event Listeners
  document.getElementById('save-twitch-btn').addEventListener('click', async () => {
    try {
      await api.saveSettings('twitch', {
        clientId: document.getElementById('twitch-client-id').value,
        clientSecret: document.getElementById('twitch-client-secret').value,
        broadcaster: document.getElementById('twitch-broadcaster').value
      });
      showToast('Configurações da Twitch salvas', 'success');
    } catch(e) {
      showToast('Erro ao salvar Twitch', 'error');
    }
  });

  document.getElementById('save-youtube-btn').addEventListener('click', async () => {
    try {
      await api.saveSettings('youtube', {
        apiKey: document.getElementById('youtube-api-key').value,
        channelId: document.getElementById('youtube-channel-id').value
      });
      showToast('Configurações do YouTube salvas', 'success');
    } catch(e) {
      showToast('Erro ao salvar YouTube', 'error');
    }
  });

  document.getElementById('save-valorant-btn').addEventListener('click', async () => {
    try {
      await api.saveSettings('valorant', {
        apiKey: document.getElementById('valorant-api-key').value,
        name: document.getElementById('valorant-name').value,
        tag: document.getElementById('valorant-tag').value
      });
      showToast('Configurações do Valorant salvas', 'success');
    } catch(e) {
      showToast('Erro ao salvar Valorant', 'error');
    }
  });

  document.getElementById('add-category-btn').addEventListener('click', () => {
    showModal({
      title: 'Nova Categoria',
      body: `
        <div class="form-group">
          <label>Nome</label>
          <input type="text" id="new-cat-name" class="form-input">
        </div>
        <div class="form-group">
          <label>Cor (Hex)</label>
          <input type="text" id="new-cat-color" class="form-input" value="#ffffff">
        </div>
      `,
      buttons: [
        { text: 'Cancelar', class: 'btn btn-secondary', close: true },
        { text: 'Salvar', class: 'btn btn-primary', onClick: async (modal) => {
          const name = document.getElementById('new-cat-name').value;
          const color = document.getElementById('new-cat-color').value;
          if(name && color) {
            try {
              await api.createCategory(name, color);
              showToast('Categoria criada', 'success');
              modal.close();
              loadCategories();
            } catch(e) {
              showToast('Erro ao criar categoria', 'error');
            }
          }
        }}
      ]
    });
  });

  document.getElementById('export-db-btn').addEventListener('click', async () => {
    try {
      await api.exportDatabase();
      showToast('Banco de dados exportado', 'success');
    } catch(e) {
      showToast('Erro ao exportar', 'error');
    }
  });

  document.getElementById('import-db-btn').addEventListener('click', async () => {
    try {
      await api.importDatabase();
      showToast('Banco de dados importado', 'success');
      loadSettingsData();
    } catch(e) {
      showToast('Erro ao importar', 'error');
    }
  });
}

async function loadSettingsData() {
  try {
    const twitch = await api.getSettings('twitch');
    if (twitch) {
      document.getElementById('twitch-client-id').value = twitch.clientId || '';
      document.getElementById('twitch-client-secret').value = twitch.clientSecret || '';
      document.getElementById('twitch-broadcaster').value = twitch.broadcaster || '';
    }

    const youtube = await api.getSettings('youtube');
    if (youtube) {
      document.getElementById('youtube-api-key').value = youtube.apiKey || '';
      document.getElementById('youtube-channel-id').value = youtube.channelId || '';
    }

    const valorant = await api.getSettings('valorant');
    if (valorant) {
      document.getElementById('valorant-api-key').value = valorant.apiKey || '';
      document.getElementById('valorant-name').value = valorant.name || '';
      document.getElementById('valorant-tag').value = valorant.tag || '';
    }

    await loadCategories();
  } catch(e) {
    console.error('Failed to load settings', e);
  }
}

async function loadCategories() {
  const container = document.getElementById('categories-grid');
  try {
    const categories = await api.getCategories();
    if (categories.length === 0) {
      container.innerHTML = '<p class="text-muted">Nenhuma categoria cadastrada</p>';
      return;
    }
    
    container.innerHTML = categories.map(c => `
      <div class="category-item" style="border-left: 4px solid ${c.color}; padding: 8px; margin-bottom: 8px; background: #1a1a20; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
        <span>${c.name}</span>
        <button class="btn btn-sm btn-danger delete-cat-btn" data-id="${c.id}">X</button>
      </div>
    `).join('');

    container.querySelectorAll('.delete-cat-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        if(confirm('Tem certeza que deseja excluir esta categoria?')) {
          try {
            await api.deleteCategory(id);
            showToast('Categoria removida', 'success');
            loadCategories();
          } catch(err) {
            showToast('Erro ao remover', 'error');
          }
        }
      });
    });
  } catch(e) {
    container.innerHTML = '<p class="text-error">Erro ao carregar categorias</p>';
  }
}
