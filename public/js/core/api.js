/**
 * Frontend API Configuration
 * Centralizes the backend API base URL for split deployment (Vercel + Render).
 * Split deployments can set window.__API_BASE_URL__; same-origin deployments use the current origin.
 */

const API_BASE_URL =
    window.__API_BASE_URL__ || window.location.origin;

export function apiUrl(path) {
    return `${API_BASE_URL}${path}`;
}
