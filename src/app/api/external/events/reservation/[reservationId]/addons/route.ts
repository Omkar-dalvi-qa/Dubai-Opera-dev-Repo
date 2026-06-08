import { NextRequest, NextResponse } from "next/server";
import { eventService } from "@/services/eventService";

/**
 * Same-origin proxy for `GET /external/events/reservation/:reservation_id/addons`.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ reservationId: string }> },
) {
  const { reservationId } = await context.params;
  const id = String(reservationId);
  // if (!Number.isFinite(id) || id <= 0) {
  //   return NextResponse.json(
  //     { success: false, message: "Invalid reservation id" },
  //     { status: 400 },
  //   );
  // }
//external/addons/list
  const result = await eventService.get<{
    success?: boolean;
    message?: string;
    data?: unknown;
  }>(`/external/addons/list/${id}`);

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
