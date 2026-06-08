import type { NextResponse } from "next/server";
import type { EmaarPassTokenResponse } from "./oauthService";

/** Session cookies set after successful token exchange or refresh */
export const EMAARPASS_ACCESS_COOKIE = "emaarpass_access_token";
export const EMAARPASS_REFRESH_COOKIE = "emaarpass_refresh_token";
export const EMAARPASS_EXPIRES_COOKIE = "emaarpass_expires_at";
/** Non-sensitive flag cookie to skip auth calls for anonymous users */
export const EMAARPASS_SESSION_FLAG = "emaarpass_session";

/** Short-lived OAuth flow cookies (authorize → callback) */
export const EMAARPASS_OAUTH_STATE = "emaarpass_oauth_state";
export const EMAARPASS_OAUTH_RETURN = "emaarpass_oauth_return";
export const EMAARPASS_OAUTH_LOCALE = "emaarpass_oauth_locale";
export const EMAARPASS_OAUTH_FLOW = "emaarpass_oauth_flow";

export function emaarpassSessionCookieOptions(maxAgeSeconds: number) {
    return {
        httpOnly: true as const,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        maxAge: maxAgeSeconds,
    };
}

export function applyEmaarPassTokenCookies(
    res: NextResponse,
    data: EmaarPassTokenResponse,
): void {
    const expiresIn = Number.isFinite(data.expires_in) ? data.expires_in : 3600;
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
    res.cookies.set(
        EMAARPASS_ACCESS_COOKIE,
        data.access_token,
        emaarpassSessionCookieOptions(expiresIn),
    );
    res.cookies.set(
        EMAARPASS_REFRESH_COOKIE,
        data.refresh_token,
        emaarpassSessionCookieOptions(60 * 60 * 24 * 365),
    );
    res.cookies.set(
        EMAARPASS_EXPIRES_COOKIE,
        String(expiresAt),
        emaarpassSessionCookieOptions(expiresIn),
    );
    // JS-readable flag so the client can decide whether to call /me.
    res.cookies.set(EMAARPASS_SESSION_FLAG, "1", {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
    });
}

export function clearEmaarPassSessionCookies(res: NextResponse): void {
    const empty = { path: "/", maxAge: 0 };
    res.cookies.set(EMAARPASS_ACCESS_COOKIE, "", empty);
    res.cookies.set(EMAARPASS_REFRESH_COOKIE, "", empty);
    res.cookies.set(EMAARPASS_EXPIRES_COOKIE, "", empty);
    res.cookies.set(EMAARPASS_SESSION_FLAG, "", empty);
}

export function clearEmaarPassOAuthFlowCookies(res: NextResponse): void {
    const empty = { path: "/", maxAge: 0 };
    res.cookies.set(EMAARPASS_OAUTH_STATE, "", empty);
    res.cookies.set(EMAARPASS_OAUTH_RETURN, "", empty);
    res.cookies.set(EMAARPASS_OAUTH_LOCALE, "", empty);
    res.cookies.set(EMAARPASS_OAUTH_FLOW, "", empty);
}
