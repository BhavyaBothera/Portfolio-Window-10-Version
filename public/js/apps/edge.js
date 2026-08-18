import { isValidUrl } from '../utils/validation.js';
import { playSound } from '../core/audio.js';
import { escapeHTML } from '../utils/dom.js';

export function initEdgeBrowser() {
    const addressInput = document.getElementById('edge-address-input');
    const edgeViewport = document.getElementById('edge-viewport-container');
    const goBtn = document.getElementById('edge-go-btn');

    const navigateToUrl = (inputVal) => {
        if (!edgeViewport) return;
        const query = (inputVal || addressInput?.value || '').trim();
        if (!query) return;

        let targetUrl = query;

        // Automatically prepends https:// if user types domain without protocol
        if (!/^https?:\/\//i.test(targetUrl) && /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(targetUrl)) {
            targetUrl = `https://${targetUrl}`;
        }

        if (isValidUrl(targetUrl)) {
            if (addressInput) addressInput.value = targetUrl;

            // Load via direct iframe with safe error fallback
            const iframe = document.createElement('iframe');
            iframe.src = targetUrl;
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');

            edgeViewport.innerHTML = '';
            edgeViewport.appendChild(iframe);

            // Fallback screen if iframe fails to load
            iframe.onerror = () => {
                showFallbackScreen(targetUrl);
            };
        } else {
            // Simulated Bing Search Results Page
            const escapedQuery = escapeHTML(query);
            edgeViewport.innerHTML = `
                <div style="padding:30px;color:#fff;">
                    <div style="font-size:0.85rem;color:#888;margin-bottom:10px;">
                        <i class="fa-solid fa-globe"></i> Bing Search Results for: <strong>${escapedQuery}</strong>
                    </div>
                    <div style="background:#141418;padding:22px;border-radius:8px;border:1px solid var(--win-border);">
                        <h3 style="color:#60a5fa;margin-bottom:8px;font-size:1.15rem;">Bhavy — Full-Stack Software Engineer & Systems Architect</h3>
                        <p style="color:#ccc;font-size:0.92rem;line-height:1.6;margin-bottom:18px;">
                            Explore projects, interactive Windows 10 Web OS apps, developer tools, and architecture documentation.
                        </p>
                        <div style="display:flex;gap:12px;">
                            <button id="edge-search-proj-btn" class="win-btn primary-btn"><i class="fa-solid fa-folder-open"></i> Projects</button>
                            <button id="edge-search-contact-btn" class="win-btn"><i class="fa-solid fa-envelope"></i> Contact</button>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('edge-search-proj-btn')?.addEventListener('click', () => {
                window.openWindow?.('projects');
            });
            document.getElementById('edge-search-contact-btn')?.addEventListener('click', () => {
                window.openWindow?.('contact');
            });
        }

        playSound('click');
    };

    function showFallbackScreen(url) {
        const safeUrl = escapeHTML(url);
        edgeViewport.innerHTML = `
            <div style="padding:40px;text-align:center;color:#aaa;">
                <i class="fa-solid fa-ban" style="font-size:3rem;margin-bottom:15px;color:#f87171;"></i>
                <h3 style="color:#fff;margin-bottom:8px;">This website cannot be embedded here</h3>
                <p style="color:#888;margin-bottom:20px;">The requested site restricts iframe embedding for security reasons.</p>
                <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:8px;background:var(--win-accent);color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:500;">
                    Open externally ↗
                </a>
            </div>
        `;
    }

    goBtn?.addEventListener('click', () => navigateToUrl());
    addressInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') navigateToUrl();
    });
}
