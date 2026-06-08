import { NextRequest, NextResponse } from "next/server";
import { getPosts } from "@/services/websiteServer";

export async function GET(req: NextRequest) {
  const locale = (req.nextUrl.searchParams.get("locale") || "en").trim();
  const pageRaw = Number(req.nextUrl.searchParams.get("page") || "1");
  const limitRaw = Number(req.nextUrl.searchParams.get("limit") || "12");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 12;

  const items = await getPosts(
    { page, limit, locale },
    { revalidate: 60 },
  );

  return NextResponse.json(
    {
      success: true,
      items,
      hasMore: items.length >= limit,
      page,
      limit,
    },
    { status: 200 },
  );
}
