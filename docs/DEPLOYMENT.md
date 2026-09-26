# Deployment & Operations

This document describes the deployment behavior implemented by the repository. It does not imply a specific cloud provider or high-availability architecture.

## Current application architecture

```
Browser
   │
   ▼
Express / Node.js
   ├── Helmet + CORS + request limits
   ├── REST API
   ├── SQLite database
   └── Static frontend (development source or built dist/)
```

### Production build

Run:

```bash
npm run build
```

The build bundles the frontend JavaScript with ESBuild, minifies the stylesheet, copies static assets, and writes the production shell to `dist/`.

In development, the server uses `public/` when no built `dist/index.html` is present. In non-production environments, it can also serve the built `dist/` directory when available.

### Split frontend/backend deployments

The frontend API client uses the current browser origin by default. A separate frontend deployment can provide `window.__API_BASE_URL__` before the application bundle loads.

If the frontend and backend are on different origins:

- set `CORS_ORIGIN` on the backend to the exact frontend origin;
- provide the backend base URL through the deployment's HTML/configuration layer;
- ensure the backend's CSP `connect-src` policy allows the configured API origin.

### Environment variables

```env
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.example
ADMIN_TOKEN=<generate-a-long-random-secret>
DB_PATH=./db/portfolio.sqlite
RESTRICT_PUBLIC_READ=false
```

Do not commit real credentials to the repository.

### Reverse proxies

If the application is placed behind a reverse proxy, configure Express's `trust proxy` setting to match the actual proxy topology. The current application uses one trusted proxy hop for client-IP handling; change this when the deployment has a different proxy chain.

### Database

SQLite is the application's embedded database. The server initializes the schema before it starts listening. If initialization fails, startup fails rather than continuing with an unknown database state.

For a single-instance portfolio deployment, SQLite is intentionally simple. Multi-instance deployments require a shared database/storage strategy rather than assuming that a local SQLite file is shared between instances.

### Health check

`GET /api/health` performs a database connectivity check and returns HTTP 200 when the database query succeeds, or HTTP 503 when it fails. It is a basic readiness/health signal, not a complete infrastructure health monitor.

## Operational notes

- Rate limiting is in-memory and therefore per process.
- Observability is lightweight in-memory request/latency instrumentation.
- CDN/DDoS protection, external log aggregation, backups, and process managers are deployment-level concerns and are not provided by the Express application itself.
