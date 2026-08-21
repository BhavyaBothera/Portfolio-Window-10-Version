import { getItem, setItem } from '../core/storage.js';

export function initStickyNotes() {
    const textarea = document.getElementById('stickynotes-textarea');
    if (!textarea) return;

    // Load initial note (Try server API first, fall back to local storage)
    fetch('/api/notes')
        .then(res => res.json())
        .then(json => {
            if (json.success && json.data && json.data.text !== undefined) {
                textarea.value = json.data.text;
                setItem('win10-sticky-note', json.data.text);
            } else {
                textarea.value = getItem('win10-sticky-note', '');
            }
        })
        .catch(() => {
            textarea.value = getItem('win10-sticky-note', '');
        });

    let saveTimeout = null;
    textarea.addEventListener('input', () => {
        // Instant local sync
        setItem('win10-sticky-note', textarea.value);

        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(async () => {
            try {
                await fetch('/api/notes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Admin-Token': 'bhavy-admin-secret-key-2026'
                    },
                    body: JSON.stringify({ text: textarea.value })
                });
            } catch (e) {
                /* Graceful sync error handling */
            }
        }, 1000);
    });
}
