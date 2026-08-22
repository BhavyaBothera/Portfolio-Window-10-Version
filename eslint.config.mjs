import js from '@eslint/js';

export default [
    js.configs.recommended,
    {
        ignores: ['dist/**', 'node_modules/**', 'playwright-report/**', 'test-results/**']
    },
    {
        files: ['**/*.js', '**/*.mjs'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                process: 'readonly',
                console: 'readonly',
                module: 'readonly',
                require: 'readonly',
                __dirname: 'readonly',
                exports: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearTimeout: 'readonly',
                clearInterval: 'readonly',
                Blob: 'readonly',
                PerformanceObserver: 'readonly',
                performance: 'readonly',
                URL: 'readonly',
                window: 'readonly',
                document: 'readonly',
                location: 'readonly',
                Node: 'readonly',
                global: 'readonly',
                localStorage: 'readonly',
                fetch: 'readonly',
                requestAnimationFrame: 'readonly',
                cancelAnimationFrame: 'readonly',
                Image: 'readonly',
                page: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '.*', varsIgnorePattern: '^_', caughtErrors: 'none' }],
            'no-undef': 'error',
            'no-unreachable': 'error',
            'no-duplicate-imports': 'error',
            'no-constant-condition': 'warn',
            'no-useless-assignment': 'off',
            'no-useless-escape': 'off',
            'no-empty': ['error', { allowEmptyCatch: true }]
        }
    }
];
