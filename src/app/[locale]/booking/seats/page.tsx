"use client";

import LoginModal from "@/components/auth/LoginModal";
import ChangeDateTimeModal from "@/components/programs/ChangeDateTimeModal";
import SeatsSummaryBarStatic from "@/components/programs/SeatsSummaryBarStatic";
import { useAuth } from "@/contexts/auth/AuthContext";
import {
  useExternalEventBookingState,
  useExternalEventBookingSelection,
  useExternalEventDetails,
} from "@/contexts/program-event/ExternalEventDetailsContext";
import { SeedLayoutRenderer } from "@/seatLayout";
import { getSeatLayout } from "@/services/externalEventReservationClient";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

function formatHHMMTo12Hour(hhmm: string): string | null {
  const match = String(hhmm ?? "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const [, hRaw, mRaw] = match;
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function parseIsoDateOnly(iso: string): Date | null {
  const [y, m, d] = String(iso).trim().split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatScheduleChipLabel(slot: {
  date?: string;
  time_slot?: { start_time?: string; end_time?: string };
}): string {
  const iso = String(slot.date ?? "").trim();
  const d = parseIsoDateOnly(iso);
  const datePart = d
    ? `${d.toLocaleDateString("en-GB", { weekday: "short" })} ${d.getDate()} ${d.toLocaleDateString("en-GB", { month: "short" })}`
    : iso;
  const start =
    slot.time_slot && typeof slot.time_slot === "object"
      ? String(slot.time_slot.start_time ?? "")
      : "";
  const timeLabel = formatHHMMTo12Hour(start) || start;
  return timeLabel ? `${datePart}, ${timeLabel}` : datePart;
}

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [layoutData, setLayoutData] = useState<any>(null);
  const [modifyOpen, setModifyOpen] = useState(false);
  const externalEventDetails = useExternalEventDetails();
  const bookingCtx = useExternalEventBookingState();
  const bookingSelection = useExternalEventBookingSelection();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "en";
  const { showLoginModal, setShowLoginModal } = useAuth();

  const pathname = usePathname();
  // `searchParams` reference may not change when only the query string changes; depend on `toString()` so sid/date updates recompute.
  const searchKey = searchParams?.toString() ?? "";
  const queryString = searchKey;

  const returnTo = useMemo(() => {
    const path = pathname.includes("/seats") &&  bookingCtx?.hasAddons ? `/${locale}/booking/addons` : `/${locale}/booking/checkout`;
    return queryString ? `${path}?${queryString}` : path;
  }, [pathname, locale, searchParams, bookingCtx?.hasAddons]);

  const hasSelectedSeatsRef = useRef(false);

  const eventTitle = String(externalEventDetails?.name ?? "").trim();

  const selectedTimeSlot:
    | {
      event_config_id?: number;
      schedule_id?: number;
      chart_id?: string;
      date?: string;
      time_slot?: { start_time?: string; end_time?: string };
    }
    | undefined = useMemo(() => {
      const scheduleRouteId = Number(new URLSearchParams(searchKey).get("sid"));
      const schedulesRaw = externalEventDetails.schedules;
      const schedules: Array<{
        event_config_id?: number;
        schedule_id?: number;
        chart_id?: string;
        date?: string;
        time_slot?: { start_time?: string; end_time?: string };
      }> = Array.isArray(schedulesRaw) ? (schedulesRaw as any[]) : [];

      return schedules.find(
        (schedule) => schedule.schedule_id === Number(scheduleRouteId),
      );
    }, [externalEventDetails, searchKey]);

  const venueName = String(externalEventDetails?.screens?.[0]?.name ?? "Dubai Opera").trim() || "Dubai Opera";
  const currencyCode = String(externalEventDetails?.currency?.code ?? "AED").trim() || "AED";

  const scheduleChipLabel = useMemo(
    () => (selectedTimeSlot ? formatScheduleChipLabel(selectedTimeSlot) : ""),
    [selectedTimeSlot],
  );

  const handleApplyDateTime = useCallback(
    ({ scheduleId, date }: { scheduleId: number; date: string }) => {
      const q = new URLSearchParams(searchKey);
      q.set("sid", String(scheduleId));
      q.set("date", date);
      bookingCtx.setSeatSelection({
        seatQuantity: 0,
        seatSubtotal: 0,
        selectedSeatLabels: "",
        selectedSeatCategoryIds: [],
        selectedSeatsData: [],
      });
      window.dispatchEvent(new CustomEvent("bookingSeatsClearAll"));
      router.replace(`/${locale}/booking/seats?${q.toString()}`);
      setModifyOpen(false);
    },
    [searchKey, locale, router, bookingCtx],
  );

  // Keep right-side panel in sync with selected schedule.
  useEffect(() => {
    if (!selectedTimeSlot) return;

    bookingSelection.setSelectedDate(selectedTimeSlot.date ?? null);
    bookingSelection.setSelectedTime(
      formatHHMMTo12Hour(selectedTimeSlot.time_slot?.start_time ?? "") ??
      selectedTimeSlot.time_slot?.start_time ??
      null,
    );
    bookingSelection.setSelectedScheduleId(
      Number(selectedTimeSlot.schedule_id ?? 0) || null,
    );

    // Users must be able to change date/time from the booking side panel.
    const schedulesRaw = externalEventDetails.schedules;
    const schedules: Array<{ date?: string }> = Array.isArray(schedulesRaw)
      ? (schedulesRaw as any[])
      : [];
    const dates = Array.from(
      new Set(
        schedules.map((s) => String(s?.date ?? "").trim()).filter(Boolean),
      ),
    );
    if (dates.length) bookingSelection.setAllowedDates(dates);
  }, [bookingSelection, selectedTimeSlot, externalEventDetails.schedules]);

  // Drop stale SVG/map state as soon as schedule (sid/date → row) changes, before paint.
  const scheduleLayoutIdentity = selectedTimeSlot
    ? `${selectedTimeSlot.schedule_id ?? ""}-${selectedTimeSlot.chart_id ?? ""}-${selectedTimeSlot.event_config_id ?? ""}`
    : "";
  useLayoutEffect(() => {
    if (!scheduleLayoutIdentity) return;
    // setLayoutData(null);
    hasSelectedSeatsRef.current = false;
  }, [scheduleLayoutIdentity]);

  useEffect(() => {
    console.log("selectedTimeSlot", selectedTimeSlot);
    if (!selectedTimeSlot) return;

    const fetchLayout = async () => {
      try {

        console.log("selectedTimeSlot", selectedTimeSlot.schedule_id);
          const layoutData1 = await getSeatLayout(
            String(selectedTimeSlot.schedule_id ?? "")
          );
        setLayoutData(layoutData1);
      } catch (error) {
        console.error("Error fetching seat layout:", error);
      }
    };

    fetchLayout();
  }, [selectedTimeSlot]);

  if (!selectedTimeSlot) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-gray-500">
        No schedule found for this event.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full relative">
      <div className="w-full flex flex-col lg:flex-row items-start lg:items-end justify-between gap-2 relative">
      {eventTitle && (
        <h1 className="font-optima md:w-[60%] w-full text-[20px] md:text-[25px] lg:text-[30px] leading-8 text-white">
          {eventTitle}
        </h1>
      )}
      <div className="md:absolute md:bottom-0 md:right-0 mb-2 md:mb-0">
        <div className="py-2 px-2 lg:px-4 w-full lg:w-[300px] flex items-center justify-between gap-3 rounded-xl border border-[#FFFFFF2E] text-white bg-white/5">
          <div className="w-full lg:w-auto">
          <div className="text-xs lg:text-sm whitespace-nowrap font-montserrat">{scheduleChipLabel || "—"}</div> 
            <p className="text-xs lg:text-xs font-montserrat text-[#FFFFFFA6]">{venueName}</p>
          </div>
          <button
            type="button"
            onClick={() => setModifyOpen(true)}
            className="bg-primary cursor-pointer py-1 px-2 lg:px-5 rounded-lg text-[12px] font-montserrat"
          >
            Modify
          </button>
        </div>
      </div>
      </div>

      <main className="h-[60vh] lg:h-[calc(100vh-200px)]">
        {layoutData && (
        <SeedLayoutRenderer
          key={scheduleLayoutIdentity}
          layoutData={layoutData}
          onSelectionChange={(seats: any) => {
            const safeSeats = Array.isArray(seats) ? seats : [];
            if (
              safeSeats.length === 0 &&
              !hasSelectedSeatsRef.current &&
              Array.isArray(bookingCtx.selectedSeatsData) &&
              bookingCtx.selectedSeatsData.length > 0
            ) {
              // On remount (e.g. addons -> seats), seat map may emit empty values before
              // replaying its actual selection. Keep restored context seats until the map
              // emits a non-empty selection once.
              return;
            }

            if (safeSeats.length > 0) {
              hasSelectedSeatsRef.current = true;
            }

            const quantity = safeSeats.length;
            const subtotal = safeSeats.reduce((sum: number, s: any) => {
              const price = Number(s?.seat_price) || 0;
              return sum + price;
            }, 0);
            const labels = safeSeats
              .map((s: any) => s?.sl_seat_name || s?.label)
              .filter(Boolean)
              .join(", ");
            const categoryIds = Array.from(
              new Set(
                safeSeats
                  .map((s: any) =>
                    String(s?.screen_seat_type_id || s?.zoneId || "").trim(),
                  )
                  .filter(Boolean),
              ),
            ) as string[];

            bookingCtx.setSeatSelection({
              seatQuantity: quantity,
              seatSubtotal: subtotal,
              selectedSeatLabels: labels,
              selectedSeatCategoryIds: categoryIds,
              selectedSeatsData: safeSeats,
            });

            // Preserve existing event-based wiring used elsewhere in the booking flow.
            window.dispatchEvent(
              new CustomEvent("seatSelectionChange", {
                detail: { selectedSeats: safeSeats },
              }),
            );
          }}
        />
         )} 
      </main>
      {layoutData && bookingCtx.selectedSeatsData.length > 0 && 
      <SeatsSummaryBarStatic layoutData={layoutData} nextHref={returnTo} />}

      <ChangeDateTimeModal
        open={modifyOpen}
        onClose={() => setModifyOpen(false)}
        schedules={externalEventDetails.schedules ?? []}
        currencyCode={currencyCode}
        currentScheduleId={Number(selectedTimeSlot.schedule_id ?? 0)}
        onApply={handleApplyDateTime}
      />

      {showLoginModal && <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        returnTo={queryString ? `${returnTo}?${queryString}` : returnTo}
        title="Sign in to continue"
        description="Please sign in with Emaar PASS to proceed to add this event to your favorites."
      />}
    </div>
  );
}
