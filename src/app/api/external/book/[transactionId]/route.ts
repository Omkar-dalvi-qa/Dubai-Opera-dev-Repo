import { NextRequest, NextResponse } from "next/server";
import { eventService } from "@/services/eventService";

/**
 * Same-origin proxy for `GET /external/book/:transactionId`.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ transactionId: string }> },
) {
  const { transactionId } = await context.params;
  const id = String(transactionId || "").trim();
  if (!id) {
    return NextResponse.json(
      { success: false, message: "Invalid transaction id" },
      { status: 400 },
    );
  }

  ///endpoint/v1/external/booking/ticket-pdf/

  const result = await eventService.get<{
    success?: boolean;
    message?: string;
    data?: unknown;
  }>(`/external/booking/transaction/${encodeURIComponent(id)}`);

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

