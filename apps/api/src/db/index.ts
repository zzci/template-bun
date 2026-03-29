import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { ROOT_DIR } from "../root";
import { embeddedMigrations } from "./embedded-migrations";
import * as schema from "./schema";

export function createDb(path: string) {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const sqlite = new Database(path, { create: true });
  sqlite.exec("PRAGMA journal_mode = WAL");
  sqlite.exec("PRAGMA foreign_keys = ON");
  sqlite.exec("PRAGMA busy_timeout = 5000");

  const db = drizzle(sqlite, { schema });

  runMigrations(db);

  return Object.assign(db, { close: () => sqlite.close() });
}

function runMigrations(db: ReturnType<typeof drizzle>) {
  const fsMigrationsFolder = resolve(ROOT_DIR, "apps/api/drizzle");
  const journalPath = resolve(fsMigrationsFolder, "meta/_journal.json");

  if (existsSync(journalPath)) {
    migrate(db, { migrationsFolder: fsMigrationsFolder });
  }
  else if (embeddedMigrations.size > 0) {
    const tmpMigrations = resolve(tmpdir(), `app-migrations-${process.pid}`);
    try {
      mkdirSync(resolve(tmpMigrations, "meta"), { recursive: true });
      for (const [name, content] of embeddedMigrations) {
        const filePath = resolve(tmpMigrations, name);
        mkdirSync(dirname(filePath), { recursive: true });
        writeFileSync(filePath, content);
      }
      migrate(db, { migrationsFolder: tmpMigrations });
    }
    finally {
      rmSync(tmpMigrations, { recursive: true, force: true });
    }
  }
  else {
    throw new Error("No migrations available (neither filesystem nor embedded). Cannot ensure database schema.");
  }
}

export type AppDatabase = ReturnType<typeof createDb>;
