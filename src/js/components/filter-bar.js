export function renderFilterBar(categories = []) {
  const categoryOptions = categories
    .map(c => `<option value="${c.id}">${c.name}</option>`)
    .join("");

  return `
    <div class="filter-bar">
      <div class="filter-search">
        <input type="text" id="search-input" placeholder="Buscar clipe pelo título..." />
      </div>

      <div class="filter-controls">
        <select id="status-filter">
          <option value="">Todos os status</option>
          <option value="novo">Novo</option>
          <option value="editando">Editando</option>
          <option value="editado">Editado</option>
          <option value="postado">Postado</option>
          <option value="descartado">Descartado</option>
        </select>

        <select id="category-filter">
          <option value="">Todas as categorias</option>
          ${categoryOptions}
        </select>

        <select id="sort-by-filter">
          <option value="created_at">Data recente</option>
          <option value="title">Título A-Z</option>
        </select>

        <div class="view-toggle">
          <button id="view-grid-btn" class="btn-toggle active" title="Visualização em Grid">Grid</button>
          <button id="view-list-btn" class="btn-toggle" title="Visualização em Lista">Lista</button>
        </div>

        <button id="import-twitch-btn" class="btn btn-secondary">Importar Twitch</button>
        <button id="new-clip-btn" class="btn btn-primary">Novo Clipe</button>
      </div>
    </div>
  `;
}
