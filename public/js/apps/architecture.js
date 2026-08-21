/**
 * System Architecture App Module
 * Handles tab navigation, interactive architectural diagrams, and telemetry summaries.
 */

export function initArchitectureApp() {
    const winEl = document.getElementById('win-architecture');
    if (!winEl) return;

    const navTabs = winEl.querySelectorAll('.arch-nav-tab');
    const tabPanes = winEl.querySelectorAll('.arch-tab-pane');

    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetPaneId = tab.dataset.pane;

            navTabs.forEach(t => t.classList.remove('active'));
            tabPanes.forEach(p => p.classList.add('hidden'));

            tab.classList.add('active');
            const targetPane = winEl.querySelector(`#${targetPaneId}`);
            if (targetPane) {
                targetPane.classList.remove('hidden');
            }
        });
    });
}
