import type { Config } from "./config";
import type { AppDatabase } from "./db";
import type { Logger } from "./shared/lib/logger";
import type { AppEnv } from "./shared/lib/types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { docsRoutes } from "./modules/docs";
import { healthRoutes } from "./modules/health";
import { errorHandler } from "./shared/middleware/error-handler";
import { loggingMiddleware } from "./shared/middleware/logging";
import { hasStaticAssets, serveStaticAssets } from "./shared/middleware/static";

interface AppDeps {
  readonly config: Config;
  readonly db: AppDatabase;
  readonly logger: Logger;
}

export function createApp({ config, db, logger }: AppDeps) {
  const api = new OpenAPIHono<AppEnv>({
    defaultHook: (result, c) => {
      if (!result.success) {
        return c.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Validation failed", details: result.error.flatten() } }, 422);
      }
    },
  });

  api.use("*", requestId());
  api.use("*", secureHeaders());
  api.use("*", cors({
    origin: config.CORS_ORIGIN ?? "*",
  }));
  api.use("*", (c, next) => {
    c.set("db", db);
    c.set("config", config);
    c.set("logger", logger);
    return next();
  });
  api.use("*", loggingMiddleware());

  api.route("/", healthRoutes());
  api.route("/", docsRoutes());

  api.onError(errorHandler);

  const app = new OpenAPIHono();
  app.route("/api", api);

  if (hasStaticAssets()) {
    app.get("*", serveStaticAssets);
  }

  return app;
}
