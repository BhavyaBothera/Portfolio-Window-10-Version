/**
 * Safe Shunting-Yard Arithmetic Expression Evaluator
 * Replaces dangerous eval() and Function() calls.
 * Supports: +, -, *, /, %, decimals, and parentheses ().
 */

export function evaluateExpression(expression) {
    if (!expression || typeof expression !== 'string') return '0';

    // Normalize operators
    let clean = expression.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').trim();

    if (!clean) return '0';

    // Strict validation regex: allow only digits, decimal point, whitespace, operators +, -, *, /, %, and parens ( )
    if (!/^[0-9\s\.\+\-\*\/\%\(\)]+$/.test(clean)) {
        return 'Error';
    }

    try {
        const tokens = tokenize(clean);
        const rpn = shuntingYard(tokens);
        const result = evaluateRPN(rpn);
        
        if (!isFinite(result) || isNaN(result)) {
            return 'Error';
        }

        // Format clean output (round tiny float precision artifacts)
        return String(Math.round(result * 1e10) / 1e10);
    } catch (e) {
        return 'Error';
    }
}

function tokenize(expr) {
    const tokens = [];
    let i = 0;

    while (i < expr.length) {
        const char = expr[i];

        if (/\s/.test(char)) {
            i++;
            continue;
        }

        if (/[0-9\.]/.test(char)) {
            let numStr = '';
            while (i < expr.length && /[0-9\.]/.test(expr[i])) {
                numStr += expr[i];
                i++;
            }
            if ((numStr.match(/\./g) || []).length > 1) {
                throw new Error('Multiple decimals');
            }
            tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
            continue;
        }

        if (['+', '-', '*', '/', '%', '(', ')'].includes(char)) {
            // Handle unary negative/positive signs (e.g. -5 or (-3))
            const prev = tokens[tokens.length - 1];
            if (
                (char === '-' || char === '+') &&
                (!prev || prev.type === 'OPERATOR' || (prev.type === 'PAREN' && prev.value === '('))
            ) {
                i++;
                let numStr = char;
                while (i < expr.length && /[0-9\.]/.test(expr[i])) {
                    numStr += expr[i];
                    i++;
                }
                if (numStr === '-' || numStr === '+') {
                    throw new Error('Invalid unary operator syntax');
                }
                tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
                continue;
            }

            if (char === '(' || char === ')') {
                tokens.push({ type: 'PAREN', value: char });
            } else {
                tokens.push({ type: 'OPERATOR', value: char });
            }
            i++;
            continue;
        }

        throw new Error(`Unexpected character: ${char}`);
    }

    return tokens;
}

const PRECEDENCE = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
    '%': 2
};

function shuntingYard(tokens) {
    const outputQueue = [];
    const operatorStack = [];

    for (const token of tokens) {
        if (token.type === 'NUMBER') {
            outputQueue.push(token);
        } else if (token.type === 'OPERATOR') {
            while (
                operatorStack.length > 0 &&
                operatorStack[operatorStack.length - 1].type === 'OPERATOR' &&
                PRECEDENCE[operatorStack[operatorStack.length - 1].value] >= PRECEDENCE[token.value]
            ) {
                outputQueue.push(operatorStack.pop());
            }
            operatorStack.push(token);
        } else if (token.type === 'PAREN' && token.value === '(') {
            operatorStack.push(token);
        } else if (token.type === 'PAREN' && token.value === ')') {
            let foundMatch = false;
            while (operatorStack.length > 0) {
                const top = operatorStack.pop();
                if (top.type === 'PAREN' && top.value === '(') {
                    foundMatch = true;
                    break;
                }
                outputQueue.push(top);
            }
            if (!foundMatch) throw new Error('Unmatched parenthesis');
        }
    }

    while (operatorStack.length > 0) {
        const top = operatorStack.pop();
        if (top.type === 'PAREN') throw new Error('Unmatched parenthesis');
        outputQueue.push(top);
    }

    return outputQueue;
}

function evaluateRPN(rpnTokens) {
    const stack = [];

    for (const token of rpnTokens) {
        if (token.type === 'NUMBER') {
            stack.push(token.value);
        } else if (token.type === 'OPERATOR') {
            if (stack.length < 2) throw new Error('Invalid expression syntax');
            const b = stack.pop();
            const a = stack.pop();

            switch (token.value) {
                case '+': stack.push(a + b); break;
                case '-': stack.push(a - b); break;
                case '*': stack.push(a * b); break;
                case '/':
                    if (b === 0) throw new Error('Division by zero');
                    stack.push(a / b);
                    break;
                case '%':
                    if (b === 0) throw new Error('Modulo by zero');
                    stack.push(a % b);
                    break;
                default: throw new Error(`Unknown operator: ${token.value}`);
            }
        }
    }

    if (stack.length !== 1) throw new Error('Invalid expression final stack');
    return stack[0];
}
