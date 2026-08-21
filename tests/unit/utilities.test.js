const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

describe('Unit Test: System Utilities & Formatting Helpers', () => {

    test('HTML Special Character Escaping Helper', () => {
        const escapeHTML = (str) => {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        };

        assert.equal(escapeHTML('<script>alert("XSS")</script>'), '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
        assert.equal(escapeHTML("John's Portfolio"), 'John&#039;s Portfolio');
    });

    test('File Size Byte Formatter (B, KB, MB)', () => {
        const formatBytes = (bytes) => {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        assert.equal(formatBytes(0), '0 Bytes');
        assert.equal(formatBytes(1024), '1 KB');
        assert.equal(formatBytes(1048576), '1 MB');
        assert.equal(formatBytes(5242880), '5 MB');
    });

    test('Time String Formatter (12-Hour Format)', () => {
        const formatTime = (date) => {
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        };

        const testDate = new Date('2026-08-21T14:30:00');
        assert.match(formatTime(testDate), /2:30\s*PM/i);
    });
});
