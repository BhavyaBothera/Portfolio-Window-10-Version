# 💻 Windows 10 Portfolio OS — Full-Stack Web Desktop Application

> An enterprise-grade, interactive **Windows 10 Web Desktop Application** and **Full-Stack Portfolio** built with Node.js, Express, REST APIs, SQLite Database, and a high-performance Vanilla Web OS Engine with Fluent Design Glassmorphism.

---

## 🌟 Architecture & Highlights

- **Full-Stack REST Architecture**: Express.js REST API with zero-config embedded database persistence (`db/portfolio.db.json`).
- **Interactive OS Shell**: Drag, resize, minimize, maximize, snap, z-index window management, audio sound engine, live canvas wallpapers (Matrix CRT, Starfield), and desktop shortcuts.
- **20+ Built-in Web OS Applications**:
  - 📂 **Projects Explorer** — 3D interactive project cards & live demo sandbox iframe.
  - 🤖 **Cortana AI Assistant** — Knowledge base search with speech synthesis & animated audio wave.
  - 📊 **Task Manager** — Real-time server telemetry CPU/RAM graphs connected to backend `/api/system/stats`.
  - 📧 **Windows Mail** — Form submission connected to REST API `/api/contact` with DB storage.
  - 💻 **VS Code Source Code Viewer** — Code viewer with syntax line numbers and file tree switcher.
  - 🎨 **MS Paint** — Drawing canvas with brush, eraser, line, rect, circle, undo stack, and PNG export.
  - 🔢 **Calculator** — Fluent mathematical expression calculator.
  - 🕹️ **Minesweeper & Solitaire** — Games with victory audio fanfare and REST API leaderboard score recording.
  - 📝 **Sticky Notes & Notepad** — Real-time notes and text editing.
  - ⚙️ **Windows Settings** — Accent color pickers, wallpaper selection, and sound toggles.
  - 🖼️ **Wallpaper Drag-and-Drop** — Instant image upload desktop wallpaper switcher with `localStorage` persistence.

---

## 📁 Repository Directory Structure

```
Portfolio-Window-10-Version/
├── public/                     # Public Frontend Assets
│   ├── css/
│   │   └── style.css           # Fluent Glassmorphism Stylesheet
│   ├── js/
│   │   └── script.js           # Web OS Desktop Shell Engine
│   ├── assets/                 # Lockscreen & Wallpaper Images
│   └── index.html              # OS HTML Shell
├── src/                        # Node.js Server Source Code
│   ├── controllers/            # API Request Controllers
│   │   ├── contact.controller.js
│   │   ├── system.controller.js
│   │   └── leaderboard.controller.js
│   ├── routes/                 # Express API Router
│   │   └── api.routes.js
│   └── database/               # Database Storage Manager
│       └── db.manager.js
├── db/                         # Database Storage Directory
│   └── portfolio.db.json       # Database Persistence Store
├── server.js                   # Node.js Express Application Entry
├── package.json                # Project Dependencies & Build Scripts
└── README.md                   # Full-Stack Documentation
```

---

## 🛠️ REST API Documentation

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/contact` | `POST` | Submits contact messages to the backend database |
| `/api/messages` | `GET` | Retrieves all saved contact inbox messages |
| `/api/system/stats` | `GET` | Returns real-time server CPU, RAM, and uptime telemetry |
| `/api/leaderboard/:game` | `GET` | Returns top scores for Solitaire or Minesweeper |
| `/api/leaderboard` | `POST` | Records a new game victory score |
| `/api/notes` | `GET / POST` | Synchronizes sticky note text and background color |
| `/api/vfs` | `GET / POST` | Saves/loads virtual desktop files |

---

## 🚀 Quick Start & Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/BhavyaBothera/Portfolio-Window-10-Version.git
   cd Portfolio-Window-10-Version
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Full-Stack Server**:
   ```bash
   npm start
   ```

4. **Open in Browser**:
   Navigate to `http://localhost:5000` to interact with the full-stack desktop OS!

---

## 📄 License
This project is licensed under the **MIT License**. Created with passion by **Bhavy**.
