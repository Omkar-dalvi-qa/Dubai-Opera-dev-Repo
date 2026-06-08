import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import VisitToursPageClient from "./VisitToursPageClient";
import { generateMetadataWithFallback, getMetadataFallback } from "@/lib/seo/metadata";
import StructuredData from "@/components/StructuredData";
import { getBaseUrl, getBreadcrumbSchema, getLocalePath } from "@/lib/seo/schema";
import { getHomePageData } from "@/services/homePageServer";
import {
  getExternalVisitOperaSchedules,
  type ExternalVisitOperaData,
} from "@/services/eventServer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateMetadataWithFallback({ locale: locale as Locale, key: "visitTours" });
}

export default async function VisitToursPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale = locale as Locale;
  const baseUrl = await getBaseUrl();
  const localeCode = getLocalePath(validLocale);
  const mainTitle = getMetadataFallback(validLocale, "visitTours").mainTitle;
  const { partnerCategories } = await getHomePageData(validLocale);

  const visitResult = await getExternalVisitOperaSchedules(locale);
  console.log("visitResult>>>>>>>", visitResult);
  const visitData: ExternalVisitOperaData = visitResult.data ?? {
    slug: "visit-opera",
    name: "Visit Opera",
    schedules: [],
  };

  if (visitResult.success) {
    console.log("[visit/tours/page] Visit Opera schedules loaded:", {
      productId: visitData.product_id,
      eventSlug: visitData.slug,
      hasAddons: visitData.has_addons,
      currency: visitData.currency,
      minPrice: visitData.min_price,
      maxDuration: visitData.max_duration,
      timestamp: visitResult.timestamp,
    });
  } else {
    console.error("[visit/tours] Visit Opera schedules API error:", visitResult.message);
  }
  return (
    <>
      <StructuredData
        schemas={[
          getBreadcrumbSchema(validLocale, [
            {
              name: validLocale === "ar" ? "الصفحة الرئيسية" : "Homepage",
              item: `${baseUrl}/${localeCode}/home`,
            },
            {
              name: validLocale === "ar" ? "زيارة" : "Visit",
              item: `${baseUrl}/${localeCode}/visit`,
            },
            {
              name: mainTitle,
              item: `${baseUrl}/${localeCode}/visit/tours`,
            },
          ]),
        ]}
      />
      <VisitToursPageClient visitData={visitData} partnerCategories={partnerCategories} />
    </>
  );
}
