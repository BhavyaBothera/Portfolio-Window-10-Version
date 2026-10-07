# 💻 Windows 10 Portfolio OS — Web Desktop Application

An interactive, full-stack **Windows 10 Web Desktop Application** built with Node.js, Express, SQLite, and a modular Vanilla JavaScript ES Module Web OS engine.

[![Tests](https://img.shields.io/badge/Tests-run%20via%20CI-blue?style=flat-square&logo=playwright)](https://github.com/BhavyaBothera/Portfolio-Window-10-Version/actions)
[![Coverage](https://img.shields.io/badge/Coverage-reported%20by%20CI-blue?style=flat-square&logo=c8)](https://github.com/BhavyaBothera/Portfolio-Window-10-Version/actions)
[![ESLint](https://img.shields.io/badge/ESLint-10-success?style=flat-square&logo=eslint)](https://github.com/BhavyaBothera/Portfolio-Window-10-Version)
[![CI Status](https://github.com/BhavyaBothera/Portfolio-Window-10-Version/actions/workflows/ci.yml/badge.svg)](https://github.com/BhavyaBothera/Portfolio-Window-10-Version/actions/workflows/ci.yml)
[![Accessibility Audit](https://img.shields.io/badge/Accessibility-100%2F100-success?style=flat-square&logo=lighthouse)](docs/LIGHTHOUSE_REPORT.md)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

---

## 🚀 Engineering Validation Report

The repository includes automated checks across nine engineering-quality areas. Exact pass counts and environment-specific performance numbers are intentionally reported by the current CI/audit run rather than hardcoded here.

| Engineering Quality Pillar | Tooling & Benchmark Result | Metric / Verification | Status |
| :--- | :--- | :--- | :---: |
| 1. **Static Code Analysis** | ESLint 10 Flat Config (`eslint.config.mjs`) | `npm run lint` — **0 Errors, 0 Warnings** | 🟢 PASS |
| 2. **Production Build Pipeline** | ESBuild Bundler (`build.js`) | `npm run build` — bundle/minification verification | 🟢 PASS |
| 3. **Code Coverage Reporting** | C8 Code Coverage Reporter | `npm run test:coverage` — generates the current statement/function coverage report | 🟢 PASS |
| 4. **Performance Evidence** | Lighthouse & DevTools Profiler | See `docs/LIGHTHOUSE_REPORT.md` for the dated audit and environment | 🟢 PASS |
| 5. **Accessibility Audit** | axe-core & Lighthouse | Automated accessibility checks and keyboard/focus coverage; see the dated report | 🟢 PASS |
| 6. **Security Automation** | `npm audit` & security tests | Dependency and application security checks run through CI | 🟢 PASS |
| 7. **Production Smoke Testing** | Playwright Production E2E Spec | `npm run test:prod` — production smoke checks against the `dist/` build | 🟢 PASS |
| 8. **Playwright E2E Test Suite** | Chromium Browser Automation | `npm run test:e2e` — current Playwright suite | 🟢 PASS |
| 9. **Automated CI Pipeline** | GitHub Actions Pipeline | `.github/workflows/ci.yml` — current status is reported by GitHub Actions | 🟢 PASS |

---

### 📖 System Architecture & Engineering Specifications

- 🪟 [Window Manager System Specification](docs/WINDOW_MANAGER.md)
- 🚀 [Production Deployment Topology & Configuration](docs/DEPLOYMENT.md)
- 📊 [Performance Audit & Web Vitals Evidence Report](docs/LIGHTHOUSE_REPORT.md)

---

## 🌟 Features & OS Applications

- **Interactive OS Desktop Shell**: Drag, 8-axis resize, minimize, maximize, snap left/right/quadrants, z-index window management, audio synthesizer sound engine, live canvas wallpapers, and desktop shortcuts.
- **🛠️ Developer Mode (`Ctrl + Shift + D`)**: Live HUD exposing real browser render FPS, main thread long tasks (>50ms), DOM event rates, state store memory size, and backend Express/SQLite API latencies.
- **20+ Built-in Web Applications**:
  - 📂 **This PC & Projects Explorer** — Interactive project cards, skills control panel, and developer overview.
  - 🤖 **Cortana Assistant** — Knowledge base guide with interactive query replies.
  - 📊 **Task Manager** — Real server telemetry line graphs using Node `os.cpus()` time diff sampling and RAM metrics.
  - 📧 **Windows Mail (Contact)** — Form submission connected to SQLite backend (`contact_messages`) with input length validation and rate limiting.
  - 💻 **VS Code Viewer** — Code viewer with syntax line numbers and file tree switcher.
  - 🎨 **MS Paint** — Drawing canvas with brush, eraser, shapes, undo stack, and PNG export.
  - 🔢 **Calculator** — Safe, zero-eval Shunting-Yard arithmetic parser supporting `+`, `-`, `*`, `/`, `%`, and `()`.
  - 🕹️ **Minesweeper & Solitaire** — Retro games with victory audio fanfare and SQLite leaderboard recording.
  - 📝 **Sticky Notes & Notepad** — Browser-persistent local notes editor; admin-only server notes remain protected.
  - ⚙️ **Windows Settings** — Accent color pickers, wallpaper selection, light/dark mode, and sound toggles.
  - 🌐 **Microsoft Edge Simulation** — Web browser with safe HTTPS URL validation and fallback embeds for sites blocking iframes.

---

## 🏗️ Architecture & Project Structure

```
Portfolio-Window-10-Version/
├── db/                         # SQLite Database Store
│   └── portfolio.sqlite
├── public/                     # Static Frontend Shell
│   ├── assets/                 # Icons, Wallpapers, Avatar
│   ├── css/
│   │   └── style.css           # Fluent Design Glassmorphism Stylesheet
│   ├── js/
│   │   ├── main.js             # ES Module Bootstrap
│   │   ├── core/               # State, Audio, Window Manager, Notifications
│   │   ├── system/             # Boot, Lock Screen, Taskbar, Start Menu, Settings
│   │   ├── apps/               # 20+ Application Controllers
│   │   └── utils/              # Math Evaluator, DOM & Validation Helpers
│   └── index.html              # OS HTML Shell
├── src/                        # Express Backend
│   ├── config/                 # Environment Configuration (dotenv)
│   ├── controllers/            # API Request Handlers
│   ├── database/               # SQLite Connection & Table Migrations
│   ├── middleware/             # Admin Auth, Rate Limiter, Error & 404 Handlers
│   └── routes/                 # Express API Router
├── tests/                      # Automated Verification Test Suite
├── .env.example                # Example Environment Variables
├── server.js                   # Express Application Entry Point
├── package.json
└── README.md
```

---

## 📊 Database Schema (SQLite)

The application uses an embedded **SQLite** database (`db/portfolio.sqlite`) with the following tables:

### 1. `contact_messages`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | Unique UUID v4 |
| `name` | TEXT | NOT NULL | Submitter name (max 100 chars) |
| `email` | TEXT | NOT NULL | Submitter email address |
| `subject` | TEXT | NOT NULL | Message subject |
| `message` | TEXT | NOT NULL | Message body (max 2000 chars) |
| `created_at` | TEXT | NOT NULL | ISO 8601 Timestamp |

### 2. `notes`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY (id = 1) | Single row constraint |
| `text` | TEXT | NOT NULL | Sticky note content |
| `color` | TEXT | NOT NULL | Theme color (yellow, blue, etc.) |
| `updated_at` | TEXT | NOT NULL | ISO 8601 Timestamp |

### 3. `leaderboard`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | Unique UUID v4 |
| `player` | TEXT | NOT NULL | Player display name (max 50 chars) |
| `game` | TEXT | NOT NULL | Game identifier (`minesweeper`, `solitaire`) |
| `score` | INTEGER | NOT NULL | Server-validated score bounds (Minesweeper 1-200, Solitaire 1-1000) |
| `time_seconds` | INTEGER | NOT NULL | Completion duration bounds (Minesweeper >= 2s, Solitaire >= 10s) |
| `created_at` | TEXT | NOT NULL | ISO 8601 Timestamp |

### 4. `vfs`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `file_name` | TEXT | PRIMARY KEY | Sanitized file name |
| `content` | TEXT | NOT NULL | File content (max 50,000 chars) |
| `updated_at` | TEXT | NOT NULL | ISO 8601 Timestamp |

---

## 🔒 Security & Performance Features

- **Helmet Security Headers**: Helmet-managed Content-Security-Policy plus standard security headers. The policy permits the external font/CDN resources required by the current UI.
- **Admin Authentication**: Admin write endpoints (`GET /api/messages`, `POST /api/notes`, `POST /api/vfs`) protected by `X-Admin-Token` middleware. Public read routes can also be restricted by setting `RESTRICT_PUBLIC_READ=true`.
- **Game Leaderboard Plausibility Verification**: Server-side score & time bounds enforcement preventing cheated score injections.
- **Zero-Eval Math Calculator**: Replaced `eval()` and `Function()` with a custom Shunting-Yard arithmetic AST evaluator supporting numbers, `+`, `-`, `*`, `/`, `%`, and `()`.
- **IP Rate Limiting**: In-memory per-process rate limiting is applied to public submission routes (`/api/contact`, `/api/leaderboard`). It is basic abuse protection, not distributed DDoS protection.
- **Input Sanitization & Validation**: Validation and output escaping are applied to user-controlled data, with prototype-pollution guards (`__proto__`, `constructor`, `prototype`). Security tests cover representative attack paths; they are not a blanket proof of XSS safety.
- **Server Runtime Telemetry**: Task Manager samples the backend process host using Node `os.cpus()` time-diff sampling and memory metrics. This is server-side telemetry, not the visitor’s local Windows CPU/RAM.
- **No SSRF / Open Proxy**: Open proxy endpoints removed; Edge Browser iframe simulation gracefully handles blocked sites with external link fallbacks.

---

## 🛠️ REST API Documentation

| Endpoint | Method | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `/api/contact` | `POST` | No (Rate Limited) | Submit contact message (validated name, email, message) |
| `/api/messages` | `GET` | **Yes** (`X-Admin-Token`) | Fetch contact messages inbox |
| `/api/system/stats` | `GET` | Optional (`RESTRICT_PUBLIC_READ`) | Fetch real CPU & RAM server telemetry |
| `/api/notes` | `GET` | Optional (`RESTRICT_PUBLIC_READ`) | Get sticky notes text |
| `/api/notes` | `POST` | **Yes** (`X-Admin-Token`) | Save sticky notes text |
| `/api/vfs` | `GET` | Optional (`RESTRICT_PUBLIC_READ`) | Fetch virtual filesystem files |
| `/api/vfs` | `POST` | **Yes** (`X-Admin-Token`) | Save file to virtual filesystem |
| `/api/leaderboard/:game` | `GET` | No | Get top game leaderboard scores |
| `/api/leaderboard` | `POST` | No (Rate Limited) | Submit validated game score |

---

## 🚀 Setup & Installation

1. **Clone Repository**:
   ```bash
   git clone https://github.com/BhavyaBothera/Portfolio-Window-10-Version.git
   cd Portfolio-Window-10-Version
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   ```bash
   cp .env.example .env
   ```

4. **Run Verification Test Suite**:
   ```bash
   npm test
   ```

5. **Start Server**:
   ```bash
   npm start
   ```

6. **Access Application**:
   Open browser at `http://localhost:5000`

---

## 🚀 Continuous Integration & Automated Testing Pipeline

Every `git push` and `pull_request` to `main` triggers the GitHub Actions CI Pipeline ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)):

```
git push origin main
      ↓
npm ci ──> npm run lint ──> npm run build ──> npm test ──> npx playwright install ──> npm run test:e2e
```

- **Syntax & Lint Verification**: `npm run lint` runs ESLint across the repository; `npm run syntax-check` separately runs Node syntax checks on the configured JavaScript paths.
- **Build Check**: `npm run build` verifies static bundle structure and Express route imports.
- **Backend Unit, Integration & Security Tests**: `npm test` runs the current unit, integration, and security test files listed in `package.json`.
- **Playwright E2E Tests**: `npm run test:e2e` runs the Playwright suite covering boot, window management, start menu, taskbar, accessibility, and mobile behavior.

---

## ⚙️ Environment Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Application server port |
| `NODE_ENV` | `development` | Node environment (`development` / `production`) |
| `ADMIN_TOKEN` | Secret in `.env` | Admin API authentication header token |
| `DB_PATH` | `./db/portfolio.sqlite` | SQLite database file location |
| `RESTRICT_PUBLIC_READ` | `false` | If set to `true`, locks down read endpoints (`/notes`, `/vfs`, `/system/stats`) to admin token |

---

## 📄 License
This project is licensed under the **MIT License**. Created by **Bhavya Bothera**.
