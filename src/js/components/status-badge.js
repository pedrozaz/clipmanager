export function renderStatusBadge(statusKey) {
  const safeStatus = (statusKey || '').toLowerCase();
  
  return `<span class="badge badge-${safeStatus}">${statusKey}</span>`;
}
