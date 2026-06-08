export type ExternalReservationAddonRow = {
  schedule_id?: number;
  time_slot_label?: string | null;
  product_id?: number;
  ticket_class_id?: number;
  ticket_type_id?: number;
  addons?: Array<{
    id: number;
    name: string;
    image_url?: string | null;
    description?: string | null;
    price?: number | string | null;
    is_required?: boolean;
    quantity_equals_ticket_count?: boolean;
    available_quantity?: number;
  }>;
};

/**
 * Fetches add-ons for an event reservation via the Next.js API route (same origin).
 */
export async function getExternalEventReservationAddons(
  reservationId: string | null,
  options?: { signal?: AbortSignal },
): Promise<ExternalReservationAddonRow[]> {
  const url = `/api/external/events/reservation/${reservationId}/addons`;
  const res = await fetch(url, { signal: options?.signal });
  const parsed = (await res.json()) as
    | ExternalReservationAddonRow[]
    | {
        success?: boolean;
        message?: string;
        data?: ExternalReservationAddonRow[];
      };
  if (Array.isArray(parsed)) {
    if (!res.ok) {
      throw new Error(`Add-ons request failed (${res.status})`);
    }
    return parsed;
  }
  if (!res.ok || parsed.success === false) {
    throw new Error(parsed?.message || `Add-ons request failed (${res.status})`);
  }
  const data = parsed.data;
  return Array.isArray(data) ? data : [];
}
