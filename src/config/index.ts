export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export const API_TIMEOUT = 15_000;

export const DEFAULT_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
};

