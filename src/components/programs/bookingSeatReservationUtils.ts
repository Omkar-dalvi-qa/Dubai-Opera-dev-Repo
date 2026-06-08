import { toast } from "sonner";

export const FALLBACK_TIMER_SECONDS = 600;

function toFiniteNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function mergedUpdatedSummary(
  summaryLike: unknown,
  reservationLike?: unknown,
): Record<string, unknown> | null {
  if (!summaryLike || typeof summaryLike !== "object") return null;
  const nextSummary = { ...(summaryLike as Record<string, unknown>) };
  const reservation =
    reservationLike && typeof reservationLike === "object"
      ? (reservationLike as Record<string, unknown>)
      : null;
  if (!reservation) return nextSummary;

  if (reservation.is_gift_card === true) {
    nextSummary.is_gift_card = true;
  }
  const giftCardAmount = toFiniteNumber(reservation.gift_card_amount);
  if (giftCardAmount != null) {
    nextSummary.gift_card_amount = Math.max(0, giftCardAmount);
  }
  const taxAmount = toFiniteNumber(reservation.tax_amount);
  if (taxAmount != null && nextSummary.tax_amount == null) {
    nextSummary.tax_amount = taxAmount;
  }
  if (typeof reservation.show_courier_addon === "boolean") {
    nextSummary.show_courier_addon = reservation.show_courier_addon;
  }
  const courierPrice = toFiniteNumber(reservation.courier_price);
  if (courierPrice != null) {
    nextSummary.courier_price = courierPrice;
  }

  return nextSummary;
}

/**
 * POST responses use `data.summary`; GET-by-id often puts totals on the reservation root.
 * Returns one merged summary object for context, or null when there is no pricing data.
 */
export function resolveReservationSummary(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;

  if (record.summary && typeof record.summary === "object") {
    return mergedUpdatedSummary(record.summary, record);
  }

  const subTotal = record.sub_total ?? record.subtotal;
  const grandTotal = record.grand_total ?? record.total_amount ?? record.total;
  if (subTotal == null && grandTotal == null) return null;

  return mergedUpdatedSummary(
    {
      sub_total: subTotal,
      grand_total: grandTotal,
      taxes: record.taxes,
      discounts: record.discounts,
    },
    record,
  );
}

function ticketClassIdFromSeat(seat: Record<string, unknown>): number | null {
  const raw = seat.seat_class_id ?? seat.ticket_class_id ?? seat.screen_seat_type_id;
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function resolveTicketTypeFromSchedule(
  schedule: Record<string, unknown> | undefined,
  classId: number,
): { id: number; name: string } | null {
  const prices = Array.isArray(schedule?.tickets)
    ? (schedule.tickets as Record<string, unknown>[])
    : [];
  const row = prices.find((p) => Number(p?.class_id) === classId);
  const types = Array.isArray(row?.types)
    ? (row.types as Record<string, unknown>[])
    : [];
  const first = types.find((t) => t?.type_id != null && Number(t.type_id) > 0);
  if (!first) return null;
  return {
    id: Number(first.type_id),
    name: String(first.type_name ?? "Ticket"),
  };
}

export function buildEventReservationItemsFromSeats(args: {
  productId: number;
  scheduleId: number;
  schedules: unknown[];
  seats: unknown[];
}): Array<{
  product_id: number;
  schedule_id: number;
  ticket_class_id: number;
  ticket_type_id: number;
  quantity: number;
}> {
  const { productId, scheduleId, schedules, seats } = args;
  const list = Array.isArray(schedules) ? schedules : [];
  const schedule = list.find(
    (s) => Number((s as Record<string, unknown>)?.schedule_id) === Number(scheduleId),
  ) as Record<string, unknown> | undefined;

  const byClass = new Map<number, unknown[]>();
  for (const raw of seats) {
    const seat = raw as Record<string, unknown>;
    const cid = ticketClassIdFromSeat(seat);
    if (cid == null) {
      toast.error(
        "One or more selected seats are missing ticket class information. Please reselect your seats.",
      );
    }
    if (!byClass.has(cid ?? 0)) byClass.set(cid ?? 0, []);
    byClass.get(cid ?? 0)!.push(seat);
  }

  const items: Array<{
    product_id: number;
    schedule_id: number;
    ticket_class_id: number;
    ticket_type_id: number;
    quantity: number;
  }> = [];

  for (const [classId, seatList] of byClass) {
    const tt = resolveTicketTypeFromSchedule(schedule, classId);
    if (!tt) {
      throw new Error(
        `No ticket type is configured for ticket class ${classId} on this showtime.`,
      );
    }
    items.push({
      product_id: productId,
      schedule_id: scheduleId,
      ticket_class_id: classId,
      ticket_type_id: tt.id,
      quantity: seatList.length,
    });
  }
  return items;
}

export function cloneSeatsForReservationPayload(
  seats: unknown[],
  context?: { productId?: number; scheduleId?: number },
): unknown[] {
  const productId = Number(context?.productId);
  const scheduleId = Number(context?.scheduleId);
  const hasProductId = Number.isFinite(productId) && productId > 0;
  const hasScheduleId = Number.isFinite(scheduleId) && scheduleId > 0;

  return seats.map((s) => {
    const cloned =
      typeof structuredClone === "function"
        ? structuredClone(s)
        : JSON.parse(JSON.stringify(s));

    if (!cloned || typeof cloned !== "object" || Array.isArray(cloned)) {
      return cloned;
    }

    const seatWithContext = cloned as Record<string, unknown>;
    if (hasProductId) seatWithContext.product_id = productId;
    if (hasScheduleId) seatWithContext.schedule_id = scheduleId;
    return seatWithContext;
  });
}
