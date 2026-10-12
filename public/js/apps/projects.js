import { playSound } from '../core/audio.js';

export function initProjectsExplorer() {
    const root = document.getElementById('win-projects');
    if (!root || root.dataset.projectsInitialized === 'true') return;
    root.dataset.projectsInitialized = 'true';

    const filterItems = Array.from(root.querySelectorAll('.sidebar-menu li[data-filter]'));
    const projectCards = Array.from(root.querySelectorAll('.project-item-card'));
    const searchInput = root.querySelector('#project-search-input');
    const grid = root.querySelector('#projects-grid-container');
    if (!grid || projectCards.length === 0) return;

    let activeFilter = root.querySelector('.sidebar-menu li.active[data-filter]')?.dataset.filter || 'all';
    let query = '';

    if (searchInput) {
        searchInput.setAttribute('type', 'search');
        searchInput.setAttribute('aria-label', 'Search projects by name, description, or technology');
        searchInput.setAttribute('autocomplete', 'off');
    }

    const status = document.createElement('p');
    status.className = 'projects-filter-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    grid.parentElement.insertBefore(status, grid);

    const emptyState = document.createElement('div');
    emptyState.className = 'projects-empty-state';
    emptyState.hidden = true;
    emptyState.innerHTML = '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><strong>No matching projects</strong><span>Try another search or choose a different category.</span>';
    grid.appendChild(emptyState);

    const applyFilters = () => {
        let visibleCount = 0;

        projectCards.forEach(card => {
            const categoryMatches = activeFilter === 'all' || card.dataset.category === activeFilter;
            const searchableText = card.textContent.toLowerCase();
            const searchMatches = !query || searchableText.includes(query);
            const visible = categoryMatches && searchMatches;

            card.classList.toggle('hidden', !visible);
            if (visible) visibleCount += 1;
        });

        emptyState.hidden = visibleCount > 0;
        status.textContent = query || activeFilter !== 'all'
            ? `Showing ${visibleCount} of ${projectCards.length} projects`
            : `${projectCards.length} projects`;
    };

    filterItems.forEach(item => {
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.setAttribute('aria-pressed', String(item.dataset.filter === activeFilter));

        const activateFilter = () => {
            activeFilter = item.dataset.filter || 'all';
            filterItems.forEach(filterItem => {
                const selected = filterItem === item;
                filterItem.classList.toggle('active', selected);
                filterItem.setAttribute('aria-pressed', String(selected));
            });
            applyFilters();
            playSound('click');
        };

        item.addEventListener('click', activateFilter);
        item.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                activateFilter();
            }
        });
    });

    searchInput?.addEventListener('input', event => {
        query = event.target.value.toLowerCase().trim();
        applyFilters();
    });

    applyFilters();
}
