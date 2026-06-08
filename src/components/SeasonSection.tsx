"use client";

import SeasonCard from "./SeasonCard";
import SeasonCardMobile from "./SeasonCardMobile";
import "react-datepicker/dist/react-datepicker.css";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import BigLogo from "../../public/images/Operabiglogo.png";
import { useAuth } from "@/contexts/auth/AuthContext";
import { getUserFavourate } from "@/services/websiteServer";
import LoginModal from "./auth/LoginModal";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ExternalEvent } from "@/services/eventServer";
import SectionHeader from "./SectionHeader";
import Filters from "./Filters";
import type { FiltersDateState, FiltersOption } from "./Filters";

export type SeasonSectionEventRow = {
  id: number | string;
  season_label?: string;
  slug: string;
  image: string;
  imageWidth?: number;
  imageHeight?: number;
  category: string;
  categoryId?: number;
  categorySlug?: string;
  title: string;
  location: string;
  date: string;
  price: string;
  tag?: string;
  startDateIso?: string;
  endDateIso?: string;
  seasonName?: string;
  season?: string;
  seasonSlug?: string;
  eventSlug?: string;
  thumbnail_url?: string;
  isScheduleUpcoming?: boolean;
};

interface SeasonSectionProps {
  sectionTitle?: string | false;
  viewAllLink?: string;
  events?: ExternalEvent[];
  showImageBackground?: boolean;
  locale?: string;
  isBannerImageOverlay?: boolean;
  showFilters?: boolean;
  filtersTitle?: string;
  seasonOptions?: FiltersOption[];
  pastShowsOnlySeasonsFilter?: boolean;
}

function formatDateParams(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function filtersAreDefault(state: FiltersDateState): boolean {
  return (
    state.datePreset === "Upcoming" &&
    !state.calendarDate &&
    !state.venueValue &&
    !state.seasonValue &&
    state.categoryIds.length === 0
  );
}

export default function SeasonSection({
  events,
  isBannerImageOverlay = false,
  sectionTitle = false,
  viewAllLink = '/events',
  showFilters = false,
  filtersTitle = "",
  seasonOptions = [],
  pastShowsOnlySeasonsFilter = false,
  locale = "en",
}: SeasonSectionProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams?.toString() ?? "";
  const { user, showLoginModal, setShowLoginModal } = useAuth();
  const [favouriteEventIds, setFavouriteEventIds] = useState<string[]>([]);
  const t = useTranslations("common");

  const path = pathname.replace(/\/$/, "");
  const isHomePage = path === "" || path === "/en" || path === "/ar";
  const [filtersState, setFiltersState] = useState<FiltersDateState>({
    datePreset: "Upcoming",
    calendarDate: null,
    venueValue: null,
    seasonValue: null,
    categoryIds: [],
  });
  const [visibleEvents, setVisibleEvents] = useState<ExternalEvent[]>(events ?? []);

  const screenOptions = useMemo<FiltersOption[]>(
    () =>
      Array.from(
        new Set(
          (events ?? []).flatMap((event) => {
            const primary = String(event.screen ?? "").trim();
            const list = (event.screens ?? []).map((screen) => String(screen ?? "").trim());
            return [primary, ...list].filter(Boolean);
          }),
        ),
      )
        .map((name) => ({ value: name, label: name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [events],
  );
  const categoryOptions = useMemo<FiltersOption[]>(
    () => {
      const map = new Map<string, FiltersOption>();
      for (const event of events ?? []) {
        const label = String(event.category?.name ?? event.genre ?? "").trim();
        if (!label) continue;
        const key = label.toLowerCase();
        if (!map.has(key)) map.set(key, { value: key, label });
      }
      return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
    },
    [events],
  );
  useEffect(() => {
    setVisibleEvents(events ?? []);
  }, [events]);

  useEffect(() => {
    if (!showFilters) return;

    if (filtersAreDefault(filtersState) && (events ?? []).length > 0) {
      setVisibleEvents(events ?? []);
      return;
    }

    let isMounted = true;

    const fetchFilteredEvents = async () => {
      const today = formatDateParams(new Date());
      const selectedCalendarDate = filtersState.calendarDate
        ? formatDateParams(filtersState.calendarDate)
        : undefined;
      let startDate: string | undefined;
      let endDate: string | undefined;

      if (selectedCalendarDate) {
        startDate = selectedCalendarDate;
        endDate = selectedCalendarDate;
      } else if (!pastShowsOnlySeasonsFilter && filtersState.datePreset === "Past Shows") {
        endDate = today;
      }

      const params = new URLSearchParams({
        product_type: "EVENT",
        page: "1",
        limit: "100",
        locale,
      });
      if (startDate) params.set("start_date", startDate);
      if (endDate) params.set("end_date", endDate);
      const seasonFromEvents = String(events?.[0]?.seasonSlug ?? "").trim();
      const season = String(filtersState.seasonValue ?? seasonFromEvents).trim();
      if (season) params.set("season", season);
      if (filtersState.categoryIds[0]) params.set("category", filtersState.categoryIds[0]);
      const screen = String(filtersState.venueValue ?? "").trim();
      if (screen) params.set("screen", screen);

      const response = await fetch(`/api/external/products?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });
      const body = (await response.json().catch(() => null)) as
        | { data?: { data?: ExternalEvent[] } }
        | null;
      const filtered = body?.data?.data ?? [];

      if (!isMounted) return;
      setVisibleEvents(filtered);
    };

    void fetchFilteredEvents();

    return () => {
      isMounted = false;
    };
  }, [showFilters, filtersState, pastShowsOnlySeasonsFilter, locale, events]);

  const filteredEvents = visibleEvents;
  const viewAllEvents = visibleEvents.length > 8;

  useEffect(() => {
    if (!user) return;
    getUserFavourate(String(user.emmarId))
      .then((res) => {
        setFavouriteEventIds(res?.event_ids ?? []);
      })
      .catch((err) => {
        console.log(err, "err");
      });
  }, [user]);

  return (
    <section
      data-testid="whats-on-section"
      className={`w-full relative py-10   ${isBannerImageOverlay ? "pt-20 lg:pt-72 bg-linear-to-b from-[#060102] from-10% via-[#792327]" : "max-w-[1400px] mx-auto  px-4 md:px-8 lg:px-16"} overflow-hidden`}
    >
      {isBannerImageOverlay ? (
        <Image
          src={BigLogo}
          alt="background"
          width={1000}
          height={1000}
          className="hidden lg:block lg:absolute  lg:-top-80 inset-0 lg:left-1/2 lg:-translate-x-1/2 w-[80%] lg:w-[110%] max-w-none h-auto pointer-events-none z-0"
        />
      ) : null}

      {sectionTitle && (
        <SectionHeader
          sectionTitle={sectionTitle}
          viewAllLink={viewAllLink}
        />
      )}

      {showFilters && (
        <Filters
          title={filtersTitle}
          screenOptions={screenOptions}
          categoryOptions={categoryOptions}
          seasonOptions={seasonOptions}
          showSeasonsFilter={seasonOptions.length > 0}
          showVenueFilter={!pastShowsOnlySeasonsFilter}
          showDateFilters={!pastShowsOnlySeasonsFilter}
          showCalendarFilter={!pastShowsOnlySeasonsFilter}
          showCategoryFilter={!pastShowsOnlySeasonsFilter}
          onFiltersChange={setFiltersState}
        />
      )}

      <div className={`mx-auto w-full relative z-10 max-w-[1400px] ${isBannerImageOverlay ? "px-4 md:px-8 lg:px-12" : ""}`}>
        {filteredEvents.length === 0 ? (
          <p data-testid="whats-on-empty" className="col-span-full text-center font-montserrat text-white/80 py-8 h-96 flex items-center justify-center mt-10">
            {t("noPerformancesMatchThisDate")}
          </p>
        ) : (
          <>
            {/* Mobile: homepage = horizontal scroll | other pages = 2-column grid */}
            {isHomePage ? (
              <div className="mt-[30px] sm:hidden overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="flex gap-4 w-max">
                  {Array.from({
                    length: Math.ceil((filteredEvents.slice(0, 8).length || 0) / 3),
                  }).map((_, columnIndex) => (
                    <div
                      key={columnIndex}
                      className="flex flex-col gap-4 snap-start"
                    >
                      {filteredEvents
                        ?.slice(columnIndex * 3, columnIndex * 3 + 3)
                        .map((event: ExternalEvent, index: number) => (
                          <SeasonCardMobile
                            key={event.id ?? index}
                            event={event}
                            variant="scroll"
                            isFav={favouriteEventIds.includes(String(event.id))}
                          />
                        ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-[30px] grid grid-cols-2 gap-3 sm:hidden">
                {filteredEvents?.map((event: ExternalEvent, index: number) => (
                  <SeasonCardMobile
                    key={event.id ?? index}
                    event={event}
                    variant="grid"
                    isFav={favouriteEventIds.includes(String(event.id))}
                  />
                ))}
              </div>
            )}

            {/* Desktop: large cards in a responsive grid */}
            <div data-testid="whats-on-grid" className="mt-10 hidden gap-6 sm:grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredEvents.slice(0, 8).map((event: ExternalEvent, index: number) => (
                <div key={event.id ?? index} className="w-full">
                  <SeasonCard
                    event={event}
                    isFav={favouriteEventIds.includes(String(event.id))}
                  />
                </div>
              ))}
              {viewAllEvents && (
                <div className="w-auto">
                  <Link
                    data-testid="whats-on-view-all-card"
                    href="/events"
                    className="bg-surface rounded-2xl h-full min-h-[540px] flex items-center justify-center p-8 text-center text-white border border-white/10 hover:border-white/30 transition-colors"
                  >
                    <span className="font-montserrat text-2xl font-semibold">
                      {t("viewAll")}
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          returnTo={queryString ? `${pathname}?${queryString}` : pathname}
          title="Sign in to continue"
          description="Please sign in with Emaar PASS to proceed to add this event to your favorites."
        />
      )}
    </section>
  );
}
