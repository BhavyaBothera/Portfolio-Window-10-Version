# 🚀 Production Deployment Architecture & Operations Manual

This document details the production deployment topology, security hardening, reverse proxy configuration, environment variables, and persistence management for **Windows 10 Portfolio OS**.

---

## 1. System Topology & Architecture

```
Internet / End Users (HTTPS Port 443)
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ Edge CDN & DNS Proxy (Cloudflare / Fastly)                 │
│ - Global Edge Caching for dist/assets & bundle.min.js       │
│ - DDoS Mitigation & TLS 1.3 Termination                     │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Production Host Server (Ubuntu 24.04 LTS / Docker)          │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Nginx / Caddy Reverse Proxy                              │ │
│ │ - HTTP/2 Protocol Upgrade & Gzip/Brotli Compression     │ │
│ │ - Passes API & Dynamic Requests to Local Port 3000      │ │
│ └───────────────────────────┬─────────────────────────────┘ │
│                             │                               │
│                             ▼                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ PM2 Process Manager (Node.js v20 Cluster Mode)          │ │
│ │ - Executes server.js (Serving dist/ production build)   │ │
│ │ - Auto-restart on crash / memory cap (>500MB)           │ │
│ └───────────────────────────┬─────────────────────────────┘ │
│                             │                               │
│                             ▼                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ SQLite3 Database Layer (Persistent Volume)              │ │
│ │ - Location: /var/lib/portfolio/db/portfolio.sqlite      │ │
│ │ - PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;   │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Environment Configuration (`.env`)

Create a `.env` file in the root directory prior to starting the production server:

```env
# Application Core Config
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://bhavyaos.com

# Security & Secrets
ADMIN_PASSWORD_HASH=$2b$12$eImiTXuWVxfM37uY4JANjO...
JWT_SECRET=super_secret_production_key_x982347
RATE_LIMIT_MAX=100
```

---

## 3. Nginx Reverse Proxy Configuration

Place the following configuration in `/etc/nginx/sites-available/portfolio.conf`:

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

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 4. Zero-Downtime Deployment Command Sequence

```bash
# 1. Pull Latest Source
git pull origin main

# 2. Clean Install Production Dependencies
npm ci --only=production

# 3. Execute Production ESBuild Compilation
npm run build

# 4. Verify Production Smoke Test
npm run test:prod

# 5. Reload Server via PM2
pm2 reload server.js --name "bhavya-os"
```

---

## 5. SQLite Persistence & Backup Management

SQLite database files (`db/portfolio.sqlite`) operate in Write-Ahead Logging (WAL) mode for concurrency:
- **Daily Automated Backup Cron**:
  ```bash
  0 3 * * * sqlite3 /var/lib/portfolio/db/portfolio.sqlite ".backup '/backups/portfolio_$(date +\%Y\%m\%d).sqlite'"
  ```
