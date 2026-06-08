"use client";

import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import BookingCheckoutClient from "@/components/programs/BookingCheckoutClient";
import { useExternalEventDetails } from "@/contexts/program-event/ExternalEventDetailsContext";

/**
 * Checkout page flow:
 * - Reads event/date/schedule from URL query.
 * - Builds back-link to add-ons with the same booking query state.
 * - Renders checkout CSR client using event details from context.
 */
export default function BookingCheckoutPage() {
  const details = useExternalEventDetails();
  const params = useParams<{ locale: string }>();
  const searchParams = useSearchParams();

  const locale = params?.locale || "en";
  const eventSlug = (searchParams.get("event") || "").trim();
  const date = searchParams.get("date");

  const backHref = useMemo(() => {
    const q = new URLSearchParams();
    if (eventSlug) q.set("event", eventSlug);
    if (date) q.set("date", date);
    const sid = searchParams.get("sid");
    if (sid) q.set("sid", sid);
    return `/${locale}/booking/addons?${q.toString()}`;
  }, [date, eventSlug, locale, searchParams]);

  const summaryDateTime = [date].filter(Boolean).join(", ");

  return (
    <BookingCheckoutClient
      eventTitle={details.name}
      summaryImageSrc={details.thumbnail_url}
      summaryDateTime={summaryDateTime}
      backHref={backHref}
      selectedAddons={[]}
    />
  );
}
