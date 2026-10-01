import { getItem, setItem } from '../core/storage.js';

export function initStickyNotes() {
    const textarea = document.getElementById('stickynotes-textarea');
    if (!textarea) return;

    // Sticky Notes are intentionally local to this browser profile.
    // The server-side notes endpoint is admin-protected and must not receive
    // an admin token from public client-side JavaScript.
    textarea.value = getItem('win10-sticky-note', '');

    textarea.addEventListener('input', () => {
        setItem('win10-sticky-note', textarea.value);
    });
}
