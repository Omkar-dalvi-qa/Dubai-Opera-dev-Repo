import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import FaqsPageClient from "./FaqsPageClient";
import { generateMetadataWithFallback, getMetadataFallback } from "@/lib/seo/metadata";
import StructuredData from "@/components/StructuredData";
import { getBaseUrl, getBreadcrumbSchema, getFaqPageSchema, getLocalePath } from "@/lib/seo/schema";
import { getTranslations } from "next-intl/server";
import { FaqGroup } from "./data";
import { getPartners } from "@/services/websiteServer";
import { LONG_REVALIDATE_SECONDS } from "../RevalidateConstants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateMetadataWithFallback({ locale: locale as Locale, key: "faqs" });
}

export default async function FaqsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale = locale as Locale;
  const baseUrl = await getBaseUrl();
  const localeCode = getLocalePath(validLocale);
  const t = await getTranslations({ locale: validLocale, namespace: "faqs" });
  const faqGroups = t.raw("groups") as FaqGroup[];
  const questions = faqGroups.flatMap((group) => group.faqs);
  const mainTitle = getMetadataFallback(validLocale, "faqs").mainTitle;
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
              name: validLocale === "ar" ? "الأسئلة الشائعة" : "FAQs",
              item: `${baseUrl}/${localeCode}/faqs`,
            },
          ]),
          getFaqPageSchema({ questions }),
        ]}
      />
            <h1 className="sr-only">{mainTitle}</h1>
      <FaqsPageClient partnerCategories={partnerCategories} />
    </>
  );
}
