import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import VisitDiningPageClient from "./VisitDiningPageClient";
import { generateMetadataWithFallback, getMetadataFallback } from "@/lib/seo/metadata";
import StructuredData from "@/components/StructuredData";
import { getBaseUrl, getBreadcrumbSchema, getLocalePath } from "@/lib/seo/schema";
import { getPartners } from "@/services/websiteServer";
import { LONG_REVALIDATE_SECONDS } from "../../RevalidateConstants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateMetadataWithFallback({ locale: locale as Locale, key: "visitDining" });
}

export default async function VisitDiningPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale = locale as Locale;
  const baseUrl = await getBaseUrl();
  const localeCode = getLocalePath(validLocale);
  const mainTitle = getMetadataFallback(validLocale, "visitDining").mainTitle;
  const partnerCategories = await getPartners({ locale: validLocale }, { revalidate: LONG_REVALIDATE_SECONDS });
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
              item: `${baseUrl}/${localeCode}/visit/dining`,
            },
          ]),
        ]}
      />
      <VisitDiningPageClient partnerCategories={partnerCategories} />
    </>
  );
}

