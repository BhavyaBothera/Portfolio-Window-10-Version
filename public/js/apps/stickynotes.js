import { showToast } from '../core/notifications.js';
import { playSound } from '../core/audio.js';

export function initStickyNotes() {
    const textarea = document.getElementById('stickynotes-textarea');
    if (!textarea) return;

    // Load initial note
    fetch('/api/notes')
        .then(res => res.json())
        .then(json => {
            if (json.success && json.data) {
                textarea.value = json.data.text || '';
            }
        })
        .catch(() => {});

    let saveTimeout = null;
    textarea.addEventListener('input', () => {
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
                /* Ignore sync error */
            }
        }, 1000);
    });
}
