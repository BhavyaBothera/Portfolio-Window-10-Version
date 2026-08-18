import { isValidEmail } from '../utils/validation.js';
import { showToast } from '../core/notifications.js';
import { playSound } from '../core/audio.js';

export function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nameInput = document.getElementById('contact-name');
        const emailInput = document.getElementById('contact-email');
        const subjectInput = document.getElementById('contact-subject');
        const messageInput = document.getElementById('contact-message');
        const submitBtn = document.getElementById('contact-submit-btn');

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
            submitBtn.textContent = 'Delivering Message...';
        }

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, subject, message })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                showToast('Message Sent!', 'Thank you! Your message has been delivered to Bhavy\'s portfolio inbox.', 'fa-solid fa-paper-plane', 'Windows Mail');
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
                submitBtn.textContent = 'Send Message';
            }
        }
    });
}
