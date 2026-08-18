import { playSound } from '../core/audio.js';
import { escapeHTML } from '../utils/dom.js';

const fileContents = {
    'server.js': `// Server Entry Point (Express + SQLite)
const express = require('express');
const helmet = require('helmet');
const apiRoutes = require('./src/routes/api.routes');

const app = express();
app.use(helmet());
app.use('/api', apiRoutes);
app.listen(5000);`,
    'index.html': `<!-- Windows 10 Portfolio OS Shell -->
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Bhavy | Windows 10 Portfolio OS</title>
</head>
<body>
  <div id="desktop-shell"></div>
</body>
</html>`,
    'style.css': `/* Fluent Design Glassmorphism System */
:root {
  --win-accent: #0078d7;
  --win-dark-bg: rgba(18, 18, 24, 0.85);
}
.win-window {
  backdrop-filter: blur(35px);
}`
};

export function loadVsCodeContent(fileName = 'index.html') {
    const codeContainer = document.getElementById('vscode-code-display');
    const tabsContainer = document.getElementById('vscode-tabs-container');
    if (!codeContainer) return;

    const rawCode = fileContents[fileName] || '// File empty or select another file';
    const lines = rawCode.split('\n');

    codeContainer.innerHTML = '';

    lines.forEach((line, idx) => {
        const lineRow = document.createElement('div');
        lineRow.className = 'code-line-row';

        const num = document.createElement('span');
        num.className = 'code-line-num';
        num.textContent = String(idx + 1);

        const content = document.createElement('span');
        content.className = 'code-line-text';
        content.textContent = line;

        lineRow.appendChild(num);
        lineRow.appendChild(content);
        codeContainer.appendChild(lineRow);
    });

    if (tabsContainer) {
        tabsContainer.innerHTML = `<div class="vscode-tab active"><i class="fa-solid fa-code"></i> ${escapeHTML(fileName)}</div>`;
    }
}

export function initVsCode() {
    document.querySelectorAll('#win-vscode .vscode-file-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('#win-vscode .vscode-file-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const fileName = item.dataset.file || 'index.html';
            loadVsCodeContent(fileName);
            playSound('click');
        });
    });
}
