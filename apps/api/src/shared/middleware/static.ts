import type { Context } from "hono";
import { staticAssets } from "../static-assets";

export function serveStaticAssets(c: Context) {
  const path = new URL(c.req.url).pathname;
  const asset = staticAssets.get(path) ?? staticAssets.get("/index.html");
  if (asset) {
    return new Response(Bun.file(asset));
  }
  return c.notFound();
}

export function hasStaticAssets(): boolean {
  return staticAssets.size > 0;
}
