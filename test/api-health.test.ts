import { describe, expect, test } from 'bun:test'
import { expectError, expectJson, get } from './helpers'
import './setup'

describe('GET /api', () => {
  test('returns API info', async () => {
    const res = await get('/api')
    const data = await expectJson<{
      name: string
      status: string
      routes: string[]
    }>(res)
    expect(data.name).toBe('app-api')
    expect(data.status).toBe('ok')
    expect(data.routes).toBeArray()
  })
})

describe('GET /api/health', () => {
  test('returns health status with envelope', async () => {
    const res = await get('/api/health')
    const data = await expectJson<{
      status: string
      db: string
      version: string
    }>(res)
    expect(data.status).toBe('ok')
    expect(data.db).toBe('ok')
    expect(data.version).toBeDefined()
    expect(data).toHaveProperty('timestamp')
  })
})

describe('GET /api/runtime', () => {
  test('returns 404 when ENABLE_RUNTIME_ENDPOINT is not set', async () => {
    process.env.ENABLE_RUNTIME_ENDPOINT = undefined
    const res = await get('/api/runtime')
    await expectError(res, 404)
  })
})

describe('404 handler', () => {
  test('returns error envelope for unknown API routes', async () => {
    const res = await get('/api/nonexistent')
    const error = await expectError(res, 404)
    expect(error).toBe('Not Found')
  })
})
