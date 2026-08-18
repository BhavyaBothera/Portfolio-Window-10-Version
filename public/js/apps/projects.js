import { playSound } from '../core/audio.js';

export function initProjectsExplorer() {
    const filterItems = document.querySelectorAll('#win-projects .sidebar-menu li');
    const projectCards = document.querySelectorAll('#win-projects .project-item-card');
    const searchInput = document.getElementById('project-search-input');

    filterItems.forEach(item => {
        item.addEventListener('click', () => {
            filterItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            const filter = item.dataset.filter;
            projectCards.forEach(card => {
                const category = card.dataset.category;
                if (filter === 'all' || category === filter) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
            playSound('click');
        });
    });

    searchInput?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        projectCards.forEach(card => {
            const title = card.querySelector('h3')?.textContent?.toLowerCase() || '';
            const desc = card.querySelector('.proj-desc')?.textContent?.toLowerCase() || '';
            if (title.includes(query) || desc.includes(query)) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });
    });
}
