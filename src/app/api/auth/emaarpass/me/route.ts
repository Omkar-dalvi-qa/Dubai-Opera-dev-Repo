import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
    applyEmaarPassTokenCookies,
    EMAARPASS_ACCESS_COOKIE,
    EMAARPASS_REFRESH_COOKIE,
} from "@/services/emaarpassSessionCookies";
import {
    getUserProfile,
    refreshAccessToken,
    updateUserProfile,
    type EmaarPassProfileUpdateBody,
} from "@/services/oauthService";

/**
 * GET — proxy to EmaarPASS GET /api/v1/user/me using the session access token.
 * PATCH — proxy to EmaarPASS PATCH /api/v1/user/me (JSON body).
 */
export async function GET() {
    const jar = await cookies();
    const access = jar.get(EMAARPASS_ACCESS_COOKIE)?.value;
    if (!access) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await getUserProfile(access);
    if (!result.error) {
        return NextResponse.json(result.data);
    }

    // If EmaarPASS rejects the access token, try a one-time refresh then retry profile.
    if (result.status === 401 || result.status === 403) {
        const refresh = jar.get(EMAARPASS_REFRESH_COOKIE)?.value;
        if (!refresh) {
            return NextResponse.json(
                { error: result.error.message },
                { status: result.status || 502 },
            );
        }

        const refreshed = await refreshAccessToken(refresh);
        if (refreshed.error || !refreshed.data) {
            return NextResponse.json(
                { error: refreshed.error?.message ?? "Refresh failed" },
                { status: refreshed.status === 401 ? 401 : 502 },
            );
        }

        const retry = await getUserProfile(refreshed.data.access_token);
        if (retry.error) {
            return NextResponse.json(
                { error: retry.error.message },
                { status: retry.status || 502 },
            );
        }

        const res = NextResponse.json(retry.data);
        applyEmaarPassTokenCookies(res, refreshed.data);
        return res;
    }

    return NextResponse.json(
        { error: result.error.message },
        { status: result.status || 502 },
    );
}

export async function PATCH(request: NextRequest) {
    const jar = await cookies();
    const access = jar.get(EMAARPASS_ACCESS_COOKIE)?.value;
    if (!access) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: EmaarPassProfileUpdateBody;
    try {
        body = (await request.json()) as EmaarPassProfileUpdateBody;
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const result = await updateUserProfile(access, body);
    if (!result.error) {
        return NextResponse.json(result.data);
    }

    // If EmaarPASS rejects the access token, try a one-time refresh then retry update.
    if (result.status === 401 || result.status === 403) {
        const refresh = jar.get(EMAARPASS_REFRESH_COOKIE)?.value;
        if (!refresh) {
            return NextResponse.json(
                { error: result.error.message },
                { status: result.status || 502 },
            );
        }

        const refreshed = await refreshAccessToken(refresh);
        if (refreshed.error || !refreshed.data) {
            return NextResponse.json(
                { error: refreshed.error?.message ?? "Refresh failed" },
                { status: refreshed.status === 401 ? 401 : 502 },
            );
        }

        const retry = await updateUserProfile(refreshed.data.access_token, body);
        if (retry.error) {
            return NextResponse.json(
                { error: retry.error.message },
                { status: retry.status || 502 },
            );
        }

        const res = NextResponse.json(retry.data);
        applyEmaarPassTokenCookies(res, refreshed.data);
        return res;
    }

    return NextResponse.json(
        { error: result.error.message },
        { status: result.status || 502 },
    );
}
