import Banner from "@/components/programs/Banner";
import SeasonSection from "@/components/SeasonSection";
import Partners from "@/components/Partners";
import {
  getExternalEvents,
  getExternalEventSeasons,
} from "@/services/eventServer";
import { getHomePageData } from "@/services/homePageServer";
import { Locale } from "@/i18n/config";
import { seasonOptions as buildSeasonSelectOptions } from "@/services/eventFilterOptions";

type PageConfig = {
  bannerSubtitle: string;
  bannerTitle: string;
  showBannerOverlay?: boolean;
};

const REQUIRED_PAGE_CONFIG: Record<string, PageConfig> = {
  "season-2025-26": {
    bannerSubtitle: "WHAT'S ON",
    bannerTitle: "STAGE THIS Season",
    showBannerOverlay: true,
  },
  "past-shows": {
    bannerSubtitle: "WHAT WAS ON",
    bannerTitle: "STAGE PAST Season",
    showBannerOverlay: true,
  },
};

function buildPageConfig(eventName: string): PageConfig {
  const requiredConfig = REQUIRED_PAGE_CONFIG[eventName];
  if (requiredConfig) return requiredConfig;

  const isPastShows = eventName === "past-shows";
  return {
    bannerSubtitle: isPastShows ? "WHAT WAS ON" : "WHAT'S ON",
    bannerTitle: isPastShows ? "STAGE PAST Season" : "STAGE THIS Season",
    showBannerOverlay: true,
  };
}


export default async function ProgramEventPage({
  params,
}: {
  params: Promise<{ locale: string; eventName: string }>;
}) {
  const { locale, eventName } = await params;
  const isPastShowsPage = eventName === "past-shows";
  const config = buildPageConfig(eventName);
  const [seasonsForFilter, seasonCards] = await Promise.all([
    getExternalEventSeasons({ locale }),
    getExternalEvents({
      page: 1,
      limit: 100,
      season: eventName,
      locale,
    }),
  ]);
  const seasonFilterOptions = buildSeasonSelectOptions(seasonsForFilter);
  const { partnerCategories } = await getHomePageData(locale as Locale);
  const filtersTitleByPage = eventName === "past-shows" ? "Past seasons" : "What's on";

  return (
    <main>
      <div className="relative isolate overflow-hidden w-full" >
        <div className="relative bg-linear-to-b from-[#060102] from-10% via-[#792327] via-80% to-black">
          <Banner
            subtitle={config.bannerSubtitle}
            title={config.bannerTitle}
            mediaType="video"
            mediaSrc="/videos/OperaVideo1.mp4"
            height="60vh"
            mobileHeight="30vh"
            isBannerImageOverlay={true}
          />

          <div className="relative z-10 lg:-mt-56">

            <SeasonSection
              isBannerImageOverlay={true}
              events={seasonCards}
              locale={locale}
              showFilters={eventName === "season-2025-26" || eventName === "past-shows"}
              filtersTitle={filtersTitleByPage}
              seasonOptions={isPastShowsPage ? seasonFilterOptions : []}
              pastShowsOnlySeasonsFilter={isPastShowsPage}
            />

            <Partners partnerCategories={partnerCategories} />
          </div>
        

        </div>
      </div>
    </main>
  );
}
