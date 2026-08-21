const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { evaluateExpression } = require('../../public/js/utils/math-evaluator.js');
const { getJSON, setItem } = require('../../public/js/core/storage.js');

// Mock localStorage in Node.js test environment
if (typeof localStorage === 'undefined') {
    const store = new Map();
    global.localStorage = {
        getItem: (k) => store.get(k) ?? null,
        setItem: (k, v) => store.set(k, String(v)),
        removeItem: (k) => store.delete(k),
        clear: () => store.clear()
    };
}

describe('Unit Test: Error Handling & Self-Healing Recovery', () => {

    beforeEach(() => {
        localStorage.clear();
    });

    test('Corrupted JSON in localStorage auto-resets to fallback', () => {
        localStorage.setItem('corrupted-key', '{ invalid: json syntax');
        const result = getJSON('corrupted-key', { default: true });
        assert.deepEqual(result, { default: true });
        assert.equal(localStorage.getItem('corrupted-key'), null, 'Corrupted key must be cleared from storage');
    });

    test('Valid JSON in localStorage parses cleanly', () => {
        setItem('valid-key', { theme: 'dark', sound: true });
        const result = getJSON('valid-key', null);
        assert.deepEqual(result, { theme: 'dark', sound: true });
    });

    test('Math Evaluator handles Division by Zero without crashing', () => {
        const result = evaluateExpression('10 / 0');
        assert.equal(result, 'Error');
    });

    test('Math Evaluator handles Mismatched Parentheses gracefully', () => {
        const result = evaluateExpression('(5 + (2 * 3)');
        assert.equal(result, 'Error');
    });

    test('formatBytes handles Non-Numeric Inputs safely', () => {
        const formatBytes = (bytes) => {
            const num = Number(bytes);
            if (!num || isNaN(num) || num <= 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(num) / Math.log(k));
            return parseFloat((num / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        assert.equal(formatBytes(null), '0 B');
        assert.equal(formatBytes(undefined), '0 B');
        assert.equal(formatBytes('invalid'), '0 B');
        assert.equal(formatBytes(-100), '0 B');
    });
});
