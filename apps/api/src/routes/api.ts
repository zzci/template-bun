import { Hono } from 'hono'
import { checkDbHealth } from '../db'
import { COMMIT, VERSION } from '../version'

const apiRoutes = new Hono()

function detectRuntime() {
  const hasBunGlobal = typeof Bun !== 'undefined'
  const bunVersion = process.versions?.bun ?? null
  const nodeRelease = process.release?.name ?? null
  const nodeVersion = process.versions?.node ?? null
  const execPath = process.execPath ?? null

  if (hasBunGlobal || bunVersion) {
    return {
      runtime: 'bun' as const,
      confidence: 'high' as const,
      signals: {
        hasBunGlobal,
        bunVersion,
        nodeRelease,
        nodeVersion,
        execPath,
      },
    }
  }

  if (nodeRelease === 'node' || nodeVersion) {
    return {
      runtime: 'node' as const,
      confidence: 'high' as const,
      signals: {
        hasBunGlobal,
        bunVersion,
        nodeRelease,
        nodeVersion,
        execPath,
      },
    }
  }

  return {
    runtime: 'unknown' as const,
    confidence: 'low' as const,
    signals: {
      hasBunGlobal,
      bunVersion,
      nodeRelease,
      nodeVersion,
      execPath,
    },
  }
}

function getRuntimeInfo() {
  const detected = detectRuntime()

  return {
    version: VERSION,
    commit: COMMIT,
    runtime: detected.runtime,
    confidence: detected.confidence,
    isBun: detected.runtime === 'bun',
    isNode: detected.runtime === 'node',
    signals: detected.signals,
    versions: {
      bun: process.versions?.bun ?? null,
      node: process.versions?.node ?? null,
      v8: process.versions?.v8 ?? null,
      uv: process.versions?.uv ?? null,
    },
    process: {
      pid: process.pid,
      ppid: process.ppid,
      title: process.title,
      cwd: process.cwd(),
      uptimeSeconds: process.uptime(),
      platform: process.platform,
      arch: process.arch,
      env: {
        API_HOST: process.env.API_HOST ?? null,
        API_PORT: process.env.API_PORT ?? null,
      },
    },
    timestamp: new Date().toISOString(),
  }
}

apiRoutes.get('/', (c) => {
  return c.json({
    success: true,
    data: {
      name: 'app-api',
      status: 'ok',
      routes: ['GET /api', 'GET /api/health', 'GET /api/runtime'],
    },
  })
})

apiRoutes.get('/health', async (c) => {
  const dbHealth = await checkDbHealth()
  return c.json({
    success: true,
    data: {
      status: 'ok',
      version: VERSION,
      commit: COMMIT,
      db: dbHealth.ok ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
    },
  })
})

// Gate /api/runtime behind explicit opt-in env var
apiRoutes.get('/runtime', (c) => {
  if (process.env.ENABLE_RUNTIME_ENDPOINT !== 'true') {
    return c.json({ success: false, error: 'Not Found' }, 404)
  }

  const info = getRuntimeInfo()
  // Strip execPath from signals to avoid leaking binary path
  const { execPath: _, ...safeSignals } = info.signals
  return c.json({ success: true, data: { ...info, signals: safeSignals } })
})

export default apiRoutes
