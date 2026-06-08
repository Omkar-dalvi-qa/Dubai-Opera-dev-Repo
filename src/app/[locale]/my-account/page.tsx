import ProfileDashboard from "@/components/profile/ProfileDashboard";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import StructuredData from "@/components/StructuredData";
import { getBaseUrl, getBreadcrumbSchema, getLocalePath } from "@/lib/seo/schema";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { generateMetadataWithFallback, getMetadataFallback } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateMetadataWithFallback({ locale: locale as Locale, key: "myAccount" });
}

export default async function MyAccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale = locale as Locale;
  const baseUrl = await getBaseUrl();
  const localeCode = getLocalePath(validLocale);
  const canonicalUrl = await getCanonicalUrl({
    locale: validLocale,
    path: "/my-account",
  });
  const mainTitle = getMetadataFallback(validLocale, "myAccount").mainTitle;

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
              name: validLocale === "ar" ? "حسابي" : "My Account",
              item: canonicalUrl,
            },
          ]),
        ]}
      />
      <ProfileDashboard locale={locale} />
    </>
  );
}
