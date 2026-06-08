"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PayLaterPaymentCard from "@/components/paylater/PayLaterPaymentCard";
import PayLaterSummaryCard from "@/components/paylater/PayLaterSummaryCard";
import { getExternalEventReservationbyId } from "@/services/externalEventReservationClient";

type PayLaterPageClientProps = {
  locale: string;
  reservationId: string | null;
  token: string;
};

export default function PayLaterPageClient({
  locale,
  reservationId,
  token,
}: PayLaterPageClientProps) {
  const payNowRef = useRef<(() => void) | null>(null);
  const [reservationDetails, setReservationDetails] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const response = await getExternalEventReservationbyId(String(reservationId), token);
        const data = response?.data;
        if (!mounted || !data || typeof data !== "object") return;
        setReservationDetails(data as Record<string, unknown>);
      } catch {
        if (!mounted) return;
        setReservationDetails(null);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [reservationId, token]);

  const summaryProps = useMemo(() => {
    const safeObj = (value: unknown): Record<string, unknown> | null =>
      value && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : null;
    const toNumber = (value: unknown, fallback = 0) => {
      const n = typeof value === "number" ? value : Number(value);
      return Number.isFinite(n) ? n : fallback;
    };
    const pickFirst = <T,>(...values: Array<T | undefined | null>) =>
      values.find((value) => value !== undefined && value !== null);
    const asString = (value: unknown, fallback = "") =>
      typeof value === "string" ? value : fallback;

    const data = safeObj(reservationDetails);
    const summary = safeObj(data?.summary);
    const firstReservationItem = Array.isArray(data?.reservation_items)
      ? safeObj(data.reservation_items[0])
      : null;
    const ticketClass = safeObj(firstReservationItem?.ticket_class);
    const ticketTypeObj = safeObj(firstReservationItem?.ticket_type);
    const selectedAddons = Array.isArray(firstReservationItem?.selected_addons)
      ? firstReservationItem.selected_addons
      : [];

    const seats = Array.isArray(data?.selected_seats)
      ? data.selected_seats
          .map((seat) => safeObj(seat)?.sl_seat_name ?? safeObj(seat)?.label)
          .filter((label): label is string => typeof label === "string" && label.trim().length > 0)
      : [];

    const addons = selectedAddons
      .map((addon, index) => {
        const row = safeObj(addon);
        if (!row) return null;
        const quantity = toNumber(row.quantity, 0);
        const unitPrice = toNumber(pickFirst(row.price, row.unit_price, row.amount), 0);
        return {
          id: asString(row.id, String(index + 1)),
          name: asString(
            pickFirst(row.name, row.title, row.label),
            `Add-on ${index + 1}`,
          ),
          quantity,
          total: toNumber(pickFirst(row.total, row.grand_total), unitPrice * quantity),
        };
      })
      .filter((row): row is { id: string; name: string; quantity: number; total: number } => Boolean(row));

    const ticketQuantity = toNumber(pickFirst(firstReservationItem?.quantity, data?.ticket_quantity), 1);
    const ticketUnitPrice = toNumber(
      pickFirst(data?.ticket_total, firstReservationItem?.price),
      0,
    );
    const ticketTotal = ticketUnitPrice * Math.max(ticketQuantity, 1);

    return {
      eventTitle: asString(
        pickFirst(
          data?.event_title,
          firstReservationItem?.product_name,
          firstReservationItem?.name,
          data?.title,
        ),
        "Booking",
      ),
      eventImage: asString(
        pickFirst(
          data?.event_image,
          Array.isArray(firstReservationItem?.images) ? firstReservationItem.images[0] : undefined,
        ),
        "/images/fallback.png",
      ),
      dateTime: asString(
        pickFirst(data?.date_time, firstReservationItem?.schedule_date),
      ),
      ticketQuantity,
      ticketType: asString(
        pickFirst(ticketClass?.name, ticketTypeObj?.name, data?.ticket_type),
        "Ticket",
      ),
      seatLabels: seats.join(", ") || asString(firstReservationItem?.time_slot_label, "-"),
      ticketTotal,
      addons,
      subtotal: toNumber(pickFirst(data?.sub_total, summary?.sub_total), ticketTotal),
      grandTotal: toNumber(pickFirst(data?.grand_total, summary?.grand_total), ticketTotal),
      vat: toNumber(pickFirst(data?.tax_amount, data?.vat, summary?.vat), 0),
    };
  }, [reservationDetails]);

  const paymentProps = useMemo(() => {
    const safeObj = (value: unknown): Record<string, unknown> | null =>
      value && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : null;
    const asString = (value: unknown, fallback = "") =>
      typeof value === "string" ? value : fallback;
    const toNumber = (value: unknown, fallback = 0) => {
      const n = typeof value === "number" ? value : Number(value);
      return Number.isFinite(n) ? n : fallback;
    };
    const pickFirst = <T,>(...values: Array<T | undefined | null>) =>
      values.find((value) => value !== undefined && value !== null);

    const data = safeObj(reservationDetails);
    const summary = safeObj(data?.summary);
    const firstReservationItem = Array.isArray(data?.reservation_items)
      ? safeObj(data.reservation_items[0])
      : null;
    const amount = toNumber(
      pickFirst(
        data?.grand_total,
        summary?.grand_total,
        summary?.sub_total,
        firstReservationItem?.price,
      ),
      0,
    );

    return {
      amount: amount.toFixed(2),
      currency: asString(pickFirst(data?.currency, firstReservationItem?.currency), "AED"),
      customerName: asString(data?.customer_name, "Guest"),
      customerEmail: asString(data?.email, "guest@example.com"),
      customerPhone: asString(data?.phone, "-"),
    };
  }, [reservationDetails]);

  return (
    <div
      className="mx-auto w-full pb-5 pt-30 md:px-6 lg:min-h-screen lg:px-12 lg:pb-20 xl:px-20"
      style={{
        background: "linear-gradient(to bottom, #0F0505 0%, #702024 25%, #772226 40%, #000000 60%)",
      }}
    >
      <div className="flex flex-col items-start lg:flex-row lg:gap-6">
        <div className="w-full px-4 lg:min-w-0 lg:flex-1">
          <PayLaterPaymentCard
            locale={locale}
            reservationId={reservationId}
            token={token}
            amount={paymentProps.amount}
            currency={paymentProps.currency}
            customerName={paymentProps.customerName}
            customerEmail={paymentProps.customerEmail}
            customerPhone={paymentProps.customerPhone}
            payNowRef={payNowRef}
          />
        </div>

        <div className="w-full px-4 pt-5 lg:w-[360px] lg:px-0 xl:w-[390px]">
          <PayLaterSummaryCard {...summaryProps} payNowRef={payNowRef} />
        </div>
      </div>
    </div>
  );
}
