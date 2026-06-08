"use client";

import { useEffect, useMemo, useRef } from "react";
import { notFound, useParams, usePathname, useSearchParams } from "next/navigation";
import { SeatLayoutStep } from "@/components/seat-layout";
import { useExternalEventDetails } from "@/contexts/program-event/ExternalEventDetailsContext";
import { useExternalEventBookingState } from "@/contexts/program-event/ExternalEventDetailsContext";
import { useExternalEventBookingSelection } from "@/contexts/program-event/ExternalEventDetailsContext";
import LoginModal from "../auth/LoginModal";
import { useAuth } from "@/contexts/auth/AuthContext";

type BookingSeatLayoutPageClientProps = {
  scheduleRouteId: string;
  eventTitle?: string;
};

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

export default function BookingSeatLayoutPageClient({
  scheduleRouteId,
  eventTitle,
}: BookingSeatLayoutPageClientProps) {
  const externalEventDetails = useExternalEventDetails();
  const bookingCtx = useExternalEventBookingState();
  const bookingSelection = useExternalEventBookingSelection();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "en";
  // True after seat map emits a non-empty selection at least once.
  // Used to ignore the initial empty callback on remount.
  const hasSelectedSeatsRef = useRef(false);
  const { showLoginModal, setShowLoginModal } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const returnTo = useMemo(() => {
    const path = pathname.includes("/seats") ? `/${locale}/booking/addons` : pathname;
    return queryString ? `${path}?${queryString}` : path;
  }, [pathname, locale, searchParams]);

  const selectedTimeSlot = useMemo(() => {
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
  }, [externalEventDetails, scheduleRouteId]);

  if (!selectedTimeSlot) {
    notFound();
  }

  const chartId = String(selectedTimeSlot.chart_id ?? "").trim();
  const eventConfigId = Number(selectedTimeSlot.event_config_id ?? 0);

  useEffect(() => {
    // Keep right-side panel in sync with selected schedule.
    bookingSelection.setSelectedDate(selectedTimeSlot.date ?? null);
    bookingSelection.setSelectedTime(
      formatHHMMTo12Hour(selectedTimeSlot.time_slot?.start_time ?? "") ??
      selectedTimeSlot.time_slot?.start_time ??
      null,
    );
    bookingSelection.setSelectedScheduleId(Number(selectedTimeSlot.schedule_id ?? 0) || null);

    // IMPORTANT: do NOT restrict the calendar to a single date.
    // Users must be able to change date/time from the booking side panel.
    const schedulesRaw = externalEventDetails.schedules;
    const schedules: Array<{ date?: string }> = Array.isArray(schedulesRaw) ? (schedulesRaw as any[]) : [];
    const dates = Array.from(new Set(schedules.map((s) => String(s?.date ?? "").trim()).filter(Boolean)));
    if (dates.length) bookingSelection.setAllowedDates(dates);
  }, [bookingSelection, selectedTimeSlot]);

  if (!chartId || !Number.isFinite(eventConfigId) || eventConfigId <= 0) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="rounded-2xl border border-border p-4 text-sm text-muted-foreground">
          Seat layout not available for this schedule.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      {eventTitle ? (
        <h1 className="mb-4 font-optima text-[28px] leading-[100%] md:leading-[58px] text-white md:text-[40px]">
          {eventTitle}
        </h1>
      ) : null}
      <SeatLayoutStep
        chartId={chartId}
        eventConfigId={eventConfigId}
        framed
        height="min(78vh,820px)"
        onSelectionChange={(seats) => {
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
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        returnTo={returnTo}
        title="Sign in to continue"
        description="Please sign in with Emaar PASS to proceed to add this event to your favorites."
      />
    </div>
  );
}

