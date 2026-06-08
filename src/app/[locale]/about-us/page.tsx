import { Cormorant_Garamond, Manrope, Montserrat } from "next/font/google";
import Banner from "@/components/programs/Banner";
import AboutOurStory from "@/components/about/AboutOurStory";
import AbouExcellingtAtTheArt from "@/components/about/AbouExcellingtAtTheArt";
import AboutArchitecture from "@/components/about/AboutArchitecture";
import AboutCorporates from "@/components/about/aboutCorporates";
import AboutVenuesSection from "@/components/about/AboutVenuesSection";
import { getAboutVenuesSlides } from "@/components/about/aboutVenuesSlides";
import Partners from "@/components/Partners";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { generateMetadataWithFallback, getMetadataFallback } from "@/lib/seo/metadata";
import StructuredData from "@/components/StructuredData";
import { getBaseUrl, getBreadcrumbSchema, getLocalePath } from "@/lib/seo/schema";
import { getTranslations } from "next-intl/server"; 
import { getPartners } from "@/services/websiteServer";
import { LONG_REVALIDATE_SECONDS } from "../RevalidateConstants";

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
  weight: ["400", "600"],
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateMetadataWithFallback({ locale: locale as Locale, key: "aboutUs" });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale = locale as Locale;
  const baseUrl = await getBaseUrl();
  const localeCode = getLocalePath(validLocale);
  const mainTitle = getMetadataFallback(validLocale, "aboutUs").mainTitle;
  const t = await getTranslations({locale, namespace: "about"});
  const aboutVenuesSlides = getAboutVenuesSlides(t as any);
  const partnerCategories = await getPartners({ locale: validLocale }, { revalidate: LONG_REVALIDATE_SECONDS });
  return (
    <div
      className={`${display.variable} ${sans.variable} ${montserrat.variable} min-h-screen overflow-x-clip bg-black text-white`}
    >
      <StructuredData
        schemas={[
          getBreadcrumbSchema(validLocale, [
            {
              name: validLocale === "ar" ? "الصفحة الرئيسية" : "Homepage",
              item: `${baseUrl}/${localeCode}/home`,
            },
            {
              name: validLocale === "ar" ? "من نحن" : "About Us",
              item: `${baseUrl}/${localeCode}/about-us`,
            },
          ]),
        ]}
      />
      <h1 className="sr-only">{mainTitle}</h1>
      <Banner
        subtitle={t("the")}
        title={t("storyToTell")}
        showOverlay={true}
        mediaType="video"
        height="70vh"
        mediaSrc="/about/DubaiOperaLUXURY.mp4"
      />

      <main className="bg-linear-to-b from-[#060102] from-[10%] via-[#792327] via-[80%] to-black pb-20">
        <div className="mx-auto w-full max-w-[1400px] px-4 pb-0 pt-8 sm:px-6 sm:pt-10">
          <AboutOurStory t={t as any} />
          <AbouExcellingtAtTheArt t={t as any} />
          <AboutArchitecture
            sectionClassName="mx-auto mt-12 grid w-full max-w-[1400px] gap-10 md:grid-cols-[1fr_1.25fr] md:items-center"
            textContainerClassName="max-w-[520px]"
            imageContainerClassName="h-64 sm:h-72 md:h-96 overflow-hidden rounded-2xl shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
            heading={t("architecture.main.heading")}
            headingTag="h2"
            headingClassName="text-[36px] text-white/95"
            headingStyle={{
              fontFamily: "Optima, Candara, 'Noto Sans', sans-serif",
              fontWeight: 400,
              fontStyle: "normal",
              lineHeight: "100%",
              letterSpacing: "0",
              verticalAlign: "middle",
            }}
            subheading={t("architecture.main.subheading")}
            subheadingTag="h3"
            subheadingClassName="mt-4 font-montserrat text-[22px] font-semibold text-white md:whitespace-nowrap"
            subheadingStyle={{ lineHeight: "100%", letterSpacing: "0" }}
            paragraphs={[
              {
                text: t("architecture.main.paragraph1"),
                className: "mt-5 font-montserrat text-[16px] font-normal text-white/88 sm:text-[17px]",
                style: { lineHeight: "1.35", letterSpacing: "0" },
              },
              {
                text: t("architecture.main.paragraph2"),
                className: "mt-4 font-montserrat text-[16px] font-normal text-white/88 sm:text-[17px]",
                style: { lineHeight: "1.35", letterSpacing: "0" },
              },
            ]}
            imageSrc="/about/IncredibleTransformingAbilityTitle.avif"
            imageAlt={t("architecture.main.imageAlt")}
          />

          <AboutArchitecture
            sectionClassName="mx-auto mt-16 grid w-full max-w-[1400px] gap-10 md:grid-cols-[1.25fr_1fr] md:items-center"
            textContainerClassName="order-1 max-w-[520px] md:order-2 md:flex md:flex-col md:justify-center"
            imageContainerClassName="order-2 h-64 sm:h-72 md:order-1 md:h-96 overflow-hidden rounded-2xl shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
            imagePosition="left"
            heading={t("architecture.concert.heading")}
            headingTag="h3"
            headingClassName="whitespace-nowrap text-[34px] text-white"
            headingStyle={{
              fontFamily: "Optima, Candara, 'Noto Sans', sans-serif",
              fontWeight: 400,
              fontStyle: "normal",
              lineHeight: "100%",
              letterSpacing: "0",
              verticalAlign: "middle",
            }}
            paragraphs={[
              {
                text: t("architecture.concert.paragraph1"),
                className: "mt-5 font-montserrat text-[15px] font-normal text-white/88 sm:text-[16px]",
                style: { lineHeight: "1.35", letterSpacing: "0" },
              },
              {
                text: t("architecture.concert.paragraph2"),
                className: "mt-4 font-montserrat text-[15px] font-normal text-white/88 sm:text-[16px]",
                style: { lineHeight: "1.35", letterSpacing: "0" },
              },
            ]}
            imageSrc="/about/ConcertHallMode.avif"
            imageAlt={t("architecture.concert.imageAlt")}
          />

          <AboutArchitecture
            sectionClassName="mx-auto mt-14 grid w-full max-w-[1400px] gap-10 md:grid-cols-[1fr_1.25fr] md:items-center"
            textContainerClassName="max-w-[520px] md:flex md:flex-col md:justify-center"
            imageContainerClassName="h-64 sm:h-72 md:h-96 overflow-hidden rounded-2xl shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
            heading={t("architecture.theatre.heading")}
            headingTag="h3"
            headingClassName="text-[34px] text-white"
            headingStyle={{
              fontFamily: "Optima, Candara, 'Noto Sans', sans-serif",
              fontWeight: 400,
              fontStyle: "normal",
              lineHeight: "100%",
              letterSpacing: "0",
              verticalAlign: "middle",
            }}
            subheading={t("architecture.theatre.subheading")}
            subheadingTag="h4"
            subheadingClassName="mt-6 font-montserrat text-[20px] font-semibold text-white"
            subheadingStyle={{ lineHeight: "100%", letterSpacing: "0" }}
            subheadingAfterParagraphs={1}
            paragraphs={[
              {
                text: t("architecture.theatre.paragraph1"),
                className: "mt-4 font-montserrat text-[15px] font-normal text-white/88 sm:text-[16px]",
                style: { lineHeight: "1.35", letterSpacing: "0" },
              },
              {
                text: t("architecture.theatre.paragraph2"),
                className: "mt-3 font-montserrat text-[15px] font-normal text-white/88 sm:text-[16px]",
                style: { lineHeight: "1.35", letterSpacing: "0" },
              },
            ]}
            imageSrc="/about/TheatreMode.avif"
            imageAlt={t("architecture.theatre.imageAlt")}
          />

          <AboutVenuesSection slides={aboutVenuesSlides} />
        </div>
        <AboutCorporates />
        <Partners partnerCategories={partnerCategories} />
      </main>
    </div>
  );
}
//asjnajscnjlkansljknlk
///anjdakjnja