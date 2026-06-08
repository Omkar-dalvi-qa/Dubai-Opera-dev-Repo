import { NextRequest, NextResponse } from "next/server";
import {
    buildEmaarPassAuthorizeUrl,
    getEmaarPassRedirectUri,
} from "@/services/oauthService";

/**
 * GET — returns the EmaarPASS sign-in URL (no cookies set).
 * Mirrors the backend `/sign-in-url` helper.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const redirectUri = searchParams.get("redirect_uri") || getEmaarPassRedirectUri();
    const state = searchParams.get("state") ?? "";
    const lang = searchParams.get("lang") ?? "en";

    const url = buildEmaarPassAuthorizeUrl({
        mode: "login",
        lang,
        state,
        redirectUri,
    });

    return NextResponse.json({ url });
}

