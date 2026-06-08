import { cache } from "react";
import { TimelineStep } from "@/components/event-tabs/TimelineTab";
import { eventService } from "./eventService";
import {
  mergeServerFetchCache,
  type ServerFetchCacheOpts,
} from "./serverFetchCache";
import { CashCardApiProduct, CashCardProductsResponse } from "@/types";
import { generateBookingTicketPDFResponse, GetEventsBySearchResponse } from "@/types/website";

/** Shape returned by `GET /external/events` (see API docs / sample payload). */
export type ExternalEventCategory = {
  id: number;
  name: string;
  slug?: string;
};

export type ExternalEvent = {
  id?: number | string;
  name?: string;
  slug?: string;
  description?: string;
  short_description?: string;
  event_thumbnail_url?: string;
  status?: string;
  category?: ExternalEventCategory;
  seasonSlug?: string;
  thumbnail_url?: string;
  currency?: {
    name: string;
    code: string;
    symbol: string;
  };
  images?: Array<{
    imageUrl?: string;
    name?: string;
    width?: number;
    height?: number;
  }>;
  start_date?: string;
  end_date?: string;
  min_price?: number | string;
  screen?: string | null;
  screens?: string[];
  /** Legacy / alternate field names (still honored in helpers below) */
  title?: string;
  shortDescription?: string;
  image?: string;
  poster?: string;
  cover?: string;
  posterUrl?: string;
  imageUrl?: string;
  thumbnail?: string;
  season?: string;
  genre?: string;
  venue?: string;
  venueName?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  eventStartDate?: string;
  eventEndDate?: string;
  minPrice?: number | string;
  priceFrom?: number | string;
  price?: number | string;
  is_schedule_upcoming?: boolean;
  tag?: string;
};

export type CastAndCrewMember = {
  name: string;
  // role: string;
  description: string;
  image_url: string;
  type: string;
  stage_name: string
};

export type ExternalEventDetails = {
  id: number;
  name: string;
  slug: string;
  min_price: number | string;
  has_addons?: boolean;
  currency?: {
    name: string;
    code: string;
    symbol: string;
  };
  /** Season URL segment (e.g. season-2025-26); API may send `season_slug` instead */
  seasonSlug?: string;
  season_slug?: string;
  description: string;
  short_description: string;
  status: string;
  category: ExternalEventCategory;
  thumbnail_url: string;
  business_unit?: { id: number; name: string };
  screens?: { id: number; name: string }[];
  media_url?: string;
  images?: Array<{
    imageUrl?: string;
    name?: string;
    height?: number;
    width?: number;
  }>;
  schedules?: unknown[];
  timeline?: {
    heading: string;
    total_duration: string;
    timeline_data: TimelineStep[];
    late_comer_policy: string;
  };
  cast_and_crew?: {
    description: string;
    cast_and_crew_data: CastAndCrewMember[];
  };
  dress_code?: {
    image_url: string;
    description: string;
  };
  gallery?: {
    gallery_data: {
      id: string;
      image_url: string;
      video_url?: string;
      youtube_url?: string;
    }[];
  };
  terms_and_conditions?: string;
  seo?: unknown;
};

export type ExternalVisitOperaScheduleTicketType = {
  type_id?: number;
  type_name?: string;
  price?: number | string;
};

export type ExternalVisitOperaScheduleTicket = {
  class_id?: number;
  class_name?: string;
  types?: ExternalVisitOperaScheduleTicketType[];
};

export type ExternalVisitOperaSchedule = {
  id?: number;
  schedule_id?: number;
  date?: string;
  time_slot?: {
    id?: number;
    time_slot_id?: number;
    start_time?: string;
    end_time?: string;
  };
  tickets?: ExternalVisitOperaScheduleTicket[];
};

export type ExternalEventSchedule = {
  slug?: string;
  schedule_id?: number;
  date?: string;
  time_slot?: {
    start_time?: string;
    end_time?: string;
  };
  screen?: {
    id?: number;
    name?: string;
  } | null;
  is_seat_booking_enabled?: boolean;
  registration_start_date?: string | null;
  registration_end_date?: string | null;
  chart_id?: string | null;
  tickets?: Array<{
    class_id?: number;
    class_name?: string;
    types?: Array<{
      type_id?: number;
      type_name?: string;
      price?: number | string;
    }>;
  }>;
};

export type ExternalVisitOperaCurrency = {
  id?: number;
  name?: string;
  code?: string;
  symbol?: string;
};

export type ExternalVisitOperaCategory = {
  id?: number;
  name?: string;
  slug?: string;
};

export type ExternalVisitOperaImage = {
  imageUrl?: string;
  name?: string;
  width?: number;
  height?: number;
};

export type ExternalVisitOperaData = {
  product_id?: number;
  name?: string;
  slug?: string;
  description?: string | null;
  short_description?: string | null;
  status?: string;
  category?: ExternalVisitOperaCategory;
  images?: ExternalVisitOperaImage[];
  currency?: ExternalVisitOperaCurrency;
  has_addons?: boolean;
  min_price?: number;
  max_price?: number;
  min_duration?: number;
  max_duration?: number;
  schedules?: ExternalVisitOperaSchedule[];
};

export type ExternalBookingDetailsResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
  [key: string]: unknown;
};

export type ExternalEventScreen = {
  id: number;
  name: string;
  code?: string | null;
  description?: string | null;
  sort_order?: number;
};

export type ExternalEventSeries = {
  id?: number | string;
  name?: string;
  slug?: string;
  short_description?: string;
  description?: string;
  thumbnail_url?: string;
  is_active?: boolean;
};

export type ExternalEventSeason = {
  name: string;
  slug: string;
};

function dataArray<T>(body: unknown): T[] {
  if (!body || typeof body !== "object") return [];
  const b = body as Record<string, unknown>;
  const top = b.data;
  if (Array.isArray(top)) return top as T[];
  return [];
}

export async function getExternalBookDetailsServer(
  transactionId: string,
  locale?: string,
): Promise<ExternalBookingDetailsResponse> {
  const id = String(transactionId || "").trim();
  if (!id) return { success: false, message: "Invalid transaction id" };

  const res = await eventService.get<ExternalBookingDetailsResponse>(
    `/external/booking/transaction/${encodeURIComponent(id)}`,
    { cache: "no-store", params: { locale } },
  );
  console.log("[getExternalBookDetailsServer] res:", res);
  console.log("[getExternalBookDetailsServer] id:", id);

  if (res.error) {
    return { success: false, message: res.error.message };
  }

  const data = res.data ?? { success: true };
  return data;
}

export async function generateBookingTicketPDF(
  transactionId: string,
  locale?: string,
): Promise<generateBookingTicketPDFResponse | null> {
  const id = String(transactionId || "").trim();
  if (!id) return { success: false, message: "Invalid transaction id" };

  const res = await eventService.get<generateBookingTicketPDFResponse>(
    `/external/booking/ticket-pdf/${encodeURIComponent(id)}`,
    { cache: "no-store", params: { locale } },
  );
  console.log("[generateBookingTicketPDF] res:", res);
  return res.data ?? null;
}

export async function getEventsBySearch(
  search: string,
  locale?: string,
): Promise<GetEventsBySearchResponse | null> {
  const res = await eventService.get<GetEventsBySearchResponse>(
    `/external/search`,
    { cache: "no-store", params: { locale, search } },
  );
  console.log("[getEventsBySearch] res121212:", res);
  return res.data as GetEventsBySearchResponse | null;
}

export async function getExternalVisitOperaSchedules(
  locale?: string,
): Promise<{
  success: boolean;
  message?: string;
  data: ExternalVisitOperaData | null;
  timestamp?: string;
}> {
  const res = await eventService.get<{
    success?: boolean;
    message?: string;
    data?:
    | ExternalVisitOperaSchedule[]
    | ExternalVisitOperaData;
    timestamp?: string;
  }>("/external/products/visit-opera/schedules", {
    cache: "no-store",
    params: locale ? { locale } : undefined,
  });

  if (res.error) {
    return {
      success: false,
      message: res.error.message || "Failed to fetch visit opera schedules.",
      data: null,
      timestamp: new Date().toISOString(),
    };
  }

  const objectData = res.data?.data;
  const data = Array.isArray(objectData)
    ? { schedules: objectData }
    : objectData && typeof objectData === "object"
      ? objectData
      : null;

  return {
    success: res.data?.success === true,
    message: res.data?.message,
    data,
    timestamp: res.data?.timestamp,
  };
}

export type SeasonSectionEventItem = {
  id: number | string;
  slug: string;
  thumbnail_url?: string;
  image: string;
  imageWidth?: number;
  imageHeight?: number;
  category: string;
  /** From API `category.slug` — used for `/events/[genre]/...` routing */
  categorySlug?: string;
  /** From API `category.id` — used for `category_ids` filtering */
  categoryId?: number;
  title: string;
  location: string;
  date: string;
  price: string;
  tag?: string;
  /** ISO strings from API — used for client-side date filtering */
  startDateIso?: string;
  endDateIso?: string;
  /** From API `season` — used for section heading (first item) */
  seasonName?: string;
  /** Optional URL segment from API (e.g. list page slug) */
  seasonSlug?: string;
  /** From API `slug` — per-event routing */
  eventSlug?: string;
  isScheduleUpcoming?: boolean;
};



function pickEventImageMeta(e: ExternalEvent): {
  url: string;
  width?: number;
  height?: number;
} {
  const mobileBanner =
    e.images?.find((img) => String(img?.name ?? "").toLowerCase() === "mobile banner") ??
    e.images?.find((img) => String(img?.name ?? "").toLowerCase().includes("mobile"));

  if (mobileBanner?.imageUrl) {
    return {
      url: mobileBanner.imageUrl,
      ...(typeof mobileBanner.width === "number" ? { width: mobileBanner.width } : {}),
      ...(typeof mobileBanner.height === "number" ? { height: mobileBanner.height } : {}),
    };
  }

  return {
    url:
      e.thumbnail_url ??
      e.cover ??
      e.poster ??
      e.image ??
      e.posterUrl ??
      e.imageUrl ??
      e.thumbnail ??
      "",
  };
}

function pickEventImage(e: ExternalEvent): string {
  return pickEventImageMeta(e).url;
}

function formatEventDateRange(e: ExternalEvent): string {
  const start =
    e.start_date ??
    e.startDate ??
    e.eventStartDate;
  const end =
    e.end_date ??
    e.endDate ??
    e.eventEndDate;
  if (start && end) {
    try {
      const ds = new Date(start);
      const de = new Date(end);
      if (!Number.isNaN(ds.getTime()) && !Number.isNaN(de.getTime())) {
        const opts: Intl.DateTimeFormatOptions = {
          day: "numeric",
          month: "short",
          year: "numeric",
        };
        return `${ds.toLocaleDateString("en-GB", opts)} - ${de.toLocaleDateString("en-GB", opts)}`;
      }
    } catch {
      /* fall through */
    }
    return `${start} - ${end}`;
  }
  if (start) return String(start);
  return "Dates TBA";
}

function unwrapEvents(body: unknown): ExternalEvent[] {
  if (!body || typeof body !== "object") return [];
  const b = body as Record<string, unknown>;

  if (Array.isArray(b)) return b as ExternalEvent[];

  const top = b.data;
  if (Array.isArray(top)) return top as ExternalEvent[];

  if (top && typeof top === "object") {
    const inner = top as Record<string, unknown>;
    if (Array.isArray(inner.data)) return inner.data as ExternalEvent[];
    if (Array.isArray(inner.events)) return inner.events as ExternalEvent[];
    if (Array.isArray(inner.items)) return inner.items as ExternalEvent[];
  }

  if (Array.isArray(b.events)) return b.events as ExternalEvent[];
  if (Array.isArray(b.items)) return b.items as ExternalEvent[];

  return [];
}

function sortExternalEventsByProductIdOrder(
  events: ExternalEvent[],
  order: string[],
): ExternalEvent[] {
  const rank = new Map(order.map((id, i) => [id, i]));
  return [...events].sort((a, b) => {
    const aid = String(a.id ?? "");
    const bid = String(b.id ?? "");
    return (rank.get(aid) ?? 999) - (rank.get(bid) ?? 999);
  });
}

export async function getExternalEvents(
  args: {
    page?: number;
    limit?: number;
    locale?: string;
    tags?: string[];
    season?: string;
    /** When set, loads those events via by-event-ids (banner-driven home strip). */
    productIds?: string[];
  },
  fetchOpts?: ServerFetchCacheOpts,
): Promise<ExternalEvent[]> {
  const { page = 1, limit = 10, season, locale, tags, productIds } = args;

  // if (productIds && productIds.length > 0) {
  //   const byIds = await getEventbyIds(productIds, fetchOpts);
  //   return sortExternalEventsByProductIdOrder(byIds, productIds).slice(0, limit);
  // }

  console.log("productIds", productIds);

  const res = await eventService.get<unknown>("/external/products", {
    params: {
      page,
      limit,
      product_type: "EVENT",
      ...(season ? { season } : {}),
      ...(tags ? { tags: tags.join(",") } : {}),
      ...(locale ? { locale } : {}),
      ...(productIds ? { product_ids: productIds.join(",") } : {}),
    },
    ...mergeServerFetchCache(fetchOpts),
  });

  const EVENT_API_URL = process.env.NEXT_PUBLIC_EVENT_SERVICE_API_URL ?? "";
  const EVENT_API_SECRET = process.env.NEXT_PUBLIC_EVENT_SERVICE_API_SECRET ?? "";

  console.log("EVENT_API_URL", EVENT_API_URL);
  console.log("EVENT_API_SECRET", EVENT_API_SECRET);

  console.log("getExternalEvents", res);
  return unwrapEvents(res.data);
}

export async function getExternalEventScreens(
  args?: { locale?: string },
  fetchOpts?: ServerFetchCacheOpts,
): Promise<ExternalEventScreen[]> {
  const res = await eventService.get<unknown>("/external/events/screens", {
    params: { ...(args?.locale ? { locale: args.locale } : {}) },
    ...mergeServerFetchCache(fetchOpts),
  });
  return dataArray<ExternalEventScreen>(res.data);
}

export async function getExternalEventSeasons(args?: {
  locale?: string;
}): Promise<ExternalEventSeason[]> {
  const res = await eventService.get<{
    data?: Array<string | number | { name?: string | null; slug?: string | null }>;
  }>("/external/event/seasons", {
    params: { ...(args?.locale ? { locale: args.locale } : {}) },
    cache: "no-store",
  });

  return (res.data?.data ?? [])
    .map((item) => {
      if (typeof item === "string" || typeof item === "number") {
        const value = String(item).trim();
        if (!value) return null;
        return { name: value, slug: value };
      }
      const name = String(item?.name ?? "").trim();
      const slug = String(item?.slug ?? "").trim();
      if (!name || !slug) return null;
      return { name, slug };
    })
    .filter((item): item is ExternalEventSeason => item !== null);
}

export async function getExternalEventSeries(
  args?: { locale?: string },
): Promise<ExternalEventSeries[]> {
  const res = await eventService.get<unknown>("/external/event/series", {
    params: { ...(args?.locale ? { locale: args.locale } : {}) },
  });
  console.log("getExternalEventSeries", res);
  return dataArray<ExternalEventSeries>(res.data);
}

export async function getExternalEventsBySeriesSlug(
  args: { slug: string; locale?: string },
  fetchOpts?: ServerFetchCacheOpts,
): Promise<ExternalEvent[]> {
  const slug = String(args.slug ?? "").trim();
  if (!slug) return [];

  const res = await eventService.get<unknown>(
    `/external/event/series/${encodeURIComponent(slug)}`,
    {
      params: { ...(args.locale ? { locale: args.locale } : {}) },
      ...mergeServerFetchCache(fetchOpts),
    },
  );

  return unwrapEvents(res.data);
}

export async function getEventbyIds(
  ids: string[],
  fetchOpts?: ServerFetchCacheOpts,
): Promise<ExternalEvent[]> {
  if (!ids.length) return [];
  const res = await eventService.get<unknown>(`/external/customer/by-event-ids`, {
    params: { product_ids: ids.join(",") },
    ...mergeServerFetchCache(fetchOpts),
  });
  return unwrapEvents(res.data);
}

export async function getExternalEventDetails(args: {
  slug: string;
  locale?: string;
  draftPassword?: string;
}): Promise<ExternalEventDetails | null> {
  const result = await getExternalEventDetailsResult(args);
  return result.ok ? result.data : null;
}

/** Same as `getExternalEventDetails`, deduped per request when called with the same `slug` (e.g. layout + page). */
export const getExternalEventDetailsCached = cache(
  async (slug: string, args?: { locale?: string }): Promise<ExternalEventDetails | null> => {
    return getExternalEventDetails({ slug, ...args });
  },
);

export type ExternalEventDetailsResult =
  | { ok: true; data: ExternalEventDetails }
  | {
    ok: false;
    reason: "PASSWORD_REQUIRED" | "NOT_FOUND" | "ERROR";
    message?: string;
  };

function isDraftPasswordRequired(message: unknown): boolean {
  const msg = String(message ?? "").toUpperCase();
  return msg.includes("DRAFT_PASSWORD_REQUIRED") || msg.includes("DRAFT_EVENT");
}

export async function getExternalEventDetailsResult(args: {
  slug: string;
  locale?: string;
  draftPassword?: string;
  channel?: string;
}): Promise<ExternalEventDetailsResult> {
  const slug = String(args.slug ?? "").trim();
  const locale = args.locale;
  const draftPassword = String(args.draftPassword ?? "").trim() || undefined;
  const channel = String(args.channel ?? "web").trim() || "web";
  if (!slug) return { ok: false, reason: "NOT_FOUND", message: "Missing event slug" };

  const draftAuthUser = process.env.EVENT_DRAFT_AUTH_USER ?? "htauth";
  const authHeader =
    draftPassword ? `Basic ${Buffer.from(`${draftAuthUser}:${draftPassword}`).toString("base64")}` : undefined;

  const res = await eventService.get<{
    success?: boolean;
    message?: string;
    data?: ExternalEventDetails;
  }>(`/external/products/${encodeURIComponent(slug)}`, {
    cache: "no-store",
    params: {
      ...(locale ? { locale } : {}),
      ...(channel ? { channel } : {}),
      ...(draftPassword ? { password: draftPassword } : {}),
    },
    // Upstream expects password in payload/body.
    // body: draftPassword ? { password: draftPassword } : undefined,
    headers: draftPassword
      ? {
        Authorization: authHeader!,
      }
      : undefined,
  });

  if (res.error) {
    if (isDraftPasswordRequired(res.error.message)) {
      return { ok: false, reason: "PASSWORD_REQUIRED", message: "DRAFT_PASSWORD_REQUIRED" };
    }
    if (res.error.status === 404) {
      return { ok: false, reason: "NOT_FOUND", message: res.error.message };
    }
    return { ok: false, reason: "ERROR", message: res.error.message };
  }

  if (res.data?.success && res.data.data) return { ok: true, data: res.data.data };

  if (isDraftPasswordRequired(res.data?.message)) {
    return { ok: false, reason: "PASSWORD_REQUIRED", message: "DRAFT_PASSWORD_REQUIRED" };
  }

  return { ok: false, reason: "NOT_FOUND", message: res.data?.message ?? "Event not found" };
}

export async function getExternalEventSchedules(args: {
  slug: string;
  locale?: string;
  channel?: string;
}): Promise<ExternalEventSchedule[]> {
  const channel = String(args.channel ?? "web").trim() || "web";
  const res = await eventService.get<{
    success?: boolean;
    message?: string;
    data?: {
      slug?: string;
      schedules?: ExternalEventSchedule[];
    };
    timestamp?: string;
  }>(`/external/products/${encodeURIComponent(args.slug)}/schedules`, {
    cache: "no-store",
    params: { ...(args.locale ? { locale: args.locale } : {}), ...(channel ? { channel } : {}) },
  });
  return res.data?.data?.schedules ?? [];
}




export function mapExternalEventsToNewsPosts(
  events: ExternalEvent[],
): {
  slug: string;
  title: string;
  short_description: string;
  cover: string;
  category: string;
}[] {
  return events
    .map((e, idx) => {
      const cover = pickEventImage(e);
      const short =
        e.short_description ??
        e.shortDescription ??
        e.description ??
        "";
      return {
        slug: String(e.slug ?? e.id ?? `event-${idx}`),
        title: String(e.name ?? e.title ?? "Event"),
        short_description: String(short),
        cover,
        category: e.category?.name ?? "Event"
      };
    })
    .filter((p) => p.cover.length > 0);
}

const FALLBACK_CARD_IMAGE = "/images/fallback.png";


export function mapExternalEventsToSeasonCards(
  events: ExternalEvent[],
): SeasonSectionEventItem[] {
  return events.map((e, idx) => {
    const imageMeta = pickEventImageMeta(e);
    const image = imageMeta.url || FALLBACK_CARD_IMAGE;
    const eventSlug = String(e.slug ?? e.id ?? `event-${idx}`);
    // console.log(e, 'e', e.category?.name);
    return {
      id: e.id ?? idx,
      eventSlug,
      slug: e.slug ?? `event-${idx}`,
      thumbnail_url: e.thumbnail_url ?? undefined,
      seasonName: e.season ?? "",
      seasonSlug: e.seasonSlug ?? "",
      image,
      category: e.category?.name ?? "Event",
      categorySlug: e.category?.slug,
      categoryId: e.category?.id,
      title: String(e.name ?? e.title ?? "Event"),
      location: e.screens?.[0] ?? "-",
      date: formatEventDateRange(e),
      price: String(e.min_price ?? "-"),
      ...(typeof e.is_schedule_upcoming === "boolean"
        ? { isScheduleUpcoming: e.is_schedule_upcoming }
        : {}),
      ...(e.tag ? { tag: String(e.tag) } : {}),
      ...(e.start_date ? { startDateIso: e.start_date } : {}),
      ...(e.end_date ? { endDateIso: e.end_date } : {}),
    };
  });
}

export async function getCashCardProducts({ locale }: { locale?: string }): Promise<CashCardApiProduct[]> {
  const res = await eventService.get<CashCardProductsResponse>("/external/cashcard/products", {
    cache: "no-store",
    params: locale ? { locale } : undefined,

  });
  return res.data?.data ?? [] as CashCardApiProduct[];
}

export async function getCashCardProduct(id: string): Promise<CashCardApiProduct[] | null> {
  const res = await eventService.get<CashCardProductsResponse>(`/external/cashcard/products`, {
    cache: "no-store",
    params: { product_id: id },
  }); 
  return res?.data?.data ?? null;
}


// export async function getSeatLayout(schedule_id: string): Promise<any | null> {
//   const res = await eventService.get<any>(`/external/seat-layout/${schedule_id}`, {
//     cache: "no-store",
//   });
//   console.log(res, "Seat Layout Response>>>")
//   return res?.data ?? null;
// }