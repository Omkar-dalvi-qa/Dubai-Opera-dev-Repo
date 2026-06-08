import type { Locale } from "@/i18n/config";
import { getBaseUrl, getLocalePath } from "@/lib/seo/schema";

function joinUrl(baseUrl: string, path: string) {
  const base = baseUrl.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`.replace(/\/+$/, "");
}

export function resolveCanonicalUrl(
  baseUrl: string,
  candidate: unknown,
  fallback: string,
) {
  if (typeof candidate !== "string") return fallback;
  const v = candidate.trim();
  if (!v) return fallback;
  try {
    const url = new URL(v, baseUrl);
    return url.toString();
  } catch {
    return fallback;
  }
}

export async function getCanonicalUrl(args: {
  locale: Locale;
  path?: string; // without locale prefix, e.g. "/news"
}) {
  const baseUrl = await getBaseUrl();
  const localeCode = getLocalePath(args.locale);
  const suffix = args.path ?? "";
  return joinUrl(baseUrl, `/${localeCode}${suffix}`);
}

export function getLanguageAlternates(args: {
  baseUrl: string;
  path: string; // without locale prefix, e.g. "/news" or "/news/my-slug"
}) {
  const en = joinUrl(args.baseUrl, `/${getLocalePath("en")}${args.path}`);
  const ar = joinUrl(args.baseUrl, `/${getLocalePath("ar")}${args.path}`);
  return {
    en,
    ar,
    "x-default": en,
  } as const;
}

