import { playSound } from '../core/audio.js';
import { showToast } from '../core/notifications.js';

export function initMinesweeper() {
    const gridContainer = document.getElementById('minesweeper-grid');
    const timerDisplay = document.getElementById('ms-timer-display');
    const mineCountDisplay = document.getElementById('ms-mine-count');
    const resetBtn = document.getElementById('ms-reset-btn');

    if (!gridContainer) return;

    const ROWS = 9, COLS = 9, MINES = 10;
    let grid = [], revealedCount = 0, timerVal = 0, timerInterval = null, gameOver = false;

    function resetGame() {
        if (timerInterval) clearInterval(timerInterval);
        timerVal = 0;
        gameOver = false;
        revealedCount = 0;
        if (timerDisplay) timerDisplay.textContent = '000';
        if (mineCountDisplay) mineCountDisplay.textContent = '010';
        if (resetBtn) resetBtn.innerHTML = '😊';

        grid = Array.from({ length: ROWS }, () =>
            Array.from({ length: COLS }, () => ({ mine: false, revealed: false, flagged: false, count: 0 }))
        );

        // Place 10 mines randomly
        let placed = 0;
        while (placed < MINES) {
            const r = Math.floor(Math.random() * ROWS);
            const c = Math.floor(Math.random() * COLS);
            if (!grid[r][c].mine) {
                grid[r][c].mine = true;
                placed++;
            }
        }

        // Calculate adjacent counts
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (grid[r][c].mine) continue;
                let count = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        const nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc].mine) {
                            count++;
                        }
                    }
                }
                grid[r][c].count = count;
            }
        }

        renderGrid();
    }

    function startTimer() {
        if (timerInterval) return;
        timerInterval = setInterval(() => {
            timerVal++;
            if (timerDisplay) timerDisplay.textContent = String(timerVal).padStart(3, '0');
        }, 1000);
    }

    function renderGrid() {
        gridContainer.innerHTML = '';
        gridContainer.style.gridTemplateColumns = `repeat(${COLS}, 30px)`;

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = document.createElement('div');
                cell.className = 'ms-cell';
                const cellData = grid[r][c];

                if (cellData.revealed) {
                    cell.classList.add('revealed');
                    if (cellData.mine) {
                        cell.classList.add('mine');
                        cell.textContent = '💣';
                    } else if (cellData.count > 0) {
                        cell.textContent = cellData.count;
                    }
                } else if (cellData.flagged) {
                    cell.textContent = '🚩';
                }

                cell.addEventListener('click', () => revealCell(r, c));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    toggleFlag(r, c);
                });

                gridContainer.appendChild(cell);
            }
        }
    }

    function toggleFlag(r, c) {
        if (gameOver || grid[r][c].revealed) return;
        grid[r][c].flagged = !grid[r][c].flagged;
        playSound('click');
        renderGrid();
    }

    function revealCell(r, c) {
        if (gameOver || grid[r][c].revealed || grid[r][c].flagged) return;

        startTimer();
        const cell = grid[r][c];
        cell.revealed = true;
        revealedCount++;

        if (cell.mine) {
            gameOver = true;
            if (timerInterval) clearInterval(timerInterval);
            if (resetBtn) resetBtn.innerHTML = '😵';
            playSound('error');

            // Reveal all mines
            grid.forEach(row => row.forEach(c => { if (c.mine) c.revealed = true; }));
            renderGrid();
            return;
        }

        playSound('click');

        if (cell.count === 0) {
            // Cascade reveal empty neighbors
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !grid[nr][nc].revealed) {
                        revealCell(nr, nc);
                    }
                }
            }
        }

        // Check victory
        if (revealedCount === ROWS * COLS - MINES) {
            gameOver = true;
            if (timerInterval) clearInterval(timerInterval);
            if (resetBtn) resetBtn.innerHTML = '😎';
            playSound('solitaire-victory');
            showToast('Victory!', `Minesweeper cleared in ${timerVal}s!`, 'fa-solid fa-trophy', 'Minesweeper');

            // Submit high score to SQLite backend
            const finalTime = Math.max(2, timerVal);
            fetch('/api/leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ player: 'Bhavy Explorer', game: 'minesweeper', score: 100, time_seconds: finalTime })
            }).catch(() => {});
        }

        renderGrid();
    }

    resetBtn?.addEventListener('click', resetGame);
    resetGame();
}
