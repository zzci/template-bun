/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

const config = defineConfig({
  plugins: [
    tsconfigPaths({ projects: ['./tsconfig.app.json'] }),
    tailwindcss(),
    viteReact(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          const m = id.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/)
          if (!m) return undefined
          const pkg = m[1]
          if (pkg === 'react' || pkg === 'scheduler') return 'vendor-react'
          if (pkg === 'react-dom') return 'vendor-react-dom'
          if (pkg === 'react-router' || pkg === 'react-router-dom')
            return 'vendor-router'
          if (pkg === '@tanstack/react-query') return 'vendor-query'
          if (pkg === 'lucide-react') return 'vendor-ui'
          if (
            pkg === 'tailwind-merge' ||
            pkg === 'clsx' ||
            pkg === 'class-variance-authority'
          )
            return 'vendor-style'
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3010',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})

export default config
