import { NextRequest, NextResponse } from "next/server";
import { eventService } from "@/services/eventService";

/**
 * Same-origin proxy for `POST /external/events/upg-payment/:reservationId`.
 * Browser calls this route; server forwards with `X-Access-Key-Secret`.
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ reservationId: string }> },
) {
  const { reservationId } = await ctx.params;
  const id = String(reservationId);
  if (String(id).trim().length === 0) {
    return NextResponse.json(
      { success: false, message: "Invalid reservation id" },
      { status: 400 },  
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  //external/booking/upg-payment
  const result = await eventService.post<{
    success?: boolean;
    message?: string;
    data?: unknown;
  }>(`/external/booking/upg-payment/${encodeURIComponent(id)}`, { body });

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
