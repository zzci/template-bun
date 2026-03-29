import type { AppEnv } from "@/shared/lib/types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";

export function docsRoutes() {
  const router = new OpenAPIHono<AppEnv>();

  router.doc("/openapi.json", {
    openapi: "3.1.0",
    info: {
      title: "API",
      version: "0.1.0",
    },
  });

  router.get("/docs", apiReference({ url: "/api/openapi.json" }));

  return router;
}
