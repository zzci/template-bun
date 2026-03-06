export interface Config {
  server: {
    port: number
    host: string
  }
  database: {
    path: string
  }
  log: {
    level: string
  }
}

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key]
  if (value === undefined) {
    if (defaultValue !== undefined) return defaultValue
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

function getEnvNumber(key: string, defaultValue: number): number {
  const raw = process.env[key]
  if (raw === undefined) return defaultValue
  const parsed = parseInt(raw, 10)
  if (isNaN(parsed))
    throw new Error(`Environment variable ${key} must be a number`)
  return parsed
}

export function loadConfig(): Config {
  return {
    server: {
      port: getEnvNumber('API_PORT', 3000),
      host: getEnv('API_HOST', '0.0.0.0'),
    },
    database: {
      path: getEnv('DB_PATH', 'data/app.db'),
    },
    log: {
      level: getEnv('LOG_LEVEL', 'info'),
    },
  }
}

export const config = loadConfig()
