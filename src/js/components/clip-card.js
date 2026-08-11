import { renderStatusBadge } from './status-badge.js';
import { renderCategoryTag } from './category-tag.js';

export function renderClipCard(clip, categoriesMap) {
  const clipCategories = (clip.category_ids || []).map(id => categoriesMap[id]).filter(Boolean);
  const dateStr = new Date(clip.created_at).toLocaleDateString('pt-BR');
  
  return `
    <div class="clip-card clip-item-link" data-id="${clip.id}">
      <div class="card-thumbnail">
        ${clip.thumbnail_url 
          ? `<img src="${clip.thumbnail_url}" alt="${clip.title}" loading="lazy">` 
          : `<div class="thumb-placeholder"><span>CM</span></div>`
        }
        <div class="card-thumbnail-gradient"></div>
        <div class="card-status">
          ${renderStatusBadge(clip.status)}
        </div>
      </div>
      <div class="card-content">
        <h4 class="card-title" title="${clip.title}">${clip.title}</h4>
        <div class="card-meta">
          <span>${dateStr}</span>
          <span>${clip.views || 0} views</span>
        </div>
        ${clipCategories.length > 0 ? `
          <div class="card-tags">
            ${clipCategories.slice(0, 3).map(c => renderCategoryTag(c)).join('')}
            ${clipCategories.length > 3 ? '<span class="text-xs text-muted">+more</span>' : ''}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

export function renderClipRow(clip, categoriesMap) {
  const clipCategories = (clip.category_ids || []).map(id => categoriesMap[id]).filter(Boolean);
  const dateStr = new Date(clip.created_at).toLocaleDateString('pt-BR');
  
  return `
    <tr class="clip-row clip-item-link cursor-pointer" data-id="${clip.id}">
      <td style="width: 100px;">
        <div class="row-thumb">
          ${clip.thumbnail_url 
            ? `<img src="${clip.thumbnail_url}" alt="Thumb">` 
            : `<span>CM</span>`
          }
        </div>
      </td>
      <td>
        <div class="font-medium card-title-text">${clip.title}</div>
        <div class="row-tags">
          ${clipCategories.map(c => renderCategoryTag(c)).join('')}
        </div>
      </td>
      <td>${renderStatusBadge(clip.status)}</td>
      <td class="text-muted text-sm">${dateStr}</td>
      <td class="text-muted text-sm">${clip.views || 0}</td>
    </tr>
  `;
}

