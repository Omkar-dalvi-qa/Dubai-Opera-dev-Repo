import { createServerApi } from "./apiClient";

const EVENT_API_URL = process.env.NEXT_PUBLIC_EVENT_SERVICE_API_URL ?? "";
const EVENT_API_SECRET = process.env.NEXT_PUBLIC_EVENT_SERVICE_API_SECRET ?? "";

export const eventService = createServerApi(EVENT_API_URL, {
  "Content-Type": "application/json",
  ...(EVENT_API_SECRET ? { "X-Access-Key-Secret": EVENT_API_SECRET } : {}),
});

