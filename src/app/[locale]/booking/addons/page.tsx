"use client";

import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import BookingAddonsClient from "@/components/programs/BookingAddonsClient";
import { useExternalEventDetails } from "@/contexts/program-event/ExternalEventDetailsContext";

/**
 * Add-ons page flow:
 * - Reads event/date/schedule from URL query.
 * - Builds back-link to seats with same query state.
 * - Renders add-ons CSR client with event details from context.
 */
export default function BookingAddonsPage() {
  const details = useExternalEventDetails();
  const params = useParams<{ locale: string }>();
  const searchParams = useSearchParams();

  const locale = params?.locale || "en";
  const eventSlug = (searchParams.get("event") || "").trim();
  const date = searchParams.get("date");

  const backToSeatsHref = useMemo(() => {
    const q = new URLSearchParams();
    if (eventSlug) q.set("event", eventSlug);
    if (date) q.set("date", date);
    const sid = searchParams.get("sid");
    if (sid) q.set("sid", sid);
    return `/${locale}/booking/seats?${q.toString()}`;
  }, [date, eventSlug, locale, searchParams]);

  return (
    <BookingAddonsClient
      eventName=""
      eventId={details.slug}
      eventTitle={details.name}
      eventImageSrc={details.thumbnail_url}
      selectedDateLabel={date ?? null}
      selectedTime={null}
      backToSeatsHref={backToSeatsHref}
    />
  );
}
