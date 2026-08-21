const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { evaluateExpression } = require('../../public/js/utils/math-evaluator.js');

describe('Unit Test: Math Evaluator Shunting-Yard Engine', () => {

    test('Basic Addition (12 + 8 -> 20)', () => {
        assert.equal(evaluateExpression('12 + 8'), '20');
    });

    test('Precedence & Multiplication (2 + 3 * 4 -> 14)', () => {
        assert.equal(evaluateExpression('2 + 3 * 4'), '14');
    });

    test('Parentheses Evaluation ((12 + 8) * 5 -> 100)', () => {
        assert.equal(evaluateExpression('(12 + 8) * 5'), '100');
    });

    test('Modulo Arithmetic (10 % 3 -> 1)', () => {
        assert.equal(evaluateExpression('10 % 3'), '1');
    });

    test('Zero Division Safety (10 / 0 -> Error)', () => {
        assert.equal(evaluateExpression('10 / 0'), 'Error');
    });

    test('Decimal Precision Handling (0.1 + 0.2 -> 0.3)', () => {
        assert.equal(evaluateExpression('0.1 + 0.2'), '0.3');
    });

    test('Unary Operator Syntax (-5 + 10 -> 5)', () => {
        assert.equal(evaluateExpression('-5 + 10'), '5');
    });

    test('Invalid Syntax Parentheses Rejection ((5 + 2 -> Error)', () => {
        assert.equal(evaluateExpression('(5 + 2'), 'Error');
    });

    test('Empty or Non-String Input Default (-> 0)', () => {
        assert.equal(evaluateExpression(''), '0');
        assert.equal(evaluateExpression(null), '0');
    });
});
