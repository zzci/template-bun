# Template Bun

Full-stack monorepo template using Bun workspaces.

- **Backend**: Hono + SQLite (Drizzle ORM) + Pino logger
- **Frontend**: React 19 + Vite 7 + Tailwind CSS v4 + shadcn (base-nova)
- **Tooling**: Biome (lint/format) + TypeScript strict

## Quick Start

```bash
bun install
bun run dev
```

- Frontend: http://localhost:3000
- API: http://localhost:3010

## Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start API + frontend |
| `bun run build` | Build frontend (tsc -b + vite) |
| `bun run start` | Start API in production mode |
| `bun run test` | Run all tests |
| `bun run lint` | Code check |
| `bun run lint:fix` | Auto-fix |
| `bun run db:generate` | Generate database migrations |
| `bun run db:migrate` | Run migrations |

## Project Structure

```
apps/api/        Hono API server (@app/api)
apps/frontend/   React SPA (@app/frontend)
packages/shared/ Shared types (@app/shared)
packages/tsconfig/ Shared TS configs (@app/tsconfig)
test/            API tests
docs/            Architecture docs, task management
```

See [docs/architecture.md](docs/architecture.md) for details.
