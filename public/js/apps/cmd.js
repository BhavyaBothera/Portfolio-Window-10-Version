import { playSound } from '../core/audio.js';
import { openWindow } from '../core/window-manager.js';

export function initCmdTerminal() {
    const inputField = document.getElementById('cmd-input-field');
    const outputContainer = document.getElementById('cmd-output');
    const bodyContainer = document.getElementById('cmd-body-container');

    const appendText = (text, color = null) => {
        const div = document.createElement('div');
        div.className = 'cmd-text';
        if (color) div.style.color = color;
        div.textContent = text;
        outputContainer?.appendChild(div);
        if (bodyContainer) bodyContainer.scrollTop = bodyContainer.scrollHeight;
    };

    const commands = {
        help: () => {
            appendText('AVAILABLE COMMANDS:', '#60a5fa');
            appendText('  help       - Show list of commands');
            appendText('  about      - Display developer summary');
            appendText('  skills     - View technical stack');
            appendText('  projects   - Open Projects Explorer');
            appendText('  clear      - Clear terminal screen');
            appendText('  date       - Display current system time');
        },
        about: () => {
            appendText('Bhavy — Full-Stack Developer & Web Systems Architect');
            appendText('Specializing in Node.js, Express, SQLite, React, and Interactive Web OS Shells.');
        },
        skills: () => {
            appendText('Frontend: HTML5, CSS3 (Fluent UI), Vanilla JS (ES Modules), React, Next.js');
            appendText('Backend: Node.js, Express, SQLite3, REST APIs, System Telemetry');
        },
        projects: () => {
            appendText('Opening Projects Explorer window...');
            openWindow('projects');
        },
        clear: () => {
            if (outputContainer) outputContainer.innerHTML = '';
        },
        cls: () => {
            if (outputContainer) outputContainer.innerHTML = '';
        },
        date: () => {
            appendText(new Date().toString());
        }
    };

    inputField?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const raw = inputField.value.trim();
            inputField.value = '';
            if (!raw) return;

            appendText(`C:\\Users\\Bhavy> ${raw}`, '#38bdf8');
            const cmdName = raw.toLowerCase();

            if (commands[cmdName]) {
                commands[cmdName]();
            } else {
                appendText(`'${raw}' is not recognized as an internal or external command. Type 'help' for available commands.`, '#f87171');
            }

            playSound('click');
        }
    });
}
