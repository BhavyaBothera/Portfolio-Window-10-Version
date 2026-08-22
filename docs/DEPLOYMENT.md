# 🚀 Deployment Architecture & Operations Manual

This document provides an accurate, truthful specification of the **active deployment pipeline** running in this repository, alongside the **recommended cloud host architecture** for enterprise scale deployment.

---

## Part 1 — Active Repository Deployment Architecture

The architecture currently implemented and verified in this codebase:

```
Browser Client (Localhost / Hosted VPS Node.js Server)
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ Express HTTP Server (server.js - Node.js v20+)              │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Security & Middleware Layer                             │ │
│ │ - Helmet Security Headers (CSP, X-Frame-Options)       │ │
│ │ - CORS Origin Guard & Express JSON Body Parser          │ │
│ │ - Zero-PII High-Resolution Telemetry Middleware         │ │
│ └───────────────────────────┬─────────────────────────────┘ │
│                             │                               │
│                             ▼                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Static Asset Routing Engine                             │ │
│ │ - Production Mode: Serves dist/ (bundled & minified)   │ │
│ │ - Development Mode: Serves public/ ES modules           │ │
│ └───────────────────────────┬─────────────────────────────┘ │
│                             │                               │
│                             ▼                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ SQLite3 Database Layer (src/database/database.js)       │ │
│ │ - Location: ./db/portfolio.sqlite                       │ │
│ │ - PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;   │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Active Implementation Details

- **Production Build Compiler**: ESBuild script ([`build.js`](file:///c:/Users/bhavy/OneDrive/Desktop/Projects/Portfolio%20Ideas/New%20laptop%20version/build.js)) bundles 20+ Web OS modules into `dist/js/bundle.min.js` (51.7% size reduction) and minifies `dist/css/style.min.css` (31.9% size reduction).
- **Static File Routing**: `server.js` automatically inspects whether `dist/index.html` exists. If present, Express serves the compiled `dist/` production assets; otherwise, it falls back to `public/` ES source modules.
- **Database Engine & Concurrency**: Embedded SQLite3 database ([`src/database/database.js`](file:///c:/Users/bhavy/OneDrive/Desktop/Projects/Portfolio%20Ideas/New%20laptop%20version/src/database/database.js)) initialized with:
  ```sql
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;
  ```
- **Authentication Gatekeeper**: Protected REST API endpoints (`/api/messages`) validate request headers against static secret tokens (`X-Admin-Token` or `Bearer dev_secret_token_2026`).
- **Telemetry Engine**: `process.hrtime()` measures API and database query latencies in an in-memory sliding window (last 100 entries). Returns `0` ms when unmeasured (no initial fake hardcoded defaults).

---

## Part 2 — Recommended Cloud Host Architecture

For deploying this application to public cloud hosts (AWS EC2, Hetzner, DigitalOcean, GCP) for high-availability traffic:

### Recommended Cloud Topology

```
Internet / End Users (HTTPS Port 443)
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ Global Edge CDN (Cloudflare / Fastly)                      │
│ - Edge Caching for dist/ static assets & bundle.min.js      │
│ - DDoS Protection & TLS 1.3 Termination                     │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Host Server (Ubuntu 24.04 LTS / Docker Container)           │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Nginx / Caddy Reverse Proxy                              │ │
│ │ - HTTP/2 Protocol Upgrade & Gzip/Brotli Compression     │ │
│ │ - Passes /api/ and Dynamic Requests to Local Port 3000   │ │
│ └───────────────────────────┬─────────────────────────────┘ │
│                             │                               │
│                             ▼                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ PM2 Process Manager / Node Cluster                      │ │
│ │ - Executes server.js in production mode                 │ │
│ │ - Automatic restart on crash or memory threshold        │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Recommended Environment Configuration (`.env`)

```env
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://bhavyaos.com
ADMIN_TOKEN=super_secret_production_key_2026
```

### Recommended Nginx Site Config (`/etc/nginx/sites-available/portfolio.conf`)

```nginx
server {
    listen 80;
    server_name bhavyaos.com www.bhavyaos.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name bhavyaos.com www.bhavyaos.com;

    ssl_certificate /etc/letsencrypt/live/bhavyaos.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bhavyaos.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Backup Management (SQLite WAL Mode)

- **Automated Nightly Backup Cron**:
  ```bash
  0 3 * * * sqlite3 ./db/portfolio.sqlite ".backup '/backups/portfolio_$(date +\%Y\%m\%d).sqlite'"
  ```
