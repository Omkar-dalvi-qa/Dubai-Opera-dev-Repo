import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
    applyEmaarPassTokenCookies,
    EMAARPASS_REFRESH_COOKIE,
} from "@/services/emaarpassSessionCookies";
import { refreshAccessToken } from "@/services/oauthService";

/**
 * POST — exchange refresh token for new tokens; updates httpOnly session cookies.
 * EmaarPASS refresh tokens are one-time use; after this call the old refresh token is invalid.
 */
export async function POST() {
    const jar = await cookies();
    const refresh = jar.get(EMAARPASS_REFRESH_COOKIE)?.value;
    if (!refresh) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await refreshAccessToken(refresh);
    if (result.error || !result.data) {
        return NextResponse.json(
            { error: result.error?.message ?? "Refresh failed" },
            { status: result.status === 401 ? 401 : 502 },
        );
    }

    const res = NextResponse.json({
        ok: true,
        expires_in: result.data.expires_in,
    });
    applyEmaarPassTokenCookies(res, result.data);
    return res;
}
