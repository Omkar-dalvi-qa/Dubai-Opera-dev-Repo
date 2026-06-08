"use client";

import { useMemo } from "react";
import EventTicketCard from "@/components/EventTicketCard";
import { EventTabs } from "@/components/event-tabs";
import VideoBanner from "@/components/VideoBanner";
import Partners from "@/components/Partners";
import {
  useExternalEventDetails,
  useExternalEventSchedules,
} from "@/contexts/program-event/ExternalEventDetailsContext";
import type { PartnerCategory } from "@/types/website";

type ProgramEventDetailPageClientProps = {
  locale: string;
  eventName: string;
  eventId: string;
  partnerCategories: PartnerCategory[];
  backHref?: string;
  /** Override booking CTA destination (defaults to season booking route). */
  bookTicketsUrl?: string;
};

const DEFAULT_VIDEO_FALLBACK = "/videos/videoevent.mp4";

export default function ProgramEventDetailPageClient({
  locale,
  partnerCategories,
}: ProgramEventDetailPageClientProps) {
  const externalEventDetails = useExternalEventDetails();
  const schedules = useExternalEventSchedules();

  const {
    scheduleDateRange,
    allScheduleDates,
    firstDateTime,
    lastDateTime,
    scheduleTimes,
  } = useMemo(() => {
    const schedulesRaw = schedules;
    const schedulesList: Array<{
      schedule_id?: number;
      date?: string;
      time_slot?: { start_time?: string; end_time?: string };
    }> = Array.isArray(schedulesRaw) ? (schedulesRaw as any[]) : [];

    const allScheduleDatesList = Array.from(
      new Set(
        schedulesList
          .map((s) => s.date)
          .filter((date): date is string => Boolean(date))
      )
    );


    const schedulesWithStart = schedulesList
      .map((s) => ({
        date: s.date ?? "",
        start: s.time_slot?.start_time ?? "",
        end: s.time_slot?.end_time ?? "",
      }))
      .filter((s) => s.date && s.start);


    const formatShowDate = (isoDate: string) => {
      const d = new Date(`${isoDate}T00:00:00`);
      if (Number.isNaN(d.getTime())) return isoDate;
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    };


    const scheduleDatesAsc = Array.from(new Set(schedulesWithStart.map((s) => s.date))).sort(
      (a, b) => new Date(`${a}T00:00:00`).getTime() - new Date(`${b}T00:00:00`).getTime(),
    );
    const scheduleDateRangeLocal =
      scheduleDatesAsc.length > 1
        ? `${formatShowDate(scheduleDatesAsc[0])} to ${formatShowDate(
          scheduleDatesAsc[scheduleDatesAsc.length - 1],
        )}`
        : formatShowDate(scheduleDatesAsc?.length ? scheduleDatesAsc[0] : "");

    const firstSchedule = schedulesWithStart
      .slice()
      .sort((a, b) => {
        const da = new Date(`${a.date}T${a.start}:00`).getTime();
        const db = new Date(`${b.date}T${b.start}:00`).getTime();
        return da - db;
      })[0];

    const lastSchedule = schedulesWithStart
      .slice()
      .sort((a, b) => {
        const da = new Date(`${a.date}T${a.start}:00`).getTime();
        const db = new Date(`${b.date}T${b.start}:00`).getTime();
        return db - da;
      })[0];

    const lastDateTimeLocal = lastSchedule
      ? {
        dateTime: `${lastSchedule.date}T${lastSchedule.end}:00.000`,
        endDateTime: lastSchedule.end ? `${lastSchedule.date}T${lastSchedule.end}:00.000` : undefined,
      }
      : null;

    const firstDateTimeLocal = firstSchedule
      ? {
        dateTime: `${firstSchedule.date}T${firstSchedule.start}:00.000`,
        endDateTime: firstSchedule.end ? `${firstSchedule.date}T${firstSchedule.end}:00.000` : undefined,
      }
      : null;

    const uniqueStartTimes = Array.from(new Set(schedulesWithStart.map((s) => s.start)))
      .filter(Boolean)
      .sort((a, b) => {
        const [ah = "0", am = "0"] = a.split(":");
        const [bh = "0", bm = "0"] = b.split(":");
        return Number(ah) * 60 + Number(am) - (Number(bh) * 60 + Number(bm));
      });

    const formatStartTime = (hhmm: string) => {
      const [h = "0", m = "0"] = hhmm.split(":");
      const d = new Date();
      d.setHours(Number(h), Number(m), 0, 0);
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    };

    const scheduleTimesLocal =
      uniqueStartTimes.length > 0 ? uniqueStartTimes.map(formatStartTime).join(" & ") : null;

    return {
      schedules: schedulesList,
      scheduleDateRange: scheduleDateRangeLocal,
      allScheduleDates: allScheduleDatesList,
      firstDateTime: firstDateTimeLocal,
      lastDateTime: lastDateTimeLocal,
      scheduleTimes: scheduleTimesLocal,
    };
  }, [schedules]);



  const websiteBanner =
    externalEventDetails.images?.find((img) => String(img?.name ?? "").toLowerCase() === "hero banner") ??
    externalEventDetails.images?.[0] ??
    null;
  const mobileBanner =
    externalEventDetails.images?.find((img) => String(img?.name ?? "").toLowerCase() === "event poster") ?? null;
  const websiteBannerUrl = websiteBanner?.imageUrl ?? null;
  const mobileBannerUrl = mobileBanner?.imageUrl ?? null;
  const scheduleScreenNames = (Array.isArray(externalEventDetails.schedules) ? externalEventDetails.schedules : [])
    .map((schedule: any) => String(schedule?.screen?.name ?? "").trim())
    .filter(Boolean);

  return (
    <main className="min-h-screen">
      <VideoBanner
        mediaUrl={externalEventDetails.media_url}
        websiteBannerUrl={websiteBannerUrl}
        mobileBannerUrl={mobileBannerUrl}
        thumbnailUrl={externalEventDetails.thumbnail_url}
        fallbackVideoSrc={DEFAULT_VIDEO_FALLBACK}
        title={externalEventDetails.name}
        venueName={externalEventDetails.screens?.[0]?.name ?? "-"}
        scheduleScreenNames={scheduleScreenNames}
        backHref={`/${locale}`}
      />


      <div
        className="w-full bg-linear-to-b from-black via-primary-light to-[#000000]"
        // style={{
        //   background: "linear-gradient(180deg, #120305 24%, #792327 52%, #8b2a2f 62%, #1a0608 88%)",
        // }}
      >
        <div className="px-4 py-2 lg:py-6 mx-auto max-w-350 lg:max-w-7xl">
          <EventTabs venueName={externalEventDetails.screens?.[0]?.name ?? "-"} data={externalEventDetails}>
            <EventTicketCard
              schedules={schedules}
              scheduleDateRange={scheduleDateRange}
              allScheduleDates={allScheduleDates}
              firstDateTime={firstDateTime}
              lastDateTime={lastDateTime}
              scheduleTimes={scheduleTimes}
            />
          </EventTabs>
        </div>
        <Partners partnerCategories={partnerCategories} />

      </div>
    </main>
  );
}
