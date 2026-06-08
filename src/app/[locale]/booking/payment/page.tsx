"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import BookingPaymentClient from "@/components/programs/BookingPaymentClient";
import { useExternalEventDetails } from "@/contexts/program-event/ExternalEventDetailsContext";

/**
 * Payment page flow:
 * - Reads booking query state and prepares back/next URLs.
 * - If payment gateway returns transactionId in URL, redirects to confirmation.
 * - Renders payment CSR client with event context data.
 */
export default function BookingPaymentPage() {
  const details = useExternalEventDetails();
  const params = useParams<{ locale: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const locale = params?.locale || "en";
  const eventSlug = (searchParams.get("event") || "").trim();
  const date = searchParams.get("date");

  const baseQuery = useMemo(() => {
    const q = new URLSearchParams();
    if (eventSlug) q.set("event", eventSlug);
    if (date) q.set("date", date);
    const sid = searchParams.get("sid");
    if (sid) q.set("sid", sid);
    return q.toString();
  }, [date, eventSlug, searchParams]);

  const backHref = `/${locale}/booking/checkout?${baseQuery}`;
  const nextHref = `/${locale}/booking/confirmation`;

  useEffect(() => {
    const cardPaymentSuccessful =
      (searchParams.get("transactionId") || searchParams.get("transaction_id") || "").trim();
    if (!cardPaymentSuccessful) return;
    router.replace(
      `/${locale}/booking/confirmation?transactionId=${encodeURIComponent(cardPaymentSuccessful)}`,
    );
  }, [locale, router, searchParams]);

  return (
    <BookingPaymentClient
      backHref={backHref}
      nextHref={nextHref}
      eventTitle={details.name}
      summaryImageSrc={details.thumbnail_url}
      summaryDateTime={[date].filter(Boolean).join(", ")}
      selectedAddons={[]}
    />
  );
}
