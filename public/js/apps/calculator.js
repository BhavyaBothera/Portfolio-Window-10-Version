import { evaluateExpression } from '../utils/math-evaluator.js';
import { playSound } from '../core/audio.js';

export function initCalculator() {
    const calcDisplay = document.getElementById('calc-display-text');
    const calcHistory = document.getElementById('calc-history-list');
    let calcExpression = '0';
    let isResultState = false;

    const updateDisplay = () => {
        if (calcDisplay) calcDisplay.textContent = calcExpression;
    };

    document.querySelectorAll('#win-calculator .calc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.dataset.val;
            const action = btn.dataset.action;

            if (action === 'clear') {
                calcExpression = '0';
                isResultState = false;
            } else if (action === 'backspace') {
                if (calcExpression.length > 1) {
                    calcExpression = calcExpression.slice(0, -1);
                } else {
                    calcExpression = '0';
                }
            } else if (action === 'equals') {
                const res = evaluateExpression(calcExpression);
                if (calcHistory && res !== 'Error') {
                    const li = document.createElement('li');
                    li.textContent = `${calcExpression} = ${res}`;
                    calcHistory.prepend(li);
                }
                calcExpression = res;
                isResultState = true;
            } else if (val) {
                if (isResultState && !['+', '-', '*', '/', '%'].includes(val)) {
                    calcExpression = val;
                } else {
                    if (calcExpression === '0' && !['+', '-', '*', '/', '%', '.'].includes(val)) {
                        calcExpression = val;
                    } else {
                        calcExpression += val;
                    }
                }
                isResultState = false;
            }

            updateDisplay();
            playSound('click');
        });
    });
}
