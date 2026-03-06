# Architecture

Full-stack monorepo template using Bun workspaces with a Hono API backend and React/Vite frontend.

## Directory Structure

```
template-bun/
├── apps/
│   ├── api/                    @app/api — Hono + Bun backend
│   │   ├── src/
│   │   │   ├── index.ts        Entry point (Bun.serve + static files + SPA fallback)
│   │   │   ├── app.ts          Hono app (middleware chain + error handling)
│   │   │   ├── cache.ts        In-memory cache (Map + TTL)
│   │   │   ├── logger.ts       Pino logger (stdout + file dual output)
│   │   │   ├── version.ts      Version constants (APP_VERSION, GIT_COMMIT)
│   │   │   ├── lib/
│   │   │   │   └── config.ts   Typed environment config
│   │   │   ├── db/
│   │   │   │   ├── index.ts    Drizzle ORM connection + auto-migration + health check
│   │   │   │   ├── schema.ts   SQLite table definitions
│   │   │   │   ├── helpers.ts  app_settings CRUD (with cache)
│   │   │   │   └── reset.ts    Database reset script
│   │   │   ├── routes/
│   │   │   │   ├── index.ts    Route exports
│   │   │   │   └── api.ts      API endpoints
│   │   │   └── services/
│   │   │       └── index.ts    Business logic layer (placeholder)
│   │   └── drizzle/            Migration files
│   │
│   └── frontend/               @app/frontend — React 19 + Vite 7
│       ├── src/
│       │   ├── main.tsx        Entry (React Query + Router + ThemeProvider + i18n)
│       │   ├── index.css       Tailwind v4 + blue theme CSS variables (oklch)
│       │   ├── pages/
│       │   │   └── HomePage.tsx
│       │   ├── components/
│       │   │   ├── ErrorBoundary.tsx
│       │   │   ├── theme-provider.tsx   dark/light/system theme
│       │   │   └── ui/                  shadcn base-nova components
│       │   │       ├── badge.tsx
│       │   │       ├── button.tsx
│       │   │       └── card.tsx
│       │   └── lib/
│       │       ├── api.ts      Typed fetch client
│       │       ├── i18n.ts     i18next config (en/zh)
│       │       └── utils.ts    cn() tailwind merge
│       ├── components.json     shadcn config (style: base-nova)
│       ├── tsconfig.json       tsc -b project references
│       ├── tsconfig.app.json   App source (composite)
│       └── tsconfig.node.json  Vite config (composite)
│
├── packages/
│   ├── shared/                 @app/shared — Shared types
│   │   └── src/index.ts        ApiResponse<T>, HealthData
│   └── tsconfig/               @app/tsconfig — Shared TS configs
│       ├── base.json           Base config (strict, ES2022, NodeNext)
│       ├── react.json          React 19 (jsx: react-jsx, bundler, noEmit)
│       ├── hono.json           Hono (jsx: react-jsx, jsxImportSource: hono/jsx)
│       └── utils.json          Utility package config
│
├── test/                       API tests (Bun test)
│   ├── api-health.test.ts      Health endpoint tests
│   ├── helpers.ts              HTTP request helpers
│   ├── setup.ts                Cleanup hooks
│   └── preload.ts              Environment presets (temp DB)
│
├── docs/
│   ├── architecture.md         This file
│   ├── changelog.md            Changelog
│   ├── task/index.md           Task index
│   └── plan/index.md           Plan index
│
├── package.json                Workspace root config
├── tsconfig.json               Root TS config (extends base)
└── biome.json                  Biome unified lint/format
```

## API Design

### Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api` | API info + route list |
| GET | `/api/health` | Health check (includes DB status) |
| GET | `/api/runtime` | Runtime info (requires `ENABLE_RUNTIME_ENDPOINT=true`) |

### Middleware Chain (order)

1. `secureHeaders()` — Security response headers
2. `compress()` — Gzip compression (skips `/stream`, `/api/events`)
3. `httpLogger()` — HTTP logging (skips `/api/health`, `/api/events`)

### API Response Envelope

```typescript
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }
```

## Database

### Engine

SQLite + WAL mode + foreign key constraints, operated via Drizzle ORM. Migrations run automatically on startup.

### Schema

**`runtime_events`**

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (ULID) | Primary key |
| event | TEXT | Event name |
| createdAt / updatedAt | TEXT | Timestamps |
| isDeleted | INTEGER | Soft delete |

**`app_settings`**

| Column | Type | Description |
|--------|------|-------------|
| key | TEXT | Primary key |
| value | TEXT | Setting value |
| createdAt / updatedAt | TEXT | Timestamps |
| isDeleted | INTEGER | Soft delete |

### ID Generation

- `id()` — ULID (ordered, globally unique)
- `shortId()` — nanoid 8 chars (for short identifiers)

## Frontend Architecture

### Tech Stack

- **React 19** + **React Router 7** + **TanStack Query 5**
- **Vite 7** build, `tsc -b` type checking
- **Tailwind CSS v4** + **shadcn base-nova** components
- **@base-ui/react** as component primitives (not Radix)

### Theme

- Colors: **blue** theme (zinc grayscale base + blue primary, oklch color space)
- Modes: light / dark / system, persisted in localStorage
- ThemeProvider manages via React Context, toggling `dark` class

### Internationalization

- **i18next** + **react-i18next** + browser language detection
- Languages: `en` (English), `zh` (Chinese)
- Detection order: localStorage → navigator
- Translation namespaces: app, theme, health, query

### Code Splitting

Vite manual chunk strategy:
- `vendor-react` — react, scheduler
- `vendor-react-dom` — react-dom
- `vendor-router` — react-router, react-router-dom
- `vendor-query` — @tanstack/react-query
- `vendor-ui` — lucide-react
- `vendor-style` — tailwind-merge, clsx, class-variance-authority

## Toolchain

### Biome

Single tool replacing ESLint + Prettier:
- Formatting: 2-space indent, no semicolons, single quotes
- Imports: auto-sorted, `useImportType` (separated)
- React rules only for `apps/frontend/**/*`
- Key rules: `noDelete`, `useNodejsImportProtocol`, `useConst`

### TypeScript Configuration

```
@app/tsconfig/base.json        Base for all packages (strict, ES2022)
  ├── react.json                Frontend (bundler, jsx: react-jsx, noEmit)
  ├── hono.json                 API (ESNext, jsxImportSource: hono/jsx)
  └── utils.json                Utility packages (bundler, noEmit)
```

Frontend uses `tsc -b` project references:
- `tsconfig.app.json` (composite: true) — app source
- `tsconfig.node.json` (composite: true) — vite.config.ts

## Scripts

### Root

| Command | Description |
|---------|-------------|
| `bun run dev` | Start API + frontend dev servers |
| `bun run dev:api` | Start API only (watch mode, port 3010) |
| `bun run dev:web` | Start frontend only (port 3000, proxies API) |
| `bun run build` | Build frontend (tsc -b + vite build) |
| `bun run start` | Start API in production mode |
| `bun run test` | Run all tests |
| `bun run test:api` | Run API tests only |
| `bun run lint` | Biome check |
| `bun run lint:fix` | Biome auto-fix |
| `bun run db:generate` | Generate Drizzle migrations |
| `bun run db:migrate` | Run migrations |
| `bun run db:reset` | Reset database |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `API_PORT` | `3000` | API server port |
| `API_HOST` | `0.0.0.0` | API bind address |
| `DB_PATH` | `data/app.db` | SQLite database path |
| `LOG_LEVEL` | `info` | Log level |
| `SERVICE_NAME` | `app` | Service name (log file name) |
| `NODE_ENV` | — | Set to `production` for production mode |
| `ENABLE_RUNTIME_ENDPOINT` | — | Set to `true` to enable `/api/runtime` |

## Development Flow

```
Frontend :3000  ──proxy /api──▶  API :3010  ──▶  SQLite (data/app.db)
```

1. `bun run dev` starts both servers
2. Vite proxies `/api` requests to the API on port 3010
3. In production, the API serves frontend static files (`apps/frontend/dist`)
