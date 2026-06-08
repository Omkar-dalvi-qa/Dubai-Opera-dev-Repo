// import { notFound } from "next/navigatassasadsadion"; ////////////////////////// /////////////
///bdhbashfbkasbkfbaskbfkj ///////////////////////. /////////////////////
/////////////////. 1233 ddd vgghvghvghvgvgj
import Banner from "@/components/programs/Banner";
import { Cormorant_Garamond, Manrope, Montserrat } from "next/font/google";
// app/[locale]/[slug]/page.tsx ////
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import StructuredData from "@/components/StructuredData";
import { getBaseUrl, getBreadcrumbSchema, getLocalePath } from "@/lib/seo/schema";
import { getCanonicalUrl, getLanguageAlternates } from "@/lib/seo/canonical";

export const revalidate = 18000; // 5 hours
export const dynamicParams = true;


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

/** GET /pages/:slug — body shape from website CMS */
type CmsPagePayload = {
  title: string;
  content: string;
  slug: string;
  excerpt?: string;
  locale?: string;
  status?: string;
};

type PagesApiResponse = {
  page: CmsPagePayload | null;
};

function contentToHtmlString(content: unknown): string {
  if (content == null) return "";
  if (typeof content === "string") return content;
  if (typeof content === "object" && content !== null) {
    const o = content as Record<string, unknown>;
    if (typeof o.html === "string") return o.html;
    if (typeof o.body === "string") return o.body;
    if (typeof o.content === "string") return o.content;
  }
  return "";
}

async function getPage(
  locale: string,
  slug: string,
): Promise<CmsPagePayload | null> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_WEBSITE_SERVICE_API_URL}/pages/${slug}?locale=${locale}`,
    {
      next: { revalidate: 18000 },
    },
  );

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error("Failed to fetch page");
  }

  const data = (await res.json()) as PagesApiResponse;
  return data.page ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const validLocale = locale as Locale;

  const page = await getPage(locale, slug);
  if (!page) return {};

  const baseUrl = await getBaseUrl();
  const canonicalPath = `/${encodeURIComponent(slug)}`;
  const canonicalUrl = await getCanonicalUrl({ locale: validLocale, path: canonicalPath });

  const title = page.title;
  const description = page.excerpt ?? "";

  return {
    title,
    description,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: canonicalUrl,
      languages: getLanguageAlternates({ baseUrl, path: canonicalPath }),
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
    },
  };
}

export default async function DynamicPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const validLocale = locale as Locale;

  const page = await getPage(locale, slug);

  if (!page) {
    notFound();
  }

  const html = contentToHtmlString(page.content);
  const baseUrl = await getBaseUrl();
  const localeCode = getLocalePath(validLocale);
  const canonicalUrl = await getCanonicalUrl({
    locale: validLocale,
    path: `/${encodeURIComponent(slug)}`,
  });

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
              name: page.title,
              item: canonicalUrl,
            },
          ]),
        ]}
      />
    <Banner
      subtitle=""
      title={page.title}
      mediaType="image"
      height="90vh"
      mobileHeight="40vh"
      mediaSrc="/blog/NEWSUPDATESbackground.avif"
      hideMobileGradient
      className="opacity-90"
    />
    <main className="bg-linear-to-b from-black via-[#792327] to-black">
      {/* <h1>{page.title}</h1> */}
      <div className="mx-auto w-full max-w-7xl px-3 pb-16 pt-16 md:mt-0 lg:pt-0 sm:px-8">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </main>
    </div>
  );
}
