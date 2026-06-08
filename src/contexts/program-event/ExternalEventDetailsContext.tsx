"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type MutableRefObject,
} from "react";
import type { ExternalEventDetails, ExternalEventSchedule } from "@/services/eventServer";
import { getExternalEventBookingIdsStorageKey } from "../program-booking/bookingStorage";
import { getExternalEventReservationbyId } from "@/services/externalEventReservationClient";
import { resolveReservationSummary } from "@/components/programs/bookingSeatReservationUtils";

/* ────────────────────────────────────────────────────────── */
/*  Shared types                                              */
/* ────────────────────────────────────────────────────────── */

export type SelectedAddonDetail = {
  id: string;
  quantity: number;
  label: string;
  price: string;
  maxQuantity?: number;
};

export type CustomerDetails = {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  country: string;
  city: string;
  nationality: string;
  dateOfBirth: string;
  gender: string;
  acceptedTerms: boolean;
  receiveCourier: boolean;
};

export type PaymentDetails = {
  cardNumber: string;
  cardholderName: string;
  expiryDate: string;
  cvv: string;
  saveCard: boolean;
};

export type ShippingDetails = {
  receiveCourier: boolean;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  streetAddress: string;
  city: string;
  emirate: string;
  postalCode: string;
  saveAddress: boolean;
};

export type ReservationSummary = {
  sub_total?: number | string;
  taxes?: Array<{ tax_amount?: number | string }>;
  discounts?: Array<{
    discount_amount?: number | string;
    amount?: number | string;
    voucher_code?: string;
    voucher_name?: string;
  }>;
  grand_total?: number | string;
  show_courier_addon?: boolean;
  courier_price?: number;
};

export type VoucherState = {
  voucherCode: string;
  isVoucherApplied: boolean;
  discountAmount: number;
};

export type VisitTickets = Record<string, number>;

/** `selectedDate` is local calendar date as `YYYY-MM-DD`, or `null`. */
export type ExternalEventBookingSelection = {
  selectedDate: string | null;
  selectedTime: string | null;
  selectedScheduleId: number | null;
};

/* ────────────────────────────────────────────────────────── */
/*  Defaults                                                   */
/* ────────────────────────────────────────────────────────── */

const defaultCustomer: CustomerDetails = {
  firstName: "",
  lastName: "",
  email: "",
  mobile: "",
  country: "",
  city: "",
  nationality: "",
  dateOfBirth: "",
  gender: "",
  acceptedTerms: false,
  receiveCourier: false,
};

const defaultPayment: PaymentDetails = {
  cardNumber: "",
  cardholderName: "",
  expiryDate: "",
  cvv: "",
  saveCard: false,
};

const defaultShipping: ShippingDetails = {
  receiveCourier: false,
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  streetAddress: "",
  city: "",
  emirate: "",
  postalCode: "",
  saveAddress: false,
};

/* ────────────────────────────────────────────────────────── */
/*  Context value shape                                        */
/* ────────────────────────────────────────────────────────── */

type ExternalEventDetailsContextValue = {
  details: ExternalEventDetails;
  isBookingState: boolean;

  /* Schedule selection */
  selectedDate: string | null;
  selectedTime: string | null;
  selectedScheduleId: number | null;
  setSelectedDate: (date: string | null) => void;
  setSelectedTime: (time: string | null) => void;
  setSelectedScheduleId: (scheduleId: number | null) => void;

  /* Derived schedule data (persisted across booking flow) */
  timeSlots: string[];
  setTimeSlots: (slots: string[]) => void;
  allowedDates: string[];
  setAllowedDates: (dates: string[]) => void;

  /* Addons */
  selectedAddons: SelectedAddonDetail[];
  setSelectedAddons: (addons: SelectedAddonDetail[]) => void;

  /* Customer */
  customer: CustomerDetails;
  setCustomer: (patch: Partial<CustomerDetails>) => void;

  /* Shipping */
  shipping: ShippingDetails;
  setShipping: (patch: Partial<ShippingDetails>) => void;

  /* Payment */
  paymentMethod: "visa" | "applePay" | "googlePay";
  setPaymentMethod: (method: "visa" | "applePay" | "googlePay") => void;
  paymentDetails: PaymentDetails;
  setPaymentDetails: (patch: Partial<PaymentDetails>) => void;

  /* Form Validations */
  requestCheckoutSubmit: MutableRefObject<(() => any) | null>;
  requestPaymentSubmit: MutableRefObject<(() => any) | null>;

  /* Timer */
  timerExpiry: number | null;
  setTimerExpiry: (expiry: number | null) => void;
  timerTotalSeconds: number | null;
  setTimerTotalSeconds: (seconds: number | null) => void;

  /* Visit tickets */
  visitTickets: VisitTickets;
  setVisitTickets: (patch: Partial<VisitTickets>) => void;

  /* Seats */
  seatQuantity: number;
  seatSubtotal: number;
  selectedSeatLabels: string;
  selectedSeatCategoryIds: string[];
  selectedSeatsData: any[];
  setSeatSelection: (selection: {
    seatQuantity: number;
    seatSubtotal: number;
    selectedSeatLabels: string;
    selectedSeatCategoryIds: string[];
    selectedSeatsData: any[];
  }) => void;

  /** Set after `POST /external/events/reservation` so later steps can upsert the same cart. */
  reservationId: string | null;
  setReservationId: (id: string | null) => void;
  reservationSummary: ReservationSummary | null;
  setReservationSummary: (summary: ReservationSummary | null) => void;
  voucherState: VoucherState;
  setVoucherState: (patch: Partial<VoucherState>) => void;
  recoverReservationById: (reservationId: string) => Promise<void>;
  isHydratingReservation: boolean;
};

const ExternalEventDetailsContext = createContext<ExternalEventDetailsContextValue | null>(null);
const defaultVoucherState: VoucherState = {
  voucherCode: "",
  isVoucherApplied: false,
  discountAmount: 0,
};

type PersistedBookingIds = {
  scheduleId: number | null;
  reservationId: string | null;
};

/* ────────────────────────────────────────────────────────── */
/*  Provider                                                   */
/* ────────────────────────────────────────────────────────── */

export function ExternalEventDetailsProvider({
  value: details,
  children,
}: {
  value: ExternalEventDetails;
  children: ReactNode;
}) {
  // Booking state flow:
  // 1) Persist only lightweight IDs (scheduleId + reservationId) in sessionStorage.
  // 2) Keep full booking state in memory while user navigates the flow.
  // 3) On refresh/direct revisit/state loss, recover full state from API via reservationId.
  const bookingIdsStorageKey = useMemo(() => {
    return getExternalEventBookingIdsStorageKey(details as { id?: unknown; slug?: unknown });
  }, [details]);
  const restoredIdsKeyRef = useRef<string | null>(null);
  /** Reservation id we already hydrated from GET — at most one fetch per id. */
  const recoveredReservationIdRef = useRef<string | null>(null);
  const preventDuplicateRequests = useRef<string | null>(null);
  const [isBookingState, setIsBookingState] = useState(false);

  /* ── Schedule ── */
  const [selectedDate, setSelectedDateState] = useState<string | null>(null);
  const [selectedTime, setSelectedTimeState] = useState<string | null>(null);
  const [selectedScheduleId, setSelectedScheduleIdState] = useState<number | null>(null);

  /* ── Derived schedule data (persisted across booking flow) ── */
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [allowedDates, setAllowedDates] = useState<string[]>([]);

  const setSelectedDate = useCallback((next: string | null) => {
    setSelectedDateState(next);
    setSelectedTimeState(null);
    setSelectedScheduleIdState(null);
  }, []);

  const setSelectedTime = useCallback((next: string | null) => {
    setSelectedTimeState(next);
  }, []);

  const setSelectedScheduleId = useCallback((next: number | null) => {
    setSelectedScheduleIdState(next);
  }, []);

  /* ── Addons ── */
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddonDetail[]>([]);

  /* ── Customer ── */
  const [customer, setCustomerState] = useState<CustomerDetails>(defaultCustomer);
  const setCustomer = useCallback(
    (patch: Partial<CustomerDetails>) => setCustomerState((prev) => ({ ...prev, ...patch })),
    [],
  );

  /* ── Shipping ── */
  const [shipping, setShippingState] = useState<ShippingDetails>(defaultShipping);
  const setShipping = useCallback(
    (patch: Partial<ShippingDetails>) => setShippingState((prev) => ({ ...prev, ...patch })),
    [],
  );

  /* ── Payment ── */
  const [paymentMethod, setPaymentMethod] = useState<"visa" | "applePay" | "googlePay">("visa");
  const [paymentDetails, setPaymentDetailsState] = useState<PaymentDetails>(defaultPayment);
  const setPaymentDetails = useCallback(
    (patch: Partial<PaymentDetails>) => setPaymentDetailsState((prev) => ({ ...prev, ...patch })),
    [],
  );

  /* ── Form Validations ── */
  /* ── Form Validations (using Refs for immediate access across page transitions) ── */
  const requestCheckoutSubmit = useRef<(() => void) | null>(null);
  const requestPaymentSubmit = useRef<(() => void) | null>(null);

  /* ── Timer ── */
  const [timerExpiry, setTimerExpiry] = useState<number | null>(null);
  const [timerTotalSeconds, setTimerTotalSeconds] = useState<number | null>(null);

  /* ── Visit tickets ── */
  const [visitTickets, setVisitTicketsState] = useState<VisitTickets>({
    adult: 0,
    kids: 0,
    albaDinner: 0,
    bisouDinner: 0,
  });
  const setVisitTickets = useCallback(
    (patch: Partial<VisitTickets>) =>
      setVisitTicketsState((prev) => {
        const normalizedPatch = Object.fromEntries(
          Object.entries(patch).map(([key, value]) => [key, Math.max(0, Number(value ?? 0))]),
        );
        return { ...prev, ...normalizedPatch };
      }),
    [],
  );

  /* ── Seats ── */
  const [seatQuantity, setSeatQuantity] = useState(0);
  const [seatSubtotal, setSeatSubtotal] = useState(0);
  const [selectedSeatLabels, setSelectedSeatLabels] = useState("");
  const [selectedSeatCategoryIds, setSelectedSeatCategoryIds] = useState<string[]>([]);
  const [selectedSeatsData, setSelectedSeatsData] = useState<any[]>([]);
  const [reservationId, setReservationIdState] = useState<string | null>(null);
  const [reservationSummary, setReservationSummary] = useState<ReservationSummary | null>(null);

  const setReservationId = useCallback((id: string | null) => {
    const next = String(id ?? "").trim();
    setReservationIdState(next.length > 0 ? next : null);
  }, []);

  useEffect(() => {
    recoveredReservationIdRef.current = null;
    preventDuplicateRequests.current = null;
  }, [reservationId]);
  const [isHydratingReservation, setIsHydratingReservation] = useState(false);
  const [voucherState, setVoucherStateRaw] = useState<VoucherState>(defaultVoucherState);
  const setVoucherState = useCallback(
    (patch: Partial<VoucherState>) =>
      setVoucherStateRaw((prev) => ({ ...prev, ...patch })),
    [],
  );

  const setSeatSelection = useCallback((selection: {
    seatQuantity: number;
    seatSubtotal: number;
    selectedSeatLabels: string;
    selectedSeatCategoryIds: string[];
    selectedSeatsData: any[];
  }) => {
    setSeatQuantity(selection.seatQuantity);
    setSeatSubtotal(selection.seatSubtotal);
    setSelectedSeatLabels(selection.selectedSeatLabels);
    setSelectedSeatCategoryIds(selection.selectedSeatCategoryIds);
    setSelectedSeatsData(selection.selectedSeatsData);
  }, []);

  const recoverReservationById = useCallback(async (id: string) => {
    const reservationKey = String(id).trim();
    if (reservationKey.length === 0) return;

    if (recoveredReservationIdRef.current === reservationKey) return;
    if (preventDuplicateRequests.current === reservationKey) return;

    preventDuplicateRequests.current = reservationKey;
    setIsHydratingReservation(true);
    try {
      const response = await getExternalEventReservationbyId(reservationKey);
      const data = (response as { data?: Record<string, unknown> } | null)?.data;
      if (!data || typeof data !== "object") return;

      const mergedSummary = resolveReservationSummary(data);
      if (mergedSummary) {
        setReservationSummary(mergedSummary as ReservationSummary);
      }

      const reservationItems = Array.isArray(data.reservation_items)
        ? (data.reservation_items as Array<Record<string, unknown>>)
        : [];
      const selectedSeats = Array.isArray(data.selected_seats)
        ? (data.selected_seats as Array<Record<string, unknown>>)
        : [];

      // Rebuild seat/ticket rows after refresh so summary panel can render reservation items.
      if (reservationItems.length > 0) {
        const selectedReservationItems = reservationItems.filter((item) => !Boolean(item.is_deleted));
        const addonsById = new Map<string, SelectedAddonDetail>();

        for (const item of selectedReservationItems) {
          const itemAddons = Array.isArray(item.selected_addons)
            ? (item.selected_addons as Array<Record<string, unknown>>)
            : [];
          for (const addon of itemAddons) {
            const id = String(addon.id ?? "").trim();
            const quantity = Number(addon.quantity ?? 0);
            if (!id || !Number.isFinite(quantity) || quantity <= 0) continue;

            const parsedPrice = Number.parseFloat(String(addon.price ?? "0"));
            const price = Number.isFinite(parsedPrice) ? String(parsedPrice) : "0";
            const label = String(addon.name ?? "").trim() || `Add-on ${id}`;
            const existing = addonsById.get(id);

            if (existing) {
              addonsById.set(id, { ...existing, quantity: existing.quantity + quantity });
            } else {
              addonsById.set(id, { id, quantity, price, label });
            }
          }
        }

        if (addonsById.size > 0) {
          setSelectedAddons(Array.from(addonsById.values()));
        }

        const seatRows = selectedReservationItems
          .map((item, index) => {
            console.log('item123', item);
            const price = Number(item.price ?? 0);
            const productId = Number(item.product_id ?? 0);
            const itemScheduleId = Number(item.schedule_id ?? 0);
            const row = String(item.seat_row_name ?? "").trim();
            const seatNumber = String(item.seat_number ?? "").trim();
            const label =
              (row && seatNumber ? `${row}${seatNumber}` : `Ticket ${index + 1}`);
            const ticketClass = item.ticket_class && typeof item.ticket_class === "object"
              ? (item.ticket_class as Record<string, unknown>)
              : null;
            const ticketType = item.ticket_type && typeof item.ticket_type === "object"
              ? (item.ticket_type as Record<string, unknown>)
              : null;
            const ticketClassId = Number(ticketClass?.id ?? 0);
            const ticketClassName = String(ticketClass?.name ?? "").trim() || "Standard";
            const ticketTypeId = Number(ticketType?.id ?? item.ticket_type_id ?? 0);
            const quantity = Number(item.quantity ?? 0);
            const matchedSeat = selectedSeats.find(
              (seat) =>
                String(seat.sl_seat_name ?? "").trim() === label
            );
            return {
              sl_seat_name: label,
              label,
              seat_row: row,
              seat_number: seatNumber,
              layout_seat_id: String((matchedSeat?.sl_meta_data as Record<string, unknown>)?.id ?? "").trim(),
              sst_seat_type: ticketClassName,
              screen_seat_type_id: Number.isFinite(ticketClassId) && ticketClassId > 0 ? ticketClassId : 0,
              product_id: Number.isFinite(productId) && productId > 0 ? productId : 0,
              schedule_id: Number.isFinite(itemScheduleId) && itemScheduleId > 0 ? itemScheduleId : 0,
              ticket_class_id: Number.isFinite(ticketClassId) && ticketClassId > 0 ? ticketClassId : 0,
              ticket_type_id: Number.isFinite(ticketTypeId) && ticketTypeId > 0 ? ticketTypeId : 0,
              quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
              seat_price: Number.isFinite(price) ? price : 0,
              actual_price: Number.isFinite(price) ? price : 0,
            };
          })
          .filter(Boolean);

        if (seatRows.length > 0) {
          const seatSubtotalValue = seatRows.reduce((sum, seat) => sum + Number(seat.seat_price ?? 0), 0);
          const seatLabels = seatRows
            .map((seat) => String(seat.sl_seat_name ?? seat.label ?? "").trim())
            .filter(Boolean)
            .join(", ");
          const selectedSeatCategoryIds = Array.from(
            new Set(
              seatRows
                .map((seat) => String(seat.screen_seat_type_id ?? "").trim())
                .filter(Boolean),
            ),
          );
          setSeatSelection({
            seatQuantity: seatRows.length,
            seatSubtotal: seatSubtotalValue,
            selectedSeatLabels: seatLabels,
            selectedSeatCategoryIds,
            selectedSeatsData: seatRows,
          });
        }

        const isVisitOpera = String((details as any)?.slug ?? "").trim().toLowerCase() === "visit-opera";
        // Only visit-opera should hydrate ticket counters from reservation items.
        // For seated events this causes an incorrect "counter mode" UI after refresh.
        if (isVisitOpera) {
          const visitTicketCounts = selectedReservationItems.reduce<Record<string, number>>((acc, item) => {
            const ticketClass = item.ticket_class && typeof item.ticket_class === "object"
              ? (item.ticket_class as Record<string, unknown>)
              : null;
            const rawName = String(ticketClass?.name ?? item.ticket_type_name ?? item.name ?? "").trim();
            const key = rawName
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "_")
              .replace(/^_+|_+$/g, "")
              .replace(/_+/g, "_");
            if (!key) return acc;
            const qty = Number(item.quantity ?? 0);
            if (!Number.isFinite(qty) || qty <= 0) return acc;
            acc[key] = (acc[key] ?? 0) + qty;
            return acc;
          }, {});
          if (Object.keys(visitTicketCounts).length > 0) {
            setVisitTickets(visitTicketCounts);
          }
        }
      } else if (selectedSeats.length > 0) {
        // Fallback: if reservation_items are absent, still rebuild from selected_seats.
        const seatRows = selectedSeats.map((seat, index) => {
          const row = String(seat.sl_row_num ?? seat.seat_row ?? "").trim();
          const seatNumber = String(seat.seat_number ?? "").trim();
          const label =
            String(seat.sl_seat_name ?? "").trim() ||
            (row && seatNumber ? `${row}${seatNumber}` : `Seat ${index + 1}`);
          const seatTypeId = Number(seat.screen_seat_type_id ?? seat.category ?? 0);
          return {
            ...seat,
            sl_seat_name: label,
            label,
            seat_row: row,
            seat_number: seatNumber,
            screen_seat_type_id: Number.isFinite(seatTypeId) && seatTypeId > 0 ? seatTypeId : undefined,
            seat_price: 0,
            actual_price: 0,
          };
        });
        const seatLabels = seatRows
          .map((seat) => String(seat.sl_seat_name ?? seat.label ?? "").trim())
          .filter(Boolean)
          .join(", ");
        const selectedSeatCategoryIds = Array.from(
          new Set(
            seatRows
              .map((seat) => String(seat.screen_seat_type_id ?? "").trim())
              .filter(Boolean),
          ),
        );
        setSeatSelection({
          seatQuantity: seatRows.length,
          seatSubtotal: 0,
          selectedSeatLabels: seatLabels,
          selectedSeatCategoryIds,
          selectedSeatsData: seatRows,
        });
      }

      const scheduleFromReservation = Number(
        (Array.isArray(data.reservation_items) ? (data.reservation_items[0] as any)?.schedule_id : 0) ?? 0,
      );
      if (Number.isFinite(scheduleFromReservation) && scheduleFromReservation > 0 && !selectedScheduleId) {
        setSelectedScheduleIdState(scheduleFromReservation);
      }

      const expiryTime = String(data.expiry_time ?? "").trim();
      if (expiryTime) {
        const expiryMs = new Date(expiryTime).getTime();
        if (Number.isFinite(expiryMs) && expiryMs > 0) {
          setTimerExpiry(expiryMs);
        }
      }
    } finally {
      recoveredReservationIdRef.current = reservationKey;
      setIsHydratingReservation(false);
      if (preventDuplicateRequests.current === reservationKey) {
        preventDuplicateRequests.current = null;
      }
    }
  }, [details, selectedScheduleId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (restoredIdsKeyRef.current === bookingIdsStorageKey) return;
    restoredIdsKeyRef.current = bookingIdsStorageKey;
    setIsBookingState(false);
    try {
      const raw = window.sessionStorage.getItem(bookingIdsStorageKey);
      if (!raw) return;
      const persisted = JSON.parse(raw) as Partial<PersistedBookingIds>;
      const persistedScheduleId = Number(persisted.scheduleId ?? 0);
      const persistedReservationId = String(persisted.reservationId ?? "").trim();
      if (Number.isFinite(persistedScheduleId) && persistedScheduleId > 0) {
        setSelectedScheduleIdState(persistedScheduleId);
      }
      if (String(persistedReservationId).trim().length > 0) {
        setReservationId(persistedReservationId);
      }
    } catch {
      // Ignore corrupt storage and keep in-memory defaults.
    } finally {
      setIsBookingState(true);
    }
  }, [bookingIdsStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (restoredIdsKeyRef.current !== bookingIdsStorageKey) return;
    const payload: PersistedBookingIds = {
      scheduleId: selectedScheduleId ?? null,
      reservationId: String(reservationId ?? "").trim() || null,
    };
    try {
      window.sessionStorage.setItem(bookingIdsStorageKey, JSON.stringify(payload));
    } catch {
      // Ignore storage quota/security errors.
    }
  }, [bookingIdsStorageKey, reservationId, selectedScheduleId]);

  /* ── Memo ── */
  const value = useMemo(
    (): ExternalEventDetailsContextValue => ({
      details,
      isBookingState,
      selectedDate,
      selectedTime,
      selectedScheduleId,
      setSelectedDate,
      setSelectedTime,
      setSelectedScheduleId,
      timeSlots,
      setTimeSlots,
      allowedDates,
      setAllowedDates,
      selectedAddons,
      setSelectedAddons,
      customer,
      setCustomer,
      shipping,
      setShipping,
      paymentMethod,
      setPaymentMethod,
      paymentDetails,
      setPaymentDetails,
      requestCheckoutSubmit,
      requestPaymentSubmit,
      timerExpiry,
      setTimerExpiry,
      timerTotalSeconds,
      setTimerTotalSeconds,
      visitTickets,
      setVisitTickets,
      seatQuantity,
      seatSubtotal,
      selectedSeatLabels,
      selectedSeatCategoryIds,
      selectedSeatsData,
      setSeatSelection,
      reservationId,
      setReservationId,
      reservationSummary,
      setReservationSummary,
      voucherState,
      setVoucherState,
      recoverReservationById,
      isHydratingReservation,
    }),
    [
      details,
      isBookingState,
      selectedDate,
      selectedTime,
      selectedScheduleId,
      setSelectedDate,
      setSelectedTime,
      setSelectedScheduleId,
      timeSlots,
      allowedDates,
      selectedAddons,
      customer,
      setCustomer,
      shipping,
      setShipping,
      paymentMethod,
      setPaymentMethod,
      paymentDetails,
      setPaymentDetails,
      requestCheckoutSubmit,
      requestPaymentSubmit,
      timerExpiry,
      timerTotalSeconds,
      visitTickets,
      setVisitTickets,
      seatQuantity,
      seatSubtotal,
      selectedSeatLabels,
      selectedSeatCategoryIds,
      selectedSeatsData,
      setSeatSelection,
      reservationId,
      reservationSummary,
      voucherState,
      setVoucherState,
      recoverReservationById,
      isHydratingReservation,
    ],
  );

  return (
    <ExternalEventDetailsContext.Provider value={value}>{children}</ExternalEventDetailsContext.Provider>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Hooks                                                      */
/* ────────────────────────────────────────────────────────── */

export function useExternalEventDetails(): ExternalEventDetails {
  const ctx = useContext(ExternalEventDetailsContext);
  if (!ctx) {
    throw new Error(
      "useExternalEventDetails must be used within ExternalEventDetailsProvider (under programs/[eventName]/[eventId] layout).",
    );
  }
  return ctx.details;
}

export function useOptionalExternalEventDetails(): ExternalEventDetails | null {
  return useContext(ExternalEventDetailsContext)?.details ?? null;
}


// implement useExternalEventSchedules where it add the schedules in the details context
export function useExternalEventSchedules(): ExternalEventSchedule[] {
  const details = useExternalEventDetails();
  console.log(details, "details>>>>.");
  return Array.isArray(details?.schedules) ? (details?.schedules as ExternalEventSchedule[]) : [];
}

/** Schedule selection only (date / time / scheduleId + derived schedule data). */
export function useExternalEventBookingSelection(): ExternalEventBookingSelection & {
  setSelectedDate: (date: string | null) => void;
  setSelectedTime: (time: string | null) => void;
  setSelectedScheduleId: (scheduleId: number | null) => void;
  setTimeSlots: (slots: string[]) => void;
  setAllowedDates: (dates: string[]) => void;
} {
  const ctx = useContext(ExternalEventDetailsContext);
  if (!ctx) {
    throw new Error(
      "useExternalEventBookingSelection must be used within ExternalEventDetailsProvider.",
    );
  }
  return {
    selectedDate: ctx.selectedDate,
    selectedTime: ctx.selectedTime,
    selectedScheduleId: ctx.selectedScheduleId,
    setSelectedDate: ctx.setSelectedDate,
    setSelectedTime: ctx.setSelectedTime,
    setSelectedScheduleId: ctx.setSelectedScheduleId,
    setTimeSlots: ctx.setTimeSlots,
    setAllowedDates: ctx.setAllowedDates,
  };
}

/** Full booking state (seats, addons, customer, shipping, timer, payment, visit tickets). */
function mapExternalEventBookingState(ctx: ExternalEventDetailsContextValue) {
  const schedules = Array.isArray(ctx.details?.schedules)
    ? (ctx.details.schedules as Array<Record<string, unknown>>)
    : [];
  const selectedSchedule =
    schedules.find((schedule) => Number(schedule.schedule_id ?? 0) === Number(ctx.selectedScheduleId ?? 0)) ??
    schedules[0] ??
    null;
  const rawSeatBookingFlag = selectedSchedule?.is_seat_booking_enabled;
  const isSeatBookingEnabled =
    typeof rawSeatBookingFlag === "boolean"
      ? rawSeatBookingFlag
      : typeof rawSeatBookingFlag === "number"
        ? rawSeatBookingFlag === 1
        : typeof rawSeatBookingFlag === "string"
          ? rawSeatBookingFlag === "1" || rawSeatBookingFlag.toLowerCase() === "true"
          : false;
  const hasAddons = ctx.details?.has_addons ?? true;

  return {
    /* details */
    details: ctx.details,
    isBookingState: ctx.isBookingState,
    /* schedule */
    selectedDate: ctx.selectedDate,
    selectedTime: ctx.selectedTime,
    selectedScheduleId: ctx.selectedScheduleId,
    setSelectedDate: ctx.setSelectedDate,
    setSelectedTime: ctx.setSelectedTime,
    setSelectedScheduleId: ctx.setSelectedScheduleId,
    /* derived schedule data */
    timeSlots: ctx.timeSlots,
    setTimeSlots: ctx.setTimeSlots,
    allowedDates: ctx.allowedDates,
    setAllowedDates: ctx.setAllowedDates,
    /* addons */
    selectedAddons: ctx.selectedAddons,
    setSelectedAddons: ctx.setSelectedAddons,
    /* customer */
    customer: ctx.customer,
    setCustomer: ctx.setCustomer,
    /* shipping */
    shipping: ctx.shipping,
    setShipping: ctx.setShipping,
    /* payment */
    paymentMethod: ctx.paymentMethod,
    setPaymentMethod: ctx.setPaymentMethod,
    paymentDetails: ctx.paymentDetails,
    setPaymentDetails: ctx.setPaymentDetails,
    /* Form Triggers (Refs) */
    requestCheckoutSubmit: ctx.requestCheckoutSubmit,
    requestPaymentSubmit: ctx.requestPaymentSubmit,
    /* timer */
    timerExpiry: ctx.timerExpiry,
    setTimerExpiry: ctx.setTimerExpiry,
    timerTotalSeconds: ctx.timerTotalSeconds,
    setTimerTotalSeconds: ctx.setTimerTotalSeconds,
    /* visit tickets */
    visitTickets: ctx.visitTickets,
    setVisitTickets: ctx.setVisitTickets,
    /* seats */
    seatQuantity: ctx.seatQuantity,
    seatSubtotal: ctx.seatSubtotal,
    selectedSeatLabels: ctx.selectedSeatLabels,
    selectedSeatCategoryIds: ctx.selectedSeatCategoryIds,
    selectedSeatsData: ctx.selectedSeatsData,
    setSeatSelection: ctx.setSeatSelection,
    reservationId: ctx.reservationId,
    setReservationId: ctx.setReservationId,
    reservationSummary: ctx.reservationSummary,
    setReservationSummary: ctx.setReservationSummary,
    voucherState: ctx.voucherState,
    setVoucherState: ctx.setVoucherState,
    recoverReservationById: ctx.recoverReservationById,
    isHydratingReservation: ctx.isHydratingReservation,
    isSeatBookingEnabled,
    hasAddons,
  };
}

export function useExternalEventBookingState(): ReturnType<typeof mapExternalEventBookingState>;
export function useExternalEventBookingState(options: { optional: true }): ReturnType<
  typeof mapExternalEventBookingState
> | null;
export function useExternalEventBookingState(options?: { optional?: boolean }) {
  const ctx = useContext(ExternalEventDetailsContext);
  if (!ctx) {
    if (options?.optional) return null;
    throw new Error(
      "useExternalEventBookingState must be used within ExternalEventDetailsProvider.",
    );
  }
  return mapExternalEventBookingState(ctx);
}

