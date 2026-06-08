import type { RequestConfig } from "@/types";

/** Optional cache hints for CMS/event GETs used in ISR pages. */
export type ServerFetchCacheOpts = {
    revalidate?: number;
    tags?: string[];
};

/**
 * Merge into `websiteService` / `eventService` GET config.
 * When `revalidate` is set, uses Data Cache with time-based revalidation (ISR).
 * Otherwise keeps previous behavior: `cache: "no-store"` (always fresh).
 */
export function mergeServerFetchCache(
    opts?: ServerFetchCacheOpts,
): Pick<RequestConfig, "cache" | "revalidate" | "tags"> {
    if (opts?.revalidate != null) {
        return {
            cache: "force-cache",
            revalidate: opts.revalidate,
            ...(opts.tags?.length ? { tags: opts.tags } : {}),
        };
    }
    // return { cache: "no-store" };
    return { cache: "force-cache" };
}
