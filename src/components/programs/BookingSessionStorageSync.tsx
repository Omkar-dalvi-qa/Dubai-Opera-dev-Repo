"use client";

import { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { clearBookingSessionStorage } from "@/contexts/program-booking/bookingStorage";

function isBookingPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname.includes("/booking");
}

/**
 * Clears persisted external-event booking blobs and the visit-opera bridge session
 * when the user leaves the `/booking` route tree, so stale `reservation_id` values
 * are not reused on a later booking attempt.
 *
 * Uses `useLayoutEffect` so storage is cleared in the layout phase, before deeper
 * components' `useEffect` runs (e.g. ExternalEventDetailsProvider hydrating from
 * sessionStorage). A passive `useEffect` here raced and let stale state be re-written.
 */
export default function BookingSessionStorageSync() {
  const pathname = usePathname();
  const wasInBookingRef = useRef(false);

  useLayoutEffect(() => {
    const inBooking = isBookingPath(pathname);
    if (wasInBookingRef.current && !inBooking) {
      clearBookingSessionStorage();
    }
    wasInBookingRef.current = inBooking;
  }, [pathname]);

  return null;
}
