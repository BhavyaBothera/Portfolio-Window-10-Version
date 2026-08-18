import { state } from './state.js';
import { playSound } from './audio.js';
import { createElement } from '../utils/dom.js';

export function showToast(title, body, icon = 'fa-solid fa-bell', source = 'System') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    playSound('notify');

    const toast = createElement('div', { className: 'toast-notification' });
    
    const header = createElement('div', { className: 'toast-header' }, [
        createElement('i', { className: icon }),
        createElement('span', { textContent: ` ${source}` })
    ]);

    const titleEl = createElement('div', { className: 'toast-title', textContent: title });
    const bodyEl = createElement('div', { className: 'toast-body', textContent: body });
    const progress = createElement('div', { className: 'toast-progress' }, [
        createElement('div', { className: 'toast-progress-bar' })
    ]);

    toast.appendChild(header);
    toast.appendChild(titleEl);
    toast.appendChild(bodyEl);
    toast.appendChild(progress);

    toast.addEventListener('click', () => {
        toast.classList.add('toast-dismiss');
        setTimeout(() => toast.remove(), 350);
    });

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-dismiss');
        setTimeout(() => toast.remove(), 350);
    }, 5000);

    // Update notification badge
    state.notifCount++;
    const badge = document.getElementById('notif-badge');
    if (badge) {
        badge.textContent = String(state.notifCount);
        badge.classList.remove('hidden');
    }
}
