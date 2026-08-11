import { renderStatusBadge } from "./status-badge.js";
import { renderCategoryTag } from "./category-tag.js";

export function renderClipCard(clip, categories = []) {
  const dateStr = clip.clip_date || (clip.created_at ? clip.created_at.split(" ")[0] : "Sem data");
  
  const categoryTagsHtml = categories.length > 0
    ? categories.map(renderCategoryTag).join("")
    : `<span class="category-tag category-none">Sem categoria</span>`;

  const thumbnailHtml = clip.thumbnail_url
    ? `<img src="${clip.thumbnail_url}" alt="${clip.title}" loading="lazy" />`
    : `<div class="clip-thumbnail-placeholder">ClipManager</div>`;

  return `
    <div class="clip-card" data-clip-id="${clip.id}">
      <div class="clip-thumbnail-wrapper">
        ${thumbnailHtml}
        <div class="clip-card-status">
          ${renderStatusBadge(clip.status)}
        </div>
      </div>
      <div class="clip-card-content">
        <h4 class="clip-title" title="${clip.title}">${clip.title}</h4>
        <div class="clip-meta">
          <span class="clip-date">${dateStr}</span>
        </div>
        <div class="clip-categories">
          ${categoryTagsHtml}
        </div>
      </div>
    </div>
  `;
}

export function renderClipRow(clip, categories = []) {
  const dateStr = clip.clip_date || (clip.created_at ? clip.created_at.split(" ")[0] : "Sem data");
  const categoryTagsHtml = categories.length > 0
    ? categories.map(renderCategoryTag).join("")
    : `<span class="category-tag category-none">Sem categoria</span>`;

  return `
    <tr class="clip-row" data-clip-id="${clip.id}">
      <td class="col-title"><strong>${clip.title}</strong></td>
      <td class="col-status">${renderStatusBadge(clip.status)}</td>
      <td class="col-categories">${categoryTagsHtml}</td>
      <td class="col-date">${dateStr}</td>
      <td class="col-actions">
        <button class="btn-icon btn-detail" data-id="${clip.id}">Detalhes</button>
      </td>
    </tr>
  `;
}
