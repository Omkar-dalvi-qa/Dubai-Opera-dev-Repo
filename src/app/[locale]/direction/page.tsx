import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import DirectionsPageClient from "./DirectionsPageClient";
import { generateMetadataWithFallback } from "@/lib/seo/metadata";
import StructuredData from "@/components/StructuredData";
import { getBaseUrl, getBreadcrumbSchema, getLocalePath } from "@/lib/seo/schema";
import { LONG_REVALIDATE_SECONDS } from "../RevalidateConstants";
import { getPartners } from "@/services/websiteServer";

// export const revalidate = LONG_REVALIDATE_SECONDS;
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateMetadataWithFallback({ locale: locale as Locale, key: "directions" });
}

export default async function DirectionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale = locale as Locale;
  const baseUrl = await getBaseUrl();
  const localeCode = getLocalePath(validLocale);
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
              name: validLocale === "ar" ? "الاتجاهات" : "Directions",
              item: `${baseUrl}/${localeCode}/direction`,
            },
          ]),
        ]}
      />
      <DirectionsPageClient partnerCategories={partnerCategories} />
    </>
  );
}