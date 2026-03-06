import type { ApiResponse, HealthData } from '@app/shared'

export type { HealthData }

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json = (await res.json()) as ApiResponse<T>
  if (!json.success) {
    throw new Error(json.error)
  }
  return json.data
}

function get<T>(url: string) {
  return request<T>(url)
}

function post<T>(url: string, body: unknown) {
  return request<T>(url, { method: 'POST', body: JSON.stringify(body) })
}

function patch<T>(url: string, body: unknown) {
  return request<T>(url, { method: 'PATCH', body: JSON.stringify(body) })
}

function del<T>(url: string) {
  return request<T>(url, { method: 'DELETE' })
}

export const api = {
  getHealth: () => get<HealthData>('/api/health'),
  getRoot: () =>
    get<{ name: string; status: string; routes: string[] }>('/api'),
  post,
  patch,
  del,
  get,
}
