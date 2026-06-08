import { NextRequest, NextResponse } from "next/server";
import { eventService } from "@/services/eventService";

type VerifyPinResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
};

/**
 * Same-origin proxy for `POST /external/cashcard/verify-pin`.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 });
  }

  const result = await eventService.post<VerifyPinResponse>("/external/cashcard/verify-pin", {
    body,
  });

  if (result.error) {
    const status = result.status && result.status >= 400 && result.status < 600 ? result.status : 502;
    return NextResponse.json({ success: false, message: result.error.message }, { status });
  }

  const status = result.status && result.status >= 200 ? result.status : 200;
  return NextResponse.json(result.data ?? { success: true }, { status });
}
