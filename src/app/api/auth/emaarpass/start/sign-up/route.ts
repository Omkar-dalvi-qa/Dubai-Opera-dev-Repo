import { NextRequest, NextResponse } from "next/server";
import { getPublicOriginFromRequest } from "@/lib/getPublicOriginFromRequest";

/**
 * GET — backend-driven redirect to EmaarPASS sign-up.
 * Mirrors the backend `/start/sign-up`.
 *
 * Query:
 * - lang=en|ar... (optional)
 * - return_to=/en/... (optional)
 */
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const lang = searchParams.get("lang") ?? "en";
    const returnTo = searchParams.get("return_to") ?? "/";
    const url = new URL("/api/auth/emaarpass/authorize", getPublicOriginFromRequest(request));
    url.searchParams.set("mode", "register");
    url.searchParams.set("locale", lang);
    url.searchParams.set("returnTo", returnTo);
    return NextResponse.redirect(url);
}

