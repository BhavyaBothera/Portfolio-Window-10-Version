import { playSound } from '../core/audio.js';
import { showToast } from '../core/notifications.js';

export function initPaintCanvas() {
    const canvas = document.getElementById('paint-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let isDrawing = false;
    let currentTool = 'brush';
    let currentColor = '#ffffff';
    let brushSize = 4;
    let undoStack = [];

    // Save initial state for undo
    const saveState = () => {
        if (undoStack.length >= 20) undoStack.shift();
        undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    };

    // Set canvas dimensions
    canvas.width = 640;
    canvas.height = 420;
    ctx.fillStyle = '#141418';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();

    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        saveState();
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        const pos = getPos(e);

        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';

        if (currentTool === 'eraser') {
            ctx.strokeStyle = '#141418';
        } else {
            ctx.strokeStyle = currentColor;
        }

        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    });

    const stopDrawing = () => {
        if (isDrawing) {
            isDrawing = false;
            ctx.closePath();
        }
    };

    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    // Tools
    document.querySelectorAll('#win-paint .paint-tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#win-paint .paint-tool-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTool = btn.dataset.tool || 'brush';
            playSound('click');
        });
    });

    // Color Pickers
    document.querySelectorAll('#win-paint .color-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
            currentColor = swatch.dataset.color || '#ffffff';
            currentTool = 'brush';
            playSound('click');
        });
    });

    // Export PNG
    document.getElementById('paint-export-btn')?.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'paint-artwork.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('Artwork Exported', 'Downloaded paint-artwork.png', 'fa-solid fa-download', 'MS Paint');
        playSound('click');
    });

    // Clear Canvas
    document.getElementById('paint-clear-btn')?.addEventListener('click', () => {
        saveState();
        ctx.fillStyle = '#141418';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        playSound('click');
    });
}
