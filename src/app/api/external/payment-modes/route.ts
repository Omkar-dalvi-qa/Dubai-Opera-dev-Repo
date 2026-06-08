import { NextRequest, NextResponse } from "next/server";
import { eventService } from "@/services/eventService";

/**
 * Same-origin proxy for `GET /external/payment-modes`.
 */
export async function GET(_req: NextRequest) {
  const result = await eventService.get<{
    success?: boolean;
    message?: string;
    data?: unknown;
  }>("/external/master/payment-modes");

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
  return NextResponse.json(result.data ?? { success: true, data: [] }, { status });
}

