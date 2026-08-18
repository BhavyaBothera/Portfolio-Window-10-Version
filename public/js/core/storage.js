/**
 * Storage Utility
 * Safe localStorage wrapper with try-catch validation.
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
        localStorage.setItem(key, value);
    } catch (e) {
        console.warn(`[Storage] Failed to write ${key} to localStorage:`, e.message);
    }
}

export function getJSON(key, fallback = null) {
    try {
        const raw = getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
        console.warn(`[Storage] Failed to parse JSON for ${key}:`, e.message);
        return fallback;
    }
}

export function setJSON(key, data) {
    try {
        setItem(key, JSON.stringify(data));
    } catch (e) {
        console.warn(`[Storage] Failed to stringify JSON for ${key}:`, e.message);
    }
}
