# 💻 Windows 10 Portfolio OS — Web Desktop Application

An interactive, full-stack **Windows 10 Web Desktop Application** built with Node.js, Express, SQLite, and a modular Vanilla JavaScript ES Module Web OS engine.

---

## 🌟 Features & OS Applications

- **Interactive OS Desktop Shell**: Drag, 8-axis resize, minimize, maximize, snap left/right/quadrants, z-index window management, audio synthesizer sound engine, live canvas wallpapers, and desktop shortcuts.
- **20+ Built-in Web Applications**:
  - 📂 **This PC & Projects Explorer** — Interactive project cards, skills control panel, and developer overview.
  - 🤖 **Cortana Assistant** — Knowledge base guide with interactive query replies.
  - 📊 **Task Manager** — Real server telemetry line graphs using Node `os.cpus()` time diff sampling and RAM metrics.
  - 📧 **Windows Mail (Contact)** — Form submission connected to SQLite backend (`contact_messages`) with input length validation and rate limiting.
  - 💻 **VS Code Viewer** — Code viewer with syntax line numbers and file tree switcher.
  - 🎨 **MS Paint** — Drawing canvas with brush, eraser, shapes, undo stack, and PNG export.
  - 🔢 **Calculator** — Safe, zero-eval Shunting-Yard arithmetic parser supporting `+`, `-`, `*`, `/`, `%`, and `()`.
  - 🕹️ **Minesweeper & Solitaire** — Retro games with victory audio fanfare and SQLite leaderboard recording.
  - 📝 **Sticky Notes & Notepad** — Real-time notes editor synced to SQLite database.
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
| `player` | TEXT | NOT NULL | Player display name |
| `game` | TEXT | NOT NULL | Game identifier (`minesweeper`, `solitaire`) |
| `score` | INTEGER | NOT NULL | Validated score |
| `time_seconds` | INTEGER | NOT NULL | Completion duration (>= 2s) |
| `created_at` | TEXT | NOT NULL | ISO 8601 Timestamp |

### 4. `vfs`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `file_name` | TEXT | PRIMARY KEY | Sanitized file name |
| `content` | TEXT | NOT NULL | File content (max 50,000 chars) |
| `updated_at` | TEXT | NOT NULL | ISO 8601 Timestamp |

---

## 🔒 Security & Performance Features

- **Helmet Security Headers**: Content-Security-Policy, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy enabled via Helmet.
- **Admin Authentication**: Admin endpoints (`GET /api/messages`, `POST /api/notes`, `POST /api/vfs`) protected by `X-Admin-Token` middleware.
- **Zero-Eval Math Calculator**: Replaced `eval()` and `Function()` with a custom Shunting-Yard arithmetic AST evaluator supporting numbers, `+`, `-`, `*`, `/`, `%`, and `()`.
- **IP Rate Limiting**: In-memory rate limiting applied to public submission routes (`/api/contact`, `/api/leaderboard`).
- **Input Sanitization & Validation**: HTML entity escaping on all user data inputs to eliminate Stored XSS vectors. Strict prototype pollution guards (`__proto__`, `constructor`, `prototype`).
- **Real CPU Telemetry**: Task Manager calculates real system CPU load using `os.cpus()` time diff sampling over intervals. Host metadata is anonymized to prevent server infrastructure leaks.
- **No SSRF / Open Proxy**: Open proxy endpoints removed; Edge Browser iframe simulation gracefully handles blocked sites with external link fallbacks.

---

## 🛠️ REST API Documentation

| Endpoint | Method | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `/api/contact` | `POST` | No (Rate Limited) | Submit contact message (validated name, email, message) |
| `/api/messages` | `GET` | **Yes** (`X-Admin-Token`) | Fetch contact messages inbox |
| `/api/system/stats` | `GET` | No | Fetch real CPU & RAM server telemetry |
| `/api/notes` | `GET` | No | Get sticky notes text |
| `/api/notes` | `POST` | **Yes** (`X-Admin-Token`) | Save sticky notes text |
| `/api/vfs` | `GET` | No | Fetch virtual filesystem files |
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

4. **Start Server**:
   ```bash
   npm start
   ```

5. **Access Application**:
   Open browser at `http://localhost:5000`

---

## ⚙️ Environment Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Application server port |
| `NODE_ENV` | `development` | Node environment (`development` / `production`) |
| `ADMIN_TOKEN` | Required secret configured in `.env` | Admin API authentication header token |

| `DB_PATH` | `./db/portfolio.sqlite` | SQLite database file location |

---

## 📄 License
This project is licensed under the **MIT License**. Created by **Bhavy**.
