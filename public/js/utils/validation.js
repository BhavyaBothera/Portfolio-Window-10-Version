/**
 * Client Validation Utilities
 */

export function isValidUrl(urlString) {
    if (!urlString || typeof urlString !== 'string') return false;
    try {
        const parsed = new URL(urlString);
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
        return false;
    }
}

export function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
