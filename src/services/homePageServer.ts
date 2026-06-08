import { cache } from "react";
import { LONG_REVALIDATE_SECONDS } from "@/app/[locale]/RevalidateConstants";
import type { Locale } from "@/i18n/config";
import {
    getExternalEvents,
    // mapExternalEventsToSeasonCards,
} from "@/services/eventServer";
import type { WebsiteBanner, WebsitePostItem } from "@/types/website";
import {
    getBanners,
    getPartners,
    getPosts,
} from "@/services/websiteServer";

const homeFetch = { revalidate: LONG_REVALIDATE_SECONDS };

/** One banners request per render (shared by metadata + home data). */
const getHomepageBannersPayload = cache(async (locale: Locale) => {
    return getBanners(
        {
            placement: "HOMEPAGE",
            device: "BOTH",
            locale,
        },
        homeFetch,
    );
});

function addBannerProductId(ids: Set<string>, value: unknown) {
    if (value == null) return;
    const s = String(value).trim();
    if (s) ids.add(s);
}

/** Product ids from homepage banners for the events API (order preserved, de-duped). */
export function homeBannerProductIds(banners: WebsiteBanner[]): string[] {
    const ids = new Set<string>();
    for (const b of banners) {
        addBannerProductId(ids, b.productId);
        addBannerProductId(ids, b.product_id);
        if (Array.isArray(b.productIds)) {
            for (const x of b.productIds) addBannerProductId(ids, x);
        }
    }
    return [...ids];
}

export type HomeNewsPost = {
    slug: string;
    title: string;
    subtitle: string;
    cover: string;
    category: string;
    mobileFeaturedImage: string;
};

function mapWebsitePostsToHomeNews(posts: WebsitePostItem[]): HomeNewsPost[] {
    return posts
        .filter((p) => Boolean(p.isFeatured))
        .map((p) => ({
            slug: p.slug,
            title: p.title,
            subtitle: p.subtitle || p.excerpt || "",
            cover: p.featuredImage || p.featuredImagePath || "/images/fallback.png",
            category: p.categories?.[0]?.name ?? "News",
            mobileFeaturedImage: p.mobileFeaturedImage || p.mobileFeaturedImagePath || "/images/fallback.png",
        }))
        .filter((p) => p.cover);
}

/**
 * Banners for `generateMetadata` — same cache profile as the home page so
 * `fetch` can dedupe within a single render when options match.
 */
export async function getHomePageBanners(locale: Locale) {
    const { banners } = await getHomepageBannersPayload(locale);
    return banners;
}

/**
 * CMS + events fetch for the locale home page (banners first so linked product ids drive events).
 */
export async function getHomePageData(locale: Locale) {
    const { banners: websiteBanners, linkedEventIds } =
        await getHomepageBannersPayload(locale);

    const [externalEvents, partnerCategories, posts] = await Promise.all([
        getExternalEvents(
            {
                page: 1,
                limit: 9,
                locale,
                tags: ["upcoming"],
                productIds: linkedEventIds.length > 0 ? linkedEventIds : undefined,
            },
            homeFetch,
        ),
        getPartners({ locale: locale as string }, homeFetch),
        getPosts({ page: 1, limit: 20, locale }, homeFetch),
    ]);
    const homePosts =
    posts.length > 0 ? posts : [];

    return {
        websiteBanners,
        seasonCards: externalEvents,
        partnerCategories,
        homePosts,
    };
}
