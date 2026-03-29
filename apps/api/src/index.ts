import process from "node:process";
import { createApp } from "./app";
import { loadConfig } from "./config";
import { createDb } from "./db";
import { acquirePidLock, releasePidLock } from "./pid-lock";
import { createLogger } from "./shared/lib/logger";

const config = loadConfig();

acquirePidLock(config.DB_PATH, config.PORT);

const logger = createLogger(config);
const db = createDb(config.DB_PATH);
const app = createApp({ config, db, logger });

const server = Bun.serve({
  port: config.PORT,
  hostname: config.HOST,
  fetch: app.fetch,
});

logger.info({ port: config.PORT, host: config.HOST }, "server started");

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "uncaught exception");
  shutdown("uncaughtException");
});
process.on("unhandledRejection", (reason) => {
  logger.fatal({ reason }, "unhandled rejection");
  shutdown("unhandledRejection");
});

async function shutdown(signal: string) {
  logger.info({ signal }, "shutting down");
  await server.stop(true);
  db.close();
  releasePidLock();
  logger.flush();
  process.exit(0);
}
