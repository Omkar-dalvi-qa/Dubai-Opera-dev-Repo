import { notFound } from "next/navigation";
import Banner from "@/components/programs/Banner";
import SeasonSection from "@/components/SeasonSection";
import Partners from "@/components/Partners";
import {
  getExternalEventsBySeriesSlug,
} from "@/services/eventServer";
import { getHomePageData } from "@/services/homePageServer";
import { Locale } from "@/i18n/config";
import Image from "next/image";

function toSeriesTitle(slug: string) {
  const safeSlug = (() => {
    try {
      return decodeURIComponent(slug);
    } catch {
      return slug;
    }
  })();

  return safeSlug
    .split("-")
    .filter(Boolean)
    .map((word) => {
      if (/^\d+$/.test(word)) return word;
      return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
    })
    .join(" ");
}

export default async function ProgramEventPage({
  params,
}: {
  params: Promise<{ locale: string; eventName: string }>;
}) {
  const { locale, eventName } = await params;
  const { partnerCategories } = await getHomePageData(locale as Locale);

  if (!eventName?.trim()) {
    notFound();
  }

  const readableTitle = toSeriesTitle(eventName);
  const bannerTitle = readableTitle
    .replace(/(\d{4})-(\d{2})$/, "\n$1 - $2")
    .replace(/^(\S+)\s+/, "$1\n");
  const externalSeriesEvents = await getExternalEventsBySeriesSlug(
    { slug: eventName, locale },
  );

  return (
    <main>
      <div className="relative isolate overflow-hidden w-full bg-linear-to-b from-[#060102] from-[10%] via-[#792327] via-[60%] to-black">
        <Image src="/logo/bglogo.avif" alt="bg logo" width={1920} height={1080} className="object-cover object-right absolute -top-10 z-8" />
        <div className="relative z-10">
          <Banner
            subtitle=""
            title={bannerTitle}
            backHref={`/${locale}/season/studio`}
            showOverlay={false}
            mediaType="image"
            mediaSrc="/images/banners/studiomainbanner.webp"
            height="70vh"
            isBannerImageOverlay={false}
          />

          <div>

            <SeasonSection
              events={externalSeriesEvents}
              locale={locale}
            />


          </div>
          <Partners partnerCategories={partnerCategories} />
        </div>
        
      </div>
    </main>
  );
}
