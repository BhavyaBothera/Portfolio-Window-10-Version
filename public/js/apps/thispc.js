import { playSound } from '../core/audio.js';

export function initThisPC() {
    const tabs = document.querySelectorAll('#win-this-pc .explorer-view-tab');
    const panes = document.querySelectorAll('#win-this-pc .thispc-tab-pane');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const targetTab = tab.dataset.tab;
            panes.forEach(pane => {
                if (pane.id === `thispc-pane-${targetTab}`) {
                    pane.classList.remove('hidden');
                } else {
                    pane.classList.add('hidden');
                }
            });
            playSound('click');
        });
    });
}
