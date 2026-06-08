import { NextRequest, NextResponse } from "next/server";
import { eventService } from "@/services/eventService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const locale = req.nextUrl.searchParams.get("locale") || undefined;

  try {
    const res = await eventService.get<{
      data?: Array<{ name?: string | null; slug?: string | null }>;
    }>("/external/master/categories", {
      params: {
        product_type: "EVENT",
        ...(locale ? { locale } : {}),
      },
      cache: "no-store",
    });

    if (res.error) {
      return NextResponse.json(
        {
          success: false,
          message: res.error.message || "Failed to fetch categories",
          data: [],
          timestamp: new Date().toISOString(),
        },
        { status: res.error.status || 502 },
      );
    }

    const data = (res.data?.data ?? [])
      .map((item) => {
        const name = String(item?.name ?? "").trim();
        const slug = String(item?.slug ?? "").trim();
        if (!name || !slug) return null;
        return { value: slug, label: name };
      })
      .filter((item): item is { value: string; label: string } => item !== null);

    return NextResponse.json(
      {
        success: true,
        message: "Categories fetched successfully",
        data,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch categories",
        data: [],
        timestamp: new Date().toISOString(),
      },
      { status: 502 },
    );
  }
}
