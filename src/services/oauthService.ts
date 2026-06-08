/**
 * EmaarPASS OAuth 2.0 Authorization Code flow — server-side only.
 * Never import this module from client components; the client secret must stay on the server.
 */

import type { ApiResponse } from "@/types";

const TOKEN_TIMEOUT_MS = 15_000;

function getRequiredEnv(name: string): string {
    const v = process.env[name];
    if (!v?.trim()) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return v.trim().replace(/\/$/, "");
}

/** Base URL without trailing slash, e.g. https://dev-accounts-emaar-com.azurewebsites.net */
export function getEmaarPassDomain(): string {
    return getRequiredEnv("EMAAR_PASS_DOMAIN");
}

export function getEmaarPassClientId(): string {
    return getRequiredEnv("EMAAR_PASS_CLIENT_ID");
}

export function getEmaarPassClientSecret(): string {
    return getRequiredEnv("EMAAR_PASS_CLIENT_SECRET");
}

/** Must match a whitelisted redirect URI exactly (scheme, host, path). */
export function getEmaarPassRedirectUri(): string {
    return getRequiredEnv("EMAAR_PASS_REDIRECT_URI");
}

/** Maps app locale to EmaarPASS URL language prefix (en, ar, …). */
export function mapLocaleToEmaarPassLang(locale: string): string {
    const map: Record<string, string> = {
        en: "en",
        ar: "ar",
    };
    return map[locale] ?? "en";
}

export type EmaarPassTokenResponse = {
    access_token: string;
    refresh_token: string;
    id_token: string;
    expires_in: number;
    token_type?: string;
};

export type EmaarPassTokenErrorBody = {
    error?: string;
    error_description?: string;
    message?: string;
};

export type EmaarPassUserProfile = {
    sub?: string;
    email?: string;
    phone_number?: string;
    first_name?: string | null;
    last_name?: string | null;
    date_of_birth?: string | null;
    gender?: string | null;
    nationality?: string | null;
    address_1?: string | null;
    address_city?: string | null;
    address_country?: string | null;
    address_zip?: string | null;
    [key: string]: unknown;
};

export type EmaarPassProfileUpdateBody = {
    first_name?: string;
    last_name?: string;
    date_of_birth?: string;
    nationality?: string;
    email?: string;
    gender?: string;
    address_1?: string;
    address_city?: string;
    address_country?: string;
    address_zip?: string;
};

/**
 * Build the browser redirect URL for sign-in or sign-up (Authorization Code flow).
 * @see EmaarPASS docs — next=/en/oauth/authorize, response_type=code, scope=openid
 */
export function buildEmaarPassAuthorizeUrl(options: {
    mode: "login" | "register";
    lang: string;
    state: string;
    redirectUri: string;
}): string {
    const domain = getEmaarPassDomain();
    const clientId = getEmaarPassClientId();
    const pathSegment = options.mode === "register" ? "user/register" : "user/login";
    const base = `${domain}/${options.lang}/${pathSegment}`;
    // EmaarPASS appends OAuth params to `next` using '&'. If `next` doesn't already contain '?',
    // it can generate an invalid URL and land on "Not Found". Ensure '?' is present.
    // Also include client_id in `next` so downstream verify flows still have a fully-formed authorize URL.
    const next = `/${options.lang}/oauth/authorize?client_id=${encodeURIComponent(clientId)}`;
    const params = new URLSearchParams({
        next,
        client_id: clientId,
        response_type: "code",
        redirect_uri: options.redirectUri,
        state: options.state,
    });
    return `${base}?${params.toString()}`;
}

async function postForm(
    path: string,
    body: URLSearchParams,
): Promise<{ ok: boolean; status: number; json: unknown }> {
    const domain = getEmaarPassDomain();
    const url = `${domain}${path.startsWith("/") ? path : `/${path}`}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TOKEN_TIMEOUT_MS);
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: body.toString(),
            signal: controller.signal,
            cache: "no-store",
        });
        const contentType = res.headers.get("content-type");
        let json: unknown = null;
        if (contentType?.includes("application/json")) {
            json = await res.json();
        }
        return { ok: res.ok, status: res.status, json };
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Exchange the short-lived authorization code for tokens (server-to-server).
 */
export async function exchangeAuthorizationCode(
    code: string,
    redirectUri: string,
): Promise<ApiResponse<EmaarPassTokenResponse>> {
    const body = new URLSearchParams({
        grant_type: "authorization_code",
        client_id: getEmaarPassClientId(),
        client_secret: getEmaarPassClientSecret(),
        code,
        redirect_uri: redirectUri,
    });

    const { ok, status, json } = await postForm("/oauth/token", body);
    if (!ok || !json || typeof json !== "object") {
        const err = json as EmaarPassTokenErrorBody | null;
        return {
            data: null,
            error: {
                message:
                    err?.error_description ??
                    err?.error ??
                    err?.message ??
                    "Token exchange failed",
                status,
                code: err?.error,
            },
            status,
        };
    }

    const data = json as EmaarPassTokenResponse;
    if (!data.access_token) {
        return {
            data: null,
            error: { message: "Invalid token response", status },
            status,
        };
    }

    return { data, error: null, status };
}

/**
 * Obtain a new access token using a refresh token (refresh tokens are one-time use per EmaarPASS).
 */
export async function refreshAccessToken(
    refreshToken: string,
): Promise<ApiResponse<EmaarPassTokenResponse>> {
    const body = new URLSearchParams({
        grant_type: "refresh_token",
        client_id: getEmaarPassClientId(),
        client_secret: getEmaarPassClientSecret(),
        refresh_token: refreshToken,
    });

    const { ok, status, json } = await postForm("/oauth/token", body);
    if (!ok || !json || typeof json !== "object") {
        const err = json as EmaarPassTokenErrorBody | null;
        return {
            data: null,
            error: {
                message:
                    err?.error_description ??
                    err?.error ??
                    err?.message ??
                    "Refresh token exchange failed",
                status,
                code: err?.error,
            },
            status,
        };
    }

    const data = json as EmaarPassTokenResponse;
    if (!data.access_token) {
        return {
            data: null,
            error: { message: "Invalid refresh response", status },
            status,
        };
    }

    return { data, error: null, status };
}

/**
 * GET /api/v1/user/me — Bearer access_token
 */
export async function getUserProfile(
    accessToken: string,
): Promise<ApiResponse<EmaarPassUserProfile>> {
    const domain = getEmaarPassDomain();
    const url = `${domain}/api/v1/user/me`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TOKEN_TIMEOUT_MS);
    try {
        const res = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/json",
            },
            signal: controller.signal,
            cache: "no-store",
        });
        const contentType = res.headers.get("content-type");
        let data: unknown = null;
        if (contentType?.includes("application/json")) {
            data = await res.json();
        }
        console.log("getUserProfile", data);
        if (!res.ok) {
            const err = data as Record<string, unknown> | null;
            return {
                data: null,
                error: {
                    message: (err?.message as string) ?? res.statusText,
                    status: res.status,
                },
                status: res.status,
            };
        }
        return {
            data: data as EmaarPassUserProfile,
            error: null,
            status: res.status,
        };
    } catch (err) {
        const isAbort = err instanceof DOMException && err.name === "AbortError";
        return {
            data: null,
            error: {
                message: isAbort ? "Request timed out" : (err as Error).message,
                status: 0,
                code: isAbort ? "TIMEOUT" : "NETWORK_ERROR",
            },
            status: 0,
        };
    } finally {
        clearTimeout(timer);
    }
}

/**
 * PATCH /api/v1/user/me — Bearer access_token
 */
export async function updateUserProfile(
    accessToken: string,
    body: EmaarPassProfileUpdateBody,
): Promise<ApiResponse<EmaarPassUserProfile>> {
    const domain = getEmaarPassDomain();
    const url = `${domain}/api/v1/user/me`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TOKEN_TIMEOUT_MS);
    try {
        const res = await fetch(url, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(body),
            signal: controller.signal,
            cache: "no-store",
        });
        const contentType = res.headers.get("content-type");
        let data: unknown = null;
        if (contentType?.includes("application/json")) {
            data = await res.json();
        }
        if (!res.ok) {
            const err = data as Record<string, unknown> | null;
            return {
                data: null,
                error: {
                    message: (err?.message as string) ?? res.statusText,
                    status: res.status,
                },
                status: res.status,
            };
        }
        return {
            data: data as EmaarPassUserProfile,
            error: null,
            status: res.status,
        };
    } catch (err) {
        const isAbort = err instanceof DOMException && err.name === "AbortError";
        return {
            data: null,
            error: {
                message: isAbort ? "Request timed out" : (err as Error).message,
                status: 0,
                code: isAbort ? "TIMEOUT" : "NETWORK_ERROR",
            },
            status: 0,
        };
    } finally {
        clearTimeout(timer);
    }
}
