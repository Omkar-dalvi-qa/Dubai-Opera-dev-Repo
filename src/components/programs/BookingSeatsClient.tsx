"use client";

import { useEffect, useMemo, useState } from "react";
import SeatLayout from "@/components/programs/SeatLayout";
import type { SeatCategory } from "@/components/programs/BookingTicketPanel";
import { useExternalEventBookingState } from "@/contexts/program-event/ExternalEventDetailsContext";
import SeatMapStep from "../seat-map";


function formatHHMMTo12Hour(hhmm: string): string {
  const match = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return hhmm;
  const [, hRaw, mRaw] = match;
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return hhmm;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatISODateLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}


type BookingSeatsClientProps = {
  eventName: string;
  eventId: string;
  eventTitle: string;
  eventImageSrc?: string;
  selectedDateLabel: string | null;
  selectedTime: string | null;
  minDateISO?: string | null;
  maxDateISO?: string | null;
  timeSlots: string[];
  backToSeatsHref?: string;
  eventDetailHref?: string;
  isStudioFlow?: boolean;
  chartId: string;
  eventConfigId: number;
  scheduleId: number;
};

export default function BookingSeatsClient({
  eventTitle,
  selectedDateLabel,
  selectedTime,
  chartId,
  eventConfigId,
  scheduleId,
}: BookingSeatsClientProps) {


  const bookingCtx = useExternalEventBookingState();
  const { setSelectedDate, setSelectedTime, setSelectedScheduleId } = bookingCtx;

  useEffect(() => {
    if (selectedDateLabel) setSelectedDate(selectedDateLabel);
    if (selectedTime) setSelectedTime(selectedTime);
  }, [selectedDateLabel, selectedTime, setSelectedDate, setSelectedTime]);

  useEffect(() => {
    if (scheduleId > 0) setSelectedScheduleId(scheduleId);
  }, [scheduleId, setSelectedScheduleId]);

  // Sync seat map selection to global context
  useEffect(() => {
    const handleSync = (ev: any) => {
      const seats = Array.isArray(ev?.detail?.selectedSeats) ? ev.detail.selectedSeats : [];
      const quantity = seats.length;
      const subtotal = seats.reduce((sum: number, s: any) => {
        const price = Number(s.seat_price) || 0;
        return sum + price;
      }, 0);
      const labels = seats.map((s: any) => s.sl_seat_name || s.label).join(", ");
      const categoryIds = Array.from(new Set(seats.map((s: any) => String(s.screen_seat_type_id || s.zoneId)).filter(Boolean))) as string[];

      bookingCtx.setSeatSelection({
        seatQuantity: quantity,
        seatSubtotal: subtotal,
        selectedSeatLabels: labels,
        selectedSeatCategoryIds: categoryIds,
        selectedSeatsData: seats
      });
    };

    window.addEventListener("seatSelectionChange", handleSync);
    return () => window.removeEventListener("seatSelectionChange", handleSync);
  }, [bookingCtx.setSeatSelection]);


  return (
    <div>
      <div className="mt-8">
        <h2>{eventTitle}</h2>
        <div className="relative w-full space-y-5">
          <SeatMapStep chartId={chartId} eventConfigId={eventConfigId} scheduleId={scheduleId} />
        </div>
      </div>
    </div>
  );
}
