import { NextRequest, NextResponse } from "next/server";
import {
  getExternalEventDetailsCached,
  getExternalEventDetailsResult,
  getExternalEventSchedules,
  type ExternalEventDetails,
} from "@/services/eventServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getDetailsWithSchedules(
  slug: string,
  locale?: string,
): Promise<ExternalEventDetails | null> {
  const details = await getExternalEventDetailsCached(slug, { locale });
  if (!details) return null;

  const schedules = await getExternalEventSchedules({ slug, locale });
  return {
    ...details,
    schedules,
  };
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const clean = String(slug || "").trim();
  if (!clean) {
    return NextResponse.json({ success: false, message: "Missing event slug" }, { status: 400 });
  }

  const locale = req.nextUrl.searchParams.get("locale") || undefined;
  const channel = req.nextUrl.searchParams.get("channel") || undefined;
  const passwordFromQuery = req.nextUrl.searchParams.get("password") || undefined;
  const passwordFromHeader = req.headers.get("x-draft-password") || undefined;
  const password = passwordFromQuery ?? passwordFromHeader;

  if (password) {
    const result = await getExternalEventDetailsResult({
      slug: clean,
      locale: locale ?? undefined,
      channel: channel ?? undefined,
      draftPassword: password,
    });

    if (result.ok) {
      const schedules = await getExternalEventSchedules({
        slug: clean,
        locale: locale ?? undefined,
        channel: channel ?? undefined,
      });
      return NextResponse.json(
        { success: true, data: { ...result.data, schedules } },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        },
      );
    }

    if (result.reason === "PASSWORD_REQUIRED") {
      return NextResponse.json(
        {
          success: false,
          code: "DRAFT_PASSWORD_REQUIRED",
          message: result.message ?? "DRAFT_PASSWORD_REQUIRED",
          data: { type: "GENERAL_ERROR" },
          timestamp: new Date().toISOString(),
        },
        { status: 401 },
      );
    }

    if (result.reason === "NOT_FOUND") {
      return NextResponse.json({ success: false, message: result.message ?? "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ success: false, message: result.message ?? "Failed to load event" }, { status: 500 });
  }

  const details = await getDetailsWithSchedules(clean, locale ?? undefined);
  if (!details) {
    return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 });
  }

  return NextResponse.json(
    { success: true, data: details },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const clean = String(slug || "").trim();
  if (!clean) {
    return NextResponse.json({ success: false, message: "Missing event slug" }, { status: 400 });
  }

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const payload = (body && typeof body === "object" ? (body as Record<string, unknown>) : {}) as Record<
    string,
    unknown
  >;
  const locale = typeof payload.locale === "string" ? payload.locale : undefined;
  const channel =
    (typeof payload.channel === "string" ? payload.channel : undefined) ??
    req.nextUrl.searchParams.get("channel") ??
    "web";
  const password =
    (typeof payload.password === "string" ? payload.password : undefined) ??
    req.headers.get("x-draft-password") ??
    undefined;

  const result = await getExternalEventDetailsResult({
    slug: clean,
    locale,
    channel,
    draftPassword: password,
  });

  if (result.ok) {
    const schedules = await getExternalEventSchedules({ slug: clean, locale, channel });
    return NextResponse.json(
      {
        success: true,
        data: {
          ...result.data,
          schedules,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  }

  if (result.reason === "PASSWORD_REQUIRED") {
    return NextResponse.json(
      {
        success: false,
        code: "DRAFT_PASSWORD_REQUIRED",
        message: result.message ?? "DRAFT_PASSWORD_REQUIRED",
        data: { type: "GENERAL_ERROR" },
        timestamp: new Date().toISOString(),
      },
      { status: 401 },
    );
  }

  if (result.reason === "NOT_FOUND") {
    return NextResponse.json({ success: false, message: result.message ?? "Event not found" }, { status: 404 });
  }

  return NextResponse.json({ success: false, message: result.message ?? "Failed to load event" }, { status: 500 });
}

