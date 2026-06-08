import { NextRequest, NextResponse } from "next/server";
import { getExternalVisitOperaSchedules } from "@/services/eventServer";

export async function GET(req: NextRequest) {
  const locale = req.nextUrl.searchParams.get("locale") || undefined;
  const result = await getExternalVisitOperaSchedules(locale);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        message: result.message || "Failed to fetch visit opera schedules.",
        data: null,
        timestamp: result.timestamp ?? new Date().toISOString(),
      },
      { status: 502 },
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: result.message || "Product schedules fetched successfully",
      data: result.data,
      timestamp: result.timestamp ?? new Date().toISOString(),
    },
    { status: 200 },
  );
}
