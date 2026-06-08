import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope, Montserrat } from "next/font/google";
import Banner from "@/components/programs/Banner";
import Partners from "@/components/Partners";
import Newsletter from "@/components/Newsletter";
import NewsSection from "@/components/NewsSection";
import { getPartners, getPosts } from "@/services/websiteServer";
import { type Locale } from "@/i18n/config";
import StructuredData from "@/components/StructuredData";
import { getBaseUrl, getBreadcrumbSchema, getLocalePath } from "@/lib/seo/schema";
import { generateMetadataWithFallback, getMetadataFallback } from "@/lib/seo/metadata";

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
  weight: ["400", "500", "700"],
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = locale as Locale;
  return generateMetadataWithFallback({ locale: validLocale, key: "news" });
}

export default async function BlogsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const postsData = await getPosts({ page: 1, limit: 12, locale: locale as Locale });
  console.log(postsData, 'postsData?>>>>>>>>>.');

  const validLocale = locale as Locale;
  const localeCode = getLocalePath(validLocale);
  const baseUrl = await getBaseUrl();
  const newsUrl = `${baseUrl}/${localeCode}/news`;
  const posts = postsData && postsData.length ? postsData : [];
  const mainTitle = getMetadataFallback(validLocale, "news").mainTitle;
  const partnerCategories = await getPartners();

  return (
    <div className={`${display.variable} ${sans.variable} ${montserrat.variable} min-h-screen overflow-x-clip bg-black text-white`}>
      <StructuredData
        schemas={[
          getBreadcrumbSchema(validLocale, [
            {
              name: validLocale === "ar" ? "الصفحة الرئيسية" : "Homepage",
              item: `${baseUrl}/${localeCode}/home`,
            },
            {
              name: validLocale === "ar" ? "الأخبار" : "News",
              item: newsUrl,
            },
          ]),
        ]}
      />
      <h1 className="sr-only">{mainTitle}</h1>
      <Banner
        subtitle=""
        title={validLocale === "ar" ? "الأخبار والتحديثات" : "NEWS & Updates"}
        mediaType="image"
        height="60vh"
        mobileHeight="40vh"
        mediaSrc="/blog/NEWSUPDATESbackground.avif"
      />

      <main className="bg-linear-to-b from-[#060102] via-[#792327] to-black">
        <div className="mx-auto w-full  py-10 px-4 md:px-8 lg:px-16  pb-16 pt-16 md:mt-0 lg:pt-0 sm:px-8">
          <NewsSection posts={posts} locale={locale} initialHasMore={postsData.length >= 12} />
          <Newsletter />
          <Partners partnerCategories={partnerCategories} />
        </div>
       
      </main>
    </div>
  );
}

