import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'

// Set DB_PATH to a temp file before any app module loads
const testDbPath = join(tmpdir(), `app-test-${Date.now()}.db`)
process.env.DB_PATH = testDbPath
process.env.LOG_LEVEL = 'silent'
