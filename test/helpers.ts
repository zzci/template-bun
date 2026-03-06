import { expect } from 'bun:test'
import app from '../apps/api/src/app'

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

async function request(method: HttpMethod, path: string, body?: unknown) {
  const url = `http://localhost${path}`
  const init: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body !== undefined) {
    init.body = JSON.stringify(body)
  }
  return app.fetch(new Request(url, init))
}

export function get(path: string) {
  return request('GET', path)
}

export function post(path: string, body?: unknown) {
  return request('POST', path, body)
}

export function patch(path: string, body?: unknown) {
  return request('PATCH', path, body)
}

export function del(path: string) {
  return request('DELETE', path)
}

export function expectSuccess(response: Response) {
  expect(response.status).toBeGreaterThanOrEqual(200)
  expect(response.status).toBeLessThan(300)
}

export async function expectJson<T = unknown>(response: Response): Promise<T> {
  const json = await response.json()
  expect(json).toHaveProperty('success', true)
  expect(json).toHaveProperty('data')
  return (json as { success: true; data: T }).data
}

export async function expectError(response: Response, status: number) {
  expect(response.status).toBe(status)
  const json = await response.json()
  expect(json).toHaveProperty('success', false)
  expect(json).toHaveProperty('error')
  return (json as { success: false; error: string }).error
}
