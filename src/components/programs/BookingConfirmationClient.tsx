"use client";

import Link from "next/link";
import { Check, CircleAlert, Download, Mail } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { SelectedAddonDetail } from "@/components/programs/BookingTicketPanel";
import { clearBookingSessionStorage } from "@/contexts/program-booking/bookingStorage";
import { imageUrl } from "@/utils/imageUrl";
import PaymentFailed from "@/components/PaymentFailed";
import CardFailed from "@/components/CardFailed";
import { toast } from "sonner";
import { generateBookingTicketPDF } from "@/services/eventServer";
import { COURIER_ADDON_ID } from "@/components/shop/ShippingInformationSection";

export type BookingConfirmationFlowType = "booking" | "shop";

function formatDateDDMMYYYY(input?: string) {
  const raw = String(input || "").trim();
  if (!raw) return "";
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
  if (iso) return `${iso[3]}-${iso[2]}-${iso[1]}`;
  return raw;
}

function formatTimeAmPm(input?: string) {
  const raw = String(input || "").trim();
  if (!raw) return "";
  // Supports "HH:mm", "HH:mm:ss", and ISO datetime strings like "YYYY-MM-DDTHH:mm:ss.sssZ"
  const m = raw.match(/T(\d{1,2}):(\d{2})/) ?? raw.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return raw;
  let h = Number(m[1]);
  const min = m[2];
  if (Number.isNaN(h)) return raw;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, "0")}:${min} ${ampm}`;
}

function pickSeatColor(source: any): string | undefined {
  if (!source || typeof source !== "object") return undefined;
  const fromMeta = source?.sl_meta_data?.color;
  const color =
    source.ticket_class_color ||
    source.ticket_class_color_code ||
    source.sst_seat_color_code ||
    source.seat_color_code ||
    source.sst_color_code ||
    source.color ||
    fromMeta;
  return typeof color === "string" && color.trim() ? color : undefined;
}

export type ApiBookingDetails = {
  customer?: { name?: string; email?: string; phone?: string };
  payment_mode?: string;
  payment_status?: string;
  sub_total?: string | number;
  tax_amount?: string | number;
  discount_amount?: string | number;
  is_gift_card?: boolean;
  is_giftcard?: boolean;
  gift_card_amount?: string | number;
  grand_total?: string | number;
  ticket_pdf_urls?: string[] | null;
  reservation_items?: Array<{
    id?: number;
    ticket_class?: string;
    ticket_type?: string;
    quantity?: number;
    unit_price?: string | number;
    total_price?: string | number;
    ticket_class_color?: string;
    ticket_class_color_code?: string;
    seat_color_code?: string;
    color?: string;
    date?: string;
    start_time?: string;
    selected_addons?: Array<{ id?: number; name?: string; price?: number | string; quantity?: number }>;
    reservation_seats?: Array<{ seat_row?: string; seat_number?: string; gate_name?: string }>;
  }>;
};


const SHOP_CONFIRMATION_SHIPPING_FEE = 10;

function parseShopPrice(value: string) {
  const numeric = Number(value.replace(/[^\d.]/g, ""));
  return Number.isNaN(numeric) ? 0 : numeric;
}

interface BookingConfirmationClientProps {
  flowType?: BookingConfirmationFlowType;
  eventTitle: string;
  doneHref: string;
  myBookingsHref: string;
  summaryDateTime?: string;
  selectedSeatLabels?: string;
  seatSubtotal?: number;
  selectedAddons?: SelectedAddonDetail[];
  customerName?: string;
  customerEmail?: string;
  customerMobile?: string;
  initialApiBooking?: ApiBookingDetails | null;
  initialApiError?: string | null;
}

export default function BookingConfirmationClient({
  flowType = "booking",
  eventTitle,  
  doneHref,
  myBookingsHref,
  summaryDateTime,
  selectedSeatLabels = "",
  seatSubtotal = 0,
  selectedAddons = [],
  customerName,
  customerEmail,
  customerMobile,
  initialApiBooking = null,
  initialApiError = null,
}: BookingConfirmationClientProps) {
  const isShop = flowType === "shop";
  const searchParams = useSearchParams();
  const transactionId = searchParams.get("transactionId") || searchParams.get("transaction_id") || "";

  // Keep local state (initialized from server props).
  // We intentionally do not fetch on the client anymore.
  const [apiBooking, setApiBooking] = useState<ApiBookingDetails | null>(initialApiBooking);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(initialApiError);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string[] | null>(null);

  useEffect(() => {
    setApiBooking(initialApiBooking);
    setApiError(initialApiError);
    setApiLoading(false);
  }, [initialApiBooking, initialApiError]);

  const finalSummaryDateTime = useMemo(() => {
    if (summaryDateTime && String(summaryDateTime).trim()) return summaryDateTime;
    const firstItem = apiBooking?.reservation_items?.[0];
    const rawDate = firstItem?.date ? String(firstItem.date).trim() : "";
    const rawTime = firstItem?.start_time ? String(firstItem.start_time).trim() : "";
    if (!rawDate && !rawTime) return "";

    const dateLabel = formatDateDDMMYYYY(rawDate);
    const timeLabel = formatTimeAmPm(rawTime);
    return [dateLabel, timeLabel].filter(Boolean).join(", ");
  }, [summaryDateTime, apiBooking]);

  const effectiveCustomerName =
    (apiBooking?.customer?.name && String(apiBooking.customer.name).trim()) ||
    customerName ||
    "Guest User";
  const finalCustomerEmail =
    (apiBooking?.customer?.email && String(apiBooking.customer.email).trim()) ||
    customerEmail ||
    "-";
  const effectiveCustomerMobile =
    (apiBooking?.customer?.phone && String(apiBooking.customer.phone).trim()) ||
    customerMobile ||
    "-";
  const [mounted, setMounted] = useState(false);
  const [shopLines, setShopLines] = useState<
    { id: number; name: string; color: string; quantity: number; lineTotal: number }[]
  >([]);
  const [generatingTicketPdf, setGeneratingTicketPdf] = useState(false);
  const [downloadingTickets, setDownloadingTickets] = useState(false);
  const ticketPdfRef = useRef<HTMLDivElement | null>(null);

  const seatRows = useMemo(() => {
    const defaultSeatColor = "#00E0FF";
    if (apiBooking?.reservation_items?.length) {
      return apiBooking.reservation_items.map((item) => {
        const qty = Number(item.quantity) || 0;
        const unit = Number(item.unit_price) || 0;
        const total = Number(item.total_price) || unit * qty;
        const seatNames = (item.reservation_seats ?? [])
          .map((s) => {
            const row = (s.seat_row && String(s.seat_row).trim()) || "";
            const num = (s.seat_number && String(s.seat_number).trim()) || "";
            return row && num ? `${row}${num}` : "";
          })
          .filter(Boolean)
          .join(", ");
        const label = String(item.ticket_class ?? "Ticket");
        return {
          label,
          color: pickSeatColor(item) || defaultSeatColor,
          seatCode: seatNames ? `Seat ${seatNames}` : "",
          price: unit * qty,
          quantity: qty,
        };
      });
    }
    return [];
  }, [apiBooking]);

  const addonsTotal = useMemo(() => {
    if (apiBooking?.reservation_items?.length) {
      const sum = apiBooking.reservation_items.reduce((acc, item) => {
        const rows = item.selected_addons ?? [];
        return acc + rows.reduce((s, a) => s + (Number(a.price) || 0) * (Number(a.quantity) || 0), 0);
      }, 0);
      return sum;
    }
    return 0;
  }, [apiBooking]);

  const addonRows = useMemo(() => {
    if (apiBooking?.reservation_items?.length) {
      const rows: Array<{ id: string; label: string; quantity: number; total: number; isCourier: boolean }> = [];
      for (const item of apiBooking.reservation_items) {
        for (const a of item.selected_addons ?? []) {
          const addonId = Number(a.id);
          if (!addonId) continue;
          const qty = Number(a.quantity) || 0;
          if (qty <= 0) continue;
          const unit = Number(a.price) || 0;
          rows.push({
            id: String(addonId),
            label: String(a.name ?? `Add-on ${addonId}`),
            quantity: qty,
            total: unit * qty,
            isCourier: addonId === COURIER_ADDON_ID,
          });
        }
      }
      return rows;
    }
    return [];
  }, [apiBooking]);

  const shopOrderLines = useMemo(() => (mounted ? shopLines : []), [mounted, shopLines]);

  const shopItemsSubtotal = useMemo(
    () => shopOrderLines.reduce((sum, row) => sum + row.lineTotal, 0),
    [shopOrderLines],
  );

  const bookingSubtotal = apiBooking?.sub_total != null ? Number(apiBooking.sub_total) || 0 : addonsTotal;
  const bookingVat = apiBooking?.tax_amount != null ? Number(apiBooking.tax_amount) || 0 : bookingSubtotal * 0.05;
  const bookingCodeDiscount = apiBooking?.discount_amount != null ? Number(apiBooking.discount_amount) || 0 : 0;
  const hasGiftCardFlag = apiBooking?.is_gift_card === true || apiBooking?.is_giftcard === true;
  const bookingGiftCardDiscount =
    hasGiftCardFlag && apiBooking?.gift_card_amount != null ? Number(apiBooking.gift_card_amount) || 0 : 0;
  const bookingTotalPaid = apiBooking?.grand_total != null ? Number(apiBooking.grand_total) || 0 : bookingSubtotal + bookingVat;

  const shopTaxable = shopItemsSubtotal + SHOP_CONFIRMATION_SHIPPING_FEE;
  const shopVat = shopTaxable * 0.05;
  const shopTotalPaid = shopTaxable + shopVat;

  const subtotal = isShop ? (mounted ? shopItemsSubtotal : 0) : bookingSubtotal;
  const vat = isShop ? (mounted ? shopVat : 0) : bookingVat;
  const totalPaid = isShop ? (mounted ? shopTotalPaid : 0) : bookingTotalPaid;

  const ticketPdfUrl = useMemo(
    () => {
      if (generatedPdfUrl) {
        return imageUrl(generatedPdfUrl[0]);
      }
      return imageUrl(apiBooking?.ticket_pdf_urls?.[0]);
    },
    [apiBooking?.ticket_pdf_urls?.[0], generatedPdfUrl],
  );

  const generateTicketPDF = async () => {
    if (!transactionId) {
      toast.error("Transaction ID is missing. Unable to generate ticket PDF.");
      return;
    }
    setGeneratingTicketPdf(true);
    try {
      const response = await generateBookingTicketPDF(transactionId);
      if (response?.success) {
        setGeneratedPdfUrl(response?.data as string[] | null);
      } else {
        toast.error(response?.message || "Failed to generate ticket PDF. Please try again.");
      }
    } catch (error) {
      console.error("Error generating ticket PDF:", error);
      toast.error("Failed to generate ticket PDF. Please try again.");
    } finally {
      setGeneratingTicketPdf(false);
    }
  };

  useEffect(() => {
    if (!apiBooking?.ticket_pdf_urls?.[0] && transactionId) {
      generateTicketPDF();
    }
  }, [apiBooking?.ticket_pdf_urls?.[0], transactionId]);

  const handleDownloadTickets = async () => {
    if (!transactionId) {
      toast.error("Transaction ID is missing. Unable to download tickets.");
      return;
    }
    if (!ticketPdfUrl) {
      toast.error("Ticket PDF URL is missing. Unable to download tickets.");
      return;
    }
    setDownloadingTickets(true);
    try {
      let credentials: RequestCredentials = "omit";
      try {
        const u = new URL(ticketPdfUrl, window.location.href);
        if (u.origin === window.location.origin) credentials = "include";
      } catch {
        /* invalid URL — omit */
      }
      const response = await fetch(ticketPdfUrl, { mode: "cors", credentials });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      try {
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = `ticket-${transactionId}.pdf`;
        link.rel = "noopener";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    } catch {
      try {
        const link = document.createElement("a");
        link.href = ticketPdfUrl;
        link.download = `ticket-${transactionId}.pdf`;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error("Error downloading tickets:", err);
        toast.error(
          "Could not download tickets. Try opening the PDF from your confirmation email.",
        );
      }
    } finally {
      setDownloadingTickets(false);
    }
  };

  return (
    <div>
      {/* Hidden ticket template used for PDF generation */}
      {!isShop ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed left-[-10000px] top-0 w-[794px]"
          style={{ backgroundColor: "#ffffff", color: "#000000" }}
        >
          <div
            ref={ticketPdfRef}
            className="p-10"
            style={{
              backgroundColor: "#ffffff",
              color: "#000000",
              fontFamily:
                'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, "Noto Sans", "Helvetica Neue", sans-serif',
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[22px] font-semibold">Dubai Opera</div>
                <div className="mt-1 text-[12px]" style={{ color: "rgba(0,0,0,0.7)" }}>
                  E‑Ticket
                </div>
              </div>
              <div className="text-right">
                <div className="text-[12px]" style={{ color: "rgba(0,0,0,0.7)" }}>
                  Booking Reference
                </div>
                <div className="text-[14px] font-semibold">{transactionId}</div>
              </div>
            </div>

            <div
              className="mt-6 rounded-[12px] p-4"
              style={{ border: "1px solid rgba(0,0,0,0.15)" }}
            >
              <div className="text-[14px] font-semibold">{eventTitle}</div>
              {finalSummaryDateTime ? (
                <div className="mt-1 text-[12px]" style={{ color: "rgba(0,0,0,0.7)" }}>
                  {finalSummaryDateTime}
                </div>
              ) : null}
              <div className="mt-1 text-[12px]" style={{ color: "rgba(0,0,0,0.7)" }}>
                Dubai Opera, Downtown Dubai
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div
                className="rounded-[12px] p-4"
                style={{ border: "1px solid rgba(0,0,0,0.15)" }}
              >
                <div className="text-[12px] font-semibold">Customer</div>
                <div className="mt-2 text-[12px]">{effectiveCustomerName}</div>
                <div className="text-[12px]" style={{ color: "rgba(0,0,0,0.7)" }}>
                  {finalCustomerEmail}
                </div>
                <div className="text-[12px]" style={{ color: "rgba(0,0,0,0.7)" }}>
                  {effectiveCustomerMobile}
                </div>
              </div>
              <div
                className="rounded-[12px] p-4"
                style={{ border: "1px solid rgba(0,0,0,0.15)" }}
              >
                <div className="text-[12px] font-semibold">Totals</div>
                {bookingCodeDiscount > 0 ? (
                  <div className="mt-2 flex items-center justify-between text-[12px]">
                    <span style={{ color: "rgba(0,0,0,0.7)" }}>Code Discount</span>
                    <span>-{Math.abs(bookingCodeDiscount).toFixed(2)} AED</span>
                  </div>
                ) : null}
                <div className="mt-2 flex items-center justify-between text-[12px]">
                  <span style={{ color: "rgba(0,0,0,0.7)" }}>Subtotal</span>
                  <span>{subtotal.toFixed(2)} AED</span>
                </div>
                {bookingGiftCardDiscount > 0 ? (
                  <div className="mt-2 flex items-center justify-between text-[12px]">
                    <span style={{ color: "rgba(0,0,0,0.7)" }}>Gift Card Discount</span>
                    <span>-{Math.abs(bookingGiftCardDiscount).toFixed(2)} AED</span>
                  </div>
                ) : null}
                <div className="mt-1 flex items-center justify-between text-[12px]">
                  <span className="font-montserrat text-[12px] leading-[16px] text-[#99A1AF]">VAT (5%)</span>
                  <span className="font-montserrat text-[12px] leading-[16px] text-[#99A1AF]">{vat.toFixed(2)} AED</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[12px] font-semibold">
                  <span>Total Paid</span>
                  <span>{totalPaid.toFixed(2)} AED</span>
                </div>
              </div>
            </div>

            <div
              className="mt-6 rounded-[12px] p-4"
              style={{ border: "1px solid rgba(0,0,0,0.15)" }}
            >
              <div className="text-[12px] font-semibold">Tickets</div>
              <div className="mt-2 space-y-2">
                {seatRows.map((row, idx) => (
                  <div key={`${row.label}-${row.seatCode}-${idx}`} className="flex items-start justify-between gap-4">
                    <div className="text-[12px]">
                      <div className="font-semibold">
                        {row.quantity} × {row.label}
                      </div>
                      {row.seatCode ? (
                        <div style={{ color: "rgba(0,0,0,0.7)" }}>{row.seatCode}</div>
                      ) : null}
                    </div>
                    <div className="text-[12px] font-semibold">
                       {row?.price.toLocaleString("en-US", { maximumFractionDigits: 2 })} AED
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {addonRows.length > 0 ? (
              <div
                className="mt-6 rounded-[12px] p-4"
                style={{ border: "1px solid rgba(0,0,0,0.15)" }}
              >
                <div className="text-[12px] font-semibold">Add-ons</div>
                <div className="mt-2 space-y-2">
                  {addonRows.map((row) => (
                    <div key={row.id} className="flex items-start justify-between gap-4">
                      <div className="text-[12px]">
                        <div className="font-semibold">
                          {row.isCourier ? row.label : `${row.quantity} × ${row.label}`}
                        </div>
                      </div>
                      <div className="text-[12px] font-semibold">
                        {row.total.toLocaleString("en-US", { maximumFractionDigits: 2 })} AED
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-6 text-[10px]" style={{ color: "rgba(0,0,0,0.7)" }}>
              Please arrive at least 30 minutes before show begins. Present this e-ticket (digital or printed) at the entrance.
            </div>
          </div>
        </div>
      ) : null}

      <div className="max-w-6xl mx-auto">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#792327]">
            <Check size={50} strokeWidth={2.5} />
          </div>
          <h1 className="mt-5 font-optima text-[38px] leading-[100%] md:text-[48px] md:leading-[72px]">
            {isShop ? "Order Confirmed!" : "Booking Confirmed!"}
          </h1>
          <p className="mt-2 font-montserrat text-[14px] leading-[21px] text-white/80 lg:text-[18px] lg:leading-[27px]">
            {isShop
              ? `Your order confirmation has been sent to ${finalCustomerEmail}`
              : `Your tickets have been sent to ${finalCustomerEmail}`}
          </p>
          <p className="mt-1 font-montserrat text-[14px] leading-[21px] lg:text-[20px] lg:leading-[30px] font-semibold">
            {isShop ? "Order Reference" : "Booking Reference"}: {transactionId}
          </p>
          {!isShop ? (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleDownloadTickets}
                disabled={
                  generatingTicketPdf || downloadingTickets || !transactionId || !ticketPdfUrl
                }
                className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-primary-light px-5 font-montserrat text-[14px] leading-[21px] text-white lg:text-[16px] lg:leading-[24px] font-medium cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download size={14} />
                {downloadingTickets
                  ? "Downloading…"
                  : generatingTicketPdf
                    ? "Generating…"
                    : "Download Tickets"}
              </button>
              {/* <button className="inline-flex h-10 items-center gap-2 rounded-[8px] px-5 border border-white font-montserrat text-[14px] leading-[21px] text-white lg:text-[16px] lg:leading-[24px] bg-white/10 font-medium cursor-pointer">
                <Mail size={14} className="text-white" />
                Resend Email
              </button> */}
            </div>
          ) : null}
        </div>

        {!isShop && transactionId ? (
          <div className="mt-4 text-center">
            {apiLoading ? (
              <p className="font-montserrat text-[13px] text-white/60">Loading booking details…</p>
            ) : apiError ? (
              <p className="font-montserrat text-[13px] text-amber-200/90">{apiError}</p>
            ) : apiBooking?.payment_status ? (
              <p className="font-montserrat text-[13px] text-white/70">
                Payment: <span className="text-white">{apiBooking.payment_status}</span>
                {apiBooking.payment_mode ? <span className="text-white/60"> · {apiBooking.payment_mode}</span> : null}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6  rounded-[16px] border border-white/15 bg-surface p-4 md:p-6 lg:p-8">
          <h2 className="font-montserrat text-[22px] font-semibold">{isShop ? "Order Details" : "Booking Details"}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {!isShop && (
              <div>
                <p className="font-montserrat text-[12px] lg:text-[18px] lg:leading-[27px] text-white font-semibold">Event Information</p>
                <p className="mt-2 font-montserrat text-[12px] leading-[18px] text-[#99A1AF]">Event Name</p>
                <p className="font-montserrat text-[14px] leading-[21px] text-white">{eventTitle}</p>
                <p className="mt-2 font-montserrat text-[12px] leading-[18px] text-[#99A1AF]">Date & Time</p>
                {finalSummaryDateTime ? (
                  <p className="font-montserrat text-[14px] leading-[21px] text-white">{finalSummaryDateTime}</p>
                ) : null}
                <p className="mt-2 font-montserrat text-[12px] leading-[18px] text-[#99A1AF]">Venue</p>
                <p className="font-montserrat text-[14px] leading-[21px] text-white">Dubai Opera, Downtown Dubai</p>
              </div>
              
            )}
            <div>
              <p className="font-montserrat text-[12px] lg:text-[18px] lg:leading-[27px] text-white font-semibold">Customer Information</p>
              <p className="mt-2 font-montserrat text-[12px] leading-[18px] text-[#99A1AF]">Name</p>
              <p className="font-montserrat text-[14px] leading-[21px] text-white">{effectiveCustomerName}</p>
              <p className="mt-2 font-montserrat text-[12px] leading-[18px] text-[#99A1AF]">Email</p>
              <p className="font-montserrat text-[14px] leading-[21px] text-white">{finalCustomerEmail}</p>
              <p className="mt-2 font-montserrat text-[12px] leading-[18px] text-[#99A1AF]">Mobile Number</p>
              <p className="font-montserrat text-[14px] leading-[21px] text-white">{effectiveCustomerMobile}</p>
            </div>
          </div>

          <div className="mt-5 border-t border-white/15 pt-4">
            <p className="font-montserrat text-[12px] lg:text-[18px] lg:leading-[27px] text-white font-semibold">
              {isShop ? "Items" : "Tickets"}
            </p>
            <div className="mt-3 space-y-2">
              {isShop
                ? shopOrderLines.map((row) => (
                  <div key={row.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                      <p className="font-montserrat text-[14px] leading-[21px] text-white">
                        {row.quantity} x {row.name}
                      </p>
                    </div>
                    <p className="font-montserrat text-[14px] leading-[21px] text-white">
                     {row.lineTotal.toLocaleString("en-US", { maximumFractionDigits: 0 })}.00 AED 
                    </p>
                  </div>
                ))
                : seatRows.map((row, idx) => (
                  <div key={`${row.label}-${row.seatCode}-${idx}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                      <p className="font-montserrat text-[14px] leading-[21px] text-white">
                        {row.quantity} x {row.label.toUpperCase()}{" "}
                        {row.seatCode ? <span className="ml-1 text-white/60">{row.seatCode}</span> : null}
                      </p>
                    </div>
                    <p className="font-montserrat text-[14px] leading-[21px] text-white">
                     {row.price.toLocaleString("en-US", { maximumFractionDigits: 0 })}.00  AED 
                    </p>
                  </div>
                ))}
              {!isShop
                ? addonRows.map((row) => (
                  <div key={row.id} className="flex items-center justify-between">
                    <p className="font-montserrat text-[14px] leading-[21px] text-white">
                      {row.isCourier ? row.label : `${row.quantity} x ${row.label}`}
                    </p>
                    <p className="font-montserrat text-[14px] leading-[21px] text-white">AED {row.total.toLocaleString("en-US")}.00</p>
                  </div>
                ))
                : null}
            </div>
          </div>

          <div className="mt-5 border-t border-white/15 pt-4 space-y-2">
            {!isShop && bookingCodeDiscount > 0 ? (
              <div className="flex items-center justify-between">
                <p className="font-montserrat text-[14px] leading-[21px] text-white ">Code Discount</p>
                <p className="font-montserrat text-[14px] leading-[21px] text-white">-{Math.abs(bookingCodeDiscount).toFixed(2)} AED</p>
              </div>
            ) : null}
            <div className="flex items-center justify-between">
              <p className="font-montserrat text-[14px] leading-[21px] text-white ">Subtotal</p>
              <p className="font-montserrat text-[14px] leading-[21px] text-white">{subtotal.toLocaleString("en-US")} AED</p>
            </div>
            {!isShop && bookingGiftCardDiscount > 0 ? (
              <div className="flex items-center justify-between">
                <p className="font-montserrat text-[14px] leading-[21px] text-white ">Gift Card Discount</p>
                <p className="font-montserrat text-[14px] leading-[21px] text-white">-{bookingGiftCardDiscount.toLocaleString("en-US")} AED</p>
              </div>
            ) : null}
            {isShop ? (
              <div className="flex items-center justify-between">
                <p className="font-montserrat text-[14px] leading-[21px] text-white ">Shipping</p>
                <p className="font-montserrat text-[14px] leading-[21px] text-white">
                  {SHOP_CONFIRMATION_SHIPPING_FEE.toFixed(2)} AED
                </p>
              </div>
            ) : null}
            <div className="flex items-center justify-between">
              <p className="font-montserrat text-[14px] leading-[21px] text-[#99A1AF] ">VAT (5%)</p>
              <p className="font-montserrat text-[14px] leading-[21px] text-[#99A1AF]">{vat.toFixed(2)} AED</p>
            </div>
            <div className="flex items-center justify-between border-t border-white/15 pt-3">
              <p className="font-montserrat text-[18px] font-semibold text-white">Total Paid</p>
              <p className="font-montserrat text-[18px] font-semibold">{totalPaid.toFixed(2)} AED</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="font-montserrat text-[14px] leading-[21px] text-[#99A1AF]">Payment Method</p>
              <p className="font-montserrat text-[14px] leading-[21px] text-[#99A1AF]">
                {apiBooking?.payment_mode ? apiBooking.payment_mode : "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[14px] border border-white/15 bg-black/20 p-4">
          <p className="font-montserrat text-[14px] lg:text-[18px] leading-[21px] lg:leading-[27px] text-white font-semibold flex items-center gap-2">
            <CircleAlert className="text-primary-light" size={16} />
            Important Information
          </p>

          {isShop ? (
            <ul className="mt-2 space-y-4">
              <li className="font-montserrat text-[12px] text-[#99A1AF] flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-primary-light" />
                You will receive tracking details by email when your order ships.
              </li>
              <li className="font-montserrat text-[12px] text-[#99A1AF] flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-primary-light" />
                Delivery times may vary by emirate and product availability.
              </li>
              <li className="font-montserrat text-[12px] text-[#99A1AF] flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-primary-light" />
                For order changes, contact Dubai Opera shop support with your order reference.
              </li>
            </ul>
          ) : (
            <ul className="mt-2 space-y-4">
              <li className="font-montserrat text-[12px] text-[#99A1AF] flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-primary-light" />
                Please arrive at least 30 minutes before show begins.
              </li>
              <li className="font-montserrat text-[12px] text-[#99A1AF] flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-primary-light" />
                Present your e-ticket (digital or printed) at the entrance.
              </li>
              <li className="font-montserrat text-[12px] text-[#99A1AF] flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-primary-light" />
                Valid photo ID is required for entry.
              </li>
              <li className="font-montserrat text-[12px] text-[#99A1AF] flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-primary-light" />
                Tickets are non-refundable and non-transferable
              </li>
            </ul>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={doneHref}
            onClick={() => {
              clearBookingSessionStorage();
            }}
            className="inline-flex h-11 items-center justify-center rounded-[10px] bg-[#1A1A1A] border border-white px-6 font-montserrat text-[15px] font-semibold hover:bg-[#8e2b30]"
          >
            {isShop ? "Continue Shopping" : "Book Another Event"}
          </Link>
          {/* <Link
            href={myBookingsHref}
            className="inline-flex h-11 items-center justify-center rounded-[10px] border border-white bg-[#1A1A1A] px-6 font-montserrat text-[15px] font-semibold hover:bg-white/10"
          >
            {isShop ? "View Cart" : "View My Bookings"}
          </Link> */}
        </div>
        {/* <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => setShowFailedPopup(true)}
            className="rounded-full bg-red-600/20 px-3 py-1 text-[10px] text-red-500 hover:bg-red-600/30 transition-colors"
          >
            Test Payment Failed UI
          </button>
          <button
            onClick={() => setShowCardFailed(true)}
            className="rounded-full bg-orange-600/20 px-3 py-1 text-[10px] text-orange-500 hover:bg-orange-600/30 transition-colors"
          >
            Test Incorrect Card UI
          </button>
        </div> */}
      </div>

    </div>
  );
}
