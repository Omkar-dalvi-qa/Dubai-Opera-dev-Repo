import Image from "next/image";
import Banner from "@/components/programs/Banner";
import Partners from "@/components/Partners";
import StudioSeriesSection, { StudioSeriesSlide } from "@/components/programs/StudioSeriesSection";
import { getExternalEventSeries } from "@/services/eventServer";
import { imageUrl } from "@/utils/imageUrl";
import { getHomePageData } from "@/services/homePageServer";
import { Locale } from "@/i18n/config";

export default async function StudioPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const eventSeries = await getExternalEventSeries(
    { locale },
  );
  const { partnerCategories } = await getHomePageData(locale as Locale);

  const dynamicCards: StudioSeriesSlide[] = eventSeries
    .filter((series) => Boolean(series?.is_active ?? true))
    .map((series) => {
      const slug = String(series.slug ?? "").trim();
      const image = imageUrl(series.thumbnail_url);
      return {
        imageSrc: image,
        thumbnailUrl: image,
        imageAlt: String(series.name ?? "Studio event series"),
        title: String(series.name ?? ""),
        description: String(series.short_description ?? series.description ?? ""),
        ctaLabel: "Book Tickets",
        ctaHref: slug ? `/${locale}/season/studio/${slug}` : "#",
      };
    });

  const cards: StudioSeriesSlide[] = dynamicCards;

  return (
    <main className="bg-linear-to-b from-[#060102] from-[10%] via-[#792327] via-[60%] to-black">
      <div className="relative"
      >

        <Image src="/logo/bglogo.avif" alt="bg logo" width={1920} height={1080} className="object-cover object-right absolute -top-10 z-8" />
        <Banner
          subtitle=""
          title={`A Curated\nStudio Experience`}
          showOverlay={false}
          mediaType="image"
          mediaSrc="/images/banners/studiobanner.webp"
          height="70vh"
        />
        <StudioSeriesSection
          introTitle="Four Groundbreaking Concert Series at Dubai Opera Studio"
          introDescription="At Dubai Opera, we believe that music has the power to transport you to different worlds, evoke deep emotions, and create unforgettable memories. That's why we are thrilled to introduce our exciting new Studio Concert Series for the 2023-24 season, featuring upcoming events. Get ready to embark on a musical journey like no other, as we bring you four distinct and captivating concert series that showcase the very best in performing music and talent."
          title="Discover Our Studio Concert Series"
          cards={cards}
        />
      </div>
      <Partners partnerCategories={partnerCategories} />

    </main>

  );
}

