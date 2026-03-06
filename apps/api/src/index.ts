import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { serveStatic } from 'hono/bun'
import app from './app'
import { logger } from './logger'
import { COMMIT, VERSION } from './version'

const listenHost = process.env.API_HOST ?? '0.0.0.0'
const listenPort = Number(process.env.API_PORT ?? 3000)

// --- Static file serving (production only) ---
const staticRoot = resolve(import.meta.dir, '../../frontend/dist')
if (existsSync(staticRoot)) {
  // Hashed assets: immutable, 1 year cache
  app.use(
    '/assets/*',
    serveStatic({
      root: staticRoot,
      onFound: (_path, c) => {
        c.header('Cache-Control', 'public, max-age=31536000, immutable')
      },
    }),
  )

  // Other static files: 1 hour, revalidate
  app.use(
    '*',
    serveStatic({
      root: staticRoot,
      onFound: (_path, c) => {
        c.header('Cache-Control', 'public, max-age=3600, must-revalidate')
      },
    }),
  )

  // SPA fallback: serve index.html for non-file routes
  app.get(
    '*',
    serveStatic({
      root: staticRoot,
      path: 'index.html',
      onFound: (_path, c) => {
        c.header('Cache-Control', 'no-cache')
      },
    }),
  )
}

const http = Bun.serve({
  port: listenPort,
  hostname: listenHost,
  idleTimeout: 60,
  fetch: app.fetch,
})

logger.info(
  {
    host: listenHost,
    port: listenPort,
    serverName: 'app-api',
    version: VERSION,
    commit: COMMIT,
  },
  'server_started',
)

let isShuttingDown = false

async function shutdown(signal: string) {
  if (isShuttingDown) {
    return
  }
  isShuttingDown = true

  logger.warn({ signal }, 'server_shutdown')
  http.stop()
  logger.info('server_stopped')
  process.exit(0)
}

process.on('SIGINT', () => {
  void shutdown('SIGINT')
})
process.on('SIGTERM', () => {
  void shutdown('SIGTERM')
})
