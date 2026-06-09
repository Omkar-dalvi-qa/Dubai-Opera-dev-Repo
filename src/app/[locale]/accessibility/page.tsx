import Banner from "@/components/programs/Banner";
import { Accessibility as AccessibilityIcon, DoorOpen, Move, Car, CircleParking } from "lucide-react";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { generateMetadataWithFallback } from "@/lib/seo/metadata";
import StructuredData from "@/components/StructuredData";
import { getBaseUrl, getBreadcrumbSchema, getLocalePath } from "@/lib/seo/schema";
import Partners from "@/components/Partners";
import { LONG_REVALIDATE_SECONDS } from "../RevalidateConstants";
import { getPartners } from "@/services/websiteServer";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateMetadataWithFallback({ locale: locale as Locale, key: "accessibility" });
}

export default async function Accessibility({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const validLocale = locale as Locale;
    const baseUrl = await getBaseUrl();
    const localeCode = getLocalePath(validLocale);
    const t = await getTranslations({ locale: validLocale, namespace: "accessibility" });
    const partnerCategories = await getPartners({ locale: validLocale }, { revalidate: LONG_REVALIDATE_SECONDS });
    const featureTexts = t.raw("features") as Array<{ title: string; description: string; fullWidth?: boolean }>;
    const featureIcons = [
      <AccessibilityIcon key="wheelchair" className="w-8 h-8 lg:w-15 lg:h-15 text-white" />,
      <DoorOpen key="restrooms" className="w-8 h-8 lg:w-15 lg:h-15 text-white" />,
      <Move key="lifts" className="w-8 h-8 lg:w-15 lg:h-15 text-white" />,
      <Car key="dropoff" className="w-8 h-8 lg:w-15 lg:h-15 text-white" />,
      <CircleParking key="parking" className="w-8 h-8 lg:w-15 lg:h-15 text-white" />,
    ];
    const features = featureTexts.map((feature, index) => ({
      ...feature,
      icon: featureIcons[index],
    }));

    return (
        <>
        <StructuredData
          schemas={[
            getBreadcrumbSchema(validLocale, [
              {
                name: t("breadcrumbs.home"),
                item: `${baseUrl}/${localeCode}/home`,
              },
              {
                name: t("breadcrumbs.accessibility"),
                item: `${baseUrl}/${localeCode}/accessibility`,
              },
            ]),
          ]}
        />
        <main className="font-montserrat text-white bg-black">
            <Banner
                subtitle=""
                title={t("bannerTitle")}
                mediaType="image"
                height="60vh"
                mobileHeight="60vh"
                mediaSrc="/images/AccessibilityBg.jpg"
                hideMobileGradient
                showOverlay={false}
            />

            <div className="bg-linear-to-b from-[#060102] via-[#792327] to-black pb-16 lg:pb-32">
                <div className="max-w-[1240px] mx-auto px-5 text-center pt-8 lg:pt-16 pb-12">
                    <h2 className="text-3xl lg:text-[40px] lg:leading-[60px] font-optima text-white mb-6">
                        {t("introTitle")}
                    </h2>
                    <p className="text-[#FFFFFFCC] max-w-3xl text-[13px] lg:text-[16px] leading-[24px] mx-auto font-montserrat">
                        {t("introDescription")}
                    </p>
                </div>

                <div className="max-w-[1240px] mx-auto px-5 grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className={`bg-surface border border-white/5 rounded-[24px] p-8 lg:p-12 flex flex-row items-start gap-4 lg:gap-6 hover:bg-[#151515] transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.5)] ${feature.fullWidth ? 'md:col-span-2' : ''}`}
                        >
                            <div className="shrink-0 mt-1">
                                {feature.icon}
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-2xl lg:text-[32px] lg:leading-[48px] font-optima text-white">
                                    {feature.title}
                                </h2>
                                <p className="text-[#FFF]/90 text-[15px] lg:text-[16px] leading-[23px] font-montserrat font-light text-left">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <Partners partnerCategories={partnerCategories} />

            </div>
        </main>
        </>
    );
}


///////
////Tetsting metadata
////Testing module-1
/////Tesyububdds


////Testing module-2

////vgvhhgg