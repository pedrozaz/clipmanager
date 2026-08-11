export function renderFilterBar(container, props) {
  const { onSearch, onFilterStatus, onFilterCategory, onSort, onViewToggle, onImportTwitch, onNewClip, categories } = props;

  container.innerHTML = `
    <div class="filter-bar">
      <div class="filter-group flex-grow">
        <input type="text" id="search-input" class="form-input" placeholder="Buscar clipe...">
      </div>
      
      <div class="filter-group">
        <select id="status-filter" class="form-select">
          <option value="">Todos os Status</option>
          <option value="Novo">Novo</option>
          <option value="Editando">Editando</option>
          <option value="Editado">Editado</option>
          <option value="Postado">Postado</option>
          <option value="Descartado">Descartado</option>
        </select>
      </div>

      <div class="filter-group">
        <select id="category-filter" class="form-select">
          <option value="">Todas Categorias</option>
          ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
        </select>
      </div>

      <div class="filter-group">
        <select id="sort-select" class="form-select">
          <option value="date_desc">Mais recentes</option>
          <option value="date_asc">Mais antigos</option>
          <option value="views_desc">Mais visualizados</option>
          <option value="title_asc">Ordem alfabética</option>
        </select>
      </div>

      <div class="filter-group d-flex gap-2 align-items-center bg-surface p-1 rounded">
        <button id="view-grid" class="btn btn-sm btn-secondary active">Grade</button>
        <button id="view-list" class="btn btn-sm btn-secondary">Lista</button>
      </div>

      <div class="filter-group d-flex gap-2 ml-auto">
        <button id="btn-import" class="btn btn-secondary">Importar Twitch</button>
        <button id="btn-new" class="btn btn-primary">Novo Clipe</button>
      </div>
    </div>
  `;

  document.getElementById('search-input').addEventListener('input', (e) => onSearch(e.target.value));
  document.getElementById('status-filter').addEventListener('change', (e) => onFilterStatus(e.target.value));
  document.getElementById('category-filter').addEventListener('change', (e) => onFilterCategory(e.target.value));
  document.getElementById('sort-select').addEventListener('change', (e) => onSort(e.target.value));
  
  const btnGrid = document.getElementById('view-grid');
  const btnList = document.getElementById('view-list');
  
  btnGrid.addEventListener('click', () => {
    btnGrid.classList.add('active');
    btnList.classList.remove('active');
    onViewToggle('grid');
  });
  
  btnList.addEventListener('click', () => {
    btnList.classList.add('active');
    btnGrid.classList.remove('active');
    onViewToggle('list');
  });

  document.getElementById('btn-import').addEventListener('click', onImportTwitch);
  document.getElementById('btn-new').addEventListener('click', onNewClip);
}
