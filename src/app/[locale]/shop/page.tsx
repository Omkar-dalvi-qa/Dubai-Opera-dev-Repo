import Newsletter from "@/components/Newsletter";
import ShopBanner from "@/components/shop/ShopBanner";
import ShopCollectionSection from "@/components/shop/ShopCollectionSection";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import StructuredData from "@/components/StructuredData";
import { getBaseUrl, getBreadcrumbSchema, getLocalePath } from "@/lib/seo/schema";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { generateMetadataWithFallback, getMetadataFallback } from "@/lib/seo/metadata";
import { getCashCardProducts } from "@/services/eventServer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateMetadataWithFallback({ locale: locale as Locale, key: "shop" });
}

export default async function ShopPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale = locale as Locale;
  const baseUrl = await getBaseUrl();
  const localeCode = getLocalePath(validLocale);
  const canonicalUrl = await getCanonicalUrl({ locale: validLocale, path: "/shop" });
  const mainTitle = getMetadataFallback(validLocale, "shop").mainTitle;
  const data = await getCashCardProducts({ locale: validLocale });
  return (
    <>
      <h1 className="sr-only">{mainTitle}</h1>
      <StructuredData
        schemas={[
          getBreadcrumbSchema(validLocale, [
            {
              name: validLocale === "ar" ? "الصفحة الرئيسية" : "Homepage",
              item: `${baseUrl}/${localeCode}/home`,
            },
            {
              name: validLocale === "ar" ? "المتجر" : "Shop",
              item: canonicalUrl,
            },
          ]),
        ]}
      />
      <ShopBanner />
      <ShopCollectionSection products={data} />
    </>
  );
}
