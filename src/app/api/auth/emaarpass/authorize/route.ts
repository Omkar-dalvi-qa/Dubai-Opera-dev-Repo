import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import {
    EMAARPASS_OAUTH_FLOW,
    EMAARPASS_OAUTH_LOCALE,
    EMAARPASS_OAUTH_RETURN,
    EMAARPASS_OAUTH_STATE,
} from "@/services/emaarpassSessionCookies";
import {
    buildEmaarPassAuthorizeUrl,
    getEmaarPassRedirectUri,
    mapLocaleToEmaarPassLang,
} from "@/services/oauthService";
import { getPublicOriginFromRequest } from "@/lib/getPublicOriginFromRequest";

function sanitizeReturnTo(raw: string | null, locale: string): string {
    if (!raw || typeof raw !== "string") {
        return `/${locale}`;
    }
    const decoded = decodeURIComponent(raw);
    if (!decoded.startsWith("/") || decoded.startsWith("//")) {
        return `/${locale}`;
    }
    return decoded;
}

function cookieOptions(maxAge: number) {
    return {
        httpOnly: true as const,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        maxAge,
    };
}

/**
 * Starts the OAuth flow: sets CSRF state cookies and redirects the browser to EmaarPASS.
 * Query: mode=login|register, locale=en|ar, returnTo=encoded path (e.g. %2Fen%2Fprofile)
 */
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const publicOrigin = getPublicOriginFromRequest(request);
    const modeParam = searchParams.get("mode");
    const flow: "login" | "register" =
        modeParam === "register" ? "register" : "login";
    const localeParam = searchParams.get("locale") ?? "en";
    const locale = localeParam === "ar" ? "ar" : "en";
    const returnTo = sanitizeReturnTo(searchParams.get("returnTo"), locale);
    const state = randomBytes(32).toString("hex");
    const lang = mapLocaleToEmaarPassLang(locale);
    let redirectUri: string;
    let emaarUrl: string;
    try {
        redirectUri = getEmaarPassRedirectUri();
        emaarUrl = buildEmaarPassAuthorizeUrl({
            mode: flow,
            lang,
            state,
            redirectUri,
        });
        console.log("[emaarpass/authorize] Incoming (raw request.url):", request.url);
        console.log("[emaarpass/authorize] Public origin:", publicOrigin);
        console.log("[emaarpass/authorize] EMAAR_PASS_REDIRECT_URI (registered with SSO):", redirectUri);
        console.log("[emaarpass/authorize] returnTo (cookie after login):", returnTo);
        console.log("[emaarpass/authorize] flow / locale / lang:", { flow, locale, lang });
        console.log("[emaarpass/authorize] Redirecting browser to EmaarPASS:", emaarUrl);
    } catch {
        return NextResponse.json(
            {
                error: "EmaarPASS OAuth is not configured (check EMAAR_PASS_* env vars).",
            },
            { status: 500 },
        );
    }

    const res = NextResponse.redirect(emaarUrl);
    res.cookies.set(EMAARPASS_OAUTH_STATE, state, cookieOptions(600));
    // Store the raw path; Next will encode cookie values as needed.
    res.cookies.set(EMAARPASS_OAUTH_RETURN, returnTo, cookieOptions(600));
    res.cookies.set(EMAARPASS_OAUTH_LOCALE, locale, cookieOptions(600));
    res.cookies.set(
        EMAARPASS_OAUTH_FLOW,
        flow === "register" ? "register" : "login",
        cookieOptions(600),
    );
    return res;
}
