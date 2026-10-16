import { isValidEmail } from '../utils/validation.js';
import { showToast } from '../core/notifications.js';
import { playSound } from '../core/audio.js';
import { apiUrl } from '../core/api.js';

export function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;


    const clearBtn = document.getElementById('clear-mail-btn');
    clearBtn?.addEventListener('click', () => {
        form.reset();
        playSound('click');
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nameInput = document.getElementById('sender-name');
        const emailInput = document.getElementById('sender-email');
        const subjectInput = document.getElementById('sender-subject');
        const messageInput = document.getElementById('sender-message');
        const submitBtn = document.getElementById('send-mail-btn');

        const name = nameInput?.value?.trim() || '';
        const email = emailInput?.value?.trim() || '';
        const subject = subjectInput?.value?.trim() || '';
        const message = messageInput?.value?.trim() || '';

        if (!name || !email || !message) {
            showToast('Validation Error', 'Please fill in all required fields (Name, Email, Message).', 'fa-solid fa-triangle-exclamation', 'Mail Client');
            playSound('error');
            return;
        }

        if (!isValidEmail(email)) {
            showToast('Validation Error', 'Please provide a valid email address.', 'fa-solid fa-circle-exclamation', 'Mail Client');
            playSound('error');
            return;
        }

        if (name.length > 100 || subject.length > 200 || message.length > 2000) {
            showToast('Validation Error', 'Fields exceed allowed length limits.', 'fa-solid fa-circle-exclamation', 'Mail Client');
            playSound('error');
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane" aria-hidden="true"></i> Saving message...';
        }

        try {
            const res = await fetch(apiUrl('/api/contact'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, subject, message })
            });

            let data = {};
            try {
                data = await res.json();
            } catch (e) {
                data = { success: false, error: 'Invalid response from server' };
            }

            if (res.ok && data.success) {
                showToast('Message Saved', 'Thanks! Your message was saved to the portfolio database. It is not emailed automatically.', 'fa-solid fa-paper-plane', 'Windows Mail');
                playSound('notify');
                form.reset();
            } else {
                showToast('Submission Error', data.error || 'Failed to deliver message.', 'fa-solid fa-circle-xmark', 'Windows Mail');
                playSound('error');
            }
        } catch (err) {
            showToast('Network Error', 'Server unavailable. Please try again later.', 'fa-solid fa-wifi', 'Windows Mail');
            playSound('error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane" aria-hidden="true"></i> Send Message';
            }
        }
    });
}
