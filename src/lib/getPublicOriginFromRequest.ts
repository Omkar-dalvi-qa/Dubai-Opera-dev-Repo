import type { NextRequest } from "next/server";

const TRAILING_SLASH = /\/+$/;

/** First segment when proxies send comma-separated forwarded values. */
function firstForwardedValue(header: string | null): string | null {
  if (!header) return null;
  const part = header.split(",")[0]?.trim();
  return part || null;
}

/**
 * Prefer the header that preserves `:port` when nginx sets `X-Forwarded-Host` from `$host`
 * (hostname only, no port) but forwards the real `Host` as `host:port`.
 */
function resolvePublicHost(
  forwardedHost: string | null,
  hostHeader: string | null,
  fallbackHost: string,
): string {
  const xf = forwardedHost?.trim() || null;
  const raw = hostHeader?.trim() || null;
  if (xf && raw) {
    try {
      const uX = new URL(`http://${xf}`);
      const uH = new URL(`http://${raw}`);
      if (uX.hostname === uH.hostname && uH.port && !uX.port) {
        return uH.host;
      }
    } catch {
      /* ignore */
    }
  }
  return (xf ?? raw ?? fallbackHost).trim();
}

/**
 * Browser-facing origin (`https://host[:port]`) for absolute redirects behind nginx/etc.
 *
 * 1. **`APP_CANONICAL_ORIGIN`** — use when the public URL cannot be inferred from headers
 *    (recommended for staging/production behind TLS termination).
 * 2. **`X-Forwarded-Host` + `X-Forwarded-Proto`** — typical reverse-proxy setup.
 * 3. **`Host` header + `X-Forwarded-Proto` or `nextUrl` scheme** — fallback.
 *
 * **Nginx:** Prefer `$http_host` (includes port) for `Host` and `X-Forwarded-Host`, not `$host`
 * (hostname only, drops `:port`), or the app will see the wrong origin after login.
 */
export function getPublicOriginFromRequest(request: NextRequest): string {
  const fromEnv = process.env.APP_CANONICAL_ORIGIN?.trim().replace(TRAILING_SLASH, "");
  if (fromEnv) return fromEnv;

  const xfHost = firstForwardedValue(request.headers.get("x-forwarded-host"));
  const xfProto = firstForwardedValue(request.headers.get("x-forwarded-proto"));
  const hostHeader = request.headers.get("host");

  const host = resolvePublicHost(xfHost, hostHeader, request.nextUrl.host);
  let proto = xfProto ?? request.nextUrl.protocol.replace(":", "");
  if (proto !== "http" && proto !== "https") {
    proto = request.nextUrl.protocol === "https:" ? "https" : "http";
  }

  return `${proto}://${host}`;
}
