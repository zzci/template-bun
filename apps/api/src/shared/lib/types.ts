import type { Config } from "@/config";
import type { AppDatabase } from "@/db";
import type { Logger } from "@/shared/lib/logger";

export interface AppEnv {
  Variables: {
    requestId: string;
    db: AppDatabase;
    config: Config;
    logger: Logger;
  };
}
