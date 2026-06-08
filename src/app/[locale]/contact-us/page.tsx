import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import ContactPageClient from "./ContactPageClient";
import { generateMetadataWithFallback } from "@/lib/seo/metadata";
import StructuredData from "@/components/StructuredData";
import { getBaseUrl, getBreadcrumbSchema, getLocalePath } from "@/lib/seo/schema";
import { getPartners } from "@/services/websiteServer";
import Partners from "@/components/Partners";
// import { LONG_REVALIDATE_SECONDS } from "../RevalidateConstants";

// export const revalidate = LONG_REVALIDATE_SECONDS;
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateMetadataWithFallback({ locale: locale as Locale, key: "contact" });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const baseUrl = await getBaseUrl();
  const validLocale = locale as Locale;
  const localeCode = getLocalePath(validLocale);
  const partnerCategories = await getPartners();
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
        <ContactPageClient partnerCategories={partnerCategories} />
    </>
  );
}