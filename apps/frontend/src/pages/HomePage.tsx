import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  Database,
  Languages,
  Monitor,
  MoonStar,
  RefreshCw,
  Router,
  Sun,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/components/theme-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { HealthData } from '@/lib/api'
import { api } from '@/lib/api'

export default function HomePage() {
  const [polling, setPolling] = useState(true)
  const { theme, setTheme } = useTheme()
  const { t, i18n } = useTranslation()

  const healthQuery = useQuery<HealthData>({
    queryKey: ['api-health'],
    queryFn: () => api.getHealth(),
    refetchInterval: polling ? 5000 : false,
  })

  const updatedAt = useMemo(() => {
    if (!healthQuery.data?.timestamp) {
      return '--'
    }
    return new Date(healthQuery.data.timestamp).toLocaleString()
  }, [healthQuery.data?.timestamp])

  const statusBadge = useMemo(() => {
    if (healthQuery.isPending) {
      return <Badge variant="secondary">{t('health.loading')}</Badge>
    }
    if (healthQuery.isError) {
      return <Badge variant="destructive">{t('health.error')}</Badge>
    }
    return (
      <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
        {t('health.healthy')}
      </Badge>
    )
  }, [healthQuery.isError, healthQuery.isPending, t])

  const toggleLang = () => {
    const next = i18n.language?.startsWith('zh') ? 'en' : 'zh'
    i18n.changeLanguage(next)
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-primary/15 p-2 text-primary">
              <Router className="h-5 w-5" />
            </span>
            <h1 className="text-3xl font-semibold tracking-tight">
              {t('app.title')}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleLang}
              title={i18n.language?.startsWith('zh') ? 'English' : '中文'}
            >
              <Languages className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={theme === 'light' ? 'default' : 'secondary'}
              onClick={() => setTheme('light')}
            >
              <Sun className="h-4 w-4" />
              {t('theme.light')}
            </Button>
            <Button
              type="button"
              variant={theme === 'dark' ? 'default' : 'secondary'}
              onClick={() => setTheme('dark')}
            >
              <MoonStar className="h-4 w-4" />
              {t('theme.dark')}
            </Button>
            <Button
              type="button"
              variant={theme === 'system' ? 'default' : 'secondary'}
              onClick={() => setTheme('system')}
            >
              <Monitor className="h-4 w-4" />
              {t('theme.system')}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-card/70">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-500" />
                  <CardTitle>{t('health.title')}</CardTitle>
                </div>
                {statusBadge}
              </div>
              <CardDescription>{t('health.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <span className="text-muted-foreground">
                  {t('health.endpoint')}:
                </span>{' '}
                <code className="rounded bg-muted px-2 py-1">/api/health</code>
              </p>
              <p>
                <span className="text-muted-foreground">
                  {t('health.updated')}:
                </span>{' '}
                {updatedAt}
              </p>
              {healthQuery.isError && (
                <p className="text-destructive">{healthQuery.error.message}</p>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => healthQuery.refetch()}
                className="mt-2"
              >
                <RefreshCw className="h-4 w-4" />
                {t('health.refresh')}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card/70">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-cyan-500" />
                <CardTitle>{t('query.title')}</CardTitle>
              </div>
              <CardDescription>{t('query.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <label className="flex items-center justify-between rounded-lg border px-3 py-2">
                <span>{t('query.autoRefresh')}</span>
                <input
                  type="checkbox"
                  checked={polling}
                  onChange={(e) => setPolling(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
              </label>

              <p className="text-muted-foreground">{t('query.devtoolsHint')}</p>

              <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                {`queryKey: ['api-health']
refetchInterval: ${polling ? '5000' : 'false'}
source: api.getHealth()
theme: ${theme}
lang: ${i18n.language}`}
              </pre>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
