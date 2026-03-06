import { afterAll } from 'bun:test'
import { unlinkSync } from 'node:fs'
import { dbPath } from '../apps/api/src/db'

afterAll(() => {
  try {
    unlinkSync(dbPath)
    unlinkSync(`${dbPath}-wal`)
    unlinkSync(`${dbPath}-shm`)
  } catch {
    // ignore cleanup errors
  }
})
