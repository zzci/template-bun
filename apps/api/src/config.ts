import { resolve } from "node:path";
import process from "node:process";
import { z } from "zod";
import { ROOT_DIR } from "./root";

const configSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOST: z.string().default("0.0.0.0"),
  DB_PATH: z.string().default("data/db/app.db"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  LOG_FILE: z.string().default("data/logs/app.log"),
  CORS_ORIGIN: z.string().optional(),
});

export type Config = z.infer<typeof configSchema>;

function resolvePath(p: string): string {
  return p.startsWith("/") ? p : resolve(ROOT_DIR, p);
}

export function loadConfig(): Config {
  const result = configSchema.safeParse(Bun.env);
  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    console.error("Invalid configuration:", JSON.stringify(formatted, null, 2));
    process.exit(1);
  }
  const data = result.data;

  if (data.NODE_ENV === "production" && !data.CORS_ORIGIN) {
    console.error("CORS_ORIGIN is required in production");
    process.exit(1);
  }

  return {
    ...data,
    DB_PATH: resolvePath(data.DB_PATH),
    LOG_FILE: resolvePath(data.LOG_FILE),
  };
}
