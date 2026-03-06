// @app/shared — types shared between @app/api and @app/frontend

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export type HealthData = {
  status: string
  version: string
  commit: string
  db: 'ok' | 'error'
  timestamp: string
}
