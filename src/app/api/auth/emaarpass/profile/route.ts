import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { EMAARPASS_ACCESS_COOKIE } from "@/services/emaarpassSessionCookies";
import { getUserProfile } from "@/services/oauthService";

type Body = { access_token?: string };

/**
 * POST — fetch EmaarPASS profile.
 * - If body.access_token is provided, uses it
 * - Otherwise, uses the session cookie access token
 * Mirrors the backend `/profile`.
 */
export async function POST(request: NextRequest) {
    let body: Body;
    try {
        body = (await request.json()) as Body;
    } catch {
        body = {};
    }

    const tokenFromBody = typeof body.access_token === "string" ? body.access_token : "";
    let access = tokenFromBody;
    if (!access) {
        const jar = await cookies();
        access = jar.get(EMAARPASS_ACCESS_COOKIE)?.value ?? "";
    }

    if (!access) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await getUserProfile(access);
    if (result.error) {
        return NextResponse.json(
            { error: result.error.message },
            { status: result.status || 502 },
        );
    }
    return NextResponse.json(result.data);
}

