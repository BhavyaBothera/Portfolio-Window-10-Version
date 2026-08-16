const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');
const http = require('http');
const apiRoutes = require('./src/routes/api.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets from public/ directory
app.use(express.static(path.join(__dirname, 'public')));

// Mount API routes
app.use('/api', apiRoutes);

// ==========================================================================
// PROXY ENDPOINT — Lets the Edge browser iframe load any external site
// by stripping X-Frame-Options and CSP headers from the response.
// ==========================================================================
app.get('/api/proxy', (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('Missing url parameter');

    // Validate URL format
    let parsed;
    try {
        parsed = new URL(targetUrl);
    } catch {
        return res.status(400).send('Invalid URL');
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
        return res.status(400).send('Only HTTP/HTTPS URLs are supported');
    }

    // Recursive fetch that follows redirects (up to 8 hops)
    function fetchWithRedirects(url, depth) {
        if (depth > 8) return res.status(502).send('Too many redirects');

        const lib = url.startsWith('https') ? https : http;
        const reqOptions = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        };

        lib.get(url, reqOptions, (proxyRes) => {
            // Follow redirects
            if ([301, 302, 303, 307, 308].includes(proxyRes.statusCode) && proxyRes.headers.location) {
                const redirectUrl = new URL(proxyRes.headers.location, url).href;
                proxyRes.resume(); // drain the response
                return fetchWithRedirects(redirectUrl, depth + 1);
            }

            const contentType = proxyRes.headers['content-type'] || '';

            if (contentType.includes('text/html')) {
                // Collect the full HTML body
                const chunks = [];
                proxyRes.on('data', chunk => chunks.push(chunk));
                proxyRes.on('end', () => {
                    let html = Buffer.concat(chunks).toString('utf-8');

                    // Inject <base> tag so relative URLs (images, CSS, JS) resolve from original domain
                    const origin = new URL(url).origin;
                    const baseTag = `<base href="${origin}/">`;
                    if (html.includes('<head>')) {
                        html = html.replace('<head>', '<head>' + baseTag);
                    } else if (html.includes('<head ')) {
                        html = html.replace(/<head\s[^>]*>/i, (m) => m + baseTag);
                    } else if (html.includes('<html')) {
                        html = html.replace(/<html[^>]*>/i, (m) => m + '<head>' + baseTag + '</head>');
                    } else {
                        html = baseTag + html;
                    }

                    // Set clean response headers — no X-Frame-Options or CSP blocking
                    res.set('Content-Type', 'text/html; charset=utf-8');
                    res.send(html);
                });
                proxyRes.on('error', () => res.status(502).send('Proxy stream error'));
            } else {
                // For non-HTML (CSS, JS, images), pipe directly
                res.set('Content-Type', contentType);
                proxyRes.pipe(res);
            }
        }).on('error', (err) => {
            res.status(502).send('Proxy fetch error: ' + err.message);
        });
    }

    fetchWithRedirects(targetUrl, 0);
});

// Catch-all fallback route serving index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 Windows 10 Full-Stack Portfolio Server Active`);
    console.log(`🌐 Server Port: ${PORT}`);
    console.log(`📂 Serving Public Shell: http://localhost:${PORT}`);
    console.log(`==================================================\n`);
});
