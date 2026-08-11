export function renderFilterBar(container, props) {
  const { onSearch, onFilterStatus, onFilterCategory, onSort, onViewToggle, onImportTwitch, onNewClip, categories } = props;

  container.innerHTML = `
    <div class="filter-bar-container">
      <div class="filter-bar-left">
        <div class="search-box-wrapper">
          <svg class="search-box-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="search-input" class="search-box-input" placeholder="Buscar clipe por título ou nota...">
        </div>
      </div>
      
      <div class="filter-bar-center">
        <div class="select-wrapper">
          <select id="status-filter" class="select select-sm">
            <option value="">Todos os Status</option>
            <option value="Novo">Novo</option>
            <option value="Editando">Editando</option>
            <option value="Editado">Editado</option>
            <option value="Postado">Postado</option>
            <option value="Descartado">Descartado</option>
          </select>
        </div>

        <div class="select-wrapper">
          <select id="category-filter" class="select select-sm">
            <option value="">Todas Categorias</option>
            ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select>
        </div>

        <div class="select-wrapper">
          <select id="sort-select" class="select select-sm">
            <option value="date_desc">Mais recentes</option>
            <option value="date_asc">Mais antigos</option>
            <option value="views_desc">Mais visualizados</option>
            <option value="title_asc">Ordem alfabética</option>
          </select>
        </div>

        <div class="view-switch">
          <button id="view-grid" class="view-switch-btn active" title="Visualização em Grade">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            <span>Grade</span>
          </button>
          <button id="view-list" class="view-switch-btn" title="Visualização em Lista">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            <span>Lista</span>
          </button>
        </div>
      </div>

      <div class="filter-bar-right">
        <button id="btn-import" class="btn btn-secondary btn-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Importar Twitch
        </button>
        <button id="btn-new" class="btn btn-primary btn-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo Clipe
        </button>
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

