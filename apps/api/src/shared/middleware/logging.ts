import type { AppEnv } from "@/shared/lib/types";
import { createMiddleware } from "hono/factory";

export function loggingMiddleware() {
  return createMiddleware<AppEnv>(async (c, next) => {
    const start = performance.now();
    try {
      await next();
    }
    finally {
      const duration = Math.round(performance.now() - start);
      c.get("logger").info({
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        duration,
        requestId: c.get("requestId"),
      }, "request completed");
    }
  });
}
