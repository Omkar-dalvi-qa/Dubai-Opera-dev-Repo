"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import BookingFlowBreadcrumb from "@/components/BookingFlowBreadcrumb";
import {
  useOptionalExternalEventDetails,
  useExternalEventBookingState,
} from "@/contexts/program-event/ExternalEventDetailsContext";


type BookingStep = "seats" | "addons" | "checkout" | "payment" | "confirmation";
type StepItem = { key: BookingStep; label: string; href: string };

function readStep(value: string | undefined): BookingStep {
  if (
    value === "seats" || value === "addons" ||
    value === "checkout" || value === "payment" || value === "confirmation"
  ) return value;
  return "seats";
}

function sliceSteps(items: StepItem[], activeStep: BookingStep): StepItem[] {
  const index = items.findIndex((item) => item.key === activeStep);
  return index < 0 ? items.slice(0, 1) : items.slice(0, index + 1);
}

/**
 * Resolves the "back to event" href.
 *
 * Visit Opera  → /[locale]/visit/tours
 * Normal       → /[locale]/events/[genre]/[eventSlug]   (via category.slug)
 * Studio       → /[locale]/events/[genre]/[eventSlug]   (same — slug from query param)
 */
function resolveEventDetailHref({
  locale, eventSlug, isVisitOpera, categorySlug, seasonSegment,
}: {
  locale: string; eventSlug: string; isVisitOpera: boolean;
  categorySlug: string | undefined; seasonSegment: string;
}): string {
  if (isVisitOpera) return `/${locale}/visit/tours`;
  if (categorySlug && eventSlug) return `/${locale}/events/${categorySlug}/${eventSlug}`;
  if (eventSlug) return `/${locale}/season/${seasonSegment}/${eventSlug}`;
  return `/${locale}/season`;
}

export default function LayoutBookingBreadcrumb() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventDetails = useOptionalExternalEventDetails();
  const bookingState = useExternalEventBookingState({ optional: true });

  if (pathname.endsWith("/confirmation") || pathname.endsWith("/booking-failed")) return null;

  const { backHref, items, redirectTo } = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const locale = segments[0] ?? "en";
    const query = searchParams.toString();
    const withQuery = (href: string) => (query ? `${href}?${query}` : href);

    // All 3 flows: /[locale]/booking/<step>?event=<slug>&...
    const step = readStep(segments[2]);
    const eventSlug =
      (searchParams.get("event")?.trim() ?? "").split(/[?&]/)[0]?.trim().toLowerCase() ?? "";

    const isVisitOpera =
      eventSlug === "visit-opera" ||
      String(eventDetails?.slug ?? "").trim().toLowerCase() === "visit-opera";

    const categorySlug = (eventDetails as any)?.category?.slug as string | undefined;
    const seasonSegment =
      (eventDetails?.season_slug ?? eventDetails?.seasonSlug ?? "").trim();
    const eventDetailHref = resolveEventDetailHref({
      locale, eventSlug, isVisitOpera, categorySlug, seasonSegment,
    });

    // ── Step availability ─────────────────────────────────────────────────────
    // Normal booking : isSeatBookingEnabled=true  → seats → [addons] → checkout → payment
    // Studio flow    : isSeatBookingEnabled=false → [addons] → checkout → payment
    // Visit Opera    : always skips seats         → [addons] → checkout → payment
    const isSeatBookingEnabled =
      !isVisitOpera && (bookingState?.isSeatBookingEnabled ?? false);
    const hasAddons = bookingState?.hasAddons ?? true;

    const seatsHref    = withQuery(`/${locale}/booking/seats`);
    const addonsHref   = withQuery(`/${locale}/booking/addons`);
    const checkoutHref = withQuery(`/${locale}/booking/checkout`);
    const paymentHref  = withQuery(`/${locale}/booking/payment`);

    const firstAllowedStepHref = isSeatBookingEnabled
      ? seatsHref : hasAddons ? addonsHref : checkoutHref;

    const stepItems: StepItem[] = [
      ...(isSeatBookingEnabled
        ? [{ key: "seats" as BookingStep, label: "Select Your Seat", href: seatsHref }]
        : []),
      ...(hasAddons
        ? [{ key: "addons" as BookingStep, label: "Add ons", href: addonsHref }]
        : []),
      { key: "checkout" as BookingStep, label: "Checkout", href: checkoutHref },
      { key: "payment"  as BookingStep, label: "Payment",  href: paymentHref  },
    ];

    const visibleSteps = sliceSteps(stepItems, step);

    // Redirect if user somehow lands on a step skipped for their flow
    const redirectTo: string | null =
      step === "seats" && !isSeatBookingEnabled ? firstAllowedStepHref
      : step === "addons" && !hasAddons         ? checkoutHref
      : null;

      //name of the event in the first breadcrumb item
    const items = [
      { label: isVisitOpera ? "Visit Opera" : "Event Page", href: eventDetailHref },
      ...visibleSteps.map((s) => ({ label: s.label, href: s.href })),
    ];
    const backHref =
      visibleSteps.length > 1 ? visibleSteps[visibleSteps.length - 2].href : eventDetailHref;

    return { backHref, items, redirectTo };
  }, [pathname, searchParams, eventDetails, bookingState?.hasAddons, bookingState?.isSeatBookingEnabled]);

  useEffect(() => {
    if (!redirectTo) return;
    if (redirectTo === pathname || redirectTo.startsWith(`${pathname}?`)) return;
    router.replace(redirectTo);
  }, [pathname, redirectTo, router]);

  const breadcrumbEventName = eventDetails?.name?.trim() || undefined;
  const isBookingFlowPage   = pathname.includes("/booking/");
  const hasSelectedSeats =
    (bookingState?.seatQuantity ?? 0) > 0 ||
    Boolean(bookingState?.selectedSeatLabels?.trim()) ||
    (Array.isArray(bookingState?.selectedSeatsData) && bookingState.selectedSeatsData.length > 0);

  return (
    <BookingFlowBreadcrumb
      backHref={backHref}
      items={items}
      eventName={breadcrumbEventName}
      requireExitConfirm={isBookingFlowPage && hasSelectedSeats}
    />
  );
}