/**
 * Frontend API Configuration
 * Centralizes the backend API base URL for split deployment (Vercel + Render).
 * In production, set window.__API_BASE_URL__ via a <script> tag in index.html.
 * In development, defaults to the local Express server.
 */

const API_BASE_URL =
    window.__API_BASE_URL__ || 'http://localhost:5000';

export function apiUrl(path) {
    return `${API_BASE_URL}${path}`;
}
