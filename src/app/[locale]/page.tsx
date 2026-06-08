import type { Metadata } from "next";
import MainBanner from "@/components/MainBanner";
import SeasonSection from "@/components/SeasonSection";
import NewsSection from "@/components/NewsSection";
import VenueTour from "@/components/VenueTour";
import Newsletter from "@/components/Newsletter";
import Partners from "@/components/Partners";
import { type Locale } from "@/i18n/config";
import {
    getHomePageBanners,
    getHomePageData,
} from "@/services/homePageServer";
import { getBaseUrl } from "@/lib/seo/schema";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { generateMetadataWithFallback, getMetadataFallback } from "@/lib/seo/metadata";

export const revalidate = 600;

/* ────────────────────────────────────────────────────────────────────────────
 * Metadata (SSR)
 * ──────────────────────────────────────────────────────────────────────────── */

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const validLocale = locale as Locale;
    const baseUrl = await getBaseUrl();
    const canonicalUrl = await getCanonicalUrl({ locale: validLocale });
    const baseMeta = await generateMetadataWithFallback({ locale: validLocale, key: "home" });
    const websiteBanners = await getHomePageBanners(locale as Locale);
    const banners = websiteBanners.map((b, idx) => ({
        banner_id: idx + 1,
        banner_name: b.title,
        banner_image_url: b.imagePath || b.image,
    }));
    const bannerNames = banners
        .slice(0, 5)
        .map((b) => b.banner_name)
        .join(", ");

    const description = bannerNames
        ? `Explore what's on at Dubai Opera — ${bannerNames} and more. Book tickets for world-class performances in the heart of Downtown Dubai.`
        : "Discover Dubai Opera — House of Cultures. Book tickets for world-class performances in the heart of Downtown Dubai.";

    const firstBannerImage = banners[0]?.banner_image_url;

    return {
        ...baseMeta,
        metadataBase: new URL(baseUrl),
        alternates: {
            ...(baseMeta.alternates ?? {}),
            canonical: canonicalUrl,
        },
        openGraph: {
            ...(baseMeta.openGraph ?? {}),
            url: canonicalUrl,
            ...(firstBannerImage && {
                images: [{ url: firstBannerImage, width: 1920, height: 650 }],
            }),
        },
        twitter: {
            card: "summary_large_image",
            title: typeof baseMeta.title === "string" ? baseMeta.title : "Dubai Opera",
            description: baseMeta.description ?? description,
            ...(firstBannerImage && { images: [firstBannerImage] }),
        },
    };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Page (SSR)
 * ──────────────────────────────────────────────────────────────────────────── */

export default async function Home({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const mainTitle = getMetadataFallback(locale as Locale, "home").mainTitle;

    const { websiteBanners, seasonCards, partnerCategories, homePosts } =
        await getHomePageData(locale as Locale);
    console.log(homePosts, "homePosts>>>>.");
    return (
        <main className="min-h-screen flex flex-col items-center w-full bg-linear-to-b from-[#060102] from-[5%] via-[#792327] via-[90%] to-black">
            <h1 className="sr-only">{mainTitle}</h1>
            <MainBanner slides={websiteBanners} />
            <SeasonSection
                events={seasonCards}
                locale={locale}
                sectionTitle={'whatsOn'}
                viewAllLink={'/events'}
            />
            <NewsSection homeData={homePosts} locale={locale} />
            <VenueTour />
            <Newsletter />
            <Partners partnerCategories={partnerCategories} />
        
        </main>
    );
}
