import { notFound } from "next/navigation";
import Banner from "@/components/programs/Banner";
import SeasonSection from "@/components/SeasonSection";
import Partners from "@/components/Partners";
import type { Locale } from "@/i18n/config";
import { getPartners } from "@/services/websiteServer";
import {
  getExternalEvents,
  getExternalEventScreens,
  mapExternalEventsToSeasonCards,
} from "@/services/eventServer";
import {
  categoryOptions,
  screenOptions,
} from "@/services/eventFilterOptions";

export const revalidate = 600;

export default async function EventsGenrePage({
  params,
}: {
  params: Promise<{ locale: string; genre: string }>;
}) {
  const { locale, genre } = await params;
  const cleanGenre = String(genre || "").trim();
  if (!cleanGenre) notFound();

  const [externalEvents, partnerCategories, screens] = await Promise.all([
    getExternalEvents({ page: 1, limit: 100, locale: locale as Locale }),
    getPartners({ locale: locale as string }),
    getExternalEventScreens({ locale: locale as string }),
  ]);

  const seasonCardsAll = mapExternalEventsToSeasonCards(externalEvents);
  const seasonCards = seasonCardsAll.filter((e) => e.categorySlug === cleanGenre);
  if (seasonCards.length === 0) notFound();

  const categorySelectOptions = categoryOptions(seasonCardsAll);
  const screenSelectOptions = screenOptions(screens ?? []);

  return (
    <main className="min-h-screen bg-background flex flex-col items-center w-full">
      {/* <Banner
        subtitle=""
        title="Events"
        mediaType="image"
        height="60vh"
        mobileHeight="40vh"
        mediaSrc="/blog/NEWSUPDATESbackground.avif"
        hideMobileGradient
        className="opacity-90"
      />
      <SeasonSection
        events={seasonCards}
        filterVariant="full"
        showImageBackground
        locale={locale}
        titleOnly={true}
        screenOptions={screenSelectOptions}
        categoryOptions={categorySelectOptions}
      />
      <Partners partnerCategories={partnerCategories} /> */}
    </main>
  );
}

