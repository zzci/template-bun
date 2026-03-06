import { eq } from 'drizzle-orm'
import { cacheDel, cacheGet, cacheSet } from '../cache'
import { db } from '.'
import { appSettings as appSettingsTable } from './schema'

// --- App Settings helpers ---

const SETTINGS_CACHE_TTL = 300 // seconds

export async function getAppSetting(key: string): Promise<string | null> {
  const cacheKey = `app_setting:${key}`
  const cached = await cacheGet<string>(cacheKey)
  if (cached !== null && cached !== undefined) return cached

  const [row] = await db
    .select()
    .from(appSettingsTable)
    .where(eq(appSettingsTable.key, key))

  if (!row) return null

  await cacheSet(cacheKey, row.value, SETTINGS_CACHE_TTL)
  return row.value
}

export async function setAppSetting(key: string, value: string): Promise<void> {
  await db
    .insert(appSettingsTable)
    .values({ key, value })
    .onConflictDoUpdate({
      target: appSettingsTable.key,
      set: { value, updatedAt: new Date() },
    })

  await cacheDel(`app_setting:${key}`)
}
