import { API_BASE_URL, API_TIMEOUT, DEFAULT_HEADERS } from "../config";
import type { ApiResponse, HttpMethod, RequestConfig } from "../types";

/* ────────────────────────────────────────────────────────────────────────────
 * SSR API Client
 *
 * Use this inside Server Components, `generateMetadata`, Route Handlers, and
 * Server Actions. It leverages the native `fetch` that Next.js extends with
 * caching / ISR support (`next.revalidate`, `next.tags`).
 *
 * Usage:
 *   import { serverApi } from "@/services/server/apiClient";
 *   const { data, error } = await serverApi.get<Event[]>("/events");
 * ──────────────────────────────────────────────────────────────────────────── */

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Build the full URL including query-string params. */
function buildUrl(
  baseUrl: string,
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): string {
  let url = baseUrl + path;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    }
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  return url;
}

/** Execute a server-side fetch and return a typed `ApiResponse<T>`. */
async function request<T>(
  baseUrl: string,
  baseHeaders: Record<string, string>,
  method: HttpMethod,
  path: string,
  config: RequestConfig = {},
): Promise<ApiResponse<T>> {
  const {
    headers,
    params,
    body,
    cache = "no-store",
    revalidate,
    tags,
    timeout = API_TIMEOUT,
  } = config;

  const url = buildUrl(baseUrl, path, params);

  const mergedHeaders: Record<string, string> = {
    ...baseHeaders,
    ...headers,
  };

  // Build Next.js-specific fetch options
  const nextOptions: Record<string, unknown> = {};
  if (revalidate !== undefined) nextOptions.revalidate = revalidate;
  if (tags?.length) nextOptions.tags = tags;

  // Abort controller for timeout
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method,
      headers: mergedHeaders,
      body: body ? JSON.stringify(body) : undefined,
      cache,
      signal: controller.signal,
      ...(Object.keys(nextOptions).length ? { next: nextOptions } : {}),
    });


    clearTimeout(timer);

    // Attempt to parse JSON; fall back to null for empty bodies
    let data: T | null = null;
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      data = (await response.json()) as T;
    }

    if (!response.ok) {
      return {
        data: null,
        error: {
          message:
            (data as Record<string, unknown>)?.message as string ??
            response.statusText,
          status: response.status,
          code:
            ((data as Record<string, unknown>)?.code as string) ?? undefined,
        },
        status: response.status,
      };
    }

    return { data, error: null, status: response.status };
  } catch (err) {
    clearTimeout(timer);

    const isAbort =
      err instanceof DOMException && err.name === "AbortError";

    return {
      data: null,
      error: {
        message: isAbort
          ? `Request timed out after ${timeout}ms`
          : (err as Error).message ?? "Unknown error",
        status: 0,
        code: isAbort ? "TIMEOUT" : "NETWORK_ERROR",
      },
      status: 0,
    };
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

export function createServerApi(
  baseUrl: string,
  baseHeaders: Record<string, string> = DEFAULT_HEADERS,
) {
  return {
    get<T>(path: string, config?: RequestConfig) {
      return request<T>(baseUrl, baseHeaders, "GET", path, config);
    },

    post<T>(path: string, config?: RequestConfig) {
      return request<T>(baseUrl, baseHeaders, "POST", path, config);
    },

    put<T>(path: string, config?: RequestConfig) {
      return request<T>(baseUrl, baseHeaders, "PUT", path, config);
    },

    patch<T>(path: string, config?: RequestConfig) {
      return request<T>(baseUrl, baseHeaders, "PATCH", path, config);
    },

    delete<T>(path: string, config?: RequestConfig) {
      return request<T>(baseUrl, baseHeaders, "DELETE", path, config);
    },
  };
}

export const serverApi = createServerApi(API_BASE_URL);