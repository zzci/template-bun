import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { nanoid } from 'nanoid'
import { ulid } from 'ulid'

export function shortId() {
  return text('id')
    .primaryKey()
    .$defaultFn(() => nanoid(8))
}

export function id() {
  return text('id')
    .primaryKey()
    .$defaultFn(() => ulid())
}

export const commonFields = {
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
  isDeleted: integer('is_deleted').notNull().default(0),
}

export const runtimeEvents = sqliteTable('runtime_events', {
  id: id(),
  event: text('event').notNull(),
  ...commonFields,
})

export const appSettings = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  ...commonFields,
})
