/**
 * Storage Utility
 * Safe localStorage wrapper with try-catch validation & auto-healing JSON recovery.
 */

export function getItem(key, fallback = null) {
    try {
        const val = localStorage.getItem(key);
        return val !== null ? val : fallback;
    } catch (e) {
        console.warn(`[Storage] Failed to read ${key} from localStorage:`, e.message);
        return fallback;
    }
}

export function setItem(key, value) {
    try {
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    } catch (e) {
        console.warn(`[Storage] Failed to write ${key} to localStorage:`, e.message);
    }
}

export function removeItem(key) {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.warn(`[Storage] Failed to remove ${key} from localStorage:`, e.message);
    }
}

export function getJSON(key, fallback = null) {
    const raw = getItem(key, null);
    if (!raw) return fallback;
    try {
        return JSON.parse(raw);
    } catch (e) {
        console.warn(`[Storage] Corrupted JSON in localStorage key "${key}". Resetting to fallback.`, e.message);
        removeItem(key);
        return fallback;
    }
}
