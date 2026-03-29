import { createApp } from "./app";
import { loadConfig } from "./config";
import { createDb } from "./db";
import { createLogger } from "./shared/lib/logger";

const config = loadConfig();
const logger = createLogger(config);
const db = createDb(config.DB_PATH);

export default createApp({ config, db, logger });
