import { NextRequest, NextResponse } from "next/server";
import { exchangeAuthorizationCode } from "@/services/oauthService";

type Body = {
    code?: string;
    redirect_uri?: string;
    state?: string;
    terminal_code?: string;
};

/**
 * POST — exchanges authorization code for EmaarPASS tokens (no cookies set).
 * Mirrors the backend `/token`.
 */
export async function POST(request: NextRequest) {
    let body: Body;
    try {
        body = (await request.json()) as Body;
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const code = typeof body.code === "string" ? body.code : "";
    const redirectUri = typeof body.redirect_uri === "string" ? body.redirect_uri : "";
    if (!code || !redirectUri) {
        return NextResponse.json(
            { error: "Missing required fields: code, redirect_uri" },
            { status: 400 },
        );
    }

    const result = await exchangeAuthorizationCode(code, redirectUri);
    if (result.error || !result.data) {
        return NextResponse.json(
            { error: result.error?.message ?? "Token exchange failed" },
            { status: result.status === 401 ? 401 : 502 },
        );
    }

    return NextResponse.json(result.data);
}

