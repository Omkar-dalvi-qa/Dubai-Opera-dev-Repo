"use client";

import { useAuth } from "@/contexts/auth/AuthContext";
import { useExternalEventBookingState } from "@/contexts/program-event/ExternalEventDetailsContext";
import { getTypeColor, type SeatLayoutResponse, type SeatLayoutScreenSeatType } from "@/seatLayout";
import { postExternalEventReservation } from "@/services/externalEventReservationClient";
import {
  buildEventReservationItemsFromSeats,
  cloneSeatsForReservationPayload,
  FALLBACK_TIMER_SECONDS,
  mergedUpdatedSummary,
} from "@/components/programs/bookingSeatReservationUtils";
import { ChevronDown, ChevronUp, Loader2, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type SeatsSummaryBarStaticProps = {
  layoutData: SeatLayoutResponse | null;
  /** Full path including query, e.g. `/en/booking/addons?event=…` */
  nextHref: string;
};

function useRemainingSeconds(timerExpiry: number | null): number {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!timerExpiry) {
      setSeconds(0);
      return;
    }
    const tick = () => {
      setSeconds(Math.max(0, Math.ceil((timerExpiry - Date.now()) / 1000)));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [timerExpiry]);
  return seconds;
}

function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function minTypePrice(st: SeatLayoutScreenSeatType): number | null {
  const direct = Number(st.seat_price);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const opts = Array.isArray(st.all_seat_prices) ? st.all_seat_prices : [];
  const nums = opts
    .map((o) => Number(o.price))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (!nums.length) return null;
  return Math.min(...nums);
}

function seatRowLabel(seat: Record<string, unknown>): string {
  const name = String(seat.seat_class ?? seat.label ?? "").trim();
  if (name) return name;
  const row = String(seat.seat_row_name ?? "").trim();
  const num = String(seat.seat_number ?? "").trim();
  if (row && num) return `${row}:${num}`;
  return "Seat";
}

/**
 * Seats booking summary bar — same `/seats` → reservation → next route flow as `BookingTicketPanel` (`isSeatsPage` branch).
 */
export default function SeatsSummaryBarStatic({ layoutData, nextHref }: SeatsSummaryBarStaticProps) {
  const router = useRouter();
  const pathname = usePathname();
  /** Matches `BookingTicketPanel` `isSeatsPage` — reservation + payload only on the seat-selection route. */
  const isSeatsBlock = pathname.includes("/booking/seats");

  const { user, setShowLoginModal } = useAuth();
  const bookingCtx = useExternalEventBookingState();
  const {
    seatSubtotal,
    selectedSeatsData,
    timerExpiry,
    setTimerExpiry,
    setTimerTotalSeconds,
    setReservationId,
    setReservationSummary,
    reservationId,
    selectedScheduleId,
    details,
    customer,
    isSeatBookingEnabled,
  } = bookingCtx;

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [nextSubmitting, setNextSubmitting] = useState(false);

  const currency = useMemo(
    () =>
      String(layoutData?.data?.currency_code ?? "AED").trim() || "AED",
    [layoutData],
  );

  const tierColor = useMemo(() => {
    const types = layoutData?.data?.seat_classes ?? [];
    return (typeName: string) => {
      const t = String(typeName ?? "").trim();
      if (!t) return "#22d3ee";
      const st = types.find(
        (x) => String(x.class_name ?? "").trim().toLowerCase() === t.toLowerCase(),
      );
      return st?.class_color?.trim() || getTypeColor(t);
    };
  }, [layoutData]);

  const seats = useMemo(
    () => (Array.isArray(selectedSeatsData) ? selectedSeatsData : []) as Record<string, unknown>[],
    [selectedSeatsData],
  );

  const seatsByClass = useMemo(() => {
    const groups: Record<string, Record<string, unknown>[]> = {};
    for (const seat of seats) {
      const key = String(seat.seat_class ?? "Standard").trim() || "Standard";
      (groups[key] ??= []).push(seat);
    }
    return Object.values(groups);
  }, [seats]);
  console.log('seatsByClassseatsByClass', seatsByClass);

  useEffect(() => {
    if (seats.length === 0) setSummaryOpen(false);
  }, [seats.length]);

  const removeSeat = (layoutSeatId: string) => {
    window.dispatchEvent(
      new CustomEvent("bookingSeatRemove", {
        detail: { layout_seat_id: layoutSeatId },
      }),
    );
  };

  // const clearAll = () => {
  //   window.dispatchEvent(new CustomEvent("bookingSeatsClearAll"));
  //   setSummaryOpen(false);
  // };

  const goNext = useCallback(async () => {
    const seatList = Array.isArray(selectedSeatsData) ? selectedSeatsData : [];
    if (seatList.length === 0 || nextSubmitting) return;

    const target = nextHref.startsWith("/") ? nextHref : `/${nextHref}`;

    if (!isSeatsBlock) {
      router.push(target);
      return;
    }

    setNextSubmitting(true);
    try {
      const scheduleId = selectedScheduleId;
      if (scheduleId == null || scheduleId <= 0) {
        toast.error("Could not determine showtime (schedule). Go back and pick a date and time.");
        return;
      }
      const productId = Number(details?.id);
      if (!Number.isFinite(productId) || productId <= 0) {
        toast.error("Event product is missing. Please refresh the page.");
        return;
      }

      const items = buildEventReservationItemsFromSeats({
        productId,
        scheduleId: scheduleId ?? 0,
        schedules: (details?.schedules ?? []) as unknown[],
        seats: seatList,
      });

      const c = customer;
      const customer_name =
        [c.firstName, c.lastName].filter(Boolean).join(" ").trim() || "Guest";
      const email = (c.email || "").trim() || "guest@example.com";
      const phone = (c.mobile || "").trim() || "-";

      const payload: Record<string, unknown> = {
        ...(reservationId != null && String(reservationId).trim().length > 0 ? { reservation_id: reservationId } : {}),
        external_user_id: user?.emmarId ?? "",
        customer_name,
        email,
        phone,
        items,
        ...(isSeatBookingEnabled
          ? {
              selected_seats: cloneSeatsForReservationPayload(seatList, {
                productId,
                scheduleId,
              }),
            }
          : {}),
      };

      const data = await postExternalEventReservation(payload);
      
      const rid = data?.reservation_id;
      if (rid != null && String(rid).trim().length > 0) {
        setReservationId(String(rid));
      }
      setReservationSummary(mergedUpdatedSummary(data?.summary, data) as any);

      if (data?.expiry_time) {
        const expiryMs = new Date(data.expiry_time).getTime();
        if (expiryMs !== timerExpiry) {
          setTimerExpiry(expiryMs);
          setTimerTotalSeconds(Math.max(0, Math.floor((expiryMs - Date.now()) / 1000)));
        }
      }

      // if (!user?.emmarId) {
      //   setShowLoginModal(true);
      //   setNextSubmitting(false);
      //   return;
      // }

      if (!data?.expiry_time && !timerExpiry) {
        setTimerExpiry(Date.now() + FALLBACK_TIMER_SECONDS * 1000);
        setTimerTotalSeconds(FALLBACK_TIMER_SECONDS);
      }

      const savedRid = String(data?.reservation_id ?? reservationId ?? "").trim();
      const nextTarget = savedRid
        ? `${target}${target.includes("?") ? "&" : "?"}rid=${encodeURIComponent(savedRid)}`
        : target;
      router.push(nextTarget);
    } catch (err) {

      const msg =
        err instanceof Error ? err.message : "Could not create reservation. Please try again.";
      toast.error(msg);
    } finally {
      setNextSubmitting(false);
    }
  }, [
    selectedSeatsData,
    nextSubmitting,
    nextHref,
    isSeatsBlock,
    router,
    selectedScheduleId,
    details?.id,
    details?.schedules,
    customer,
    reservationId,
    user?.emmarId,
    isSeatBookingEnabled,
    setReservationId,
    setReservationSummary,
    setTimerExpiry,
    setTimerTotalSeconds,
    timerExpiry,
    setShowLoginModal,
  ]);

  return (
    <div className="fixed bottom-0 z-50 w-full left-0 right-0 max-w-[1400px] mx-auto">
      <div className="relative">
        {summaryOpen && seats.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 z-30 mb-2 w-full max-w-[400px] rounded-xl border border-white/10 bg-surface p-3 md:p-4 shadow-xl sm:w-[400px]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="font-montserrat text-sm font-semibold text-white">
                Order details
              </span>
              {/* <button
                type="button"
                onClick={clearAll}
                className="font-montserrat cursor-pointer text-xs font-medium text-white/50 transition-colors hover:text-white"
              >
                Clear all
              </button> */}
            </div>
            <div className="max-h-[40vh] space-y-2 overflow-y-auto pr-1">
              {seatsByClass.map((group) => {
                const seat = group[0];
                const seatClass = String(seat.seat_class ?? "Standard").trim() || "Standard";
                const priceName = String(seat.selected_price_name ?? "").trim();
                const tier = priceName ? `${seatClass} · ${priceName}` : seatClass;
                const total = group.reduce(
                  (n, s) => n + (Number(s.seat_price ?? s.actual_price ?? 0) || 0),
                  0,
                );
                return (
                  <div
                    key={seatClass}
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-surface px-3 py-2.5"
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: tierColor(String(seatClass ?? "")) }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-montserrat text-sm font-semibold uppercase tracking-wide text-white">
                        {group.length} × {tier}
                      </p>
                      <p className="font-montserrat text-xs text-white/60">
                        {group.map(seatRowLabel).join(", ")}
                      </p>
                    </div>
                    <span className="shrink-0 font-montserrat text-sm font-semibold text-white">
                      {currency} {total.toFixed(2)}
                    </span>
                    {/* <button
                      type="button"
                      onClick={() =>
                        group.forEach((s) => {
                          const id = String(s.layout_seat_id ?? "").trim();
                          if (id) removeSeat(id);
                        })
                      }
                      className="flex cursor-pointer h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/60 transition-colors hover:border-white/30 hover:text-white"
                      aria-label="Remove seats"
                    >
                      <X className="h-4 w-4" />
                    </button> */}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex lg:flex-wrap items-center gap-3 rounded-sm bg-[#1E1E1E] px-3 py-2.5 sm:flex-nowrap sm:px-4">
          <button
            type="button"
            onClick={() => setSummaryOpen((o) => !o)}
            disabled={seats.length === 0}
            aria-expanded={summaryOpen}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#2c2c2c] px-3 py-2 font-montserrat text-xs md:text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Summary
            {summaryOpen ? (
              <ChevronUp className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0" />
            )}
          </button>

          <div className="ml-auto flex shrink-0 items-center gap-4">
            <span className="font-montserrat text-sm lg:text-lg font-semibold tabular-nums text-white sm:text-xl">
              {currency} {Number(seatSubtotal || 0).toFixed(0)}
            </span>
            <button
              type="button"
              disabled={seats.length === 0 || nextSubmitting}
              onClick={() => void goNext()}
              className="inline-flex cursor-pointer min-w-[100px] items-center justify-center gap-2 rounded-lg bg-[#792327] p-2 md:px-5 md:py-2.5 font-montserrat text-sm font-semibold text-white transition-colors hover:bg-[#8f2a2f] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {nextSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              Proceed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
