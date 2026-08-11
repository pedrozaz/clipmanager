import { api } from "../bridge.js";
import { renderFilterBar } from "../components/filter-bar.js";
import { renderClipCard, renderClipRow } from "../components/clip-card.js";
import { openModal } from "../components/modal.js";
import { showToast } from "../components/toast.js";

let currentViewMode = "grid";
let clipsList = [];
let categoriesList = [];

export async function renderLibraryPage(container) {
  try {
    categoriesList = await api.listCategories();
  } catch (err) {
    console.error("Failed to load categories", err);
    categoriesList = [];
  }

  container.innerHTML = `
    <div class="library-header">
      <h2>Biblioteca de Clipes</h2>
    </div>
    ${renderFilterBar(categoriesList)}
    <div id="clips-display-container">
      <div class="empty-state">
        <p>Carregando clipes...</p>
      </div>
    </div>
  `;

  setupFilterEvents(container);
  await loadAndRenderClips();
}

function setupFilterEvents(container) {
  const searchInput = document.getElementById("search-input");
  const statusFilter = document.getElementById("status-filter");
  const categoryFilter = document.getElementById("category-filter");
  const sortByFilter = document.getElementById("sort-by-filter");
  const gridBtn = document.getElementById("view-grid-btn");
  const listBtn = document.getElementById("view-list-btn");
  const importTwitchBtn = document.getElementById("import-twitch-btn");
  const newClipBtn = document.getElementById("new-clip-btn");

  let debounceTimer;
  searchInput?.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadAndRenderClips, 300);
  });

  statusFilter?.addEventListener("change", loadAndRenderClips);
  categoryFilter?.addEventListener("change", loadAndRenderClips);
  sortByFilter?.addEventListener("change", loadAndRenderClips);

  gridBtn?.addEventListener("click", () => {
    currentViewMode = "grid";
    gridBtn.classList.add("active");
    listBtn?.classList.remove("active");
    renderClipsDisplay();
  });

  listBtn?.addEventListener("click", () => {
    currentViewMode = "list";
    listBtn.classList.add("active");
    gridBtn?.classList.remove("active");
    renderClipsDisplay();
  });

  importTwitchBtn?.addEventListener("click", handleImportTwitchClips);
  newClipBtn?.addEventListener("click", handleCreateNewClip);
}

async function loadAndRenderClips() {
  const searchInput = document.getElementById("search-input");
  const statusFilter = document.getElementById("status-filter");
  const sortByFilter = document.getElementById("sort-by-filter");

  const params = {
    searchQuery: searchInput?.value.trim() || null,
    filterStatus: statusFilter?.value || null,
    sortBy: sortByFilter?.value || "created_at",
    sortOrder: "DESC",
  };

  try {
    clipsList = await api.listClips(params);
    renderClipsDisplay();
  } catch (err) {
    showToast(`Erro ao carregar clipes: ${err}`, "error");
  }
}

function renderClipsDisplay() {
  const displayContainer = document.getElementById("clips-display-container");
  if (!displayContainer) return;

  if (clipsList.length === 0) {
    displayContainer.innerHTML = `
      <div class="empty-state">
        <h3>Nenhum clipe encontrado</h3>
        <p>Importe clipes da Twitch ou adicione manualmente.</p>
        <button id="empty-new-btn" class="btn btn-primary" style="margin-top: 12px;">Criar Primeiro Clipe</button>
      </div>
    `;
    document.getElementById("empty-new-btn")?.addEventListener("click", handleCreateNewClip);
    return;
  }

  if (currentViewMode === "grid") {
    displayContainer.innerHTML = `
      <div class="clips-grid">
        ${clipsList.map(clip => renderClipCard(clip, [])).join("")}
      </div>
    `;
  } else {
    displayContainer.innerHTML = `
      <div class="clips-table-wrapper">
        <table class="clips-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Status</th>
              <th>Categorias</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${clipsList.map(clip => renderClipRow(clip, [])).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  document.querySelectorAll(".clip-card, .btn-detail").forEach(elem => {
    elem.addEventListener("click", (e) => {
      const clipId = elem.getAttribute("data-clip-id") || elem.getAttribute("data-id");
      if (clipId) {
        window.location.hash = `#/clip/${clipId}`;
      }
    });
  });
}

function handleImportTwitchClips() {
  openModal({
    title: "Importar Clipes da Twitch",
    confirmText: "Iniciar Importação",
    contentHtml: `
      <p style="font-size: 0.9rem; color: var(--color-text-secondary); margin-bottom: 12px;">
        O app irá buscar os clipes da sua conta da Twitch e importar os que ainda não foram salvos.
      </p>
      <div class="form-group">
        <label for="import-days-select">Período de busca</label>
        <select id="import-days-select">
          <option value="7">Últimos 7 dias</option>
          <option value="30" selected>Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
          <option value="365">Último ano</option>
        </select>
      </div>
    `,
    onConfirm: async () => {
      const days = document.getElementById("import-days-select")?.value || "30";
      showToast("Buscando clipes na API da Twitch...", "info");
      try {
        const res = await api.importTwitchClips(days);
        showToast(`Importação concluída! ${res.imported} novos clipes, ${res.skipped} já existiam.`, "success");
        await loadAndRenderClips();
        return true;
      } catch (err) {
        showToast(`Erro na importação: ${err}`, "error");
        return false;
      }
    }
  });
}

function handleCreateNewClip() {
  openModal({
    title: "Novo Clipe",
    confirmText: "Criar Clipe",
    contentHtml: `
      <div class="form-group">
        <label for="clip-title-input">Título do Clipe *</label>
        <input type="text" id="clip-title-input" placeholder="Ex: Play insana no Ascent" required />
      </div>
      <div class="form-group">
        <label for="clip-twitch-url-input">Link da Twitch (opcional)</label>
        <input type="text" id="clip-twitch-url-input" placeholder="https://clips.twitch.tv/..." />
      </div>
      <div class="form-group">
        <label for="clip-date-input">Data do Clipe</label>
        <input type="date" id="clip-date-input" value="${new Date().toISOString().split('T')[0]}" />
      </div>
      <div class="form-group">
        <label for="clip-status-select">Status Inicial</label>
        <select id="clip-status-select">
          <option value="novo">Novo</option>
          <option value="editando">Editando</option>
          <option value="editado">Editado</option>
          <option value="postado">Postado</option>
        </select>
      </div>
      <div class="form-group">
        <label for="clip-notes-input">Anotações</label>
        <textarea id="clip-notes-input" rows="3" placeholder="Detalhes do clipe..."></textarea>
      </div>
    `,
    onConfirm: async () => {
      const title = document.getElementById("clip-title-input")?.value.trim();
      const twitchUrl = document.getElementById("clip-twitch-url-input")?.value.trim() || null;
      const clipDate = document.getElementById("clip-date-input")?.value || null;
      const status = document.getElementById("clip-status-select")?.value || "novo";
      const notes = document.getElementById("clip-notes-input")?.value.trim() || null;

      if (!title) {
        showToast("O título do clipe é obrigatório!", "error");
        return false;
      }

      try {
        await api.createClip({ title, twitchUrl, clipDate, status, notes });
        showToast("Clipe criado com sucesso!", "success");
        await loadAndRenderClips();
        return true;
      } catch (err) {
        showToast(`Erro ao criar clipe: ${err}`, "error");
        return false;
      }
    }
  });
}
