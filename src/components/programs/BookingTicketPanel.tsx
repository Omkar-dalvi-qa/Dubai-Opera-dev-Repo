"use client";

import Image from "next/image";
import { Minus, Plus, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { postExternalEventReservation } from "@/services/externalEventReservationClient";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CalendarPicker from "@/components/CalendarPicker";
import DateRangeModal from "@/components/DateRangeModal";
import BookingTimer from "@/components/programs/BookingTimer";
import { useExternalEventBookingState } from "@/contexts/program-event/ExternalEventDetailsContext";
import { BOOKING_ADDON_ITEMS } from "./bookingConstants";
import { toast } from "sonner";
import { imageUrl } from "@/utils/imageUrl";
import { useAuth } from "@/contexts/auth/AuthContext";
import {
  mergedUpdatedSummary,
  buildEventReservationItemsFromSeats,
  cloneSeatsForReservationPayload,
  FALLBACK_TIMER_SECONDS,
} from "./bookingSeatReservationUtils";
import { courierAddonItem, courierFullDetails } from "@/components/shop/ShippingInformationSection";

function parseISODateToLocalDate(iso: string | null): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function showDisplayTime(value: string | null): string | null {
  const v = String(value ?? "").trim();
  if (!v) return null;
  // Accept "7:00 PM" directly
  if (/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(v)) return v.replace(/\s+/g, " ").toUpperCase();
  // Accept "19:00" and convert to 12-hour display
  const hhmm = formatHHMMTo12Hour(v);
  if (hhmm) return hhmm;
  return v;
}

function toFiniteNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function getVoucherRowSavingsAmount(row: Record<string, unknown>): number {
  return toFiniteNumber(row.discount_amount) ?? toFiniteNumber(row.amount) ?? 0;
}

function getVoucherSavedSummary(summary: unknown): number {
  if (!summary || typeof summary !== "object") return 0;
  const discounts = (summary as Record<string, unknown>).discounts;
  if (!Array.isArray(discounts)) return 0;
  return discounts.reduce((sum, row) => {
    if (!row || typeof row !== "object") return sum;
    return sum + Math.max(0, getVoucherRowSavingsAmount(row as Record<string, unknown>));
  }, 0);
}

function getPrimaryVoucherFromSummary(summary: unknown): {
  savingsAmount: number;
  voucherCode?: string;
  voucherName?: string;
} | null {
  if (!summary || typeof summary !== "object") return null;
  const discounts = (summary as Record<string, unknown>).discounts;
  if (!Array.isArray(discounts) || discounts.length === 0) return null;
  const row = discounts[0];
  if (!row || typeof row !== "object") return null;
  const record = row as Record<string, unknown>;
  const savingsAmount = getVoucherRowSavingsAmount(record);
  if (savingsAmount <= 0) return null;
  return {
    savingsAmount,
    voucherCode: typeof record.voucher_code === "string" ? record.voucher_code : undefined,
    voucherName: typeof record.voucher_name === "string" ? record.voucher_name : undefined,
  };
}

function formatAedAmount(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function safeInt(value: string | null): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

function firstScheduleIdForISODate(schedules: unknown[], isoDate: string): number | null {
  const list = Array.isArray(schedules) ? schedules : [];
  if (!list.length) return null;
  const match = list.find(
    (s) => String((s as Record<string, unknown>)?.date ?? "") === isoDate,
  ) as Record<string, unknown> | undefined;
  const id = Number(match?.schedule_id);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function getReservationItemsFromVisitTickets(args: {
  schedules: unknown[];
  visitTickets: Record<string, number>;
  fallbackProductId: number;
  fallbackScheduleId: number;
  selectedAddons: Array<{ id: number; quantity: number; price?: number }>;
}): Array<{
  product_id: number;
  schedule_id: number;
  ticket_class_id: number;
  ticket_type_id: number;
  quantity: number;
  addons: Array<{ id: number; quantity: number; price?: number }>;
}> {
  const schedules = Array.isArray(args.schedules)
    ? (args.schedules as Array<Record<string, unknown>>)
    : [];
  const selectedSchedule =
    schedules.find((row) => Number(row.schedule_id ?? 0) === args.fallbackScheduleId) ?? schedules[0];
  const ticketRows = Array.isArray(selectedSchedule?.tickets)
    ? (selectedSchedule.tickets as Array<Record<string, unknown>>)
    : [];
  if (!ticketRows.length) return [];

  const items: Array<{
    product_id: number;
    schedule_id: number;
    ticket_class_id: number;
    ticket_type_id: number;
    quantity: number;
    addons: Array<{ id: number; quantity: number; price?: number }>;
  }> = [];

  for (const ticket of ticketRows) {
    const ticketClassId = Number(ticket.class_id ?? 0);
    const ticketClassName = String(ticket.class_name ?? "").trim();
    const ticketTypeId = Number((ticket.types as any[] | undefined)?.[0]?.type_id ?? 0);
    const key = toVisitTicketPayloadKey(ticketClassName);
    const quantity = Number(args.visitTickets[key] ?? 0);
    if (
      !Number.isFinite(ticketClassId) || ticketClassId <= 0 ||
      !Number.isFinite(ticketTypeId) || ticketTypeId <= 0 ||
      !Number.isFinite(quantity) || quantity <= 0
    ) {
      continue;
    }
    items.push({
      product_id: args.fallbackProductId,
      schedule_id: args.fallbackScheduleId,
      ticket_class_id: ticketClassId,
      ticket_type_id: ticketTypeId,
      quantity,
      addons: args.selectedAddons,
    });
  }

  return items;
}

function reservationCustomerPayload(customer: {
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
}, shipping?: { email?: string; phone?: string }): Record<string, string> {
  const payload: Record<string, string> = {};
  const customerName = [customer.firstName, customer.lastName]
    .filter((v) => String(v ?? "").trim().length > 0)
    .join(" ")
    .trim();
  const email = (customer.email || shipping?.email || "").trim();
  const phone = (customer.mobile || shipping?.phone || "").trim();

  if (customerName) payload.customer_name = customerName;
  if (email) payload.email = email;
  if (phone) payload.phone = phone;
  return payload;
}

function visitTicketDisplayLabel(key: string): string {
  const normalized = key.replace(/_/g, " ").trim();
  if (!normalized) return "Ticket";
  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

function toVisitTicketPayloadKey(value: string): string {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

function toLocalISODate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function format12HourTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function parse12HourTime(value: string): Date | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  const [, hourRaw, minuteRaw, periodRaw] = match;
  let hours = Number(hourRaw);
  const minutes = Number(minuteRaw);
  const period = periodRaw.toUpperCase();
  if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes > 59 || hours < 1 || hours > 12) return null;
  if (hours === 12) hours = 0;
  if (period === "PM") hours += 12;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
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

export interface SeatCategory {
  id: string;
  label: string;
  seatsAvailable: number;
  price: string;
  color: string;
  soldOut?: boolean;
}

export interface SelectedAddonDetail {
  id: string;
  quantity: number;
  label?: string;
  /** Unit price stored as string for API compatibility. */
  price?: string;
  maxQuantity?: number;
}

interface BookingTicketPanelProps {
  categories?: SeatCategory[];
  minDate?: Date;
  maxDate?: Date;
  timeSlots?: string[];
  onVisitTicketIncrease?: (type: string) => void;
  onVisitTicketDecrease?: (type: string) => void;
  /** When set, the primary checkout/next action calls this instead of default navigation/submit hooks. */
  onCheckout?: () => void;
  hideSummaryHeader?: boolean;
}

export default function BookingTicketPanel({
  categories = [],
  minDate,
  maxDate,
  timeSlots = [],
  onVisitTicketIncrease,
  onVisitTicketDecrease,
  onCheckout,
  hideSummaryHeader,
}: BookingTicketPanelProps) {
  const router = useRouter();
  const bookingCtx = useExternalEventBookingState();
  const { timerExpiry, setTimerExpiry, timerTotalSeconds, setTimerTotalSeconds } = bookingCtx;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isStudioPath = pathname.includes("/programs/studio/");
  const queryString = searchParams.toString();
  const withQuery = (href: string) => (queryString ? `${href}?${queryString}` : href);
  const replaceQuery = (next: URLSearchParams) => {
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };
  const bookingBasePath = useMemo(
    () =>
      pathname.replace(
        /\/(seats\d*|addons|checkout|payment|confirmation)(\/.*)?$/,
        ""
      ),
    [pathname]
  );

  // when time over redirect to home page
  const timerExpiryRedirection = useMemo(() => {
    const [locale] = pathname.split("/").filter(Boolean);
    return `/${locale || "en"}`;
  }, [pathname]);


  const { user, setShowLoginModal } = useAuth();
  const isSeatsPage = pathname.includes("/seats");
  const isAddonsPage = pathname.includes("/addons");
  const isAddonsMode = isAddonsPage || pathname.includes("/checkout") || pathname.includes("/payment");
  const isCheckoutPage = pathname.includes("/checkout");
  const isPaymentPage = pathname.includes("/payment");

  const contextSelectedDate = bookingCtx.selectedDate;
  const contextSelectedTime = bookingCtx.selectedTime;


  const bookinglabelButton = useMemo(() => {
    if (isPaymentPage) return "Pay Now";
    if (isCheckoutPage) return "Proceed to Payment";
    if (isAddonsMode) return "Proceed to Checkout";
    return "Proceed";
  }, [isPaymentPage, isCheckoutPage, isAddonsMode]);

  const firstAvailableId = useMemo(() => categories.find((item) => !item.soldOut)?.id ?? null, [categories]);
  const resolvedCategories = (categories && categories.length > 0) ? categories : [];

  const [activeId, setActiveId] = useState<string | null>(firstAvailableId);
  const activeCategory = useMemo(() => {
    return resolvedCategories.find((c) => c.id === activeId);
  }, [resolvedCategories, activeId]);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoSubmitting, setPromoSubmitting] = useState(false);
  const [reservationSubmitting, setReservationSubmitting] = useState(false);
  const isStudioTicket = useMemo(() => {
    if (isStudioPath) return true;
    return bookingCtx.isSeatBookingEnabled === false &&
      String(bookingCtx.details?.slug ?? "").trim().toLowerCase() !== "visit-opera";
  }, [isStudioPath, bookingCtx.details?.slug, bookingCtx.isSeatBookingEnabled]);
  const visitTicketCurrencyCode = useMemo(() => {
    const detailsRecord = bookingCtx.details as Record<string, unknown> | null;
    const detailsCurrency =
      detailsRecord?.currency && typeof detailsRecord.currency === "object"
        ? (detailsRecord.currency as Record<string, unknown>)
        : null;
    const detailsCurrencyCode = String(
      detailsRecord?.currency_code ??
      detailsCurrency?.code ??
      "",
    )
      .trim()
      .toUpperCase();
    return detailsCurrencyCode || "AED";
  }, [bookingCtx.details]);

  const visitTicketUnitPrices = useMemo<Record<string, number>>(() => {
    const schedules = Array.isArray(bookingCtx.details?.schedules)
      ? (bookingCtx.details.schedules as Array<Record<string, unknown>>)
      : [];
    const selectedSchedule =
      schedules.find((row) => Number(row.schedule_id ?? 0) === Number(bookingCtx.selectedScheduleId ?? 0)) ??
      schedules[0];
    const ticketRows = Array.isArray(selectedSchedule?.tickets)
      ? (selectedSchedule.tickets as Array<Record<string, unknown>>)
      : [];
    const next: Record<string, number> = {};
    for (const ticket of ticketRows) {
      const key = toVisitTicketPayloadKey(String(ticket.class_name ?? ""));
      if (!key) continue;
      const price = Number((ticket.types as any[] | undefined)?.[0]?.price ?? 0);
      if (!Number.isFinite(price) || price < 0) continue;
      next[key] = price;
    }
    return next;
  }, [bookingCtx.details?.schedules, bookingCtx.selectedScheduleId]);


  const [remainingSeconds, setRemainingSeconds] = useState(timerTotalSeconds ?? FALLBACK_TIMER_SECONDS);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const intervalIdRef = useRef<number | null>(null);
  const timerRedirectedRef = useRef(false);
  const reservationCallInProgressRef = useRef(false);
  const parsedSelectedDate = useMemo(() => {
    return parseISODateToLocalDate(contextSelectedDate);
  }, [contextSelectedDate]);

  const [selectedDate, setSelectedDate] = useState<Date | null>(parseISODateToLocalDate(bookingCtx.selectedDate));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(bookingCtx.selectedTime ?? null);

 const  [isVoucherApplied, setIsVoucherApplied] = useState(false);

  useEffect(() => {
    if (!bookingCtx.voucherState.voucherCode && !bookingCtx.voucherState.isVoucherApplied) return;
    setPromoCode(bookingCtx.voucherState.voucherCode);
    setPromoApplied(Boolean(bookingCtx.voucherState.isVoucherApplied));
    setDiscount(Math.max(0, Number(bookingCtx.voucherState.discountAmount ?? 0) || 0));
    setIsVoucherApplied(Boolean(bookingCtx.voucherState.isVoucherApplied));
  }, [bookingCtx.voucherState]);
  // Visit Opera mode uses visit ticket counts to decide seat/ticket summary UI.
  const hasVisitTicketState = Object.values(bookingCtx.visitTickets).some((qty) => Number(qty) > 0);
  const isVisitOperaBooking =
    String(bookingCtx.details?.slug ?? "").trim().toLowerCase() === "visit-opera" ||
    hasVisitTicketState;
  const showDesktopTimer = !isVisitOperaBooking;

  useEffect(() => {
    // Ensure visit-opera ticket state does not leak into non visit-opera events.
    if (isVisitOperaBooking) return;
    const activeVisitTicketKeys = Object.keys(bookingCtx.visitTickets).filter(
      (key) => Number(bookingCtx.visitTickets[key] ?? 0) > 0,
    );
    if (activeVisitTicketKeys.length === 0) {
      return;
    }
    const clearedVisitTickets = Object.fromEntries(activeVisitTicketKeys.map((key) => [key, 0]));
    bookingCtx.setVisitTickets(clearedVisitTickets);
  }, [
    bookingCtx.setVisitTickets,
    bookingCtx.visitTickets,
    isVisitOperaBooking,
  ]);

  const rawSchedules = bookingCtx.details?.schedules as any[] | undefined;
  const initFromUrlRef = useRef(false);

  const queryDate = searchParams.get("date");
  const querySid = searchParams.get("sid");

  // Ensure the booking panel reflects the user's choice made in `EventTicketCard`.
  // Source of truth order:
  // 1) URL query params (`date`, `sid`) so deep links render immediately
  // 2) Context (restored from prior in-app navigation)
  // 3) User selection inside this panel
  useEffect(() => {
    if (initFromUrlRef.current) return;

    const urlDate = parseISODateToLocalDate(queryDate);
    const urlScheduleId = safeInt(querySid);

    // If there is no relevant URL state, don't "consume" the init flag.
    if (!urlDate && !urlScheduleId) return;

    // Hydrate date
    if (urlDate) {
      const nextIso = toLocalISODate(urlDate);
      if (bookingCtx.selectedDate !== nextIso) bookingCtx.setSelectedDate(nextIso);

      const currentIso = selectedDate ? toLocalISODate(selectedDate) : null;
      if (currentIso !== nextIso) setSelectedDate(urlDate);
    }

    // Hydrate schedule id
    if (urlScheduleId != null && bookingCtx.selectedScheduleId !== urlScheduleId) {
      bookingCtx.setSelectedScheduleId(urlScheduleId);
    }

    // Hydrate time by deriving from schedule id once schedules are available.
    let derivedTime: string | null = null;
    if (urlScheduleId != null && rawSchedules?.length) {
      const row = rawSchedules.find((s) => Number(s?.schedule_id) === Number(urlScheduleId));
      derivedTime = showDisplayTime(scheduleStartToDisplaySlot(row?.time_slot));
    }
    if (derivedTime) {
      if (bookingCtx.selectedTime !== derivedTime) bookingCtx.setSelectedTime(derivedTime);
      if (selectedTimeSlot !== derivedTime) setSelectedTimeSlot(derivedTime);
    }

    // Only mark as initialized after we've had a chance to derive time from schedules
    // (if `sid` is present but schedules aren't loaded yet, we'll run again on the next render).
    if (!urlScheduleId || rawSchedules?.length) {
      initFromUrlRef.current = true;
    }
  }, [
    queryDate,
    querySid,
    rawSchedules,
    bookingCtx,
    selectedDate,
    selectedTimeSlot,
  ]);

  // Read allowed dates from context or derive from raw schedules if context is empty
  const contextAllowedDates = useMemo(() => {
    if (bookingCtx.allowedDates.length > 0) return bookingCtx.allowedDates;
    if (!rawSchedules?.length) return [];
    return Array.from(new Set(rawSchedules.map((s: any) => s.date).filter(Boolean))) as string[];
  }, [bookingCtx.allowedDates, rawSchedules]);

  // Derive time slots from raw schedule data for the selected date (same logic as EventTicketCard)
  const derivedTimeSlots = useMemo(() => {
    // 1. If explicit prop timeSlots are provided, use them
    if (timeSlots.length > 0) return timeSlots;

    // 2. Derive from raw schedule data (same as EventTicketCard)
    if (rawSchedules?.length) {
      if (!selectedDate) {
        // No date selected: show all unique time slots across all dates
        const slots = rawSchedules
          .map((s) => scheduleStartToDisplaySlot(s.time_slot))
          .filter((v): v is string => Boolean(v));
        const unique = Array.from(new Set(slots));
        unique.sort((a, b) => {
          const da = parse12HourTime(a) ?? new Date(`1970-01-01T${a}:00`);
          const db = parse12HourTime(b) ?? new Date(`1970-01-01T${b}:00`);
          return da.getTime() - db.getTime();
        });
        return unique;
      }

      // Date is selected: filter slots for that date
      const iso = toLocalISODate(selectedDate);
      const slotsForDate = rawSchedules
        .filter((s) => s.date === iso)
        .map((s) => scheduleStartToDisplaySlot(s.time_slot))
        .filter((v): v is string => Boolean(v));

      const unique = Array.from(new Set(slotsForDate));
      unique.sort((a, b) => {
        const da = parse12HourTime(a) ?? new Date(`1970-01-01T${a}:00`);
        const db = parse12HourTime(b) ?? new Date(`1970-01-01T${b}:00`);
        return da.getTime() - db.getTime();
      });
      return unique;
    }

    // 3. Fallback: use context timeSlots (set by EventTicketCard)
    return bookingCtx.timeSlots;
  }, [timeSlots, rawSchedules, selectedDate, bookingCtx.timeSlots]);

  const effectiveTimeSlots = derivedTimeSlots;

  // Find matching scheduleId for a given date + displaySlot
  const findScheduleId = (date: Date, displaySlot: string): number | null => {
    if (!rawSchedules?.length) return null;
    const iso = toLocalISODate(date);
    const match = rawSchedules.find(
      (s) => s.date === iso && scheduleStartToDisplaySlot(s.time_slot) === displaySlot,
    );
    return match?.schedule_id ?? null;
  };

  // Convert context allowedDates (ISO strings) to Date objects for CalendarPicker
  const contextAllowedDateObjects = useMemo(() => {
    if (!contextAllowedDates?.length) return undefined;
    return contextAllowedDates
      .map((d) => {
        const [y, m, day] = d.split("-").map(Number);
        if (!y || !m || !day) return null;
        return new Date(y, m - 1, day);
      })
      .filter((d): d is Date => d !== null);
  }, [contextAllowedDates]);

  const validateSelectDates = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (!minDate) return todayStart;

    const minStart = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    return minStart < todayStart ? todayStart : minStart;
  }, [minDate]);

  const upcomingAllowedDateObjects = useMemo(() => {
    if (!contextAllowedDateObjects?.length) return undefined;
    return contextAllowedDateObjects.filter((d) => d >= validateSelectDates);
  }, [contextAllowedDateObjects, validateSelectDates]);

  const resolvedAddonItems = BOOKING_ADDON_ITEMS;
  const subtotal = bookingCtx.seatSubtotal;
  const effectiveSelectedAddons = bookingCtx.selectedAddons;

  const handleIncreaseAddon = (id: string) => {
    const current = bookingCtx.selectedAddons;
    const existing = current.find((a) => a.id === id);
    if (existing) {
      if (existing.maxQuantity && existing.quantity >= existing.maxQuantity) return;
      bookingCtx.setSelectedAddons(current.map((a) => (a.id === id ? { ...a, quantity: a.quantity + 1 } : a)));
    } else {
      const matched = resolvedAddonItems.find((item) => item.id === id);
      bookingCtx.setSelectedAddons([...current, {
        id,
        quantity: 1,
        label: matched?.title || "",
        price: matched?.price != null ? String(matched.price) : "0"
      }]);
    }
  };

  const handleDecreaseAddon = (id: string) => {
    const current = bookingCtx.selectedAddons;
    const existing = current.find((a) => a.id === id);
    if (!existing) return;
    if (existing.quantity > 1) {
      bookingCtx.setSelectedAddons(current.map((a) => (a.id === id ? { ...a, quantity: a.quantity - 1 } : a)));
    } else {
      bookingCtx.setSelectedAddons(current.filter((a) => a.id !== id));
    }
  };

  const hasSelection = useMemo(() => {
    const hasVisitTicketSelection = Object.values(bookingCtx.visitTickets).some(
      (qty) => Number(qty) > 0,
    );
    return (
      bookingCtx.seatQuantity > 0 ||
      hasVisitTicketSelection
    );
  }, [bookingCtx.seatQuantity, bookingCtx.visitTickets]);

  useEffect(() => {
    if (!hasSelection) setMobileSummaryOpen(false);
  }, [hasSelection]);

  const canProceedToAddons = (hasSelection || isStudioTicket || isStudioPath) && Boolean(selectedDate && selectedTimeSlot) && remainingSeconds > 0;

  useEffect(() => {
    if (!parsedSelectedDate) return;
    // Avoid update loops by only syncing when the day actually differs.
    const nextIso = toLocalISODate(parsedSelectedDate);
    const currentIso = selectedDate ? toLocalISODate(selectedDate) : null;
    if (currentIso !== nextIso) {
      setSelectedDate(parsedSelectedDate);
    }
  }, [parsedSelectedDate, selectedDate]);

  useEffect(() => {
    if (!contextSelectedTime) return;
    if (selectedTimeSlot !== contextSelectedTime) {
      setSelectedTimeSlot(contextSelectedTime);
    }
  }, [contextSelectedTime, selectedTimeSlot]);

  useEffect(() => {
    if (!timerExpiry) {
      setRemainingSeconds(timerTotalSeconds ?? FALLBACK_TIMER_SECONDS);
      timerRedirectedRef.current = false;
      return;
    }
    const expiry = Number(timerExpiry);
    if (Number.isNaN(expiry) || expiry <= 0) {
      setRemainingSeconds(timerTotalSeconds ?? FALLBACK_TIMER_SECONDS);
      timerRedirectedRef.current = false;
      return;
    }
    setRemainingSeconds(Math.max(0, Math.floor((expiry - Date.now()) / 1000)));
  }, [timerExpiry, timerTotalSeconds]);

  useEffect(() => {
    if (!timerExpiry) return;
    const expiry = Number(timerExpiry);
    if (Number.isNaN(expiry) || expiry <= 0) return;
    if (intervalIdRef.current != null) {
      window.clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    intervalIdRef.current = window.setInterval(() => {
      const next = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      setRemainingSeconds(next);
      if (next <= 0 && intervalIdRef.current != null) {
        window.clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    }, 1000);
    return () => {
      if (intervalIdRef.current != null) {
        window.clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [timerExpiry]);

  useEffect(() => {
    if (!timerExpiry) return;
    if (remainingSeconds > 0) return;
    if (timerRedirectedRef.current) return;
    // When timer expires, send user back to locale home page.
    timerRedirectedRef.current = true;
    setTimerExpiry(null);
    if (!pathname.includes("/confirmation")) {
      router.push(timerExpiryRedirection);
    }
  }, [remainingSeconds, timerExpiry, setTimerExpiry, router, timerExpiryRedirection, pathname]);
  useEffect(() => {
    // Reset CTA spinner after route transitions in booking flow.
    setReservationSubmitting(false);
  }, [pathname]);
  const summaryDatePart = selectedDate
    ? selectedDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    : "";
  const summaryTimePart = selectedTimeSlot
    ? showDisplayTime(selectedTimeSlot) ?? selectedTimeSlot.trim()
    : "";
  const summaryDateTime = [summaryDatePart, summaryTimePart].filter(Boolean).join(", ");

  const handleNextStep = (bol= false) => {
    if (onCheckout && !bol) {
      onCheckout();
      return;
    }
    if (pathname.includes("/payment") && !bol) {
      if (bookingCtx.requestPaymentSubmit.current) {
        setReservationSubmitting(true);
        const maybePromise = bookingCtx.requestPaymentSubmit.current();
        Promise.resolve(maybePromise).finally(() => {
          setReservationSubmitting(false);
        });
        return;
      } else {
        console.warn("BookingTicketPanel: requestPaymentSubmit.current is null on /payment page");
      }
    }

    if (isSeatsPage || bol) {
    
    }

    if (isPaymentPage) {
      // Payment submission is handled by `BookingPaymentClient` via `requestPaymentSubmit`.
      setReservationSubmitting(true);
      router.push(withQuery(`${bookingBasePath}/confirmation`));
      return;
    }

    if (isCheckoutPage) {
      if (bookingCtx.requestCheckoutSubmit.current) {
        void (async () => {
          setReservationSubmitting(true);
          try {
            const checkoutSubmissionResult = bookingCtx.requestCheckoutSubmit.current?.();
            const isCheckoutSubmissionSuccessful =
              typeof checkoutSubmissionResult === "object" &&
                checkoutSubmissionResult != null &&
                "isValid" in checkoutSubmissionResult
                ? Boolean((checkoutSubmissionResult as { isValid?: boolean }).isValid)
                : Boolean(checkoutSubmissionResult);
            if (!isCheckoutSubmissionSuccessful) return;

            const reservationId = String(bookingCtx.reservationId ?? "");
            if (String(reservationId).trim().length === 0) {
              toast.error("Reservation is missing. Please go back and try again.");
              router.push(withQuery(`${bookingBasePath}/seats`));
              return;
            }

            const scheduleId = bookingCtx.selectedScheduleId;
            if (scheduleId == null || scheduleId <= 0) {
              throw new Error("Could not determine showtime (schedule). Go back and pick a date and time.");
            }
            const productId = Number(bookingCtx.details?.id);
            if (!Number.isFinite(productId) || productId <= 0) {
              throw new Error("Event product is missing. Please refresh the page.");
            }

            const seats = bookingCtx.selectedSeatsData;
            const selectedAddonPayload = (bookingCtx.selectedAddons ?? [])
              .filter((a) => a.quantity > 0)
              .map((a) => {
                const unitPrice = Number.parseFloat(String(a.price ?? ""));
                return {
                  id: Number(a.id),
                  quantity: a.quantity,
                  ...(Number.isFinite(unitPrice) ? { price: unitPrice } : {}),
                };
              });

            let items: Array<Record<string, unknown>> = [];
            let selectedSeatsPayload: unknown[] | undefined = cloneSeatsForReservationPayload(seats, {
              productId,
              scheduleId,
            });
            if (isVisitOperaBooking) {
              items = getReservationItemsFromVisitTickets({
                schedules: bookingCtx.details?.schedules as unknown[],
                visitTickets: bookingCtx.visitTickets,
                fallbackProductId: productId,
                fallbackScheduleId: scheduleId,
                selectedAddons: selectedAddonPayload,
              });

              selectedSeatsPayload = undefined;
            } else {
              items = buildEventReservationItemsFromSeats({
                productId,
                scheduleId: scheduleId ?? 0,
                schedules: (bookingCtx.details?.schedules ?? []) as unknown[],
                seats,
              }).map((item: any) => ({
                ...item,
                addons: selectedAddonPayload,
              }));
            }

            const checkoutCustomerPayload =
              typeof checkoutSubmissionResult === "object" &&
                checkoutSubmissionResult != null &&
                "customerPayload" in checkoutSubmissionResult
                ? (checkoutSubmissionResult as { customerPayload?: any }).customerPayload
                : bookingCtx.customer;
            const checkoutShippingPayload =
              typeof checkoutSubmissionResult === "object" &&
                checkoutSubmissionResult != null &&
                "shippingPayload" in checkoutSubmissionResult
                ? (checkoutSubmissionResult as { shippingPayload?: any }).shippingPayload
                : bookingCtx.shipping;

            const receiveCourier =
              Boolean(checkoutShippingPayload?.receiveCourier) ||
              Boolean(checkoutCustomerPayload?.receiveCourier);

            if (receiveCourier && items.length > 0) {
              const firstItem = items[0];
              const existingAddons = Array.isArray(firstItem.addons) ? [...firstItem.addons] : [];
              items[0] = {
                ...firstItem,
                addons: [...existingAddons, courierAddonItem()],
              };
            }

            if (items.length === 0) {
              router.push(withQuery(`${bookingBasePath}/payment`));
              return;
            }

            const payload: Record<string, unknown> = {
              reservation_id: reservationId,
              voucher:{
                voucher_code:promoCode ?? "",
                card_number:"",
              },
              external_user_id: user?.emmarId ?? "",
              ...reservationCustomerPayload(checkoutCustomerPayload ?? {}, checkoutShippingPayload ?? {}),
              items,
              ...(bookingCtx.isSeatBookingEnabled && selectedSeatsPayload && selectedSeatsPayload.length > 0
                ? { selected_seats: selectedSeatsPayload }
                : {}),
              ...(receiveCourier
                ? {
                    courier_details: courierFullDetails({
                      firstName: checkoutShippingPayload?.firstName ?? "",
                      lastName: checkoutShippingPayload?.lastName ?? "",
                      email: checkoutShippingPayload?.email ?? "",
                      phone: checkoutShippingPayload?.phone ?? "",
                      streetAddress: checkoutShippingPayload?.streetAddress ?? "",
                      city: checkoutShippingPayload?.city ?? "",
                      emirate: checkoutShippingPayload?.emirate ?? "",
                      postalCode: checkoutShippingPayload?.postalCode ?? "",
                      saveAddress: Boolean(checkoutShippingPayload?.saveAddress),
                    }),
                  }
                : {}),
            };
            if (reservationCallInProgressRef.current) return;
            reservationCallInProgressRef.current = true;
            const data = await postExternalEventReservation(payload).finally(() => {
              reservationCallInProgressRef.current = false;
            });
            const mergedCheckoutSummary = mergedUpdatedSummary(data?.summary, data);
            bookingCtx.setReservationSummary(mergedCheckoutSummary as any);
            syncVoucherFromReservationSummary(mergedCheckoutSummary, promoCode.trim());
            if (data?.expiry_time) {
              const expiryMs = new Date(data.expiry_time).getTime();
              if (expiryMs !== timerExpiry) {
                setTimerExpiry(expiryMs);
                setTimerTotalSeconds(Math.max(0, Math.floor((expiryMs - Date.now()) / 1000)));
              }
            }
            router.push(withQuery(`${bookingBasePath}/payment`));
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Could not update reservation. Please try again.";
            toast.error(message);
          } finally {
            setReservationSubmitting(false);
          }
        })();
        return;
      } else {
        console.warn("BookingTicketPanel: requestCheckoutSubmit.current is null on /checkout page");
        return;
      }
    }

    if (isAddonsPage) {
      void (async () => {
        setReservationSubmitting(true);
        try {
          const reservation_id = bookingCtx.reservationId;
          if (String(reservation_id).trim().length === 0) {
            toast.error("Reservation is missing. Please go back and try again.");
            router.push(withQuery(`${bookingBasePath}/seats`));
            return;
          }

          const scheduleId = bookingCtx.selectedScheduleId;
          if (scheduleId == null || scheduleId <= 0) {
            throw new Error("Could not determine showtime (schedule). Go back and pick a date and time.");
          }

          const productId = Number(bookingCtx.details?.id);
          if (!Number.isFinite(productId) || productId <= 0) {
            toast.error("Event product is missing. Please refresh the page.");
            return;
          }

          const selectedAddonPayload = (bookingCtx.selectedAddons ?? [])
            .filter((a) => a.quantity > 0)
            .map((a) => {
              const unitPrice = Number.parseFloat(String(a.price ?? ""));
              return {
                id: Number(a.id),
                quantity: a.quantity,
                ...(Number.isFinite(unitPrice) ? { price: unitPrice } : {}),
              };
            });

          const seats = bookingCtx.selectedSeatsData;
          let items: Array<Record<string, unknown>> = [];
          let selectedSeatsPayload: unknown[] | undefined = cloneSeatsForReservationPayload(seats, {
            productId,
            scheduleId,
          });

          if (isVisitOperaBooking) {
            items = getReservationItemsFromVisitTickets({
              schedules: bookingCtx.details?.schedules as unknown[],
              visitTickets: bookingCtx.visitTickets,
              fallbackProductId: productId,
              fallbackScheduleId: scheduleId,
              selectedAddons: selectedAddonPayload,
            });

            // Visit-opera does not use seat selection payload.
            selectedSeatsPayload = undefined;
          } else {
            items = buildEventReservationItemsFromSeats({
              productId,
              scheduleId: scheduleId ?? 0,
              schedules: (bookingCtx.details?.schedules ?? []) as unknown[],
              seats,
            }).map((item: any) => ({
              ...item,
              addons: selectedAddonPayload,
            }));
          }
          const c = bookingCtx.customer;
          const customer_name =
            [c.firstName, c.lastName].filter(Boolean).join(" ").trim() || "Guest";
          const email = (c.email || "").trim() || "guest@example.com";
          const phone = (c.mobile || "").trim() || "-";

          const payload: Record<string, unknown> = {
            reservation_id,
            customer_name,
            email,
            phone,
            items,
             voucher:{
                voucher_code:promoCode ?? "",
                card_number:"",
              },
            ...(bookingCtx.isSeatBookingEnabled && selectedSeatsPayload && selectedSeatsPayload.length > 0
              ? { selected_seats: selectedSeatsPayload }
              : {}),
          };
          // console.log("[BookingTicketPanel] addons -> reservation payload", payload);
          const data = await postExternalEventReservation(payload);
          // console.log("[BookingTicketPanel] addons -> reservation response", data);
          const rid = data?.reservation_id;
          if (String(rid).trim().length > 0 && String(rid) !== String(bookingCtx.reservationId)) {
            bookingCtx.setReservationId(String(rid));
          }
          const mergedAddonsSummary = mergedUpdatedSummary(data?.summary, data);
          bookingCtx.setReservationSummary(mergedAddonsSummary as any);
        syncVoucherFromReservationSummary(mergedAddonsSummary, promoCode.trim());
          if (data?.expiry_time) {
            const expiryMs = new Date(data.expiry_time).getTime();
            if (expiryMs !== timerExpiry) {
              setTimerExpiry(expiryMs);
              setTimerTotalSeconds(Math.max(0, Math.floor((expiryMs - Date.now()) / 1000)));
            }
          }
          if (!user?.emmarId) {
            setShowLoginModal(true);
            return;
          }
          router.push(withQuery(`${bookingBasePath}/checkout`));
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "Could not update reservation. Please try again.";
          toast.error(msg);
        } finally {
          setReservationSubmitting(false);
        }
      })();
      return;
    }
    setReservationSubmitting(true);
    router.push(withQuery(`${bookingBasePath}/checkout`));
  };


  const addonsSubtotal = useMemo(() => {
    // Use context-selected addons (API-backed) as source of truth.
    // `price` is stored as string in context.
    return effectiveSelectedAddons.reduce((sum, selected) => {
      const unitPrice = Number.parseFloat(String(selected.price ?? "0")) || 0;
      return sum + unitPrice * selected.quantity;
    }, 0);
  }, [effectiveSelectedAddons]);

  const preDiscountTotal = subtotal + addonsSubtotal;
  const totalDiscount = Math.min(Math.max(discount, 0), preDiscountTotal);
  const taxableTotal = Math.max(0, preDiscountTotal - totalDiscount);
  const addonsVat = taxableTotal;
  const addonsTotal = taxableTotal + addonsVat;
  const apiSummary = bookingCtx.reservationSummary;
  const apiSubTotal = toFiniteNumber(apiSummary?.sub_total);
  const apiGrandTotal = toFiniteNumber(apiSummary?.grand_total);
  const apiVatTotal = Array.isArray(apiSummary?.taxes)
    ? apiSummary.taxes.reduce((sum, row) => sum + (toFiniteNumber(row?.tax_amount) ?? 0), 0)
    : null;
  const apiVoucherSavings = apiSummary != null ? getVoucherSavedSummary(apiSummary) : 0;
  const hasApiReservationPricing = apiSubTotal != null && apiGrandTotal != null;
  const hasAddonsSelected = effectiveSelectedAddons.some((a) => (a?.quantity ?? 0) > 0);
  const apiSummaryIncludesAddons =
    apiSubTotal != null && Math.abs(apiSubTotal - preDiscountTotal) < 0.01;
  const useContextTotals =
    !hasApiReservationPricing ||
    (isAddonsPage && hasAddonsSelected && !apiSummaryIncludesAddons && apiVoucherSavings <= 0);

  const voucherApplied =
    promoApplied ||
    isVoucherApplied ||
    Boolean(bookingCtx.voucherState.isVoucherApplied) ||
    (Boolean(promoCode.trim()) && apiVoucherSavings > 0);
  const promoSavings =
    apiVoucherSavings > 0
      ? apiVoucherSavings
      : voucherApplied
        ? Math.max(0, Number(bookingCtx.voucherState.discountAmount ?? 0) || discount, 0)
        : 0;
  const primaryVoucher = getPrimaryVoucherFromSummary(apiSummary);
  const appliedVoucherLabel =
    primaryVoucher?.voucherCode?.trim() ||
    promoCode.trim() ||
    bookingCtx.voucherState.voucherCode.trim() ||
    primaryVoucher?.voucherName?.trim() ||
    "";

  const displaySubtotal = useContextTotals ? preDiscountTotal : (apiSubTotal ?? preDiscountTotal);
  const summaryRecord =
    apiSummary && typeof apiSummary === "object" ? (apiSummary as Record<string, unknown>) : null;
  const receiveCourier =
    bookingCtx.shipping.receiveCourier || bookingCtx.customer.receiveCourier;
  const courierAmount = toFiniteNumber(summaryRecord?.courier_price) ?? 0;
  const showCourierShipping = receiveCourier && courierAmount > 0;

  const isGiftCardApplied = summaryRecord?.is_gift_card === true;
  const giftCardAmountFromSummary = Math.max(0, toFiniteNumber(summaryRecord?.gift_card_amount) ?? 0);
  const giftCardDiscount = isGiftCardApplied
    ? giftCardAmountFromSummary > 0
      ? giftCardAmountFromSummary
      : 0
    : 0;
  const displayVat = useContextTotals ? addonsVat : (apiVatTotal ?? 0);
  const displayGrandTotal = useContextTotals ? addonsTotal : (apiGrandTotal ?? addonsTotal);

  const selectedAddonRows = effectiveSelectedAddons
    .map((selected) => {
      const matched = resolvedAddonItems.find((item) => item.id === selected.id);
      const unitPrice = Number.parseFloat(String(selected.price ?? matched?.price ?? "0")) || 0;
      const label = (selected.label && String(selected.label).trim()) || matched?.title || `Add-on ${selected.id}`;
      return {
        id: selected.id,
        label,
        quantity: selected.quantity,
        total: unitPrice * selected.quantity,
        unitPrice,
        maxQuantity: selected.maxQuantity,
      };
    })
    .filter((row) => Boolean(row) && row.quantity > 0);

  const syncVoucherFromReservationSummary = useCallback(
    (summary: unknown, fallbackCode = "") => {
      const savingsAmount = getVoucherSavedSummary(summary);
      const primaryVoucher = getPrimaryVoucherFromSummary(summary);
      const code =
        (primaryVoucher?.voucherCode ?? "").trim() ||
        fallbackCode.trim() ||
        bookingCtx.voucherState.voucherCode.trim();

      if (savingsAmount > 0 && code) {
        setDiscount(savingsAmount);
        setPromoCode(code);
        setPromoApplied(true);
        setIsVoucherApplied(true);
        bookingCtx.setVoucherState({
          voucherCode: code,
          isVoucherApplied: true,
          discountAmount: savingsAmount,
        });
        return true;
      }

      if (!code) {
        setDiscount(0);
        setPromoApplied(false);
        setIsVoucherApplied(false);
        bookingCtx.setVoucherState({
          voucherCode: "",
          isVoucherApplied: false,
          discountAmount: 0,
        });
      }
      return false;
    },
    [bookingCtx],
  );

  useEffect(() => {
    const summary = bookingCtx.reservationSummary;
    if (!summary) return;
    const savingsAmount = getVoucherSavedSummary(summary);
    if (savingsAmount <= 0) return;
    const code =
      getPrimaryVoucherFromSummary(summary)?.voucherCode?.trim() ||
      bookingCtx.voucherState.voucherCode.trim() ||
      promoCode.trim();
    if (!code) return;
    const alreadySynced =
      bookingCtx.voucherState.isVoucherApplied &&
      Math.abs((bookingCtx.voucherState.discountAmount ?? 0) - savingsAmount) < 0.01 &&
      bookingCtx.voucherState.voucherCode.trim() === code;
    if (alreadySynced) return;
    syncVoucherFromReservationSummary(summary, code);
  }, [
    bookingCtx.reservationSummary,
    bookingCtx.voucherState.discountAmount,
    bookingCtx.voucherState.isVoucherApplied,
    bookingCtx.voucherState.voucherCode,
    promoCode,
    syncVoucherFromReservationSummary,
  ]);

  const removeVoucherViaReservation = async () => {
    const seats = bookingCtx.selectedSeatsData;
    if (!Array.isArray(seats) || seats.length === 0) {
      toast.error("Please select seats first.");
      return;
    }

    setPromoSubmitting(true);
    try {
      const scheduleId = bookingCtx.selectedScheduleId;
      if (scheduleId == null || scheduleId <= 0) {
        toast.error("Could not determine showtime (schedule). Go back and pick a date and time.");
        return;
      }
      const productId = Number(bookingCtx.details?.id);
      if (!Number.isFinite(productId) || productId <= 0) {
        throw new Error("Event product is missing. Please refresh the page.");
      }

      const selectedAddonPayload = (bookingCtx.selectedAddons ?? [])
        .filter((a) => a.quantity > 0)
        .map((a) => {
          const unitPrice = Number.parseFloat(String(a.price ?? ""));
          return {
            id: Number(a.id),
            quantity: a.quantity,
            ...(Number.isFinite(unitPrice) ? { price: unitPrice } : {}),
          };
        });

      let items: Array<Record<string, unknown>> = [];
      if (isVisitOperaBooking) {
        items = getReservationItemsFromVisitTickets({
          schedules: bookingCtx.details?.schedules as unknown[],
          visitTickets: bookingCtx.visitTickets,
          fallbackProductId: productId,
          fallbackScheduleId: scheduleId,
          selectedAddons: selectedAddonPayload,
        });
      } else {
        items = buildEventReservationItemsFromSeats({
          productId,
          scheduleId: scheduleId ?? 0,
          schedules: (bookingCtx.details?.schedules ?? []) as unknown[],
          seats,
        }).map((item) => ({
          ...item,
          ...(selectedAddonPayload.length > 0 ? { addons: selectedAddonPayload } : {}),
        }));
      }

      const c = bookingCtx.customer;
      const customer_name =
        [c.firstName, c.lastName].filter(Boolean).join(" ").trim() || "Guest";
      const email = (c.email || "").trim() || "guest@example.com";
      const phone = (c.mobile || "").trim() || "-";

      const payload: Record<string, unknown> = {
        ...(String(bookingCtx.reservationId).trim().length > 0
          ? { reservation_id: bookingCtx.reservationId }
          : {}),
        external_user_id: user?.emmarId ?? "",
        customer_name,
        email,
        phone,
        items,
        voucher: {
          voucher_code: "",
          card_number: "",
        },
        ...(bookingCtx.isSeatBookingEnabled
          ? {
            selected_seats: cloneSeatsForReservationPayload(seats, {
              productId,
              scheduleId,
            }),
          }
          : {}),
      };

      const data = await postExternalEventReservation(payload);
      const rid = data?.reservation_id;
      if (String(rid).trim().length > 0) {
        bookingCtx.setReservationId(String(rid));
      }
      const mergedSummary = mergedUpdatedSummary(data?.summary, data);
      bookingCtx.setReservationSummary(mergedSummary as any);
      setDiscount(0);
      setPromoApplied(false);
      setIsVoucherApplied(false);
      setPromoCode("");
      bookingCtx.setVoucherState({ voucherCode: "", isVoucherApplied: false, discountAmount: 0 });
      toast.success("Voucher removed.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not remove voucher.";
      toast.error(msg);
    } finally {
      setPromoSubmitting(false);
    }
  };

  const getEffectiveSeatPrice = (seat: any) => {
    const originalPrice = Number(seat?.original_price);
    const hasOriginalPrice = Number.isFinite(originalPrice) && originalPrice >= 0;
    const currentSeatPrice = Number(seat?.seat_price ?? seat?.actual_price ?? 0) || 0;
    if (!bookingCtx.voucherState.isVoucherApplied && hasOriginalPrice) {
      return originalPrice;
    }
    return currentSeatPrice;
  };
  /* ───────── Seat Ticket Rows ───────── */
  const groupedSeats = useMemo(() => {
    const groups: Record<string, { seatType: string; color: string; seats: any[]; totalPrice: number; order: number }> = {};

    bookingCtx.selectedSeatsData.forEach((seat) => {

      // API uses sst_seat_type for the category name (e.g., Platinum, General)
      const seatType = seat.seat_class || seat.sst_seat_type || "Standard";

      if (!groups[seatType]) {
        // Resolve color: sst_seat_color_code from API > meta data > fallback gray
        const resolvedColor =
          seat?.sst_seat_color_code ||
          seat?.seat_color_code ||
          seat?.sst_color_code ||
          seat?.sl_meta_data?.color ||
          seat?.sl_meta_data?.sst_seat_color_code ||
          seat?.color ||
          "#808080";

        groups[seatType] = {
          seatType,
          color: resolvedColor,
          seats: [],
          totalPrice: 0,
          order: Number(seat?.sst_order) || 999
        };
      }
      groups[seatType].seats.push(seat);
      groups[seatType].totalPrice += getEffectiveSeatPrice(seat);
    });

    return Object.values(groups).sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.seatType.localeCompare(b.seatType);
    });
  }, [bookingCtx.selectedSeatsData, bookingCtx.voucherState.isVoucherApplied]);


  const selectedSeatsSection = (
    <div className="space-y-4 mb-8">
      {groupedSeats.map((group) => {
        const labels = group.seats.map((s) => s.sl_seat_name || s.label).join(", ");
        const price = `AED ${group.totalPrice.toLocaleString()}.00`;

        return (
          <div
            key={group.seatType}
            className="group flex items-center justify-between gap-4 rounded-[12px] border border-white/15 bg-white/2 p-4 transition-all hover:bg-white/5"
          >
            <div className="flex items-center gap-2">

              <div
                className="w-3.5 h-3.5 rounded-full shrink-0"
                style={{ backgroundColor: group.color }}
              />
              <p className="font-montserrat text-[16px] leading-[100%] font-medium">
                {group.seats.length} x {group.seatType}
              </p>

            </div>
            <div className="flex items-center gap-4 text-right">
              <div >

                <p className="font-montserrat text-[13px] leading-[19px] font-medium text-white">
                  {labels}
                </p>

                <div>
                  <p className="font-montserrat text-[16px] leading-[23px] font-semibold">{price}</p>
                </div>
              </div>


              {/* {pathname.includes('/seats') && (
                <button
                  type="button"
                  onClick={() => handleRemoveCategory(group.seatType)}
                  className="h-8 w-8 flex items-center justify-center rounded-full border border-white text-white hover:bg-[#8B1D21] hover:text-white transition-all  cursor-pointer"
                >
                  <X size={18} />
                </button>
              )} */}
            </div>
          </div>
        );
      })}
    </div>
  );

  const studioSeatCounterSection = useMemo(() => {
    if (!isStudioTicket) return null;
    if (!groupedSeats.length) return null;

    return (
      <div className="space-y-3 mb-4">
        {groupedSeats.map((group) => (
          <div
            key={group.seatType}
            className="rounded-[12px] border border-white/15 bg-white/2 px-4 py-3 transition-colors hover:bg-white/5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <p className="font-montserrat text-[14px] font-medium text-white lg:text-[16px]">
                  {group.seatType}
                </p>
              </div>
              <div className="inline-flex items-center overflow-hidden rounded-[6px] border border-white/20 h-8 opacity-70">
                <button
                  type="button"
                  disabled
                  className="flex h-full w-8 items-center justify-center border-r border-white/20 text-white/70 cursor-not-allowed"
                  aria-label="Decrease studio ticket quantity"
                >
                  <Minus size={12} />
                </button>
                <span className="w-8 text-center font-montserrat text-[12px] text-white">
                  {group.seats.length}
                </span>
                <button
                  type="button"
                  disabled
                  className="flex h-full w-8 items-center justify-center border-l border-white/20 text-white/70 cursor-not-allowed"
                  aria-label="Increase studio ticket quantity"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
            <p className="mt-1 font-montserrat text-[13px] text-white/80">
              AED {formatAedAmount(group.totalPrice)}
            </p>
          </div>
        ))}
      </div>
    );
  }, [groupedSeats, isStudioTicket]);

  const visitTicketsSection = useMemo(() => {
    const visitTickets = bookingCtx.visitTickets;
    const rows = Object.entries(visitTickets)
      .map(([id, qty]) => ({
        id,
        label: visitTicketDisplayLabel(id),
        qty: Number(qty ?? 0),
        unitPrice: Number(visitTicketUnitPrices[id] ?? NaN),
      }))
      .filter((row) => row.qty > 0);

    if (!rows.length) {
      return null;
    }

    return (
      <div className="space-y-3 mb-4">
        {rows.map((row) => (
          <div key={row.id} className="flex flex-col gap-1 rounded-[12px] border border-white/15 bg-white/2 px-4 py-3 transition-colors hover:bg-white/5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-montserrat font-medium text-[14px] lg:text-[16px] text-white">
                  {row.label}
                </p>
                {Number.isFinite(row.unitPrice) ? (
                  <p className="font-montserrat text-[12px] text-white">
                    {visitTicketCurrencyCode} {formatAedAmount(row.unitPrice * row.qty)}
                  </p>
                ) : null}
              </div>
              {isVisitOperaBooking ? (
                <div className="inline-flex items-center overflow-hidden rounded-[6px] border border-white/20 h-8">
                  {pathname.includes('/addons') && (
                    <button
                      type="button"
                      onClick={() => onVisitTicketDecrease?.(row.id)}
                      className="flex h-full w-8 items-center justify-center border-r border-white/20 text-white hover:bg-white/10"
                    >
                      <Minus size={12} />
                    </button>
                  )}
                  <span className="w-8 text-center font-montserrat text-[12px] text-white">{row.qty}</span>
                  {pathname.includes('/addons') && (
                    <button
                      type="button"
                      onClick={() => onVisitTicketIncrease?.(row.id)}
                      className="flex h-full w-8 items-center justify-center border-l border-white/20 text-white hover:bg-white/10"
                    >
                      <Plus size={12} />
                    </button>
                  )}
                </div>
              ) : (
                <span className="font-montserrat text-[12px] text-white/80">{row.qty} x</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }, [
    bookingCtx.visitTickets,
    isVisitOperaBooking,
    onVisitTicketDecrease,
    onVisitTicketIncrease,
    visitTicketCurrencyCode,
    visitTicketUnitPrices,
  ]);

  /* ───────── Pricing Summary ───────── */
  const pricingSummarySection = (
    <div className="space-y-5 border-t border-white/10 pt-6">
      {showCourierShipping ? (
        <div className="flex items-center justify-between">
          <p className="font-montserrat text-[16px] text-white/80">Shipping</p>
          <p className="font-montserrat text-[16px] font-semibold">AED {formatAedAmount(courierAmount)}</p>
        </div>
      ) : null}
      <div className="flex items-center justify-between">
        <p className="font-montserrat text-[18px] font-semibold">Subtotal</p>
        <p className="font-montserrat text-[18px] font-semibold">AED {formatAedAmount(displaySubtotal)}</p>
      </div>

      {/* Promo Code */}
      <div className="space-y-3">
        <p className="font-montserrat text-[14px] font-medium text-white/80">Have a promo Code?</p>
        <div className="flex gap-3">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="Enter your Code"
            disabled={voucherApplied || promoSubmitting}
            className="h-12 placeholder:capitalize uppercase flex-1 rounded-[10px] bg-[#1a1a1a] border border-white/15 px-4 font-montserrat text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => {
              if (voucherApplied) {
                void removeVoucherViaReservation();
                return;
              }
              void handleNextStep(true);
            }}
            disabled={promoSubmitting || (!voucherApplied && !promoCode.trim())}
            className="h-12 px-5 rounded-[10px] bg-[#8B1D21] hover:bg-[#a12328] text-white font-montserrat font-bold text-[15px] transition-colors cursor-pointer disabled:opacity-50"
          >
            {promoSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : voucherApplied ? "Remove" : "Apply"}
          </button>
        </div>
        {voucherApplied && promoSavings > 0 ? (
          <div className="rounded-[10px] border border-green-400/30 bg-green-400/10 px-4 py-3 space-y-1">
            <p className="font-montserrat text-[13px] text-green-300">
              {appliedVoucherLabel ? `Promo applied: ${appliedVoucherLabel}` : "Promo applied"}
            </p>
            <p className="font-montserrat text-[15px] font-semibold text-green-400">
              You save AED {formatAedAmount(promoSavings)}
            </p>
          </div>
        ) : null}
      </div>

      <div className="pt-2 space-y-4">
        {voucherApplied && promoSavings > 0 ? (
          <div className="flex items-center justify-between">
            <p className="font-montserrat text-[16px] text-green-400">Discount</p>
            <p className="font-montserrat text-[16px] text-green-400">- AED {formatAedAmount(promoSavings)}</p>
          </div>
        ) : null}
        {giftCardDiscount > 0 ? (
          <div className="flex items-center justify-between">
            <p className="font-montserrat text-[16px] text-green-400">Gift Card Discount</p>
            <p className="font-montserrat text-[16px] text-green-400">- AED {formatAedAmount(giftCardDiscount)}</p>
          </div>
        ) : null}
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <p className="font-montserrat text-[22px] font-bold">Total Payment</p>
          <p className="font-montserrat text-[18px] font-semibold">AED {formatAedAmount(displayGrandTotal)}</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="font-montserrat text-[15px] text-white/50">VAT (Included)</p>
          <p className="font-montserrat text-[15px] text-white/50">AED {formatAedAmount(displayVat)}</p>
        </div>
      </div>
    </div>
  );

  // new mobile and tablet summary card

  const formatMobileTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const mobileSummaryEventImgSrc =
    bookingCtx.details?.thumbnail_url || bookingCtx.details?.media_url;

  const mobileviewSummaryCard = (
    <div className="max-h-[70vh] overflow-y-auto px-5 pb-4 pt-3">
      <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
      <h2 className="mb-5 text-left font-montserrat text-[22px] font-semibold text-white">
        Summary
      </h2>

      {!hideSummaryHeader && bookingCtx.details?.name ? (
        <div className="mb-4 flex items-center gap-3">
          <div className="relative h-[58px] w-[70px] shrink-0 overflow-hidden rounded-[8px]">
            <Image
              src={mobileSummaryEventImgSrc ? imageUrl(mobileSummaryEventImgSrc) : "/images/fallback.png"}
              alt={bookingCtx.details.name}
              fill
              sizes="70px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate font-montserrat text-[18px] font-semibold leading-[23px] text-white">
              {bookingCtx.details.name}
            </p>
            {summaryDateTime ? (
              <p className="mt-1 font-montserrat text-[14px] leading-[16px] text-white/80">
                {summaryDateTime}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {hasSelection
        ? isStudioTicket
          ? studioSeatCounterSection
          : visitTicketsSection || selectedSeatsSection
        : null}

      {selectedAddonRows.length ? (
        <div className="mb-4 space-y-3">
          {selectedAddonRows.map((row) => (
            <div
              key={row.id}
              className="flex flex-col gap-1 rounded-[12px] border border-white/15 bg-white/2 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-montserrat w-[180px] font-medium text-[14px] text-white">
                  {row.label}
                </p>
                <div className="inline-flex h-8 items-center overflow-hidden rounded-[6px] border border-white/20">
                  {pathname.includes("/addons") && (
                    <button
                      type="button"
                      disabled={!pathname.includes("/addons")}
                      onClick={() => handleDecreaseAddon(row.id)}
                      className="flex h-full w-8 items-center justify-center border-r border-white/20 text-white hover:bg-white/10"
                    >
                      <Minus size={12} />
                    </button>
                  )}
                  <span className="w-8 text-center font-montserrat text-[12px] text-white">
                    {row.quantity}
                  </span>
                  {pathname.includes("/addons") && (
                    <button
                      type="button"
                      disabled={
                        !pathname.includes("/addons") ||
                        (row.maxQuantity != null && row.quantity >= row.maxQuantity)
                      }
                      onClick={() => handleIncreaseAddon(row.id)}
                      className="flex h-full w-8 items-center justify-center border-l border-white/20 text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus size={12} />
                    </button>
                  )}
                </div>
              </div>
              <p className="font-montserrat text-[13px] text-white/70">
                AED {row.total.toLocaleString()}.00
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {pricingSummarySection}
    </div>
  );

  const mobileFixedActionBar = hasSelection ? (
    <>
      {mobileSummaryOpen ? (
        <>
          <button
            type="button"
            aria-label="Close summary"
            className="lg:hidden fixed inset-0 z-99 bg-black/60"
            onClick={() => setMobileSummaryOpen(false)}
          />
          <div className="lg:hidden fixed bottom-[76px] left-0 right-0 z-100 rounded-t-[20px] border border-white/10 bg-surface shadow-2xl">
            {mobileviewSummaryCard}
          </div>
        </>
      ) : null}

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-101 border-t border-white/10 bg-[#1a1b1f] px-4 py-3">
        <div className="flex items-end justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <button
              type="button"
              onClick={() => setMobileSummaryOpen((open) => !open)}
              aria-expanded={mobileSummaryOpen}
              className="inline-flex cursor-pointer items-center gap-1 font-montserrat text-[15px] font-semibold leading-none text-white"
            >
              Summary
              {mobileSummaryOpen ? (
                <ChevronUp className="h-4 w-4 shrink-0" aria-hidden />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
              )}
            </button>
            {timerExpiry ? (
              <div className="flex items-center gap-2">
                <span className="font-montserrat text-[12px] text-white/50">Time Remaining</span>
                <span
                  className={`rounded-[8px] px-3 py-1 font-montserrat text-[13px] font-semibold leading-none ${
                    remainingSeconds <= 60
                      ? "bg-[#FB2C362E] text-[#ef4444]"
                      : "bg-[#6BCF8C2E] text-[#6BCF8C]"
                  }`}
                >
                  {formatMobileTimer(remainingSeconds)}
                </span>
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="font-montserrat text-[18px] font-bold leading-none text-white">
              AED {formatAedAmount(displayGrandTotal)}
            </span>
            <button
              type="button"
              onClick={() => handleNextStep()}
              disabled={isAddonsMode ? false : !canProceedToAddons || reservationSubmitting}
              className="min-w-[88px] rounded-[10px] bg-[#792327] px-5 py-2.5 font-montserrat text-[15px] font-semibold leading-none text-white transition-colors hover:bg-[#8f2a2f] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {reservationSubmitting ? "…" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </>
  ) : null;

  /* ═══════════════════════ ADDONS MODE ═══════════════════════ */
  if (isAddonsMode) {
    const imgSrc = bookingCtx.details?.thumbnail_url || bookingCtx.details?.media_url;
    const addonsPanelInner = (
      <>
        {!hideSummaryHeader && bookingCtx.details?.name ? (
          <div className="mb-4 flex items-center gap-3">
            <div className="relative h-[58px] w-[70px] shrink-0 overflow-hidden rounded-[8px]">
              <Image
                src={imgSrc ? imageUrl(imgSrc) : "/images/fallback.png"}
                alt={bookingCtx.details?.name}
                fill
                sizes="50vw"
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="font-montserrat font-semibold text-[20px] leading-[23px] text-white truncate">{bookingCtx.details?.name}</p>
              {summaryDateTime ? (
                <p className="mt-1 font-montserrat text-[14px] leading-[16px] text-white">{summaryDateTime}</p>
              ) : null}
            </div>
          </div>
        ) : null}

        {isStudioTicket
          ? studioSeatCounterSection
          : (visitTicketsSection || selectedSeatsSection)}

        {selectedAddonRows.length ? (
          <div className="space-y-3 mb-4">
            {selectedAddonRows.map((row) => (
              <div key={row.id} className="flex flex-col gap-1 rounded-[12px] border border-white/15 bg-white/2 px-4 py-3 transition-colors hover:bg-white/5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-montserrat w-[180px] font-medium text-[14px] lg:text-[16px] text-white">
                    {row.label}
                  </p>
                  <div className="inline-flex  items-center overflow-hidden rounded-[6px] border border-white/20 h-8">
                    {pathname.includes('/addons') && (
                      <button
                        type="button"
                        disabled={!pathname.includes('/addons')}
                        onClick={() => handleDecreaseAddon(row.id)}
                        className="flex h-full w-8 items-center justify-center border-r border-white/20 text-white hover:bg-white/10"
                      >
                        <Minus size={12} />
                      </button>
                    )}
                    <span className="w-8 text-center font-montserrat text-[12px] text-white">{row.quantity}</span>
                    {pathname.includes('/addons') && (
                      <button
                        type="button"
                        disabled={
                          !pathname.includes('/addons') ||
                          (row.maxQuantity != null && row.quantity >= row.maxQuantity)
                        }
                        onClick={() => handleIncreaseAddon(row.id)}
                        className="flex h-full w-8 items-center justify-center border-l border-white/20 text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Plus size={12} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="font-montserrat text-[13px] lg:text-[15px] text-white/70">
                  AED {row.total.toLocaleString()}.00
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {pricingSummarySection}

        <button
          type="submit"
          onClick={()=>handleNextStep()}
          disabled={reservationSubmitting}
          className="hidden lg:block w-full h-14 rounded-[12px] bg-[#8B1D21] hover:bg-[#a12328] text-white font-montserrat font-bold text-[18px] transition-all active:scale-[0.98] cursor-pointer mt-4 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {reservationSubmitting ? "Loading…" : bookinglabelButton}
        </button>

        <div className="text-center pt-4">
          <p className="font-montserrat text-[13px] text-white/40">Tickets are non-refundable.</p>
          <p className="font-montserrat text-[13px] text-white/40">
            See our <span className="text-[#BB2B32] hover:underline cursor-pointer">cancellation policy</span> for details.
          </p>
        </div>
      </>
    );

    return (
      <>
        {showDesktopTimer && !isSeatsPage ? (
          <div className={`hidden lg:flex items-center justify-end gap-2 mb-4 `}>
            <BookingTimer remainingSeconds={remainingSeconds} totalSeconds={timerTotalSeconds ?? FALLBACK_TIMER_SECONDS} />
          </div>
        ) : <> <div className="h-14"></div></>}

       <aside className="hidden lg:block w-full rounded-[20px] bg-surface p-6 text-white border border-white/10">
<h2 className="font-montserrat font-semibold text-[22px] leading-[1.2] mb-6">Summary</h2>
{addonsPanelInner} 
</aside>
        {mobileFixedActionBar}
      </>
    );
  }

  /* ═══════════════════════ SEATS MODE ═══════════════════════ */
  const panelInner = (
    <>
      {/* Date Section */}
      <div className="space-y-2 mb-6">
        <p className="font-montserrat text-[14px] text-white/50">Selected Event Date</p>
        <div className="relative">
          <CalendarPicker
            trigger="field"
            datePlaceholder="--/--/----"
            mode="single"
            selected={selectedDate}
            onChange={(date) => {
              setSelectedDate(date);
              setSelectedTimeSlot(null);
              if (date) {
                const isoDate = toLocalISODate(date);
                bookingCtx.setSelectedDate(isoDate);
                // Clear schedule/time because available showtimes depend on date.
                bookingCtx.setSelectedScheduleId(null);
                bookingCtx.setSelectedTime(null);
                bookingCtx.setSeatSelection({
                  selectedSeatCategoryIds: [],
                  selectedSeatLabels: "",
                  seatQuantity: 0,
                  seatSubtotal: 0,
                  selectedSeatsData: [],
                });

                // URL drives which schedule is loaded on the seats page.
                // When date changes, pick the first schedule for that date and set `sid`.
                const next = new URLSearchParams(searchParams.toString());
                next.set("date", isoDate);

                const sid = firstScheduleIdForISODate(rawSchedules ?? [], isoDate);
                if (sid != null) {
                  next.set("sid", String(sid));
                  bookingCtx.setSelectedScheduleId(sid);
                  const row = (rawSchedules ?? []).find(
                    (s) => Number((s as any)?.schedule_id) === Number(sid),
                  ) as any;
                  const derived = showDisplayTime(scheduleStartToDisplaySlot(row?.time_slot));
                  if (derived) {
                    bookingCtx.setSelectedTime(derived);
                    setSelectedTimeSlot(derived);
                  }
                } else {
                  next.delete("sid");
                }
                replaceQuery(next);
              } else {
                bookingCtx.setSelectedDate(null);
                bookingCtx.setSelectedScheduleId(null);
                bookingCtx.setSelectedTime(null);
                bookingCtx.setSeatSelection({
                  selectedSeatCategoryIds: [],
                  selectedSeatLabels: "",
                  seatQuantity: 0,
                  seatSubtotal: 0,
                  selectedSeatsData: [],
                });

                const next = new URLSearchParams(searchParams.toString());
                next.delete("date");
                next.delete("sid");
                replaceQuery(next);
              }
            }}
            minDate={validateSelectDates}
            maxDate={maxDate}
            allowedDates={upcomingAllowedDateObjects}
            buttonClassName="h-14 w-full rounded-[10px] bg-[#222222] border border-white/5 px-4 flex items-center justify-between gap-3 cursor-pointer font-montserrat text-[16px] text-white hover:bg-white/5 transition-colors"
          />
        </div>
      </div>

      {/* Time Slot Selection */}
      {selectedDate && effectiveTimeSlots.length ? (
        <div className="mb-6">
          <p className="font-montserrat text-[14px] text-white/50 mb-2">Select Timeslot</p>
          <div className="flex lg:flex-wrap items-center gap-3 overflow-auto whitespace-nowrap">
            {effectiveTimeSlots.map((slot) => {
              const active = slot === (selectedTimeSlot ?? bookingCtx.selectedTime ?? null);
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => {
                    setSelectedTimeSlot(slot);
                    if (selectedDate) {
                      const sid = findScheduleId(selectedDate, slot);
                      if (sid != null) {
                        bookingCtx.setSelectedScheduleId(sid);
                        bookingCtx.setSelectedTime(slot);
                        bookingCtx.setSeatSelection({
                          selectedSeatCategoryIds: [],
                          selectedSeatLabels: "",
                          seatQuantity: 0,
                          seatSubtotal: 0,
                          selectedSeatsData: [],
                        });

                        // Persist in URL so refreshing / sharing stays on the same showtime.
                        const next = new URLSearchParams(searchParams.toString());
                        next.set("date", toLocalISODate(selectedDate));
                        next.set("sid", String(sid));
                        replaceQuery(next);
                      }
                    }
                  }}
                  className={`px-4 py-2 cursor-pointer rounded-full text-white font-montserrat text-[14px] transition-colors ${active
                    ? "bg-primary-light border border-transparent"
                    : "border border-white/15 bg-[#1E1E1E] hover:bg-white/5"
                    }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Selected Seats / Tickets */}
      {hasSelection ? (isStudioTicket ? studioSeatCounterSection : (visitTicketsSection || selectedSeatsSection)) :
        <div className="text-center pt-4">
          <p className="font-montserrat text-[15px] leading-[100%] text-white">
            {isVisitOperaBooking ? "Please select ticket to proceed" : "Please select seat to proceed"}
          </p>
        </div>}

      {/* Pricing + CTA */}
      {hasSelection ? (
        <>
          {pricingSummarySection}

          <button
            type="button"
            onClick={()=>handleNextStep()}
            disabled={!canProceedToAddons || reservationSubmitting}
            className="hidden lg:block w-full h-14 rounded-[12px] bg-[#8B1D21] hover:bg-[#a12328] text-white font-montserrat font-bold text-[18px] shadow-lg transition-all active:scale-[0.98] cursor-pointer mt-4 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {reservationSubmitting ? "Loading…" : bookinglabelButton}
          </button>

          <div className="text-center pt-4">
            <p className="font-montserrat text-[13px] text-white/40">
              Tickets are non-refundable.
            </p>
            <p className="font-montserrat text-[13px] text-white/40">
              See our{" "}
              {/* <span className="text-[#BB2B32]"> */}
                Terms and Conditions {" "}
              {/* </span>{" "} */}
              for details.
            </p>
          </div>
        </>
      ) : null}
    </>
  );


  return (
    <>
      {timerExpiry && showDesktopTimer ? (
        <div className="flex items-center justify-end gap-2 mb-4">
          <BookingTimer remainingSeconds={remainingSeconds} totalSeconds={timerTotalSeconds ?? FALLBACK_TIMER_SECONDS} />
        </div>
      ) : <div className="h-14"></div>}

      <aside className="hidden lg:blockw-full rounded-[20px] bg-surface p-6 text-white border border-white/10">
        <h2 className="font-montserrat font-semibold text-[22px] leading-[1.2] mb-6">Choose Your Seat</h2>
        {panelInner}
      </aside>

      {mobileFixedActionBar}

      <DateRangeModal
        isOpen={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
        selectedDate={selectedDate}
        selectedTimeSlot={selectedTimeSlot}
        onConfirmSelection={({ date, timeSlot }) => {
          setSelectedDate(date);
          setSelectedTimeSlot(timeSlot);
          const next = new URLSearchParams(searchParams.toString());
          if (date) {
            const iso = toLocalISODate(date);
            bookingCtx.setSelectedDate(iso);
            next.set("date", iso);
          }
          if (timeSlot && date) {
            const sid = findScheduleId(date, timeSlot);
            if (sid != null) {
              bookingCtx.setSelectedScheduleId(sid);
              bookingCtx.setSelectedTime(timeSlot);
              next.set("sid", String(sid));
            } else {
              next.delete("sid");
            }
          } else {
            next.delete("sid");
          }
          replaceQuery(next);
          setIsDateModalOpen(false);
        }}
        priceFrom={activeCategory?.price ?? "AED 0"}
        timeSlots={effectiveTimeSlots}
        minDate={validateSelectDates}
        maxDate={maxDate}
      />
    </>
  );
}
