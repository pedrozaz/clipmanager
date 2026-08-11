import { renderStatusBadge } from './status-badge.js';
import { renderCategoryTag } from './category-tag.js';

export function renderClipCard(clip, categoriesMap) {
  const clipCategories = (clip.category_ids || []).map(id => categoriesMap[id]).filter(Boolean);
  const dateStr = new Date(clip.created_at).toLocaleDateString('pt-BR');
  
  return `
    <div class="clip-card clip-item-link" data-id="${clip.id}">
      <div class="clip-thumb">
        ${clip.thumbnail_url 
          ? `<img src="${clip.thumbnail_url}" alt="Thumbnail">` 
          : `<div class="thumb-placeholder"><span>CM</span></div>`
        }
        <div class="clip-status-overlay">
          ${renderStatusBadge(clip.status)}
        </div>
      </div>
      <div class="clip-content">
        <h4 class="clip-title" title="${clip.title}">${clip.title}</h4>
        <div class="clip-meta text-sm text-muted mb-2">
          <span>${dateStr}</span> • <span>${clip.views || 0} views</span>
        </div>
        <div class="clip-tags d-flex flex-wrap gap-1">
          ${clipCategories.slice(0, 3).map(c => renderCategoryTag(c)).join('')}
          ${clipCategories.length > 3 ? '<span class="text-xs text-muted">...</span>' : ''}
        </div>
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
        <div class="row-thumb" style="width: 80px; height: 45px; background: #1a1a20; border-radius: 4px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
          ${clip.thumbnail_url 
            ? `<img src="${clip.thumbnail_url}" style="width: 100%; height: 100%; object-fit: cover;">` 
            : `<span class="text-xs text-muted">CM</span>`
          }
        </div>
      </td>
      <td>
        <div class="font-medium">${clip.title}</div>
        <div class="d-flex flex-wrap gap-1 mt-1">
          ${clipCategories.map(c => renderCategoryTag(c)).join('')}
        </div>
      </td>
      <td>${renderStatusBadge(clip.status)}</td>
      <td class="text-muted">${dateStr}</td>
      <td class="text-muted">${clip.views || 0}</td>
    </tr>
  `;
}
