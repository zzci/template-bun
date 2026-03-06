// Injected at compile time via --define; defaults to 'dev' in dev mode
declare const __APP_VERSION__: string
declare const __APP_COMMIT__: string

export const VERSION =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'
export const COMMIT =
  typeof __APP_COMMIT__ !== 'undefined' ? __APP_COMMIT__ : 'dev'
