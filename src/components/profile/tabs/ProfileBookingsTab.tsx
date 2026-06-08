"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ProfileSurfacePanel from "@/components/profile/ProfileSurfacePanel";
import { useAuth } from "@/contexts/auth/AuthContext";
import { getUserBookingHistory } from "@/services/websiteServer";
import type { BookingHistoryRecord } from "@/types/website";
import { formatHHMMTo12Hour } from "@/helpers/programs-booking/formHelpers";

export type BookingTabKey = "upcoming" | "past" | "canceled";

const EMPTY_MESSAGES: Record<BookingTabKey, string> = {
  upcoming: "No upcoming bookings.",
  past: "No past bookings.",
  canceled: "No canceled bookings.",
};

function formatDate(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function formatPrice(amount: number) {
  if (!Number.isFinite(amount)) return "AED 0";
  return `AED ${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;
}

function getBookingKey(booking: BookingHistoryRecord, index: number) {
  return (
    booking.id?.toString() ||
    booking.reservation_id ||
    booking.order_number ||
    booking.transaction_id?.toString() ||
    `${booking.event_title ?? booking.product_name ?? "booking"}-${index}`
  );
}

export default function ProfileBookingsTab({
  locale,
  bookingTab,
  setBookingTab,
}: {
  locale: string;
  bookingTab: BookingTabKey;
  setBookingTab: (tab: BookingTabKey) => void;
}) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [bookingsByTab, setBookingsByTab] = useState<Record<BookingTabKey, BookingHistoryRecord[]>>({
    upcoming: [],
    past: [],
    canceled: [],
  });
  const loadedTabsRef = useRef<Record<BookingTabKey, boolean>>({
    upcoming: false,
    past: false,
    canceled: false,
  });

  useEffect(() => {
    if (isAuthLoading) return;

    const email = String(user?.email ?? "").trim();
    const emaarId = String(user?.emmarId ?? "").trim();
    const bookingType = bookingTab === "canceled" ? "cancelled" : bookingTab;

    if (!email || !emaarId || loadedTabsRef.current[bookingTab]) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadBookings = async () => {
      setIsLoading(true);
      try {
        const history = await getUserBookingHistory(emaarId, email, bookingType);
        if (!cancelled) {
          setBookingsByTab((prev) => ({ ...prev, [bookingTab]: history }));
          loadedTabsRef.current[bookingTab] = true;
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadBookings();

    return () => {
      cancelled = true;
    };
  }, [bookingTab, isAuthLoading, user?.email]);

  const activeBookings = bookingsByTab[bookingTab];
  const tabs: { key: BookingTabKey; label: string }[] = [
    { key: "upcoming", label: `Upcoming Bookings (${bookingsByTab.upcoming.length})` },
    { key: "past", label: `Past Bookings (${bookingsByTab.past.length})` },
    { key: "canceled", label: `Canceled Bookings (${bookingsByTab.canceled.length})` },
  ];

  if (isAuthLoading || isLoading) {
    return (
      <div className="max-w-[1048px]">
        <ProfileSurfacePanel>
          <div className="flex h-48 items-center justify-center">
            <Loader2 size={24} className="animate-spin text-white" />
          </div>
        </ProfileSurfacePanel>
      </div>
    );
  }

  return (
    <div className="max-w-[1048px]">
      <ProfileSurfacePanel>
      <div className="flex items-start gap-5 border-b border-white/18 pb-4 overflow-x-auto hideScrollbar w-full">          {tabs.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setBookingTab(key)}
              className={`relative flex w-full justify-center  pb-2 text-center transition-colors lg:w-auto lg:pb-1 ${bookingTab === key ? "text-white" : "text-white/45"
                }`}
            >
              <span
                className={`whitespace-nowrap cursor-pointer font-montserrat text-[14px] leading-[18px] md:text-[16px] lg:text-[18px] lg:leading-[28px] ${bookingTab === key ? "font-semibold" : "font-medium"
                  }`}
              >
                {label}
              </span>
              {bookingTab === key && (
                <span className="absolute inset-x-0 -bottom-[17px] h-[3px] rounded-full bg-[#b8343c]" />
              )}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-4">
          {activeBookings.length === 0 ? (
            <p className="py-8 text-center font-montserrat text-[14px] text-white/60">
              {EMPTY_MESSAGES[bookingTab]}
            </p>
          ) : (
            activeBookings.map((booking, index) => (
              <BookingCard
                key={getBookingKey(booking, index)}
                booking={booking}
                locale={locale}
                bookingTab={bookingTab}
              />
            ))
          )}
        </div>
      </ProfileSurfacePanel>
    </div>
  );
}

function BookingCard({
  booking,
  locale,
  bookingTab,
}: {
  booking: BookingHistoryRecord;
  locale: string;
  bookingTab: BookingTabKey;
}) {
  const eventTitle = booking.product_name ?? booking.event_title ?? "—";
  const scheduleDate = booking.schedule_date ?? booking.schedule_start ?? "";
  const scheduleStart = booking.schedule_start ?? "";
  let seatsCounts = booking.seats ?? "—";
  if (seatsCounts === "—" || seatsCounts === "-") {
    seatsCounts = `${booking.ticket_count ?? 0}x Studio Ticket`;
  }
  const totalAmount = Number(booking.sub_total ?? booking.total_price ?? 0);

  return (
    <div className="grid gap-4 rounded-[22px] border border-white/6 bg-black/18 px-4 py-4 sm:px-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-6">
      <div className="grid gap-x-8 gap-y-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <h2 className="font-montserrat text-[18px] font-semibold leading-[28px] text-white/90 md:col-span-2">
          {eventTitle}
        </h2>

        <div>
          <p className="font-montserrat text-[12px] text-white/40">Date & Time</p>
          <p className="mt-1 font-montserrat text-[14px] font-semibold text-white/90">
            {formatDate(scheduleDate)} &bull; {formatHHMMTo12Hour(scheduleStart) ?? "—"}
          </p>
        </div>

        <div>
          <p className="font-montserrat text-[12px] text-white/40">Seats</p>
          <p className="mt-1 font-montserrat text-[14px] font-semibold text-white/90">
            {seatsCounts}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 md:flex-col md:items-end md:self-start md:h-full">
        <p className="font-montserrat text-[18px] font-bold text-white">{formatPrice(totalAmount)}</p>

        <div className="mt-auto">
          {bookingTab === "past" && (
            <span className="inline-flex h-9 items-center justify-center rounded-full border border-white/5 bg-white/5 px-6 font-montserrat text-[12px] font-semibold uppercase tracking-[0.05em] text-white/40">
              {booking.payment_status?.toUpperCase() ?? "—"}
            </span>
          )}
          {bookingTab === "canceled" && (
            <span className="inline-flex h-9 items-center justify-center rounded-full border border-white/5 bg-white/5 px-6 font-montserrat text-[12px] font-semibold uppercase tracking-[0.05em] text-white/40">
              Cancelled
            </span>
          )}
          {bookingTab === "upcoming" &&
            (false ? (
              <a
                href={"#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#9a292f] px-5 font-montserrat text-[14px] font-medium text-white hover:bg-[#b33238]"
              >
                View Ticket
              </a>
            ) : (
              <Link
                href={booking.order_number ? `/${locale}/booking/confirmation?transactionId=${booking.order_number}` : "#"}
                className={`inline-flex h-11 items-center justify-center rounded-xl bg-[#9a292f] px-5 font-montserrat text-[14px] font-medium text-white hover:bg-[#b33238] ${!booking.order_number ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                View Ticket
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
