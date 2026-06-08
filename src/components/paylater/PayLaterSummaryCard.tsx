"use client";

import { useMemo, type MutableRefObject } from "react";

function toAmount(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatAed(value: number) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type SummaryAddon = {
  id: string;
  name: string;
  quantity: number;
  total: number;
};

interface PayLaterSummaryCardProps {
  eventTitle?: string;
  eventImage?: string;
  dateTime?: string;
  ticketQuantity?: number;
  ticketType?: string;
  seatLabels?: string;
  ticketTotal?: number;
  addons?: SummaryAddon[];
  subtotal?: number;
  grandTotal?: number;
  vat?: number;
  payNowRef?: MutableRefObject<(() => void) | null>;
}

export default function PayLaterSummaryCard({
  eventTitle = "Booking",
  eventImage = "/images/fallback.png",
  dateTime = "",
  ticketQuantity = 1,
  ticketType = "Ticket",
  seatLabels = "-",
  ticketTotal = 0,
  addons = [],
  subtotal = 0,
  grandTotal = 0,
  vat = 0,
  payNowRef,
}: PayLaterSummaryCardProps) {
  const displayRows = useMemo(
    () =>
      addons.map((addon, index) => ({
        key: String(addon.id || index),
        name: addon.name || `Add-on ${index + 1}`,
        quantity: Number(addon.quantity || 0),
        total: toAmount(addon.total),
      })),
    [addons],
  );

  return (
    <div className="w-full rounded-[20px] border border-white/10 bg-[#191A1F] p-5 text-white">
      <h2 className="font-montserrat text-[24px] leading-[28px] font-semibold">Summary</h2>

      <>
          <div className="mt-5 flex items-center gap-3">
            <img
              src={eventImage}
              alt={eventTitle}
              className="h-[66px] w-[66px] rounded-[10px] object-cover"
            />
            <div className="min-w-0">
              <p className="truncate font-montserrat text-[18px] leading-[24px] font-semibold">
                {eventTitle}
              </p>
              <p className="mt-1 font-montserrat text-[13px] leading-[18px] font-medium text-white/70">{dateTime}</p>
            </div>
          </div>

          <div className="mt-5 rounded-[12px] border border-white/15 bg-[#1B1C22] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-montserrat text-[15px] font-medium">
                  {ticketQuantity} x {ticketType}
                </p>
                <p className="mt-1 font-montserrat text-[13px] font-medium text-white/80">{seatLabels || "-"}</p>
              </div>
              <p className="font-montserrat text-[15px] font-semibold">AED {formatAed(ticketTotal)}</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {displayRows.map((row) => (
              <div key={row.key} className="rounded-[12px] border border-white/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-montserrat text-[14px] font-medium">{row.name}</p>
                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-[6px] border border-white/20 px-2 text-[12px]">
                    {row.quantity}
                  </span>
                </div>
                <p className="mt-1 font-montserrat text-[13px] text-white/70">AED {formatAed(row.total)}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-white/10 pt-5">
            <div className="flex items-center justify-between">
              <p className="font-montserrat text-[16px] font-semibold">Subtotal</p>
              <p className="font-montserrat text-[16px] font-semibold">
                AED {formatAed(subtotal)}
              </p>
            </div>

            <p className="mt-3 font-montserrat text-[13px] text-white/80">Have a promo Code?</p>
            <div className="mt-3 flex gap-3">
              <input
                readOnly
                placeholder="Enter your Code"
                className="h-11 w-full rounded-[10px] border border-white/20 bg-transparent px-3 text-[13px] text-white/60 outline-none"
              />
              <button
                type="button"
                className="h-11 min-w-[100px] rounded-[10px] bg-primary-light px-4 font-montserrat text-[14px] font-semibold text-white"
              >
                Apply
              </button>
            </div>
          </div>

          <div className="mt-6 border-t border-white/10 pt-5">
            <div className="flex items-center justify-between">
              <p className="font-montserrat text-[22px] leading-[28px] font-bold">Total Payment</p>
              <p className="font-montserrat text-[22px] leading-[28px] font-semibold">
                AED {formatAed(grandTotal)}
              </p>
            </div>
            <div className="mt-2 flex items-center justify-between text-white/70">
              <p className="font-montserrat text-[12px]">VAT (Included)</p>
              <p className="font-montserrat text-[12px]">AED {formatAed(vat)}</p>
            </div>

            <button
              type="button"
              onClick={() => payNowRef?.current?.()}
              className="mt-5 h-11 w-full rounded-[10px] bg-primary-light font-montserrat text-[16px] font-semibold text-white hover:bg-[#8e2b30]"
            >
              Pay Now
            </button>
            <p className="mt-4 text-center font-montserrat text-[12px] text-white/50">
              Tickets are non-refundable.
              <br />
              See our <span className="text-primary-light">cancellation policy</span> for details.
            </p>
          </div>
      </>
    </div>
  );
}
