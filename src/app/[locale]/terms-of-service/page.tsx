import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import TermsOfServiceClient from "./TermsOfServiceClient";
import { generateMetadataWithFallback } from "@/lib/seo/metadata";
import StructuredData from "@/components/StructuredData";
import { getBaseUrl, getBreadcrumbSchema, getLocalePath } from "@/lib/seo/schema";
import { getPartners } from "@/services/websiteServer";
import { LONG_REVALIDATE_SECONDS } from "../RevalidateConstants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateMetadataWithFallback({ locale: locale as Locale, key: "contact" });
}

export default async function TermsofServicePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const baseUrl = await getBaseUrl();
  const validLocale = locale as Locale;
  const localeCode = getLocalePath(validLocale);
  const partnerCategories = await getPartners({ locale: validLocale }, { revalidate: LONG_REVALIDATE_SECONDS });
  console.log(partnerCategories, 'partnerCategories');
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
              name: validLocale === "ar" ? "اتصل بنا" : "Contact Us",
              item: `${baseUrl}/${localeCode}/contact-us`,
            },
          ]),
        ]}
      />
      <h1 className="sr-only"></h1>
      <TermsOfServiceClient partnerCategories={partnerCategories} />
    </>
  );
}