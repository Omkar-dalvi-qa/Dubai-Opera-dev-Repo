// 'use client';

import Link from "next/link";
import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope, Montserrat } from "next/font/google";
import BlogGallery from "@/components/blogs/BlogGallery";
import Partners from "@/components/Partners";
// import { getBlogById } from "@/services/server/blogs";
import { langIdMap, type Locale } from "@/i18n/config";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getPartners, getPostBySlug } from "@/services/websiteServer";
import StructuredData from "@/components/StructuredData";
import {
  getBaseUrl,
  getBreadcrumbSchema,
  getLocalePath,
} from "@/lib/seo/schema";
import { getCanonicalUrl, resolveCanonicalUrl } from "@/lib/seo/canonical";
import Image from "next/image";

export const revalidate = 600;

const display = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600"],
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans-ui",
  weight: ["400", "500", "600", "700"],
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400"],
});

type Params = { slug: string };

function normalizeSlug(value: string) {
  return decodeURIComponent(value).trim().toLowerCase();
}

function decodeHtmlEntities(value: string) {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params & { locale: Locale }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const normalizedSlug = normalizeSlug(slug);

  const baseUrl = await getBaseUrl();
  const fallbackCanonical = await getCanonicalUrl({
    locale,
    path: `/news/${encodeURIComponent(normalizedSlug)}`,
  });

  const post = await getPostBySlug(normalizedSlug);
  const apiCanonical =
    (post as any)?.canonical_url ??
    (post as any)?.canonicalUrl ??
    (post as any)?.seo?.canonical_url ??
    (post as any)?.seo?.canonicalUrl;

  const canonicalUrl = resolveCanonicalUrl(
    baseUrl,
    apiCanonical,
    fallbackCanonical,
  );

  return {
    metadataBase: new URL(baseUrl),
    alternates: { canonical: canonicalUrl },
    openGraph: { url: canonicalUrl },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<Params & { locale: Locale }>;
}) {
  const [partnerCategories] = await Promise.all([getPartners()]);

  const { slug, locale } = await params;
  const normalizedSlug = normalizeSlug(slug);
  const languageId = langIdMap[locale] ?? 1;
  void languageId;

  const post = await getPostBySlug(normalizedSlug);
  console.log("BlogDetailPage", post);

  // const post = postResponse?.post;
  if (!post) notFound();

  const html = decodeHtmlEntities(
    (post.html ?? post.content ?? post.body ?? "") as string,
  );
  const galleryImages: string[] =
    (post as any).postGallery || (post as any).postGalleryPaths || [];

  const baseUrl = await getBaseUrl();
  const localeCode = getLocalePath(locale);
  const canonicalUrl = `${baseUrl}/${localeCode}/news/${encodeURIComponent(normalizedSlug)}`;
  const newsUrl = `${baseUrl}/${localeCode}/news`;

  const maybeDates = post as unknown as Record<string, unknown>;
  const datePublished =
    (typeof maybeDates.publishedAt === "string" && maybeDates.publishedAt) ||
    (typeof maybeDates.createdAt === "string" && maybeDates.createdAt) ||
    undefined;
  const dateModified =
    (typeof maybeDates.updatedAt === "string" && maybeDates.updatedAt) ||
    undefined;

  const newsArticleSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    headline: post.title,
    description: post.excerpt,
    ...(post.featuredImage || post.featuredImagePath
      ? { image: [post.featuredImage ?? post.featuredImagePath] }
      : {}),
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    author: {
      "@type": "Organization",
      name: "Dubai Opera",
      url: "https://www.dubaiopera.com/",
    },
    publisher: {
      "@type": "Organization",
      name: "Dubai Opera",
      logo: {
        "@type": "ImageObject",
        url: "https://www.dubaiopera.com/media/logo-light.svg",
      },
    },
  };

  return (
    <div
      className={`${display.variable} ${sans.variable} ${montserrat.variable} min-h-screen overflow-x-clip bg-black text-white`}
    >
      <StructuredData
        schemas={[
          getBreadcrumbSchema(locale, [
            {
              name: locale === "ar" ? "الصفحة الرئيسية" : "Homepage",
              item: `${baseUrl}/${localeCode}/home`,
            },
            {
              name: locale === "ar" ? "الأخبار" : "News",
              item: newsUrl,
            },
            {
              name: post.title,
              item: canonicalUrl,
            },
          ]),
          newsArticleSchema,
        ]}
      />
      <header className="relative h-[40vh] min-h-[520px] w-full overflow-hidden sm:h-[60vh] lg:h-[60vh]">
        <Image
          src={post.featuredImage || post.featuredImagePath || "/images/fallback.png"}
          alt={post.title ?? "News Image"}
          className="absolute inset-0 h-full w-full object-cover"
          width={1000}
          height={1000}
          priority
          sizes="100vw"
        />

        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-linear-to-t from-black via-black/40 to-transparent pointer-events-none z-[5]" />

        <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col px-5 sm:px-8">
          {/* Back button — left aligned */}
          <div className="pt-24 lg:block hidden">
            <Link
              href={`/${locale}/news`}
              className="flex items-center gap-1 font-montserrat font-normal text-[12px] lg:text-[14px] lg:leading-[31px] text-white w-fit"
            >
              <ChevronLeft size={20} /> Back
            </Link>
          </div>

          {/* Title — centered */}
          <div className="flex flex-1 items-center justify-center pb-14 sm:pb-18">
            <h1
              className="text-center text-[36px] uppercase text-white sm:text-[56px] md:text-[72px] lg:text-[80px]"
              style={{
                fontFamily: "Optima, Candara, 'Noto Sans', sans-serif",
                fontWeight: 400,
                fontStyle: "normal",
                lineHeight: "100%",
                letterSpacing: "0.18em",
              }}
            >
              {post.title}
            </h1>
          </div>
        </div>
      </header>

      <main className="bg-linear-to-b from-black via-primary-light to-black">
        <div className="mx-auto w-full max-w-7xl px-5 pb-8 pt-8 sm:px-8 sm:pt-10">
          {/* Back button — left aligned */}
          <div className="block lg:hidden">
            <Link
              href={`/${locale}/news`}
              className="flex items-center gap-1 font-montserrat font-normal text-[12px] lg:text-[14px] lg:leading-[31px] text-white w-fit"
            >
              <ChevronLeft size={20} /> Back
            </Link>
          </div>
          <h2
            className="w-full max-w-none text-[40px] text-white mt-4"
            style={{
              fontFamily: "Optima, Candara, 'Noto Sans', sans-serif",
              fontWeight: 400,
              fontStyle: "normal",
              lineHeight: "100%",
              letterSpacing: "0",
              verticalAlign: "middle",
            }}
          >
            {post.subtitle}
          </h2>

          <div
            className="mt-5 w-full max-w-none space-y-4 font-montserrat text-[16px] font-normal text-white sm:text-[17px] [&_h2]:mt-6 [&_h2]:text-[26px] [&_h2]:font-semibold [&_p]:mt-3 [&_p]:leading-[1.55]"
            style={{ lineHeight: "1.35", letterSpacing: "0" }}
          >
            {html ? (
              <div dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              <p className="mt-3 leading-[1.55]">{post.excerpt}</p>
            )}
          </div>

          <BlogGallery images={galleryImages} />
        </div>
        <Partners partnerCategories={partnerCategories} />
      </main>
    </div>
  );
}
