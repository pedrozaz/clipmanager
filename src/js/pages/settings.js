import { api } from "../bridge.js";
import { openModal } from "../components/modal.js";
import { showToast } from "../components/toast.js";

export async function renderSettingsPage(container) {
  let settingsMap = {};
  let categories = [];

  try {
    const rawSettings = await api.listSettings();
    rawSettings.forEach(s => { settingsMap[s.key] = s.value; });
    categories = await api.listCategories();
  } catch (err) {
    console.error("Failed to load settings or categories", err);
  }

  container.innerHTML = `
    <div class="settings-header">
      <h2>⚙️ Configurações do App</h2>
    </div>

    <div class="settings-grid">
      <div class="settings-card">
        <h3>🟣 Twitch API Settings</h3>
        <p class="settings-desc">Necessário para importar clipes automaticamente da sua live.</p>
        <div class="form-group">
          <label for="setting-twitch-client-id">Client ID</label>
          <input type="text" id="setting-twitch-client-id" value="${settingsMap['twitch_client_id'] || ''}" placeholder="Ex: kimne78kx3ncx6br..." />
        </div>
        <div class="form-group">
          <label for="setting-twitch-client-secret">Client Secret</label>
          <input type="password" id="setting-twitch-client-secret" value="${settingsMap['twitch_client_secret'] || ''}" placeholder="Ex: •••••••••••••••••" />
        </div>
        <div class="form-group">
          <label for="setting-twitch-username">Seu Nome de Usuário na Twitch</label>
          <input type="text" id="setting-twitch-username" value="${settingsMap['twitch_username'] || ''}" placeholder="Ex: streamername" />
        </div>
        <div class="button-group" style="display: flex; gap: 8px;">
          <button id="save-twitch-btn" class="btn btn-primary">Salvar Credenciais Twitch</button>
          <button id="test-twitch-btn" class="btn btn-secondary">⚡ Testar Conexão</button>
        </div>
      </div>

      <div class="settings-card">
        <h3>🔴 YouTube Data API Settings</h3>
        <p class="settings-desc">Usado para buscar contagem de views e likes dos seus vídeos/shorts.</p>
        <div class="form-group">
          <label for="setting-youtube-api-key">YouTube Data API Key v3</label>
          <input type="password" id="setting-youtube-api-key" value="${settingsMap['youtube_api_key'] || ''}" placeholder="Ex: AIzaSy..." />
        </div>
        <button id="save-youtube-btn" class="btn btn-primary">Salvar Chave YouTube</button>
      </div>

      <div class="settings-card">
        <h3>🎮 Valorant / Riot Games Settings</h3>
        <p class="settings-desc">Usado pela Henrik API para buscar dados da partida no momento do clipe.</p>
        <div class="form-group">
          <label for="setting-riot-id">Riot ID (Nome#Tag)</label>
          <input type="text" id="setting-riot-id" value="${settingsMap['riot_id'] || ''}" placeholder="Ex: Streamer#BR1" />
        </div>
        <div class="form-group">
          <label for="setting-valorant-region">Região</label>
          <select id="setting-valorant-region">
            <option value="br" ${settingsMap['valorant_region'] === 'br' ? 'selected' : ''}>Brasil (br)</option>
            <option value="na" ${settingsMap['valorant_region'] === 'na' ? 'selected' : ''}>América do Norte (na)</option>
            <option value="latam" ${settingsMap['valorant_region'] === 'latam' ? 'selected' : ''}>LATAM (latam)</option>
            <option value="eu" ${settingsMap['valorant_region'] === 'eu' ? 'selected' : ''}>Europa (eu)</option>
            <option value="ap" ${settingsMap['valorant_region'] === 'ap' ? 'selected' : ''}>Ásia-Pacífico (ap)</option>
            <option value="kr" ${settingsMap['valorant_region'] === 'kr' ? 'selected' : ''}>Coréia (kr)</option>
          </select>
        </div>
        <button id="save-valorant-btn" class="btn btn-primary">Salvar Dados Valorant</button>
      </div>

      <div class="settings-card settings-card-wide">
        <div class="card-header-flex">
          <h3>🏷️ Gerenciar Categorias</h3>
          <button id="create-category-btn" class="btn btn-primary">➕ Nova Categoria</button>
        </div>
        <p class="settings-desc">Crie categorias para organizar seus clipes (ex: Engraçado, Highlight, Play Insana).</p>
        
        <div class="categories-list-grid">
          ${categories.map(c => `
            <div class="category-item-card">
              <span class="color-dot" style="background-color: ${c.color || '#8b5cf6'}"></span>
              <span class="category-name">${c.name}</span>
              <button class="btn-icon delete-cat-btn" data-id="${c.id}" data-name="${c.name}">🗑️</button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  setupSettingsEvents(container);
}

function setupSettingsEvents(container) {
  document.getElementById("save-twitch-btn")?.addEventListener("click", async () => {
    const id = document.getElementById("setting-twitch-client-id").value.trim();
    const secret = document.getElementById("setting-twitch-client-secret").value.trim();
    const username = document.getElementById("setting-twitch-username").value.trim();

    try {
      await api.setSetting("twitch_client_id", id);
      await api.setSetting("twitch_client_secret", secret);
      await api.setSetting("twitch_username", username);
      showToast("Configurações da Twitch salvas!", "success");
    } catch (err) {
      showToast(`Erro ao salvar: ${err}`, "error");
    }
  });

  document.getElementById("test-twitch-btn")?.addEventListener("click", async () => {
    showToast("Testando conexão com a Twitch...", "info");
    try {
      const res = await api.testTwitchConnection();
      showToast(res, "success");
    } catch (err) {
      showToast(`Falha na conexão: ${err}`, "error");
    }
  });

  document.getElementById("save-youtube-btn")?.addEventListener("click", async () => {
    const apiKey = document.getElementById("setting-youtube-api-key").value.trim();
    try {
      await api.setSetting("youtube_api_key", apiKey);
      showToast("Chave da API do YouTube salva!", "success");
    } catch (err) {
      showToast(`Erro ao salvar: ${err}`, "error");
    }
  });

  document.getElementById("save-valorant-btn")?.addEventListener("click", async () => {
    const riotId = document.getElementById("setting-riot-id").value.trim();
    const region = document.getElementById("setting-valorant-region").value;

    try {
      await api.setSetting("riot_id", riotId);
      await api.setSetting("valorant_region", region);
      showToast("Configurações do Valorant salvas!", "success");
    } catch (err) {
      showToast(`Erro ao salvar: ${err}`, "error");
    }
  });

  document.getElementById("create-category-btn")?.addEventListener("click", () => {
    openModal({
      title: "🏷️ Nova Categoria",
      confirmText: "Criar Categoria",
      contentHtml: `
        <div class="form-group">
          <label for="cat-name-input">Nome da Categoria *</label>
          <input type="text" id="cat-name-input" placeholder="Ex: Engraçado, Highlight, Fail" required />
        </div>
        <div class="form-group">
          <label for="cat-color-input">Cor de Exibição</label>
          <input type="color" id="cat-color-input" value="#8b5cf6" style="height: 40px; padding: 2px;" />
        </div>
      `,
      onConfirm: async () => {
        const name = document.getElementById("cat-name-input").value.trim();
        const color = document.getElementById("cat-color-input").value;

        if (!name) {
          showToast("Nome da categoria é obrigatório!", "error");
          return false;
        }

        try {
          await api.createCategory(name, color);
          showToast("Categoria criada com sucesso!", "success");
          renderSettingsPage(container);
          return true;
        } catch (err) {
          showToast(`Erro ao criar categoria: ${err}`, "error");
          return false;
        }
      }
    });
  });

  document.querySelectorAll(".delete-cat-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const name = btn.getAttribute("data-name");

      openModal({
        title: "🗑️ Excluir Categoria",
        confirmText: "Excluir",
        contentHtml: `<p>Deseja excluir a categoria <strong>"${name}"</strong>?</p>`,
        onConfirm: async () => {
          try {
            await api.deleteCategory(id);
            showToast("Categoria excluída!", "info");
            renderSettingsPage(container);
            return true;
          } catch (err) {
            showToast(`Erro ao excluir: ${err}`, "error");
            return false;
          }
        }
      });
    });
  });
}
