"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Share2, Heart, Calendar, Clock, Ticket, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import CalendarPicker from "@/components/CalendarPicker";
import { useExternalEventBookingState } from "@/contexts/program-event/ExternalEventDetailsContext";
import { useAuth } from "@/contexts/auth/AuthContext";
import { postExternalEventReservation } from "@/services/externalEventReservationClient";
import { setUserFavourate } from "@/services/websiteServer";
import LoginModal from "./auth/LoginModal";
import EventRegisterModal from "@/components/EventRegisterModal";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { mapPayloadKey } from "./VisitTicketCard";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { ExternalEventSchedule } from "@/services/eventServer";

export interface EventTicketCardProps {
  scheduleDateRange: string,
  allScheduleDates: string[],
  firstDateTime: {
    dateTime?: string,
    endDateTime?: string
  } | null | undefined,
  lastDateTime: {
    dateTime?: string,
    endDateTime?: string
  } | null | undefined,
  scheduleTimes: string | null | undefined,
  schedules?: ExternalEventSchedule[];
}


function useCountdown(endDate: Date | string, enabled: boolean) {
  const [left, setLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const end = typeof endDate === "string" ? new Date(endDate) : endDate;
    const tick = () => {
      const now = new Date().getTime();
      const endTime = end.getTime();
      const diff = endTime - now;

      if (diff <= 0) {
        setExpired(true);
        setLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDate, enabled]);

  return { ...left, expired };
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function parseDateRange(range: string): [Date | null, Date | null] {
  const parts = range
    .split(/\s+-\s+|\s+to\s+/i)
    .map((item) => item.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    const start = new Date(parts[0]);
    const end = new Date(parts.slice(1).join("-"));
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) return [start, end];
  }
  const single = new Date(range.trim());
  if (!Number.isNaN(single.getTime())) return [single, single];
  return [null, null];
}

function parseTimeSlots(times: string): string[] {
  return times
    .split(/&|,/)
    .map((slot) => slot.trim())
    .filter(Boolean);
}

function parse12HourTime(value: string): Date | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  const [, hourRaw, minuteRaw, periodRaw] = match;
  let hours = Number(hourRaw);
  const minutes = Number(minuteRaw);
  const period = periodRaw.toUpperCase();

  if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes > 59 || hours < 1 || hours > 12) {
    return null;
  }

  if (hours === 12) hours = 0;
  if (period === "PM") hours += 12;

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function format12HourTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function buildTwoHourSlotsFromRange(times: string): string[] {
  return parseTimeSlots(times);
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

function formatHHMMTo12Hour(hhmm: string): string | null {
  const match = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const [, hRaw, mRaw] = match;
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return format12HourTime(d);
}

function scheduleStartToDisplaySlot(
  time_slot: string | { start_time?: string; end_time?: string } | undefined,
): string | null {
  if (!time_slot) return null;
  if (typeof time_slot === "string") return formatHHMMTo12Hour(time_slot) ?? time_slot;
  const start = time_slot.start_time ?? "";
  return (formatHHMMTo12Hour(start) ?? start) || null;
}

type TicketRow = {
  id: string;
  classId: number;
  label: string;
  payloadKey: string;
  typeId: number;
  price: number;
};

export default function EventTicketCard({
  schedules,
  scheduleDateRange,
  allScheduleDates,
  lastDateTime,
  scheduleTimes,
}: EventTicketCardProps) {
  const bookingCtx = useExternalEventBookingState();
  const id = bookingCtx?.details?.id ?? "";
  const status = bookingCtx?.details?.status ?? "";

  const [isFavorite, setIsFavorite] = useState(false);
  const [countdownVisible, setCountdownVisible] = useState(false);
  const [localSelectedDate, setLocalSelectedDate] = useState<Date | null>(null);
  const [localSelectedTimeSlot, setLocalSelectedTimeSlot] = useState<string | null>(null);
  const [localSelectedScheduleId, setLocalSelectedScheduleId] = useState<number | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [isBookingRedirecting, setIsBookingRedirecting] = useState(false);
  const countdownRef = useRef<HTMLDivElement | null>(null);
  const count = useCountdown(lastDateTime?.dateTime ?? "", countdownVisible);

  const isCountdownExpired = count.expired;

  const { user, showLoginModal, setShowLoginModal } = useAuth();
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState("");
  const params = useParams<{ locale: string, eventSlug: string }>();
  const locale = params?.locale || "en";
  const eventSlug = params?.eventSlug || "";
  const [userFav, setUserFav] = useState<string[]>([]);
  const selectedDate = bookingCtx
    ? parseISODateToLocalDate(bookingCtx.selectedDate)
    : localSelectedDate;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams?.toString() ?? "";
  const router = useRouter();

  const selectedTimeSlot = bookingCtx ? bookingCtx.selectedTime : localSelectedTimeSlot;
  const selectedScheduleId = bookingCtx ? bookingCtx.selectedScheduleId : localSelectedScheduleId;
  const selectedSchedule =
    selectedScheduleId
      ? null
      : schedules?.find((schedule) => Number(schedule.schedule_id) === Number(selectedScheduleId)) ?? null;

  const isSeatBookingEnabled =
    selectedSchedule?.is_seat_booking_enabled ?? bookingCtx?.isSeatBookingEnabled ?? false;

    console.log(isSeatBookingEnabled, "isSeatBookingEnabled>>>>>")
  const handleDateChange = (date: Date | null) => {
    if (bookingCtx) {
      bookingCtx.setSelectedDate(date ? toLocalISODate(date) : null);
    } else {
      setLocalSelectedDate(date);
      setLocalSelectedTimeSlot(null);
      setLocalSelectedScheduleId(null);
    }
  };

  useEffect(() => {
    const lUserFav = localStorage.getItem("userFav");
    if (lUserFav) {
      const favs = lUserFav.split(",").filter(Boolean);
      setUserFav(favs);
      setIsFavorite(favs.includes(String(id)));
    }
  }, [id]);

  const addToFavourite = (value: number | string) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    const strValue = String(value);
    let newFavs: string[];
    if (isFavorite) {
      // If it's already a favorite, remove it
      newFavs = userFav.filter((fav) => fav !== strValue);
      setIsFavorite(false);
      if (user && user.emmarId) {
        setUserFavourate(String(user.emmarId), strValue, false);
        // setUserFavourate("10", strValue, false);
      }
    } else {
      // If it's not a favorite, add it
      newFavs = [...userFav, strValue];
      setIsFavorite(true);
      if (user && user.emmarId) {
        setUserFavourate(String(user.emmarId), strValue, true);
        // setUserFavourate("10", strValue, true);
      }
    }

    setUserFav(newFavs);
    localStorage.setItem("userFav", newFavs.join(","));

  };

  const handleTimeSlotSelect = (slot: string) => {
    const iso = selectedDate ? toLocalISODate(selectedDate) : null;
    const match = iso
      ? schedules?.find(
        (s) =>
          s.date === iso &&
          scheduleStartToDisplaySlot(s.time_slot) === slot,
      )
      : undefined;
    const sid = match?.schedule_id ?? null;

    if (bookingCtx) {
      bookingCtx.setSelectedTime(slot);
      bookingCtx.setSelectedScheduleId(sid);
    } else {
      setLocalSelectedTimeSlot(slot);
      setLocalSelectedScheduleId(sid);
    }
  };

  const startOfToday = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const displayedDateRange = scheduleDateRange;
  const displayedTimes = scheduleTimes;

  const [eventStartDate, eventEndDate] = useMemo(() => parseDateRange(scheduleDateRange), [scheduleDateRange]);
  const allScheduleSlots = useMemo(() => {
    if (!schedules?.length) return null;

    const slots = schedules
      .map((s) => scheduleStartToDisplaySlot(s.time_slot))
      .filter((v): v is string => Boolean(v));

    const unique = Array.from(new Set(slots));
    unique.sort((a, b) => {
      const da = parse12HourTime(a) ?? new Date(`1970-01-01T${a}:00`);
      const db = parse12HourTime(b) ?? new Date(`1970-01-01T${b}:00`);
      return da.getTime() - db.getTime();
    });
    return unique;
  }, [schedules]);

  const timeSlots = useMemo(() => {
    if (allScheduleSlots) {
      if (!selectedDate) return allScheduleSlots;
      const iso = toLocalISODate(selectedDate);
      const slotsForDate = schedules
        ?.filter((s) => s.date === iso)
        .map((s) => scheduleStartToDisplaySlot(s.time_slot))
        .filter((v): v is string => Boolean(v)) ?? [];

      const unique = Array.from(new Set(slotsForDate));
      unique.sort((a, b) => {
        const da = parse12HourTime(a) ?? new Date(`1970-01-01T${a}:00`);
        const db = parse12HourTime(b) ?? new Date(`1970-01-01T${b}:00`);
        return da.getTime() - db.getTime();
      });
      return unique;
    }

    return buildTwoHourSlotsFromRange(scheduleTimes ?? "");
  }, [allScheduleSlots, schedules, selectedDate, scheduleTimes]);

  // Sync timeSlots into context so they persist across the booking flow
  useEffect(() => {
    if (!bookingCtx || timeSlots.length === 0) return;
    const currentSlots = Array.isArray(bookingCtx.timeSlots) ? bookingCtx.timeSlots : [];
    const isSameLength = currentSlots.length === timeSlots.length;
    const isSameContent = isSameLength && currentSlots.every((slot, index) => slot === timeSlots[index]);
    if (isSameContent) return;
    bookingCtx.setTimeSlots(timeSlots);
  }, [bookingCtx, timeSlots]);

  const disableTimeSlots = Boolean(allScheduleSlots) && !selectedDate;
  const calendarMinDate = useMemo(() => {
    if (!eventStartDate) return hasMounted ? startOfToday : undefined;
    if (!hasMounted) return eventStartDate;
    return eventStartDate.getTime() < startOfToday.getTime() ? startOfToday : eventStartDate;
  }, [eventStartDate, hasMounted, startOfToday]);

  useEffect(() => {
    if (!selectedTimeSlot) return;
    if (timeSlots.includes(selectedTimeSlot)) return;
    if (bookingCtx) {
      bookingCtx.setSelectedTime(null);
      bookingCtx.setSelectedScheduleId(null);
    } else {
      setLocalSelectedTimeSlot(null);
      setLocalSelectedScheduleId(null);
    }
  }, [bookingCtx, selectedTimeSlot, timeSlots]);

  useEffect(() => {
    const el = countdownRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setCountdownVisible(true);
      },
      { threshold: 0.1, rootMargin: "0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: document.title,
        url: window.location.href,
      }).catch(() => {
        navigator.clipboard?.writeText(window.location.href);
      });
    } else {
      navigator.clipboard?.writeText(window.location.href);
    }
  };

  const handlePrimaryAction = async () => {
    if (isBookingRedirecting) return;
    if (!isSeatBookingEnabled && ticketQuantity <= 0) return;
    if (!selectedDate || !selectedTimeSlot) return;
    if (!eventSlug) return;

    const hasAddons = bookingCtx?.hasAddons ?? true;
    const step = isSeatBookingEnabled ? "seats" : hasAddons ? "addons" : "checkout";
    const targetPathname = `/${locale}/booking/${step}`;
    const targetSearchParams = new URLSearchParams({
      event: eventSlug,
      date: toLocalISODate(selectedDate),
      sid: String(selectedScheduleId),
    });
    if (!isSeatBookingEnabled) {
      const productId = Number(bookingCtx?.details?.id ?? 0);
      if (!Number.isFinite(productId) || productId <= 0) {
        toast.error("Unable to book this event right now.");
        return;
      }

      const reservationItems = ticketRows
        .map((ticket: TicketRow) => ({
          product_id: productId,
          schedule_id: selectedScheduleId,
          ticket_class_id: ticket.classId,
          ticket_type_id: ticket.typeId,
          quantity: ticketQuantity,
          selected_addons: [] as unknown[],
        }))
        .filter((item: { quantity: number; ticket_class_id: number; ticket_type_id: number }) => {
          return (
            item.quantity > 0 &&
            Number.isFinite(item.ticket_class_id) &&
            item.ticket_class_id > 0 &&
            Number.isFinite(item.ticket_type_id) &&
            item.ticket_type_id > 0
          );
        });

      if (reservationItems.length === 0) {
        toast.error("Please select at least one valid ticket.");
        return;
      }

      const reservationPayload = {
        items: reservationItems,
        external_user_id: user?.emmarId ?? "",
        selected_date: selectedDate.toISOString(),
        customer_name: "Guest",
        email: "guest@example.com",
        phone: "-",
      };

      setIsBookingRedirecting(true);
      try {
        const reservationResponse = await postExternalEventReservation(reservationPayload);
        if (
          !reservationResponse ||
          typeof reservationResponse.reservation_id !== "string"
        ) {
          throw new Error("Failed to create reservation.");
        }
        bookingCtx?.setReservationId(String(reservationResponse.reservation_id));
        targetSearchParams.append("rid", String(reservationResponse.reservation_id));
        // if (user?.emmarId) {
        //   router.push(`${targetPathname}?${targetSearchParams.toString()}`);
        // } else {
        //   setRedirectUrl(`${targetPathname}?${targetSearchParams.toString()}`);
        //   setShowLoginModal(true);
        //   setIsBookingRedirecting(false);
        // }
        router.push(`${targetPathname}?${targetSearchParams.toString()}`);
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create reservation.";
        toast.error(message);
        setIsBookingRedirecting(false);
        return;
      }
    }
    setIsBookingRedirecting(true);
    router.push(`${targetPathname}?${targetSearchParams.toString()}`);
  };

  const isPrimaryActionDisabled =
    isBookingRedirecting ||
    (!isSeatBookingEnabled && ticketQuantity <= 0) ||
    !selectedDate ||
    !selectedTimeSlot;

  const handleMobilePrimaryAction = () => {
    if (isBookingRedirecting) return;
    if (isPrimaryActionDisabled) {
      setMobileExpanded(true);
      return;
    }
    void handlePrimaryAction();
  };

  const isEventActive =
    isCountdownExpired ||
    status == "DRAFT";


  const convertedAllowedDates = useMemo(() => {
    if (!allScheduleDates?.length) return undefined;
    return allScheduleDates
      .map((d) => parseISODateToLocalDate(d))
      .filter((d): d is Date => d !== null);
  }, [allScheduleDates]);

  const availableDateOptions = useMemo(() => {
    if (convertedAllowedDates?.length) return convertedAllowedDates;
    if (!schedules?.length) return [];
    const uniqueDates = Array.from(new Set(schedules.map((s) => s.date).filter(Boolean)));
    return uniqueDates
      .map((d) => parseISODateToLocalDate(d ?? null))
      .filter((d): d is Date => d !== null);
  }, [convertedAllowedDates, schedules]);

  const hasSingleDateOption = availableDateOptions.length === 1;
  const hasSingleTimeSlotOption = timeSlots.length === 1;
  const hideDateSelector = hasSingleDateOption;
  const hideTimeSlotSelector = hasSingleDateOption && hasSingleTimeSlotOption;

  useEffect(() => {
    if (isEventActive || !hasSingleDateOption) return;
    const onlyDate = availableDateOptions[0];
    if (!onlyDate) return;

    const normalizedOnlyDate = new Date(
      onlyDate.getFullYear(),
      onlyDate.getMonth(),
      onlyDate.getDate(),
    );
    const onlyIso = toLocalISODate(normalizedOnlyDate);
    const currentIso = selectedDate ? toLocalISODate(selectedDate) : null;
    if (currentIso === onlyIso) return;

    if (bookingCtx) {
      bookingCtx.setSelectedDate(onlyIso);
      bookingCtx.setSelectedTime(null);
      bookingCtx.setSelectedScheduleId(null);
    } else {
      setLocalSelectedDate(normalizedOnlyDate);
      setLocalSelectedTimeSlot(null);
      setLocalSelectedScheduleId(null);
    }
  }, [availableDateOptions, bookingCtx, hasSingleDateOption, isEventActive, selectedDate]);

  useEffect(() => {
    if (isEventActive || !selectedDate || !hasSingleTimeSlotOption) return;
    const onlySlot = timeSlots[0];
    if (!onlySlot || selectedTimeSlot === onlySlot) return;

    const iso = toLocalISODate(selectedDate);
    const match = schedules?.find(
      (s) => s.date === iso && scheduleStartToDisplaySlot(s.time_slot) === onlySlot,
    );
    const sid = match?.schedule_id ?? null;

    if (bookingCtx) {
      bookingCtx.setSelectedTime(onlySlot);
      bookingCtx.setSelectedScheduleId(sid);
    } else {
      setLocalSelectedTimeSlot(onlySlot);
      setLocalSelectedScheduleId(sid);
    }
  }, [bookingCtx, hasSingleTimeSlotOption, isEventActive, schedules, selectedDate, selectedTimeSlot, timeSlots]);

  const ticketRows = useMemo<TicketRow[]>(() => {
    if (!selectedDate || !selectedTimeSlot) return [];
    const chosen =
      schedules?.find(
        (s) =>
          s.date === toLocalISODate(selectedDate) &&
          scheduleStartToDisplaySlot(s.time_slot) === selectedTimeSlot,
      ) ??
      schedules?.find((s) => s.date === toLocalISODate(selectedDate)) ??
      schedules?.[0];
    const tickets = Array.isArray(chosen?.tickets) ? chosen.tickets : [];
    return tickets.map((t) => ({
      id: String(t.class_id ?? t.class_name ?? "ticket"),
      classId: Number(t.class_id ?? 0),
      label: String(t.class_name ?? "Ticket").replace(/\s+/g, " ").trim(),
      payloadKey: mapPayloadKey(String(t.class_name ?? "")),
      typeId: Number(t.types?.[0]?.type_id ?? 0),
      price: Number(t.types?.[0]?.price ?? "0"),
    }));
  }, [schedules, selectedDate, selectedTimeSlot]);
  // console.log(ticketRows, "ticketRows>>>>.");

  return (
    <>
      <div className="lg:block hidden rounded-2xl bg-surface border border-white/10 p-6 text-white max-w-md">
        {/* {bookingCtx.selectedDate}-{bookingCtx.selectedTime}-{bookingCtx.selectedScheduleId} */}
        <div className="flex items-start justify-between gap-4 mb-3">
          {bookingCtx?.details?.min_price ? (
            <div>
              <p className="text-sm text-[#FFFFFF99] font-montserrat mb-0.5 md:font-normal md:text-[18px] md:leading-[23px] md:tracking-normal">
                Tickets from
              </p>
              <p className="font-montserrat font-semibold text-xl text-white pb-0.5 w-fit md:text-[25px] md:leading-[42px] md:tracking-normal">
                {bookingCtx?.details?.currency?.code || 'AED'} {bookingCtx?.details?.min_price ?? 0}
              </p>
            </div>
          ) : (
            <div />
          )}
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
              onClick={() => addToFavourite(id)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${isFavorite ? "bg-[#191919] text-primary-light" : "bg-[#191919] text-white hover:bg-white/10"
                }`}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart size={18} stroke="white" fill={isFavorite ? "#792327" : "none"} />
            </button>
          </div>
        </div>

        {!isCountdownExpired && (
          <div className="mb-6" ref={countdownRef}>
            <p className="text-sm text-white font-montserrat mb-3 md:font-normal md:text-[14px] md:leading-[100%] md:tracking-normal">
              Tickets Available for
            </p>
            <div className="flex rounded-[16.1px] bg-[#292929] overflow-hidden">
              {[
                { value: pad(count.days), label: "Days" },
                { value: pad(count.hours), label: "Hours" },
                { value: pad(count.minutes), label: "Minutes" },
                { value: pad(count.seconds), label: "Seconds" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex-1 min-w-0 py-3 px-2 text-center"
                >
                  <span className="block font-montserrat font-bold text-xl text-white">
                    {item.value}
                  </span>
                  <span className="block text-[9px] leading-[150%] tracking-normal text-gray-400 font-montserrat font-semibold">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isCountdownExpired && (
          <div className="mb-6">
            <p className="text-sm text-white font-montserrat mb-3 md:font-normal md:text-[14px] md:leading-[100%] md:tracking-normal">
              Event has ended.
            </p>
          </div>
        )}

        <div className="mb-6 pt-4 border-t-2 border-t-[#494949]">
          <h3 className="font-montserrat font-semibold text-[22px] leading-[23px] tracking-normal text-white mb-4">Timing & Schedule</h3>

          <div className="space-y-4 text-sm text-white font-montserrat">
            <div className="flex items-center gap-2 ">
              <Calendar size={18} className="text-white shrink-0 " />
              <span className="font-montserrat font-normal text-[14px] leading-[100%] tracking-normal text-white">{displayedDateRange}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-white shrink-0" />
              <span className="font-montserrat font-normal text-[14px] leading-[100%] tracking-normal text-white">{displayedTimes}</span>
            </div>
          </div>
        </div>
        {!isEventActive && (
        <div data-testid="date-picker-section" className="mb-6">
          <h4 className="font-montserrat font-semibold lg:text-[20px] lg:leading-[23px] leading-[100%] tracking-normal text-white mb-3">Select Date</h4>
          <CalendarPicker
            trigger="field"
            mode="single"
            selected={selectedDate}
            onChange={(date) => handleDateChange(date)}
            minDate={calendarMinDate}
            allowedDates={convertedAllowedDates}
            maxDate={eventEndDate ?? undefined}
          />
        </div>
      )}
      {!isEventActive && (
        <div data-testid="time-slot-section" className="mb-6">
          <h4 className="font-montserrat font-semibold lg:text-[20px] lg:leading-[23px]  leading-[100%] tracking-normal text-white mb-3">Select Timeslot</h4>
          <div className="flex flex-wrap gap-2">
            {timeSlots.map((slot) => {
              const isActive = selectedTimeSlot === slot;
              return (
                <button
                  data-testid="time-slot-btn"
                  key={slot}
                  type="button"
                  disabled={disableTimeSlots}
                  onClick={() => {
                    if (disableTimeSlots) return;
                    handleTimeSlotSelect(slot);
                  }}
                  className={`rounded-full px-4 py-2 font-montserrat text-[14px] leading-[100%] transition-colors ${disableTimeSlots
                    ? "bg-[#292929] text-white/40 cursor-not-allowed"
                    : `cursor-pointer ${isActive
                      ? "bg-primary-light text-white"
                      : "bg-[#292929] text-white hover:bg-white/20"
                    }`
                    }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {!isSeatBookingEnabled ? (
        <div className="mb-6 space-y-3">
          {ticketRows.map((row: TicketRow) => (

            <div key={row.id} className="rounded-[10px] border border-[#494949] px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <p className="font-montserrat text-[16px] leading-[150%] text-white">{row.label}</p>
                  <p className="font-montserrat text-[14px] leading-[19px] text-white">
                    {bookingCtx?.details?.currency?.code || 'AED'} {Number.isFinite(row.price) ? Number(row.price).toFixed(2) : 0}
                  </p>
                </div>
                <div className="inline-flex items-center border border-[#494949] rounded-[4px] overflow-hidden">
                  <button
                    type="button"
                    disabled={!selectedTimeSlot}
                    onClick={() => setTicketQuantity((prev) => Math.max(0, (prev ?? 0) - 1))}
                    className="w-9 h-10 border-r border-[#494949] flex items-center justify-center hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-montserrat text-[11px] text-white">{ticketQuantity ?? 0}</span>
                  <button
                    type="button"
                    disabled={!selectedTimeSlot}
                    onClick={() => setTicketQuantity((prev) => (prev ?? 0) + 1)}
                    className="w-9 h-10 border-l border-[#494949] flex items-center justify-center hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {!isEventActive && (
        <button
          data-testid="book-tickets-btn"
          type="button"
          onClick={() => {
            void handlePrimaryAction();
          }}
          disabled={isPrimaryActionDisabled}
          className="w-full py-3 rounded-xl bg-[#792327] hover:bg-primary-light disabled:bg-[#792327]/50 disabled:hover:bg-[#792327]/50 disabled:cursor-not-allowed text-white font-montserrat cursor-pointer font-semibold flex items-center justify-center gap-2 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] active:opacity-95 disabled:hover:scale-100 disabled:active:scale-100 mb-4"
        >
          {isBookingRedirecting ? (
            <>
              <Loader2 size={24} className="animate-spin" />
            </>
          ) : (
            <>
              <Ticket size={20} />
              {"Book tickets"}
            </>
          )}
        </button>
      )}
      {/* <button
        type="button"
        onClick={() => setShowRegisterModal(true)}
        className="w-full py-3 rounded-xl bg-[#792327] hover:bg-primary-light disabled:bg-[#792327]/50 disabled:hover:bg-[#792327]/50 disabled:cursor-not-allowed text-white font-montserrat cursor-pointer font-semibold flex items-center justify-center gap-2 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] active:opacity-95 disabled:hover:scale-100 disabled:active:scale-100 mb-4"
      >
        Register
      </button> */}
      <div className="font-montserrat font-normal text-[12px] leading-[100%] tracking-normal text-center text-[#FFFFFF80] space-y-1">
        <p>Tickets are non-refundable.</p>
        <p>
          See our{" "}
          {/* <span
                className="text-[#BB2B32]"
              > */}
          Terms and Conditions {" "}
          {/* </span> */}
          for details.
        </p>
      </div>
      </div>


      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 block">
        <div className="rounded-t-2xl bg-surface border border-white/10 p-4 text-white shadow-[0_-8px_24px_rgba(0,0,0,0.35)]">
          <div className="flex items-end gap-3">
            {bookingCtx?.details?.min_price && (
              <div className="min-w-0">
                <p className="text-[14px] leading-[23px] text-[#FFFFFF99] font-montserrat mb-1">Tickets from</p>
                <p className="font-montserrat font-semibold text-[24px] leading-[42px] text-white">
                  {bookingCtx?.details?.currency?.code || 'AED'} {bookingCtx?.details?.min_price ?? 0}
                </p>
              </div>
            )}
            <button
              data-testid="book-tickets-mobile-btn"
              type="button"
              onClick={handleMobilePrimaryAction}
              disabled={isBookingRedirecting}
              aria-disabled={isPrimaryActionDisabled}
              className={`ml-auto h-10 px-4 rounded-lg text-white font-montserrat cursor-pointer text-[16px] leading-[26px] font-semibold flex items-center justify-center gap-2 transition-colors ${isPrimaryActionDisabled
                ? "bg-[#792327]/50 hover:bg-[#792327]/50"
                : "bg-[#792327] hover:bg-primary-light"
                } ${isBookingRedirecting ? "cursor-not-allowed" : ""}`}
            >
              {isBookingRedirecting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Ticket size={16} />
                  Book tickets
                </>
              )}
            </button>
            
          </div>

          <button
            type="button"
            onClick={() => setMobileExpanded((v) => !v)}
            className="w-full mt-3 pt-3 border-t border-white/15 flex items-center justify-between"
            aria-expanded={mobileExpanded}
            aria-controls="mobile-ticket-details"
          >
            <span className="font-montserrat font-semibold text-[20px] leading-[23px] text-white">Timing & Schedule</span>
            {mobileExpanded ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
          </button>

          <div
            id="mobile-ticket-details"
            className={`overflow-hidden transition-[max-height,opacity,margin] duration-300 ease-out ${mobileExpanded ? "max-h-[700px] opacity-100 mt-3" : "max-h-0 opacity-0 mt-0"
              }`}
          >
            <div className="space-y-4 text-sm text-white font-montserrat">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-white shrink-0" />
                <span className="font-montserrat font-normal text-[14px] leading-[100%] tracking-normal text-white">{displayedDateRange}</span>
              </div>

              {/* {JSON.stringify(allScheduleSlots)} */}

              {!hideDateSelector && (
                <div>
                  <h4 className="font-montserrat font-semibold text-[18px] leading-[100%] tracking-normal text-white mb-3">
                    Select Date
                  </h4>
                  <CalendarPicker
                    trigger="field"
                    mode="single"
                    selected={selectedDate}
                    onChange={(date) => handleDateChange(date)}
                    minDate={calendarMinDate}
                    allowedDates={convertedAllowedDates}
                    maxDate={eventEndDate ?? undefined}
                    buttonClassName="w-full flex items-center justify-between gap-3 rounded-[8px] border border-white/30 bg-[#292929] px-4 py-3 cursor-pointer text-white font-montserrat font-normal text-[14px] leading-[100%] tracking-normal hover:opacity-95 transition-opacity"
                  />
                </div>
              )}

              {!hideTimeSlotSelector && (
                <div>
                  <h4 className="font-montserrat font-semibold text-[18px] leading-[100%] tracking-normal text-white mb-3">
                    Select Timeslot
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {timeSlots.map((slot) => {
                      const isActive = selectedTimeSlot === slot;
                      return (
                        <button
                          key={`mobile-${slot}`}
                          type="button"
                          disabled={disableTimeSlots}
                          onClick={() => {
                            if (disableTimeSlots) return;
                            handleTimeSlotSelect(slot);
                          }}
                          className={`rounded-full px-4 py-2 font-montserrat text-[14px] leading-[100%] transition-colors ${disableTimeSlots
                            ? "bg-[#292929] text-white/40 cursor-not-allowed"
                            : `cursor-pointer ${isActive
                              ? "bg-primary-light text-white"
                              : "bg-[#292929] text-white hover:bg-white/20"
                            }`
                            }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Clock size={16} className="text-white shrink-0" />
                <span className="font-montserrat font-normal text-[14px] leading-[100%] tracking-normal text-white">
                  {displayedTimes}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showLoginModal && <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        returnTo={redirectUrl ?? (queryString ? `${pathname}?${queryString}` : pathname)}
        title="Sign in to continue"
        description="Please sign in with Emaar PASS to proceed to add this event to your favorites."
      />
      }
      <EventRegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        eventName={bookingCtx?.details?.name}
      />
    </>
  );
}
