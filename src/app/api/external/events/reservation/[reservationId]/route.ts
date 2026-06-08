//Pay Later Reservation with reservation id and token

import { NextRequest, NextResponse } from "next/server";
import { eventService } from "@/services/eventService";

/**
 * Same-origin proxy for `GET /external/events/reservation/:reservation_id`.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ reservationId: string }> },
) {
  const { reservationId } = await context.params;
  const id = String(reservationId);
  if (String(id).trim().length === 0) {
    return NextResponse.json(
      { success: false, message: "Invalid reservation id" },
      { status: 400 },  
    );
  }

  //external/booking/reservation/

  const token = req.nextUrl.searchParams.get("token")?.trim() ?? "";
  const path = token
    ? `/external/booking/reservation/${id}?token=${encodeURIComponent(token)}`
    : `/external/booking/reservation/${id}`;

  const result = await eventService.get<{
    success?: boolean;
    message?: string;
    data?: unknown;
  }>(path);

  if (result.error) {
    const status =
      result.status && result.status >= 400 && result.status < 600
        ? result.status
        : 502;
    return NextResponse.json(
      { success: false, message: result.error.message },
      { status },
    );
  }

  const status = result.status && result.status >= 200 ? result.status : 200;
  return NextResponse.json(result.data ?? { success: true }, { status });
}
