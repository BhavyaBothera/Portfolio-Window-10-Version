import { playSound } from '../core/audio.js';

export function initResumeViewer() {
    const root = document.getElementById('win-resume');
    if (!root || root.dataset.resumeInitialized === 'true') return;
    root.dataset.resumeInitialized = 'true';

    const documentPage = root.querySelector('#pdf-document');
    const zoomIn = root.querySelector('#zoom-in-pdf');
    const zoomOut = root.querySelector('#zoom-out-pdf');
    const printButton = root.querySelector('#print-resume-btn');
    if (!documentPage) return;

    let zoom = 1;
    const applyZoom = () => {
        documentPage.style.transform = 'scale(' + zoom.toFixed(2) + ')';
        documentPage.style.transformOrigin = 'top center';
        documentPage.dataset.zoom = zoom.toFixed(2);
    };

    zoomIn?.addEventListener('click', () => {
        zoom = Math.min(1.5, Math.round((zoom + 0.1) * 100) / 100);
        applyZoom();
        playSound('click');
    });

    zoomOut?.addEventListener('click', () => {
        zoom = Math.max(0.7, Math.round((zoom - 0.1) * 100) / 100);
        applyZoom();
        playSound('click');
    });

    printButton?.addEventListener('click', () => {
        const cleanup = () => document.body.classList.remove('resume-print-mode');
        window.addEventListener('afterprint', cleanup, { once: true });
        document.body.classList.add('resume-print-mode');
        playSound('click');

        try {
            window.print();
        } catch (error) {
            cleanup();
            console.error('[Resume] Unable to open print dialog:', error);
        }
    });
}
