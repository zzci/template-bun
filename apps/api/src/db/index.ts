import { Database } from 'bun:sqlite'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import { logger } from '../logger'
import * as schema from './schema'

const moduleDir =
  typeof import.meta.dir === 'string'
    ? import.meta.dir
    : dirname(fileURLToPath(import.meta.url))

// In compiled binary import.meta.dir points to read-only /$bunfs — use cwd instead
const baseDir = moduleDir.startsWith('/$bunfs')
  ? process.cwd()
  : resolve(moduleDir, '../../..')

const rawDbPath = process.env.DB_PATH || 'data/app.db'
const dbPath = rawDbPath.startsWith('/')
  ? rawDbPath
  : resolve(baseDir, rawDbPath)

const dir = dirname(dbPath)
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true })
}

const sqlite = new Database(dbPath)
sqlite.run('PRAGMA journal_mode = WAL')
sqlite.run('PRAGMA foreign_keys = ON')
sqlite.run('PRAGMA busy_timeout = 15000')
sqlite.run('PRAGMA synchronous = NORMAL')
sqlite.run('PRAGMA cache_size = -64000')
sqlite.run('PRAGMA mmap_size = 268435456')

export const db = drizzle({ client: sqlite, schema })
export { dbPath, sqlite }

function runMigrations(folder: string) {
  try {
    sqlite.run('PRAGMA foreign_keys = OFF')
    migrate(db, { migrationsFolder: folder })
    sqlite.run('PRAGMA foreign_keys = ON')
  } catch (err: unknown) {
    sqlite.run('PRAGMA foreign_keys = ON')
    const errObj = err as { message?: string; cause?: { message?: string } }
    const msg =
      String(errObj?.message ?? '') + String(errObj?.cause?.message ?? '')
    const alreadyExists =
      /table .+ already exists|index .+ already exists/i.test(msg)
    if (!alreadyExists) {
      throw err
    }
    logger.debug({ error: msg }, 'migration_silenced_already_exists')
  }
}

// moduleDir = apps/api/src/db -> ../../drizzle = apps/api/drizzle
const migrationsFolder = resolve(moduleDir, '../../drizzle')
runMigrations(migrationsFolder)

export async function checkDbHealth() {
  const result = sqlite.query('select 1 as ok').get() as { ok?: number } | null
  await db.get(sql`select 1 as ok`)
  return {
    ok: Number(result?.ok ?? 0) === 1,
  }
}
