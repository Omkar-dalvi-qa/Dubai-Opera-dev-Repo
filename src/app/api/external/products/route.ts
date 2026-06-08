import { NextRequest, NextResponse } from "next/server";
import { eventService } from "@/services/eventService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams;
  const locale = search.get("locale") ?? "en";
  const page = Number(search.get("page") ?? "1");
  const limit = Number(search.get("limit") ?? "100");
  const season = search.get("season") ?? undefined;
  const startDate = search.get("start_date") ?? undefined;
  const endDate = search.get("end_date") ?? undefined;
  const category = search.get("category") ?? undefined;
  const screen = search.get("screen") ?? undefined;

  const res = await eventService.get<unknown>("/external/products", {
    params: {
      product_type: "EVENT",
      locale,
      page,
      limit,
      ...(season ? { season } : {}),
      ...(startDate ? { start_date: startDate } : {}),
      ...(endDate ? { end_date: endDate } : {}),
      ...(category ? { category } : {}),
      ...(screen ? { screen } : {}),
    },
    cache: "no-store",
  });

  if (res.error) {
    return NextResponse.json(
      {
        success: false,
        message: res.error.message || "Failed to fetch products",
        data: { data: [] },
      },
      { status: res.error.status || 502 },
    );
  }

  return NextResponse.json(res.data, { status: 200 });
}
