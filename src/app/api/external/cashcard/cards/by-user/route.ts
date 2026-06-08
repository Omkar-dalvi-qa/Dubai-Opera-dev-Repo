import { NextRequest, NextResponse } from "next/server";
import { eventService } from "@/services/eventService";

type CashCardListResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
};

/**
 * Alias route: `GET /api/external/cashcard/cards/by-user`
 * Proxies upstream `/external/cashcard/cards/by-user`.
 */
export async function GET(req: NextRequest) {
  const mobile = req.nextUrl.searchParams.get("mobile")?.trim() ?? "";
  const cardNumber = req.nextUrl.searchParams.get("card_number")?.trim() ?? "";
  const email = req.nextUrl.searchParams.get("email")?.trim() ?? "";

  if (!mobile && !cardNumber && !email) {
    return NextResponse.json(
      { success: false, message: "At least one lookup field is required" },
      { status: 400 },
    );
  }

  const params: Record<string, string> = {};
  if (mobile) params.mobile = mobile;
  if (cardNumber) params.card_number = cardNumber;
  if (email) params.email = email;

  const result = await eventService.get<CashCardListResponse>("/external/cashcard/cards/by-user", {
    params,
  });

  if (result.error) {
    const status = result.status && result.status >= 400 && result.status < 600 ? result.status : 502;
    return NextResponse.json({ success: false, message: result.error.message }, { status });
  }

  const status = result.status && result.status >= 200 ? result.status : 200;
  return NextResponse.json(result.data ?? { success: true, data: [] }, { status });
}
