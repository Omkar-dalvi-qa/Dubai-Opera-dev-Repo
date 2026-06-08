"use client";

export const EXTERNAL_EVENT_BOOKING_IDS_PREFIX = "external-event-booking-ids:";

export function getExternalEventBookingIdsStorageKey(
  detailsLike: { id?: unknown; slug?: unknown } | null | undefined,
): string {
  const eventId = String(detailsLike?.id ?? "").trim();
  const eventSlug = String(detailsLike?.slug ?? "").trim();
  const suffix = eventId || eventSlug || "default";
  return `${EXTERNAL_EVENT_BOOKING_IDS_PREFIX}${suffix}`;
}

/** Clears bridge session (e.g. visit-opera) and all persisted per-event booking blobs. */
export function clearBookingSessionStorage(): void {
  if (typeof window === "undefined") return;
  try {
    for (const key of Object.keys(window.sessionStorage)) {
      if (key.startsWith(EXTERNAL_EVENT_BOOKING_IDS_PREFIX)) {
        window.sessionStorage.removeItem(key);
      }
    }
  } catch {
    // Ignore storage access errors.
  }
}

