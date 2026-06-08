"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, Ticket, Share2, Heart, Clock, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import CalendarPicker from "@/components/CalendarPicker";
import { useExternalEventBookingState } from "@/contexts/program-event/ExternalEventDetailsContext";
import { useAuth } from "@/contexts/auth/AuthContext";
import { postExternalEventReservation } from "@/services/externalEventReservationClient";
import { setUserFavourate } from "@/services/websiteServer";
import LoginModal from "./auth/LoginModal";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type { ExternalVisitOperaData, ExternalVisitOperaSchedule } from "@/services/eventServer";

type VisitTicketCardProps = {
  visitData?: ExternalVisitOperaData | null;
  ctaLabel?: string;
};

type VisitSchedule = ExternalVisitOperaSchedule;

function formatHHMMTo12Hour(hhmm: string): string {
  const [hRaw, mRaw] = hhmm.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function scheduleSlotLabel(schedule: VisitSchedule): string {
  const start = String(schedule.time_slot?.start_time ?? "").trim();
  return start ? formatHHMMTo12Hour(start) : "TBA";
}

function parse12HourTime(value: string): Date | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  const [, hourRaw, minuteRaw, periodRaw] = match;
  let hours = Number(hourRaw);
  const minutes = Number(minuteRaw);
  const period = periodRaw.toUpperCase();

  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
    return null;
  }

  if (hours === 12) hours = 0;
  if (period === "PM") hours += 12;

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function isPastTimeSlotForDate(slot: string, selectedDate: Date | null): boolean {
  if (!selectedDate) return false;

  const now = new Date();
  const selected = new Date(selectedDate);
  selected.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  if (selected.getTime() !== today.getTime()) return false;

  const parsedSlot = parse12HourTime(slot);
  if (!parsedSlot) return false;

  const slotDateTime = new Date(selectedDate);
  slotDateTime.setHours(parsedSlot.getHours(), parsedSlot.getMinutes(), 0, 0);

  return slotDateTime.getTime() <= now.getTime();
}

function toLocalISODate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseISODateToLocalDate(iso: string | null): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function mapPayloadKey(className: string): string {
  const normalized = className.toLowerCase().trim();
  if (!normalized) return "ticket";
  return normalized
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

export default function VisitTicketCard({
  visitData,
  ctaLabel = "Book Tickets",
}: VisitTicketCardProps) {
  const bookingState = useExternalEventBookingState({ optional: true });
  const { user, showLoginModal, setShowLoginModal } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams?.toString() ?? "";
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [userFav, setUserFav] = useState<string[]>([]);
  const [redirectUrl, setRedirectUrl] = useState<string>("");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "en";

  const router = useRouter();
  const productId = Number(visitData?.product_id);
  const eventSlug = String(visitData?.slug ?? "visit-opera").trim() || "visit-opera";
  const currency = visitData?.currency;
  const minPrice = Number(visitData?.min_price ?? 0);
  const maxDurationValue = Number(visitData?.max_duration ?? 0);
  const hasAddons = Boolean(visitData?.has_addons);
  const schedules = Array.isArray(visitData?.schedules) ? visitData.schedules : [];
  const todayStart = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);
  const todayIso = useMemo(() => toLocalISODate(todayStart), [todayStart]);
  const currencyCode = currency?.code || "AED";
  const minimumPriceLabel = useMemo(() => {
    if (Number.isFinite(minPrice) && minPrice > 0) {
      return `${currencyCode} ${minPrice}`;
    }
    return "-";
  }, [currencyCode, minPrice]);
  const normalizedSchedules = useMemo(
    () =>
      (Array.isArray(schedules) ? schedules : []).map((item) => ({
        schedule_id: Number(item.schedule_id ?? item.id) || undefined,
        id: Number(item.id ?? item.schedule_id) || undefined,
        date: item.date,
        time_slot: item.time_slot
          ? {
              id: Number(item.time_slot.id ?? item.time_slot.time_slot_id) || undefined,
              time_slot_id: Number(item.time_slot.time_slot_id ?? item.time_slot.id) || undefined,
              start_time: item.time_slot.start_time,
              end_time: item.time_slot.end_time,
            }
          : undefined,
        tickets: item.tickets,
      })),
    [schedules],
  );

  const favoriteId = String(productId);

  useEffect(() => {
    const lUserFav = localStorage.getItem("userFav");
    if (lUserFav) {
      const favs = lUserFav.split(",").filter(Boolean);
      setUserFav(favs);
      setIsFavorite(favs.includes(favoriteId));
      return;
    }
    setUserFav([]);
    setIsFavorite(false);
  }, [favoriteId]);

  useEffect(() => {
    console.log("[VisitTicketCard] received visit ticket data:", {
      productId,
      eventSlug,
      hasAddons,
      currency,
      minPrice,
      maxDuration: maxDurationValue,
    });
  }, [productId, eventSlug, hasAddons, currency, minPrice, maxDurationValue, normalizedSchedules.length]);

  const allDates = useMemo(() => {
    const now = new Date();
    const dateToSlots = new Map<string, string[]>();
  
    for (const s of normalizedSchedules) {
      const iso = String(s.date ?? "").trim();
      if (!iso || iso < todayIso) continue;
  
      const label = scheduleSlotLabel(s);
      if (!dateToSlots.has(iso)) dateToSlots.set(iso, []);
      dateToSlots.get(iso)!.push(label);
    }
  
    return Array.from(dateToSlots.entries())
      .filter(([iso, slots]) => {
        if (iso > todayIso) return true; // future date
        // today: keep only if at least one slot is not expired
        const todayDate = parseISODateToLocalDate(iso);
        if (!todayDate) return false;
        return slots.some((slot) => !isPastTimeSlotForDate(slot, todayDate));
      })
      .map(([iso]) => iso)
      .sort();
  }, [normalizedSchedules, todayIso]);

  const dateOptions = useMemo(
    () => allDates.map((d) => parseISODateToLocalDate(d)).filter((d): d is Date => d !== null),
    [allDates],
  );

  useEffect(() => {
    if (!selectedDate) return;
    if (selectedDate < todayStart) {
      setSelectedDate(null);
      setSelectedTimeSlot(null);
      setSelectedScheduleId(null);
      setQuantities({});
    }
  }, [selectedDate, todayStart]);

  const selectedDateIso = selectedDate ? toLocalISODate(selectedDate) : null;
  const isDateSelected = Boolean(selectedDateIso);
  const isTimeSlotSelected = Boolean(selectedTimeSlot);

  const slotsForDate = useMemo(() => {
    const byDate = selectedDateIso
      ? normalizedSchedules.filter((s) => s.date === selectedDateIso)
      : normalizedSchedules;
    const uniqueSlots = new Map<string, number | null>();
    for (const schedule of byDate) {
      const label = scheduleSlotLabel(schedule);
      if (!label || uniqueSlots.has(label)) continue;
      uniqueSlots.set(label, schedule.schedule_id ?? null);
    }
    return Array.from(uniqueSlots.entries()).map(([label, scheduleId]) => ({ label, scheduleId }));
  }, [normalizedSchedules, selectedDateIso]);

  const ticketRows = useMemo(() => {
    if (!isDateSelected || !isTimeSlotSelected) return [];
    const chosen =
      normalizedSchedules.find(
        (s) => s.date === selectedDateIso && scheduleSlotLabel(s) === selectedTimeSlot,
      ) ??
      normalizedSchedules.find((s) => s.date === selectedDateIso) ??
      normalizedSchedules[0];
    const raw = chosen?.tickets ?? [];
    const tickets = Array.isArray(raw[0]) ? raw.flat() : raw;
    return tickets.map((t) => ({
      id: String(t.class_id ?? t.class_name ?? "ticket"),
      classId: Number(t.class_id ?? 0),
      label: String(t.class_name ?? "Ticket").replace(/\s+/g, " ").trim(),
      payloadKey: mapPayloadKey(String(t.class_name ?? "")),
      typeId: Number(t.types?.[0]?.type_id ?? 0),
      price: Number(t.types?.[0]?.price ?? "0"),
    }));
  }, [normalizedSchedules, selectedDateIso, selectedTimeSlot, isDateSelected, isTimeSlotSelected]);

  const totalTickets = useMemo(
    () => ticketRows.reduce((sum, t) => sum + (quantities[t.id] ?? 0), 0),
    [ticketRows, quantities],
  );

  const totalAmount = useMemo(
    () => ticketRows.reduce((sum, t) => sum + (quantities[t.id] ?? 0) * t.price, 0),
    [ticketRows, quantities],
  );

  const canSubmit = Boolean(selectedDate && selectedTimeSlot && totalTickets > 0 && !isSubmitting);
  const isPrimaryActionDisabled = !canSubmit;

  const submit = async () => {
    if (!canSubmit) return;
    const validScheduleId = Number(selectedScheduleId ?? 0);
    if (!Number.isFinite(validScheduleId) || validScheduleId <= 0) {
      toast.error("Please select a valid timeslot.");
      return;
    }

    const reservationItems = ticketRows
      .map((ticket) => ({
        product_id: productId,
        schedule_id: validScheduleId,
        ticket_class_id: ticket.classId,
        ticket_type_id: ticket.typeId,
        quantity: quantities[ticket.id] ?? 0,
        selected_addons: [] as unknown[],
      }))
      .filter(
        (item) =>
          item.quantity > 0 &&
          Number.isFinite(item.ticket_class_id) &&
          item.ticket_class_id > 0 &&
          Number.isFinite(item.ticket_type_id) &&
          item.ticket_type_id > 0,
      );

    if (reservationItems.length === 0) {
      toast.error("Please select at least one valid ticket.");
      return;
    }

    const externalUserId = String(user?.emmarId ?? "").trim();
    const reservationPayload = {
      items: reservationItems,
      ...(externalUserId ? { external_user_id: externalUserId } : {}),
      selected_date: selectedDate!.toISOString(),
      customer_name: "Guest",
      email: "guest@example.com",
      phone: "-",
    };

    setIsSubmitting(true);
    try {
      console.log("[VisitTicketCard] reservation payload:", reservationPayload);
      const reservationResponse = await postExternalEventReservation(reservationPayload);
      if (
        !reservationResponse ||
        typeof reservationResponse.reservation_id !== "string" ||
        String(reservationResponse.reservation_id).trim().length === 0
      ) {
        throw new Error("Failed to create reservation.");
      }
      const nextBookingPath = hasAddons
        ? `/${locale}/booking/addons`
        : `/${locale}/booking/checkout`;
      bookingState?.setReservationId(String(reservationResponse.reservation_id));

      // Build query string explicitly to guarantee param order.
      const safeEventSlug = (eventSlug.trim().split(/[?&]/)[0] || "visit-opera").trim();
      const orderedSearch = new URLSearchParams({
        event: safeEventSlug,
        date: toLocalISODate(selectedDate!),
        sid: String(validScheduleId),
        rid: String(reservationResponse.reservation_id).trim(),
      });
    
      if (!hasAddons) {
        orderedSearch.append("skipAddons", "1");
      }

      if(!user?.emmarId) {
        router.push(`${nextBookingPath}?${orderedSearch.toString()}`);
      } else {
        setRedirectUrl(`${nextBookingPath}?${orderedSearch.toString()}`);
        setShowLoginModal(true);
        setIsSubmitting(false);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create reservation.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMobilePrimaryAction = () => {
    if (isSubmitting) return;
    if (isPrimaryActionDisabled) {
      setMobileExpanded(true);
      return;
    }
    void submit();
  };

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: document.title,
          url: window.location.href,
        })
        .catch(() => {
          navigator.clipboard?.writeText(window.location.href);
        });
    } else {
      navigator.clipboard?.writeText(window.location.href);
    }
  };

  const addToFavourite = (value: number | string) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    const strValue = String(value);
    let newFavs: string[];
    if (isFavorite) {
      newFavs = userFav.filter((fav) => fav !== strValue);
      setIsFavorite(false);
      if (user.emmarId) {
        setUserFavourate(String(user.emmarId), strValue, false);
      }
    } else {
      newFavs = [...userFav, strValue];
      setIsFavorite(true);
      if (user.emmarId) {
        setUserFavourate(String(user.emmarId), strValue, true);
      }
    }
    setUserFav(newFavs);
    localStorage.setItem("userFav", newFavs.join(","));
  };

  return (
    <>
    <div className="hidden lg:block rounded-[20px] bg-[#1E1E1E] border border-white/5 p-6 text-white shadow-2xl">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-sm text-[#FFFFFF99] font-montserrat mb-0.5 md:font-normal md:text-[18px] md:leading-[23px] md:tracking-normal">
            Tickets from
          </p>
          <p className="font-montserrat font-semibold text-xl text-white pb-0.5 w-fit md:text-[25px] md:leading-[42px] md:tracking-normal">
            {minimumPriceLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-[#191919] flex items-center justify-center text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Share"
          >
            <Share2 size={18} />
          </button>
          <button
            type="button"
            onClick={() => addToFavourite(favoriteId)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isFavorite ? "bg-[#191919] text-primary-light" : "bg-[#191919] text-white hover:bg-white/10"
            }`}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart size={18} stroke="white" fill={isFavorite ? "#792327" : "none"} />
          </button>
        </div>
      </div>
      <div className="mb-6 pt-4 border-t-2 border-t-[#494949]">
        <h3 className="font-montserrat font-semibold text-[22px] leading-[23px] text-white mb-4">Timing & Schedule</h3>
        {maxDurationValue > 0 ? (
          <p className="font-montserrat text-[14px] text-[#FFFFFF] flex items-center gap-2"><Clock size={16} className="text-white shrink-0" /> Duration: {maxDurationValue} minutes </p>
        ) : null}
      </div>

      <div data-testid="tour-date-picker-section" className="mb-6">
        <h4 className="font-montserrat font-semibold lg:text-[20px] lg:leading-[23px] text-white mb-3">Select Date</h4>
        <CalendarPicker
          trigger="field"
          mode="single"
          selected={selectedDate}
          onChange={(date) => {
            if (date && date < todayStart) return;
            setSelectedDate(date);
            setSelectedTimeSlot(null);
            setSelectedScheduleId(null);
            setQuantities({});
          }}
          minDate={todayStart}
          allowedDates={dateOptions}
        />
      </div>

      <div data-testid="tour-time-slot-section" className="mb-6">
        <h4 className="font-montserrat font-semibold lg:text-[20px] lg:leading-[23px] text-white mb-3">Select Timeslot</h4>
        <div className="flex flex-wrap gap-2">
          {slotsForDate.map((slot) => {
            const active = selectedTimeSlot === slot.label;
            const isPastSlot = isPastTimeSlotForDate(slot.label, selectedDate);
            const isSlotDisabled = !isDateSelected || isPastSlot;
            return (
              <button
                data-testid="tour-time-slot-btn"
                key={`${slot.label}-${slot.scheduleId ?? "x"}`}
                type="button"
                disabled={isSlotDisabled}
                onClick={() => {
                  if (isSlotDisabled) return;
                  setSelectedTimeSlot(slot.label);
                  setSelectedScheduleId(slot.scheduleId);
                  setQuantities({});
                }}
                className={`rounded-full px-4 py-2 font-montserrat text-[14px] transition-colors ${
                  isSlotDisabled
                    ? "bg-[#292929] text-white/40 cursor-not-allowed"
                    : active
                      ? "bg-primary-light text-white cursor-pointer"
                      : "bg-[#292929] text-white hover:bg-white/20 cursor-pointer"
                }`}
              >
                {slot.label}
              </button>
            );
          })}
        </div>
      </div>

      <div data-testid="tour-ticket-rows" className="mb-6 space-y-3">
        {ticketRows.map((row) => (
          <div data-testid="tour-ticket-row" key={row.id} className="rounded-[10px] border border-[#494949] px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <p data-testid="tour-ticket-label" className="font-montserrat text-[16px] leading-[150%] text-white">{row.label}</p>
                <p className="font-montserrat text-[14px] leading-[19px] text-white">
                  {currencyCode} {Number.isFinite(row.price) ? row.price : 0}
                </p>
              </div>
              <div className="inline-flex items-center border border-[#494949] rounded-[4px] overflow-hidden">
                <button
                  data-testid="tour-ticket-decrement"
                  type="button"
                  disabled={!isTimeSlotSelected}
                  onClick={() => setQuantities((prev) => ({ ...prev, [row.id]: Math.max(0, (prev[row.id] ?? 0) - 1) }))}
                  className="w-9 h-10 border-r border-[#494949] flex items-center justify-center hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  -
                </button>
                <span data-testid="tour-ticket-quantity" className="w-12 text-center font-montserrat text-[11px] text-white">{quantities[row.id] ?? 0}</span>
                <button
                  data-testid="tour-ticket-increment"
                  type="button"
                  disabled={!isTimeSlotSelected}
                  onClick={() => setQuantities((prev) => ({ ...prev, [row.id]: (prev[row.id] ?? 0) + 1 }))}
                  className="w-9 h-10 border-l border-[#494949] flex items-center justify-center hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        data-testid="tour-book-btn"
        type="button"
        onClick={() => {
          void submit();
        }}
        disabled={!canSubmit}
        className="w-full py-3 rounded-xl cursor-pointer bg-[#792327] hover:bg-primary-light disabled:bg-[#792327]/50 disabled:cursor-not-allowed text-white font-montserrat font-semibold flex items-center justify-center gap-2 mb-4"
      >
        
        {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <>{<Ticket size={24} />} {ctaLabel}</> }
      </button>

      <div className="font-montserrat text-[12px] text-center text-[#FFFFFF80] space-y-1">
        <p>Tickets are non-refundable.</p>
        <p>
          See our{" "}
          {/* <span  className="text-[#BB2B32]"> */}
            Terms and Conditions {" "}
          {/* </span>{" "} */}
          for details.
        </p>
      </div>
    </div>
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 block">
      <div className="rounded-[20px] bg-[#1E1E1E] border border-white/5 p-4 text-white shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[14px] leading-[23px] text-[#FFFFFF99] font-montserrat mb-1">Tickets from</p>
       
            <p className="font-montserrat font-semibold text-[24px] leading-[42px] text-white">{minimumPriceLabel}</p>
          </div>
          <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-[#191919] flex items-center justify-center text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Share"
          >
            <Share2 size={18} />
          </button>
          <button
            type="button"
            onClick={() => addToFavourite(favoriteId)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isFavorite ? "bg-[#191919] text-primary-light" : "bg-[#191919] text-white hover:bg-white/10"
            }`}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart size={18} stroke="white" fill={isFavorite ? "#792327" : "none"} />
          </button>
        </div>
         
        </div>


      
        <button
            type="button"
            onClick={handleMobilePrimaryAction}
            disabled={isSubmitting}
            aria-disabled={isPrimaryActionDisabled}
            className={`w-full h-10 px-4 rounded-lg text-white font-montserrat cursor-pointer text-[16px] leading-[26px] font-semibold flex items-center justify-center gap-2 transition-colors ${
              isPrimaryActionDisabled
                ? "bg-[#792327]/50 hover:bg-[#792327]/50"
                : "bg-[#792327] hover:bg-primary-light"
            } ${isSubmitting ? "cursor-not-allowed" : ""}`}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Ticket size={16} />
                {ctaLabel}
              </>
            )}
          </button>


        <div
          id="mobile-visit-ticket-details"
          className={`overflow-hidden transition-all duration-500 ease-out ${
            mobileExpanded ? "max-h-[780px] opacity-100 mt-3" : "max-h-0 opacity-0 mt-0"
          }`}
        >
        <button
          type="button"
          onClick={() => setMobileExpanded((v) => !v)}
          className="w-full mt-3 pt-3 border-t border-white/15 flex items-center justify-between"
          aria-expanded={mobileExpanded}
          aria-controls="mobile-visit-ticket-details"
        >
          <span className="font-montserrat font-semibold text-[20px] leading-[23px] text-white">Timing & Schedule</span>
          {mobileExpanded ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
        </button>
          <div className="space-y-4 text-sm text-white font-montserrat">
            {maxDurationValue > 0 ? (
              <p className="font-montserrat text-[14px] text-[#FFFFFF] flex items-center gap-2">
                <Clock size={16} className="text-white shrink-0" /> Duration: {maxDurationValue} minutes
              </p>
            ) : null}

            <div>
              <h4 className="font-montserrat font-semibold text-[18px] leading-[100%] tracking-normal text-white mb-3">
                Select Date
              </h4>
              <CalendarPicker
                trigger="field"
                mode="single"
                selected={selectedDate}
                onChange={(date) => {
                  if (date && date < todayStart) return;
                  setSelectedDate(date);
                  setSelectedTimeSlot(null);
                  setSelectedScheduleId(null);
                  setQuantities({});
                }}
                minDate={todayStart}
                allowedDates={dateOptions}
                buttonClassName="w-full flex items-center justify-between gap-3 rounded-[8px] border border-white/30 bg-[#292929] px-4 py-3 cursor-pointer text-white font-montserrat font-normal text-[14px] leading-[100%] tracking-normal hover:opacity-95 transition-opacity"
              />
            </div>

            <div>
              <h4 className="font-montserrat font-semibold text-[18px] leading-[100%] tracking-normal text-white mb-3">
                Select Timeslot
              </h4>
              <div className="flex flex-wrap gap-2">
                {slotsForDate.map((slot) => {
                  const active = selectedTimeSlot === slot.label;
                  const isPastSlot = isPastTimeSlotForDate(slot.label, selectedDate);
                  const isSlotDisabled = !isDateSelected || isPastSlot;
                  return (
                    <button
                      key={`mobile-${slot.label}-${slot.scheduleId ?? "x"}`}
                      type="button"
                      disabled={isSlotDisabled}
                      onClick={() => {
                        if (isSlotDisabled) return;
                        setSelectedTimeSlot(slot.label);
                        setSelectedScheduleId(slot.scheduleId);
                        setQuantities({});
                      }}
                      className={`rounded-full px-4 py-2 font-montserrat text-[14px] transition-colors ${
                        isSlotDisabled
                          ? "bg-[#292929] text-white/40 cursor-not-allowed"
                          : active
                            ? "bg-primary-light text-white cursor-pointer"
                            : "bg-[#292929] text-white hover:bg-white/20 cursor-pointer"
                      }`}
                    >
                      {slot.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              {ticketRows.map((row) => (
                <div key={`mobile-${row.id}`} className="rounded-[10px] border border-[#494949] px-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <p className="font-montserrat text-[16px] leading-[150%] text-white">{row.label}</p>
                      <p className="font-montserrat text-[14px] leading-[19px] text-white">
                        {currencyCode} {Number.isFinite(row.price) ? row.price : 0}
                      </p>
                    </div>
                    <div className="inline-flex items-center border border-[#494949] rounded-[4px] overflow-hidden">
                      <button
                        type="button"
                        disabled={!isTimeSlotSelected}
                        onClick={() =>
                          setQuantities((prev) => ({ ...prev, [row.id]: Math.max(0, (prev[row.id] ?? 0) - 1) }))
                        }
                        className="w-9 h-10 border-r border-[#494949] flex items-center justify-center hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-montserrat text-[11px] text-white">{quantities[row.id] ?? 0}</span>
                      <button
                        type="button"
                        disabled={!isTimeSlotSelected}
                        onClick={() => setQuantities((prev) => ({ ...prev, [row.id]: (prev[row.id] ?? 0) + 1 }))}
                        className="w-9 h-10 border-l border-[#494949] flex items-center justify-center hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    <LoginModal
      isOpen={showLoginModal}
      onClose={() => setShowLoginModal(false)}
      returnTo={redirectUrl || queryString ? `${pathname}?${queryString}` : pathname}
      title="Sign in to continue"
      description="Please sign in with Emaar PASS to proceed to add this event to your favorites."
    />
    </>
  );
}
