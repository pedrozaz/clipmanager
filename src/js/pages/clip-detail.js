import { api } from "../bridge.js";
import { renderStatusBadge } from "../components/status-badge.js";
import { renderCategoryTag } from "../components/category-tag.js";
import { openModal } from "../components/modal.js";
import { showToast } from "../components/toast.js";

let autoSaveTimer;

export async function renderClipDetailPage(container, clipId) {
  try {
    const clip = await api.getClip(clipId);
    const assignedCategories = await api.getClipCategories(clipId);
    const allCategories = await api.listCategories();

    container.innerHTML = `
      <div class="clip-detail-header">
        <a href="#/library" class="btn btn-secondary btn-back">⬅️ Voltar à Biblioteca</a>
        <div class="header-actions">
          <button id="delete-clip-btn" class="btn btn-danger">🗑️ Excluir Clipe</button>
        </div>
      </div>

      <div class="clip-detail-grid">
        <div class="detail-main-column">
          <div class="detail-card">
            <div class="detail-title-row">
              <input type="text" id="clip-title-edit" class="title-input" value="${clip.title}" placeholder="Título do Clipe" />
            </div>
            
            <div class="detail-status-row">
              <label for="status-select">Status do Clipe:</label>
              <select id="status-select" class="status-select-dropdown">
                <option value="novo" ${clip.status === "novo" ? "selected" : ""}>🔵 Novo</option>
                <option value="editando" ${clip.status === "editando" ? "selected" : ""}>🟡 Editando</option>
                <option value="editado" ${clip.status === "editado" ? "selected" : ""}>🟣 Editado</option>
                <option value="postado" ${clip.status === "postado" ? "selected" : ""}>🟢 Postado</option>
                <option value="descartado" ${clip.status === "descartado" ? "selected" : ""}>⚪ Descartado</option>
              </select>
            </div>

            <div class="detail-section">
              <h3>🔗 Links das Redes</h3>
              <div class="links-grid">
                <div class="link-item">
                  <label>🟣 Twitch URL</label>
                  <div class="link-input-group">
                    <input type="text" id="twitch-url-input" value="${clip.twitch_url || ""}" placeholder="https://clips.twitch.tv/..." />
                    <button class="btn-icon copy-btn" data-target="twitch-url-input">📋 Copiar</button>
                  </div>
                </div>
                <div class="link-item">
                  <label>🔴 YouTube URL</label>
                  <div class="link-input-group">
                    <input type="text" id="youtube-url-input" value="${clip.youtube_url || ""}" placeholder="https://youtube.com/shorts/..." />
                    <button class="btn-icon copy-btn" data-target="youtube-url-input">📋 Copiar</button>
                  </div>
                </div>
                <div class="link-item">
                  <label>📸 Instagram URL</label>
                  <div class="link-input-group">
                    <input type="text" id="insta-url-input" value="${clip.instagram_url || ""}" placeholder="https://instagram.com/reel/..." />
                    <button class="btn-icon copy-btn" data-target="insta-url-input">📋 Copiar</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h3>📝 Anotações <span id="auto-save-indicator" class="save-indicator"></span></h3>
              <textarea id="clip-notes-edit" rows="5" placeholder="Adicione notas, ideias de edição, hashtags...">${clip.notes || ""}</textarea>
            </div>
          </div>

          <div class="detail-card">
            <h3>📊 Analytics (YouTube)</h3>
            <div class="placeholder-section">
              <p>Os dados de views, likes e retenção serão carregados no <strong>Marco 7</strong>.</p>
            </div>
          </div>
        </div>

        <div class="detail-sidebar-column">
          <div class="detail-card">
            <h3>🏷️ Categorias</h3>
            <div id="assigned-categories-container" class="assigned-categories-list">
              ${renderAssignedCategories(assignedCategories)}
            </div>
            
            <div class="add-category-row">
              <select id="add-category-select">
                <option value="">+ Adicionar categoria...</option>
                ${allCategories
                  .filter(c => !assignedCategories.some(ac => ac.id === c.id))
                  .map(c => `<option value="${c.id}">${c.name}</option>`)
                  .join("")}
              </select>
            </div>
          </div>

          <div class="detail-card">
            <h3>🎮 Partida de Valorant</h3>
            <div class="placeholder-section">
              <p>Vínculo com partida (KDA, mapa, agente) será integrado no <strong>Marco 9</strong> (Henrik API).</p>
            </div>
          </div>

          <div class="detail-card">
            <h3>ℹ️ Informações</h3>
            <ul class="info-list">
              <li><strong>Data do Clipe:</strong> ${clip.clip_date || "Não informada"}</li>
              <li><strong>Criado em:</strong> ${clip.created_at ? clip.created_at.split(" ")[0] : "Hoje"}</li>
              <li><strong>ID Interno:</strong> ${clip.id}</li>
            </ul>
          </div>
        </div>
      </div>
    `;

    setupDetailEvents(clip, allCategories);
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>❌ Clipe não encontrado</h3>
        <p>${err}</p>
        <a href="#/library" class="btn btn-secondary">Voltar à Biblioteca</a>
      </div>
    `;
  }
}

function renderAssignedCategories(categories) {
  if (categories.length === 0) {
    return `<p class="muted-text">Nenhuma categoria atribuída.</p>`;
  }
  return categories
    .map(c => `
      <div class="category-chip" style="--chip-color: ${c.color || "#8b5cf6"}">
        <span>${c.name}</span>
        <button class="remove-cat-btn" data-cat-id="${c.id}">&times;</button>
      </div>
    `)
    .join("");
}

function setupDetailEvents(clip, allCategories) {
  const statusSelect = document.getElementById("status-select");
  const titleInput = document.getElementById("clip-title-edit");
  const notesTextarea = document.getElementById("clip-notes-edit");
  const twitchInput = document.getElementById("twitch-url-input");
  const youtubeInput = document.getElementById("youtube-url-input");
  const instaInput = document.getElementById("insta-url-input");
  const addCategorySelect = document.getElementById("add-category-select");
  const deleteBtn = document.getElementById("delete-clip-btn");

  statusSelect?.addEventListener("change", async (e) => {
    try {
      await api.updateClipStatus(clip.id, e.target.value);
      showToast("Status atualizado!", "success");
    } catch (err) {
      showToast(`Erro ao atualizar status: ${err}`, "error");
    }
  });

  const triggerAutoSave = () => {
    const indicator = document.getElementById("auto-save-indicator");
    if (indicator) indicator.innerText = "Salvando...";

    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(async () => {
      try {
        await api.updateClip({
          id: Number(clip.id),
          title: titleInput.value.trim() || clip.title,
          twitchUrl: twitchInput.value.trim() || null,
          youtubeUrl: youtubeInput.value.trim() || null,
          instagramUrl: instaInput.value.trim() || null,
          thumbnailUrl: clip.thumbnail_url,
          duration: clip.duration,
          clipDate: clip.clip_date,
          status: statusSelect.value,
          notes: notesTextarea.value.trim() || null,
        });
        if (indicator) indicator.innerText = "✓ Salvo";
        setTimeout(() => { if (indicator) indicator.innerText = ""; }, 2000);
      } catch (err) {
        if (indicator) indicator.innerText = "❌ Erro ao salvar";
      }
    }, 600);
  };

  titleInput?.addEventListener("input", triggerAutoSave);
  notesTextarea?.addEventListener("input", triggerAutoSave);
  twitchInput?.addEventListener("input", triggerAutoSave);
  youtubeInput?.addEventListener("input", triggerAutoSave);
  instaInput?.addEventListener("input", triggerAutoSave);

  document.querySelectorAll(".copy-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const input = document.getElementById(targetId);
      if (input && input.value) {
        navigator.clipboard.writeText(input.value);
        showToast("Link copiado para a área de transferência!", "info");
      }
    });
  });

  addCategorySelect?.addEventListener("change", async (e) => {
    const categoryId = e.target.value;
    if (!categoryId) return;

    try {
      await api.addCategoryToClip(clip.id, categoryId);
      showToast("Categoria adicionada!", "success");
      renderClipDetailPage(document.getElementById("app-container"), clip.id);
    } catch (err) {
      showToast(`Erro ao adicionar categoria: ${err}`, "error");
    }
  });

  document.querySelectorAll(".remove-cat-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const catId = btn.getAttribute("data-cat-id");
      try {
        await api.removeCategoryFromClip(clip.id, catId);
        showToast("Categoria removida!", "info");
        renderClipDetailPage(document.getElementById("app-container"), clip.id);
      } catch (err) {
        showToast(`Erro ao remover categoria: ${err}`, "error");
      }
    });
  });

  deleteBtn?.addEventListener("click", () => {
    openModal({
      title: "🗑️ Excluir Clipe",
      confirmText: "Sim, Excluir",
      contentHtml: `<p>Tem certeza que deseja excluir o clipe <strong>"${clip.title}"</strong>? Esta ação não pode ser desfeita.</p>`,
      onConfirm: async () => {
        try {
          await api.deleteClip(clip.id);
          showToast("Clipe excluído com sucesso!", "success");
          window.location.hash = "#/library";
          return true;
        } catch (err) {
          showToast(`Erro ao excluir clipe: ${err}`, "error");
          return false;
        }
      }
    });
  });
}
