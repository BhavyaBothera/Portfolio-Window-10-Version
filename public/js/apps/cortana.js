import { playSound } from '../core/audio.js';
import { escapeHTML } from '../utils/dom.js';

export function initCortana() {
    const input = document.getElementById('cortana-input-field');
    const sendBtn = document.getElementById('cortana-send-btn');
    const chatList = document.getElementById('cortana-chat-list');

    if (!input || !chatList) return;

    const responses = {
        skills: 'Bhavy specializes in Full-Stack Web Development, Node.js, Express, SQLite, React, Next.js, and CSS Glassmorphism.',
        projects: 'You can explore Bhavy\'s work in the Projects Explorer app on the Desktop!',
        experience: 'Bhavy has over 3 years of software engineering experience building scalable web products.',
        contact: 'Use the Contact Me app on the desktop to send a direct message to Bhavy.'
    };

    function handleSend() {
        const query = input.value.trim();
        if (!query) return;

        input.value = '';

        const userMsg = document.createElement('div');
        userMsg.className = 'cortana-msg user';
        userMsg.textContent = query;
        chatList.appendChild(userMsg);

        playSound('click');

        setTimeout(() => {
            const botMsg = document.createElement('div');
            botMsg.className = 'cortana-msg assistant';

            const lower = query.toLowerCase();
            let reply = 'I am Cortana, your portfolio guide. Ask me about Bhavy\'s skills, projects, experience, or contact details!';

            for (const [key, val] of Object.entries(responses)) {
                if (lower.includes(key)) {
                    reply = val;
                    break;
                }
            }

            botMsg.textContent = reply;
            chatList.appendChild(botMsg);
            chatList.scrollTop = chatList.scrollHeight;
        }, 500);
    }

    sendBtn?.addEventListener('click', handleSend);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSend();
    });
}
