import { renderStatusBadge } from './status-badge.js';
import { renderCategoryTag } from './category-tag.js';

export function renderClipCard(clip, categoriesMap) {
  const clipCategories = (clip.category_ids || []).map(id => categoriesMap[id]).filter(Boolean);
  const dateStr = clip.clip_date
    ? new Date(clip.clip_date).toLocaleDateString('pt-BR')
    : new Date(clip.created_at).toLocaleDateString('pt-BR');

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
        <button class="card-delete-btn" data-id="${clip.id}" title="Excluir clipe">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        ${clip.youtube_url ? `<div class="card-yt-badge" title="Postado no YouTube"><svg width="10" height="10" viewBox="0 0 24 24" fill="#ff0000"><path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.2 2.8 12 2.8 12 2.8s-4.2 0-6.8.1c-.6.1-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.2v2c0 2.1.3 4.2.3 4.2s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.2 21.6 12 21.6 12 21.6s4.2 0 6.8-.2c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.1.3-4.2v-2C23.3 9.1 23 7 23 7zM9.7 15.5V8.4l8.1 3.6-8.1 3.5z"/></svg></div>` : ''}
      </div>
      <div class="card-content">
        <h4 class="card-title" title="${clip.title}">${clip.title}</h4>
        <div class="card-meta">
          <span>${dateStr}</span>
          <span>${(clip.views || 0).toLocaleString('pt-BR')} views</span>
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

