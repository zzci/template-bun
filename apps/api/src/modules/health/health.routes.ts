import type { AppEnv } from "@/shared/lib/types";
import { OpenAPIHono } from "@hono/zod-openapi";

export function healthRoutes() {
  const router = new OpenAPIHono<AppEnv>();

  router.get("/health", c => c.json({ status: "ok" }));

  return router;
}
