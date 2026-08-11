import { api } from '../bridge.js';
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
      const clientId = document.getElementById('twitch-client-id').value;
      const clientSecret = document.getElementById('twitch-client-secret').value;
      const broadcaster = document.getElementById('twitch-broadcaster').value;

      await api.setSetting('twitch_client_id', clientId);
      await api.setSetting('twitch_client_secret', clientSecret);
      await api.setSetting('twitch_username', broadcaster);

      showToast('Configurações da Twitch salvas', 'success');
    } catch(e) {
      console.error('Save Twitch error:', e);
      showToast('Erro ao salvar Twitch: ' + (e.message || e), 'error');
    }
  });

  document.getElementById('save-youtube-btn').addEventListener('click', async () => {
    try {
      const apiKey = document.getElementById('youtube-api-key').value;
      const channelId = document.getElementById('youtube-channel-id').value;

      await api.setSetting('youtube_api_key', apiKey);
      await api.setSetting('youtube_channel_id', channelId);

      showToast('Configurações do YouTube salvas', 'success');
    } catch(e) {
      console.error('Save YouTube error:', e);
      showToast('Erro ao salvar YouTube: ' + (e.message || e), 'error');
    }
  });

  document.getElementById('save-valorant-btn').addEventListener('click', async () => {
    try {
      const apiKey = document.getElementById('valorant-api-key').value;
      const name = document.getElementById('valorant-name').value;
      const tag = document.getElementById('valorant-tag').value;
      const riotId = tag ? `${name}#${tag}` : name;

      await api.setSetting('valorant_api_key', apiKey);
      await api.setSetting('riot_id', riotId);

      showToast('Configurações do Valorant salvas', 'success');
    } catch(e) {
      console.error('Save Valorant error:', e);
      showToast('Erro ao salvar Valorant: ' + (e.message || e), 'error');
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
              showToast('Erro ao criar categoria: ' + (e.message || e), 'error');
            }
          }
        }}
      ]
    });
  });

  document.getElementById('export-db-btn').addEventListener('click', async () => {
    try {
      const jsonStr = await api.exportDataJson();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clipmanager-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Banco de dados exportado', 'success');
    } catch(e) {
      console.error('Export error:', e);
      showToast('Erro ao exportar: ' + (e.message || e), 'error');
    }
  });

  document.getElementById('import-db-btn').addEventListener('click', async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = async (evt) => {
            try {
              await api.importDataJson(evt.target.result);
              showToast('Banco de dados importado com sucesso', 'success');
              await loadSettingsData();
            } catch (err) {
              showToast('Erro ao importar: ' + (err.message || err), 'error');
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
    } catch(e) {
      console.error('Import error:', e);
      showToast('Erro ao importar: ' + (e.message || e), 'error');
    }
  });
}

async function loadSettingsData() {
  try {
    const allSettings = await api.listSettings();
    const settingsMap = {};
    if (Array.isArray(allSettings)) {
      allSettings.forEach(s => settingsMap[s.key] = s.value);
    }

    // Twitch
    document.getElementById('twitch-client-id').value = settingsMap['twitch_client_id'] || '';
    document.getElementById('twitch-client-secret').value = settingsMap['twitch_client_secret'] || '';
    document.getElementById('twitch-broadcaster').value = settingsMap['twitch_username'] || '';

    // YouTube
    document.getElementById('youtube-api-key').value = settingsMap['youtube_api_key'] || '';
    document.getElementById('youtube-channel-id').value = settingsMap['youtube_channel_id'] || '';

    // Valorant
    document.getElementById('valorant-api-key').value = settingsMap['valorant_api_key'] || '';
    const riotId = settingsMap['riot_id'] || '';
    if (riotId.includes('#')) {
      const parts = riotId.split('#');
      document.getElementById('valorant-name').value = parts[0] || '';
      document.getElementById('valorant-tag').value = parts[1] || '';
    } else {
      document.getElementById('valorant-name').value = riotId;
      document.getElementById('valorant-tag').value = '';
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
