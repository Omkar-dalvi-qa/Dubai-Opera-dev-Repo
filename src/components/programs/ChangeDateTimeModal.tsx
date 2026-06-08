"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type ScheduleRow = {
  schedule_id?: number;
  date?: string;
  time_slot?: { start_time?: string; end_time?: string } | string | null;
  tickets?: Array<{
    class_id?: number;
    types?: Array<{ type_id?: number; price?: number | string }>;
  }>;
};

function asRows(schedules: unknown[]): ScheduleRow[] {
  if (!Array.isArray(schedules)) return [];
  return schedules.filter((s): s is Record<string, unknown> => Boolean(s && typeof s === "object")) as ScheduleRow[];
}

function parseIsoDateOnly(iso: string): Date | null {
  const [y, m, d] = String(iso).trim().split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatDateCard(iso: string): { dow: string; day: string; mon: string } {
  const d = parseIsoDateOnly(iso);
  if (!d) return { dow: "", day: "", mon: "" };
  return {
    dow: d.toLocaleDateString("en-GB", { weekday: "short" }),
    day: String(d.getDate()),
    mon: d.toLocaleDateString("en-GB", { month: "short" }),
  };
}

function minPriceFromSchedule(row: ScheduleRow): number | null {
  const tickets = Array.isArray(row.tickets) ? row.tickets : [];
  let min: number | null = null;
  for (const t of tickets) {
    const types = Array.isArray(t.types) ? t.types : [];
    for (const ty of types) {
      const p = Number(ty.price);
      if (Number.isFinite(p) && p > 0) {
        min = min == null ? p : Math.min(min, p);
      }
    }
  }
  return min;
}

function minPriceForDate(rows: ScheduleRow[], dateIso: string): number | null {
  const onDay = rows.filter((r) => String(r.date ?? "") === dateIso);
  let min: number | null = null;
  for (const r of onDay) {
    const p = minPriceFromSchedule(r);
    if (p != null) min = min == null ? p : Math.min(min, p);
  }
  return min;
}

function timeSlotStart(row: ScheduleRow): string | null {
  const ts = row.time_slot;
  if (!ts) return null;
  if (typeof ts === "string") return ts || null;
  return ts.start_time ? String(ts.start_time) : null;
}

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

export type ChangeDateTimeModalProps = {
  open: boolean;
  onClose: () => void;
  schedules: unknown[];
  currencyCode: string;
  currentScheduleId: number;
  onApply: (next: { scheduleId: number; date: string }) => void;
};

export default function ChangeDateTimeModal({
  open,
  onClose,
  schedules,
  currencyCode,
  currentScheduleId,
  onApply,
}: ChangeDateTimeModalProps) {
  const rows = useMemo(() => asRows(schedules), [schedules]);

  const sortedDates = useMemo(() => {
    const set = new Set(rows.map((r) => String(r.date ?? "").trim()).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const [draftDate, setDraftDate] = useState<string | null>(null);
  const [draftScheduleId, setDraftScheduleId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const current = rows.find((r) => Number(r.schedule_id) === Number(currentScheduleId));
    const date = String(current?.date ?? sortedDates[0] ?? "").trim() || null;
    setDraftDate(date);
    const sid = Number(current?.schedule_id);
    setDraftScheduleId(Number.isFinite(sid) && sid > 0 ? sid : null);
  }, [open, currentScheduleId, rows, sortedDates]);

  const slotsForDraftDate = useMemo(() => {
    if (!draftDate) return [];
    return rows
      .filter((r) => String(r.date ?? "") === draftDate && Number(r.schedule_id) > 0)
      .sort((a, b) => (timeSlotStart(a) ?? "").localeCompare(timeSlotStart(b) ?? ""));
  }, [rows, draftDate]);

  useEffect(() => {
    if (!open || !draftDate || slotsForDraftDate.length === 0) return;
    const stillValid = slotsForDraftDate.some((s) => Number(s.schedule_id) === Number(draftScheduleId));
    if (!stillValid) {
      const first = slotsForDraftDate[0];
      setDraftScheduleId(Number(first.schedule_id));
    }
  }, [open, draftDate, slotsForDraftDate, draftScheduleId]);

  const handleApply = useCallback(() => {
    if (draftScheduleId == null || draftScheduleId <= 0 || !draftDate) return;
    onApply({ scheduleId: draftScheduleId, date: draftDate });
  }, [draftScheduleId, draftDate, onApply]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-datetime-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl sm:max-w-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2 id="change-datetime-title" className="font-montserrat text-lg font-semibold text-white sm:text-xl">
            Change date and time
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg cursor-pointer p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {sortedDates.map((iso) => {
            const { dow, day, mon } = formatDateCard(iso);
            const selected = draftDate === iso;
            const from = minPriceForDate(rows, iso);
            return (
              <button
                key={iso}
                type="button"
                onClick={() => {
                  setDraftDate(iso);
                  const first = rows.find((r) => String(r.date ?? "") === iso && Number(r.schedule_id) > 0);
                  if (first?.schedule_id != null) setDraftScheduleId(Number(first.schedule_id));
                }}
                className={`flex cursor-pointer min-w-[88px] shrink-0 flex-col items-center rounded-xl border px-3 py-3 text-center transition-colors ${
                  selected
                    ? "border-[#792327] bg-[#251416] ring-1 ring-[#792327]/60"
                    : "border-white/15 bg-[#141414] hover:border-white/25"
                }`}
              >
                <span className={`font-montserrat text-[13px] leading-[110%]  ${selected ? "text-[#FFFFFFE5]" : "text-white/50"}`}>{dow}</span>
                <span className={`font-montserrat text-xl lg:text-[24px] leading-[110%] font-semibold  ${selected ? "text-white" : "text-white/50"}`}>{day}</span>
                <span className={`font-montserrat text-xs ${selected ? "text-white" : "text-white/50"}`}>{mon}</span>
                <span className={`mt-2 font-montserrat text-[10px] leading-tight ${selected ? "text-white" : "text-white/50"}`}>
                  {from != null ? `From ${currencyCode} ${from.toFixed(0)}` : "—"}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mb-2 font-montserrat text-xs text-white/50">Show time</p>
        <div className="mb-6 flex flex-col gap-2">
          {slotsForDraftDate.map((row) => {
            const start = timeSlotStart(row) ?? "";
            const label = formatHHMMTo12Hour(start) ?? start;
            const sid = Number(row.schedule_id);
            const price = minPriceFromSchedule(row);
            const active = draftScheduleId === sid;
            return (
              <button
                key={sid}
                type="button"
                onClick={() => setDraftScheduleId(sid)}
                className={`flex w-fit cursor-pointer gap-2 items-center justify-between rounded-xl border px-4 py-3 font-montserrat text-sm transition-colors ${
                  active
                    ? "border-[#792327] bg-[#792327]/25 text-white"
                    : "border-white/15 bg-transparent text-white hover:border-white/25"
                }`}
              >
                <span className="font-medium">{label}</span>
                <span className="text-white/90">
                  {price != null ? `${currencyCode} ${price.toFixed(0)}` : "—"}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleApply}
            disabled={draftScheduleId == null || draftScheduleId <= 0 || !draftDate}
            className="rounded-lg cursor-pointer bg-[#792327] px-8 py-2.5 font-montserrat text-sm font-semibold text-white transition-colors hover:bg-[#8f2a2f] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
