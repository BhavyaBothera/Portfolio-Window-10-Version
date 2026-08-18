import { showToast } from '../core/notifications.js';
import { playSound } from '../core/audio.js';

export function initNotepad() {
    const textEditor = document.getElementById('notepad-textarea');
    const filenameInput = document.getElementById('notepad-filename');
    const saveBtn = document.getElementById('notepad-save-btn');

    saveBtn?.addEventListener('click', async () => {
        const fileName = filenameInput?.value?.trim() || 'notes.txt';
        const content = textEditor?.value || '';

        try {
            const res = await fetch('/api/vfs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Token': 'bhavy-admin-secret-key-2026'
                },
                body: JSON.stringify({ fileName, content })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast('File Saved', `File "${fileName}" saved to Virtual Filesystem.`, 'fa-solid fa-floppy-disk', 'Notepad');
                playSound('click');
            } else {
                showToast('Save Failed', data.error || 'Could not save file.', 'fa-solid fa-circle-exclamation', 'Notepad');
                playSound('error');
            }
        } catch (e) {
            showToast('Save Error', 'Failed to reach server.', 'fa-solid fa-wifi', 'Notepad');
            playSound('error');
        }
    });
}
