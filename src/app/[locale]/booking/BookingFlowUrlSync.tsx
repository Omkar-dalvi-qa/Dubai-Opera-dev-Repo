// Syncs booking URL params with context and reloads reservation data when needed.

"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useExternalEventBookingState,
  useExternalEventBookingSelection,
  useExternalEventDetails,
} from "@/contexts/program-event/ExternalEventDetailsContext";

type ExternalScheduleRow = {
  schedule_id?: number;
  date?: string;
  time_slot?: { start_time?: string; end_time?: string } | string | null;
};

function getScheduleRows(details: { schedules?: unknown }): ExternalScheduleRow[] {
  if (!details || !Array.isArray(details.schedules)) return [];
  return details.schedules
    .filter((s): s is Record<string, unknown> => Boolean(s && typeof s === "object"))
    .map((s) => {
      const row = s as Record<string, unknown>;
      const schedule_id = typeof row.schedule_id === "number" ? row.schedule_id : Number(row.schedule_id);
      const date = typeof row.date === "string" ? row.date : undefined;
      const time_slot = (row.time_slot ?? null) as ExternalScheduleRow["time_slot"];
      return {
        schedule_id: Number.isFinite(schedule_id) ? schedule_id : undefined,
        date,
        time_slot,
      };
    });
}

function timeSlotStart(row: ExternalScheduleRow): string | null {
  const ts = row.time_slot;
  if (!ts) return null;
  if (typeof ts === "string") return ts || null;
  return ts.start_time ? String(ts.start_time) : null;
}

function firstScheduleForDate(rows: ExternalScheduleRow[], date: string | null) {
  if (!rows.length) return null;
  if (!date) return rows[0];
  const match = rows.find((r) => r.date === date);
  return match ?? rows[0];
}

function readRid(
  contextId: string | null,
  searchParams: ReturnType<typeof useSearchParams>,
): string | null {
  const fromContext = String(contextId ?? "").trim();
  if (fromContext) return fromContext;
  const fromUrl = String(
    searchParams.get("rid") ||
      searchParams.get("reservationId") ||
      searchParams.get("reservation_id") ||
      "",
  ).trim();
  return fromUrl || null;
}

export default function BookingFlowUrlSync() {
  const details = useExternalEventDetails();
  const booking = useExternalEventBookingSelection();
  const {
    reservationId,
    reservationSummary,
    setReservationId,
    recoverReservationById,
    isBookingState,
    isSeatBookingEnabled,
    hasAddons,
  } = useExternalEventBookingState();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlDate = searchParams.get("date");
  const urlSid = searchParams.get("sid");
  const rid = readRid(reservationId, searchParams);
  const resolvedScheduleId =
    urlSid ?? (booking.selectedScheduleId ? String(booking.selectedScheduleId) : null);

  const derived = useMemo(() => {
    const rows = getScheduleRows(details);
    const sidNum = resolvedScheduleId ? Number(resolvedScheduleId) : NaN;
    const hasSid = Number.isFinite(sidNum) && sidNum > 0;
    if (hasSid) {
      const row = rows.find((r) => Number(r.schedule_id) === sidNum) ?? null;
      return {
        date: row?.date ?? urlDate,
        scheduleId: sidNum,
        time: row ? timeSlotStart(row) : null,
      };
    }
    const row = firstScheduleForDate(rows, urlDate);
    const scheduleId = row?.schedule_id ?? null;
    return {
      date: row?.date ?? urlDate,
      scheduleId: Number.isFinite(Number(scheduleId)) && Number(scheduleId) > 0 ? Number(scheduleId) : null,
      time: row ? timeSlotStart(row) : null,
    };
  }, [details, resolvedScheduleId, urlDate]);

  useEffect(() => {
    if (derived.date && booking.selectedDate !== derived.date) {
      booking.setSelectedDate(derived.date);
    }
    if (derived.time && booking.selectedTime !== derived.time) {
      booking.setSelectedTime(derived.time);
    }
    if (derived.scheduleId != null && booking.selectedScheduleId !== derived.scheduleId) {
      booking.setSelectedScheduleId(derived.scheduleId);
    }
  }, [
    derived.date,
    derived.time,
    derived.scheduleId,
    booking.selectedDate,
    booking.selectedTime,
    booking.selectedScheduleId,
    booking.setSelectedDate,
    booking.setSelectedTime,
    booking.setSelectedScheduleId,
  ]);

  // Keep reservation id in context; reload cart from API after refresh (summary is empty).
  useEffect(() => {
    if (!rid) return;
    if (reservationId !== rid) setReservationId(rid);
    if (!reservationSummary) void recoverReservationById(rid);
  }, [rid, reservationId, reservationSummary, setReservationId, recoverReservationById]);

  useEffect(() => {
    const isProtected =
      pathname.includes("/addons") ||
      pathname.includes("/checkout") ||
      pathname.includes("/payment");
    if (!isProtected) return;
    if (searchParams.get("transactionId") || searchParams.get("transaction_id")) return;
    if (!isBookingState) return;
    if (rid) return;

    const locale = pathname.split("/").filter(Boolean)[0] || "en";
    router.replace(`/${locale}`);
  }, [pathname, router, searchParams, isBookingState, rid]);

  return null;
}
