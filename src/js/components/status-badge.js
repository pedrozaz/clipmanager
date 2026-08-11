const STATUS_CONFIG = {
  novo: { label: "Novo", color: "var(--status-new)" },
  editando: { label: "Editando", color: "var(--status-editing)" },
  editado: { label: "Editado", color: "var(--status-edited)" },
  postado: { label: "Postado", color: "var(--status-posted)" },
  descartado: { label: "Descartado", color: "var(--status-archived)" },
};

export function renderStatusBadge(statusKey) {
  const config = STATUS_CONFIG[statusKey] || { label: statusKey, color: "var(--color-text-muted)" };
  return `
    <span class="status-badge" style="--badge-color: ${config.color}">
      <span class="status-dot"></span>
      ${config.label}
    </span>
  `;
}
