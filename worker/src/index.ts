export interface Env {
  BUCKET: R2Bucket;
  CORS_ALLOW_ORIGINS?: string;
  ALLOW_LOCALHOST_CORS?: string;
}

function shouldEdgeCache(req: Request, key: string): boolean {
  if (req.method !== "GET") return false;
  if (req.headers.has("Range")) return false;

  const lower = key.toLowerCase();
  return lower.endsWith(".ts") || lower.endsWith(".m4s");
}

function parseCorsAllowList(env: Env) {
  const raw =
    env.CORS_ALLOW_ORIGINS ??
    "https://*.igcrystal.icu,https://*.revaea.com,https://www.revaea.com,https://revaea.com,https://igcrystal.icu,https://www.igcrystal.icu";

  const items = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const allowedExactOrigins = new Set<string>();
  const allowedExactHosts = new Set<string>();
  const allowedHostSuffixes = new Set<string>();

  for (const item of items) {
    if (item.includes("://")) {
      try {
        const u = new URL(item);
        const host = u.host;
        if (host.startsWith("*.")) allowedHostSuffixes.add(host.slice(1));
        else allowedExactOrigins.add(item);
      } catch {
        // ignore
      }
    } else {
      if (item.startsWith("*.")) allowedHostSuffixes.add(item.slice(1));
      else allowedExactHosts.add(item);
    }
  }

  const allowLocalhost =
    (env.ALLOW_LOCALHOST_CORS ?? "1").toLowerCase() !== "0";

  if (allowLocalhost) {
    const dev = [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:8080",
      "http://127.0.0.1:8080",
      "http://localhost:4321",
      "http://127.0.0.1:4321",
    ];
    for (const o of dev) allowedExactOrigins.add(o);
  }

  return { allowedExactOrigins, allowedExactHosts, allowedHostSuffixes };
}

function isOriginAllowed(origin: string | null, env: Env) {
  if (!origin) return false;

  const { allowedExactOrigins, allowedExactHosts, allowedHostSuffixes } =
    parseCorsAllowList(env);

  if (allowedExactOrigins.has(origin)) return true;

  let host: string;
  try {
    host = new URL(origin).host;
  } catch {
    return false;
  }

  if (allowedExactHosts.has(host)) return true;

  for (const suf of allowedHostSuffixes) {
    const s = suf.replace(/^\./, "");
    if (host === s || host.endsWith("." + s)) return true;
  }
  return false;
}

function applyCors(req: Request, resp: Response, env: Env) {
  const origin = req.headers.get("Origin");
  if (isOriginAllowed(origin, env)) {
    resp.headers.set("Access-Control-Allow-Origin", origin!);
    resp.headers.set("Vary", "Origin");
  }

  resp.headers.set("Access-Control-Allow-Methods", "GET,HEAD,POST,OPTIONS");
  resp.headers.set(
    "Access-Control-Allow-Headers",
    req.headers.get("Access-Control-Request-Headers") ?? "Content-Type, Range",
  );

  return resp;
}

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function contentTypeForKey(key: string): string | null {
  const lower = key.toLowerCase();
  if (lower.endsWith(".m3u8")) return "application/vnd.apple.mpegurl";
  if (lower.endsWith(".ts")) return "video/mp2t";
  if (lower.endsWith(".m4s")) return "video/iso.segment";
  if (lower.endsWith(".mpd")) return "application/dash+xml";
  if (lower.endsWith(".json")) return "application/json; charset=utf-8";
  return null;
}

function cacheControlForKey(key: string): string {
  const lower = key.toLowerCase();
  if (lower.endsWith(".m3u8")) return "public, max-age=60";
  if (lower.endsWith("playlist.json")) return "public, max-age=60";
  if (lower.endsWith(".ts") || lower.endsWith(".m4s"))
    return "public, max-age=86400";
  return "public, max-age=300";
}

function parseRange(
  rangeHeader: string | null,
): { offset: number; length?: number } | null {
  if (!rangeHeader) return null;
  const m = rangeHeader.match(/^bytes=(\d+)-(\d+)?$/);
  if (!m) return null;
  const start = Number(m[1]);
  const end = m[2] ? Number(m[2]) : undefined;
  if (!Number.isFinite(start) || start < 0) return null;
  if (end !== undefined) {
    if (!Number.isFinite(end) || end < start) return null;
    return { offset: start, length: end - start + 1 };
  }
  return { offset: start };
}

async function serveR2Object(env: Env, req: Request, key: string) {
  if (req.method === "HEAD") {
    const meta = await env.BUCKET.head(key);
    if (!meta) return new Response("Not Found", { status: 404 });

    const headers = new Headers();
    const ct = contentTypeForKey(key);
    if (ct) headers.set("Content-Type", ct);
    headers.set("Cache-Control", cacheControlForKey(key));
    headers.set("Accept-Ranges", "bytes");
    if (meta.httpEtag) headers.set("ETag", meta.httpEtag);
    headers.set("Content-Length", String(meta.size));
    return new Response(null, { status: 200, headers });
  }

  if (shouldEdgeCache(req, key)) {
    const cacheKey = new Request(req.url, { method: "GET" });
    const hit = await caches.default.match(cacheKey);
    if (hit) return hit;
  }

  const range = parseRange(req.headers.get("Range"));
  const obj = await env.BUCKET.get(key, range ? { range } : undefined);
  if (!obj) return new Response("Not Found", { status: 404 });

  const headers = new Headers();
  const ct = contentTypeForKey(key);
  if (ct) headers.set("Content-Type", ct);
  headers.set("Cache-Control", cacheControlForKey(key));
  headers.set("Accept-Ranges", "bytes");

  if (obj.httpEtag) headers.set("ETag", obj.httpEtag);

  if (
    range &&
    obj.range &&
    "offset" in obj.range &&
    typeof obj.range.offset === "number" &&
    typeof obj.range.length === "number"
  ) {
    const start = obj.range.offset;
    const end = obj.range.offset + obj.range.length - 1;
    headers.set("Content-Range", `bytes ${start}-${end}/${obj.size}`);
    headers.set("Content-Length", String(obj.range.length));
    return new Response(obj.body, { status: 206, headers });
  }

  headers.set("Content-Length", String(obj.size));

  const resp = new Response(obj.body, { status: 200, headers });
  if (shouldEdgeCache(req, key)) {
    const cacheKey = new Request(req.url, { method: "GET" });
    // Best-effort: avoid delaying the response on cache writes.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    caches.default.put(cacheKey, resp.clone());
  }
  return resp;
}

function safeDecodeKey(key: string): string {
  try {
    return decodeURIComponent(key);
  } catch {
    return key;
  }
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (req.method === "OPTIONS") {
      return applyCors(req, new Response(null, { status: 204 }), env);
    }

    const method = req.method;
    const isGetOrHead = method === "GET" || method === "HEAD";

    const url = new URL(req.url);
    const path = url.pathname;

    if (path === "/api/health" && isGetOrHead) {
      return applyCors(req, json({ status: "ok" }), env);
    }

    if (path === "/api/video/playlist" && isGetOrHead) {
      const r = await serveR2Object(env, req, "video-playlist/playlist.json");
      return applyCors(req, r, env);
    }

    if (path === "/api/music/playlist" && isGetOrHead) {
      const r = await serveR2Object(env, req, "music-playlist/playlist.json");
      return applyCors(req, r, env);
    }

    if (
      (path === "/api/scan/video" || path === "/api/scan/music") &&
      req.method === "POST"
    ) {
      return applyCors(
        req,
        json(
          { error: "scan is not available in worker-only mode" },
          { status: 501 },
        ),
        env,
      );
    }

    if (path.startsWith("/video-hls/") && isGetOrHead) {
      const key = safeDecodeKey(path.slice(1));
      const r = await serveR2Object(env, req, key);
      return applyCors(req, r, env);
    }

    if (path.startsWith("/music-hls/") && isGetOrHead) {
      const key = safeDecodeKey(path.slice(1));
      const r = await serveR2Object(env, req, key);
      return applyCors(req, r, env);
    }

    return applyCors(req, new Response("Not Found", { status: 404 }), env);
  },
};
