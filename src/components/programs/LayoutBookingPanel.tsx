"use client";

import { usePathname } from "next/navigation";
import BookingTicketPanel from "@/components/programs/BookingTicketPanel";

export default function LayoutBookingPanel() {
  const pathname = usePathname();
  const isConfirmationPage = pathname.endsWith("/confirmation");
  const isBookingFailedPage = pathname.endsWith("/booking-failed");
  const isSeatsPage = pathname.includes("/seats");

  if (isConfirmationPage || isBookingFailedPage || isSeatsPage) return null;

  return (
    <div
      id="booking-summary-panel"
      className={`w-full shrink-0 lg:w-[360px] xl:w-[390px] ${isSeatsPage ? "pt-10" : "pt-5"}`}
    >
      <BookingTicketPanel />
    </div>
  );
}
