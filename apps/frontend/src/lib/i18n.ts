import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      app: {
        title: 'React Router + TanStack Query Demo',
      },
      theme: {
        light: 'Light',
        dark: 'Dark',
        system: 'System',
      },
      health: {
        title: 'API Health',
        description: 'Live endpoint check through TanStack Query.',
        endpoint: 'Endpoint',
        updated: 'Updated',
        refresh: 'Refresh',
        loading: 'Loading',
        error: 'Error',
        healthy: 'Healthy',
      },
      query: {
        title: 'Query Controls',
        description: 'Toggle background polling and inspect cache in devtools.',
        autoRefresh: 'Auto refresh (5s)',
        devtoolsHint:
          'Open React Query Devtools in the bottom-right corner during development.',
      },
    },
  },
  zh: {
    translation: {
      app: {
        title: 'React Router + TanStack Query 示例',
      },
      theme: {
        light: '浅色',
        dark: '深色',
        system: '系统',
      },
      health: {
        title: 'API 健康状态',
        description: '通过 TanStack Query 进行实时端点检查。',
        endpoint: '端点',
        updated: '更新时间',
        refresh: '刷新',
        loading: '加载中',
        error: '错误',
        healthy: '健康',
      },
      query: {
        title: '查询控制',
        description: '切换后台轮询并在开发工具中检查缓存。',
        autoRefresh: '自动刷新 (5秒)',
        devtoolsHint: '开发模式下，在右下角打开 React Query 开发工具。',
      },
    },
  },
} as const

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })

export default i18n
