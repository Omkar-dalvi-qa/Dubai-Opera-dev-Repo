import { createServerApi } from "./apiClient";

function readEnv(name: string): string {
  const raw = process.env[name];
  if (!raw) return "";
  // Handle accidental wrapping quotes in .env like: "http://..." or 'http://...'
  return raw.trim().replace(/^['"]|['"]$/g, "");
}

export const WEBSITE_API_URL = process.env.NEXT_PUBLIC_WEBSITE_SERVICE_API_URL ?? "";

console.log("WEBSITE_API_URL", WEBSITE_API_URL);


export const websiteService = createServerApi(WEBSITE_API_URL);
