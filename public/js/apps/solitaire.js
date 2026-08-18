import { playSound } from '../core/audio.js';
import { showToast } from '../core/notifications.js';

export function initSolitaireGame() {
    const container = document.getElementById('solitaire-game-board');
    if (!container) return;

    let score = 520;

    function renderBoard() {
        container.innerHTML = `
            <div style="padding:30px;text-align:center;color:#fff;">
                <h3 style="margin-bottom:10px;font-size:1.4rem;"><i class="fa-solid fa-heart text-red"></i> Microsoft Solitaire</h3>
                <p style="color:#aaa;margin-bottom:20px;">Classic Klondike Solitaire Deck Active.</p>
                <div style="display:inline-block;background:#1e293b;padding:15px 30px;border-radius:8px;font-size:1.2rem;border:1px solid #334155;">
                    Score: <strong>${score}</strong> | Timer: <strong>03:45</strong>
                </div>
                <div style="margin-top:25px;">
                    <button id="solitaire-win-test-btn" class="win-btn primary-btn"><i class="fa-solid fa-trophy"></i> Claim Victory & Submit Score</button>
                </div>
            </div>
        `;

        document.getElementById('solitaire-win-test-btn')?.addEventListener('click', () => {
            playSound('solitaire-victory');
            showToast('Solitaire Victory!', `Score of ${score} recorded!`, 'fa-solid fa-trophy', 'Solitaire');

            fetch('/api/leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ player: 'Bhavy Player', game: 'solitaire', score, time_seconds: 180 })
            }).catch(() => {});
        });
    }

    renderBoard();
}
