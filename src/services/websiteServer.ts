import { websiteService, WEBSITE_API_URL } from "./websiteService";
import {
  mergeServerFetchCache,
  type ServerFetchCacheOpts,
} from "./serverFetchCache";
import { LONG_REVALIDATE_SECONDS } from "@/app/[locale]/RevalidateConstants";

import type {
  BookingHistoryRecord,
  CreateCustomerBody,
  CreateCustomerResult,
  CustomerDto,
  EventRegisteredBody,
  EventRegisteredResult,
  GetBookingHistoryResponse,
  GetCustomerByEmaarIdResponse,
  GetUserGiftCardsResponse,
  ProfileGiftCardItem,
  PartnerCategory,
  SubscribeResult,
  WebsiteBanner,
  WebsiteMenu,
  WebsiteMenuItem,
  WebsitePostDetail,
  WebsitePostItem,
} from "@/types/website";
import { EmaarPassUserProfile } from "@/types/emaarpass";
import { eventService } from "./eventService";

// const WEBSITE_API_URL = process.env.WEBSITE_SERVICE_API_URL ?? "";

type GetMenuResponse = { menu: WebsiteMenu };

/** 5 hours — aligns with home page ISR window. */
// const MENU_CACHE_SECONDS = parseInt(process.env.NEXT_PUBLIC_CACHE_SECONDS ?? "18000", 10);

export async function getMenu(location: string, locale: string = "en"): Promise<WebsiteMenu | null> {
  if (!location) return null;



  const res = await websiteService.get<GetMenuResponse>("/menus", {
    params: { location, locale },
    ...mergeServerFetchCache({ revalidate: LONG_REVALIDATE_SECONDS }),
  });

  console.log("res", res, "location", location, "locale", locale);

  return res.data?.menu ?? null;
}

type GetBannersResponse = {
  banners: WebsiteBanner[];
  /** Placement-level linked events (e.g. home season product ids). */
  events?: Array<{ externalEventId?: string }>;
  placement: string;
  device: string | null;
  locale: string;
};

export type BannersWithLinkedEvents = {
  banners: WebsiteBanner[];
  linkedEventIds: string[];
};

function toAbsoluteUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  try {
    return new URL(pathOrUrl, WEBSITE_API_URL).toString();
  } catch {
    return pathOrUrl;
  }
}

export async function getBanners(
  args: {
    placement: string;
    device?: "BOTH" | "DESKTOP" | "MOBILE";
    locale: string;
  },
  fetchOpts?: ServerFetchCacheOpts,
): Promise<BannersWithLinkedEvents> {
  const { placement, device = "BOTH", locale } = args;

  const res = await websiteService.get<GetBannersResponse>("/banners", {
    params: { placement, device, locale },
    ...mergeServerFetchCache(fetchOpts),
  });

  console.log("res", res.data);

  const banners = res.data?.banners ?? [];
  const filteredBanners = banners
    .filter((b) => b.isActive)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((b) => ({
      ...b,
      imagePath: toAbsoluteUrl(b.imagePath),
      mobileImagePath: toAbsoluteUrl(b.mobileImagePath),
      image: toAbsoluteUrl(b.image),
      mobileImage: toAbsoluteUrl(b.mobileImage),
      videoUrl: toAbsoluteUrl(b.videoUrl),
      youtubeUrl: toAbsoluteUrl(b.youtubeUrl),
      ctaUrl: toAbsoluteUrl(b.ctaUrl),
    }));

  const linkedEventIds =
   (res.data?.events ?? [])
    .map((e) => String(e?.externalEventId ?? "").trim())
    .filter((externalEventId) => externalEventId.length > 0);


  // console.log("res.data?.events", res.data?.events);

  // console.log("linkedEventIds", linkedEventIds);

  return { banners: filteredBanners, linkedEventIds };
}

export type PartnerLogo = {
  name: string;
  image: string;
};

// export type PartnerCategory = {
//   category: string;
//   logos: PartnerLogo[];
// };

// export type WebsitePostCategory = { id: string; name: string; slug: string };

// export type WebsitePostItem = {
//   id: string;
//   title: string;
//   slug: string;
//   subtitle?: string;
//   excerpt: string;
//   locale: string;
//   featuredImagePath?: string;
//   featuredImage?: string;
//   mobileFeaturedImagePath?: string;
//   mobileFeaturedImage?: string;
//   categories?: WebsitePostCategory[];
// };

export type WebsitePostsResponse = {
  success: boolean;
  items: WebsitePostItem[];
  hasMore?: boolean;
  page?: number;
  limit?: number;
  meta?: unknown;
};

type WebsitePostBySlugResponse = { post: WebsitePostDetail };

export async function getPosts(
  args?: {
    page?: number;
    limit?: number;
    locale?: string;
  },
  fetchOpts?: ServerFetchCacheOpts,
): Promise<WebsitePostItem[]> {
  const { page = 1, limit = 10, locale } = args ?? {};
  const res = await websiteService.get<WebsitePostsResponse>("/posts", {
    params: {
      page,
      limit,
      ...(locale ? { locale } : {}),
    },
    ...mergeServerFetchCache(fetchOpts),
  });

  const items = res.data?.items ?? [];
  return items.map((p) => ({
    ...p,
    featuredImagePath: p.featuredImagePath
      ? toAbsoluteUrl(p.featuredImagePath)
      : undefined,
    featuredImage: p.featuredImage ? toAbsoluteUrl(p.featuredImage) : undefined,
    mobileFeaturedImagePath: p.mobileFeaturedImagePath
      ? toAbsoluteUrl(p.mobileFeaturedImagePath)
      : undefined,
    mobileFeaturedImage: p.mobileFeaturedImage
      ? toAbsoluteUrl(p.mobileFeaturedImage)
      : undefined,
  }));
}

export async function getPostBySlug(
  slug: string,
): Promise<WebsitePostDetail | null> {
  if (!slug?.trim()) return null;
  const res = await websiteService.get<WebsitePostBySlugResponse>(`/posts/${slug}`, {
    cache: "no-store",
  });
  const post = res.data?.post ?? null;
  if (!post) return null;
  return {
    ...post,
    featuredImagePath: post.featuredImagePath
      ? toAbsoluteUrl(post.featuredImagePath)
      : undefined,
    featuredImage: post.featuredImage ? toAbsoluteUrl(post.featuredImage) : undefined,
    mobileFeaturedImagePath: post.mobileFeaturedImagePath
      ? toAbsoluteUrl(post.mobileFeaturedImagePath)
      : undefined,
    mobileFeaturedImage: post.mobileFeaturedImage
      ? toAbsoluteUrl(post.mobileFeaturedImage)
      : undefined,
  };
}

export async function getPartners(
  args?: {
    locale?: string;
  },
  fetchOpts?: ServerFetchCacheOpts,
): Promise<PartnerCategory[]> {
  const { locale } = args ?? {};
  const res = await websiteService.get<PartnerCategory[]>("/partners", {
    params: {
      ...(locale ? { locale } : {}),
    },
    ...mergeServerFetchCache(fetchOpts),
  });

  const categories = Array.isArray(res.data) ? res.data : [];

  return categories.map((c) => ({
    category: c.category,
    logos: (c.logos ?? []).map((l) => ({
      ...l,
      image: toAbsoluteUrl(l.image),
    })),
  }));
}


export async function getUserFavourate(emaarId: string): Promise<{ event_ids: string[] }> {
  try {
    const base = WEBSITE_API_URL.replace(/\/$/, "");
    const url = `${base}/customers/favourite/${emaarId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    const json = (await response.json().catch(() => null)) as { event_ids: string[] } | null;
    return json ?? { event_ids: [] };
  } catch (err) {
    return { event_ids: [] };
  }
}

export async function setUserFavourate(emaarId: string, eventId: string, isFav: boolean): Promise<SubscribeResult> {
  try {
    const base = WEBSITE_API_URL.replace(/\/$/, "");
    const url = `${base}/customers/favourite`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emaar_id: emaarId, event_id: eventId, isFav: isFav }),
      cache: "no-store",
    });

    const json = (await response.json().catch(() => null)) as SubscribeResult | null;
    return json ?? ({ ok: false, error: "SUBSCRIBE_FAILED" } as SubscribeResult);
  } catch (err) {
    return { ok: false, error: (err as Error).message ?? "NETWORK_ERROR" };
  }
}


export async function subscribeWebsiteApi(email: string): Promise<SubscribeResult> {
  try {
    const base = WEBSITE_API_URL.replace(/\/$/, "");
    const url = `${base}/subscribe`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });

    const json = (await response.json().catch(() => null)) as SubscribeResult | null;
    return json ?? ({ ok: false, error: "SUBSCRIBE_FAILED" } as SubscribeResult);
  } catch (err) {
    return { ok: false, error: (err as Error).message ?? "NETWORK_ERROR" };
  }
}

export async function createCustomer(body: CreateCustomerBody): Promise<CreateCustomerResult> {
  const res = await websiteService.post<unknown>("customers", { body, cache: "no-store" });
  if (!res.error) return { ok: true, status: "created" };
  if (res.status === 409) return { ok: true, status: "already_exists" };
  return { ok: false, error: res.error.message, statusCode: res.status };
}

export async function getCustomerByEmaarId(emaarId: string): Promise<GetCustomerByEmaarIdResponse> {
  const res = await websiteService.get<GetCustomerByEmaarIdResponse>(`customers/${emaarId}`, {
    cache: "no-store",
  });

  // On success, the API returns `{ data: { ...customer } }`
  if (!res.error && res.data && "data" in res.data) return res.data;

  // On not-found/error, the API returns `{ error: { message } }` (sometimes message is a string-ish shape)
  return { error: { message: "customer not found" } };
}

export async function updateCustomer(emaarId: string, body: CreateCustomerBody): Promise<CreateCustomerResult> {
  const res = await websiteService.put<unknown>(`customers/${emaarId}`, { body, cache: "no-store" });
  if (!res.error) return { ok: true, data: res.data as EmaarPassUserProfile, status: "updated" };
  return { ok: false, error: res.error.message, statusCode: res.status };
}

export async function getUserBookingHistory(
  emaarId?: string,
  email?: string,
  type?: "upcoming" | "past" | "cancelled"
): Promise<BookingHistoryRecord[]> {
  const res = await eventService.get<GetBookingHistoryResponse>("/external/customer/booking-history", {
    params: { emaar_id: emaarId?.trim(), email: email?.trim(), type },
    cache: "no-store",
  });
  return res.data?.data?.bookings ?? [];
}

export async function getUserGiftCards(mobile: string, email: string): Promise<ProfileGiftCardItem[]> {
  const res = await eventService.get<GetUserGiftCardsResponse>("/external/cash-card/user-cards", {
    params: { mobile: mobile.trim(), email: email.trim() },
    cache: "no-store",
  });
  return res.data?.data ?? [];
}


export async function postEventRegistered(body: EventRegisteredBody): Promise<EventRegisteredResult> {
  const res = await websiteService.post<EventRegisteredResult>("event-registries", { body, cache: "no-store" });
  if (res.data?.message) return res.data;
  throw new Error(res.error?.message ?? "Registration failed");
}