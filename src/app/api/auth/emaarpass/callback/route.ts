import { NextRequest, NextResponse } from "next/server";
import {
  applyEmaarPassTokenCookies,
  clearEmaarPassOAuthFlowCookies,
  EMAARPASS_OAUTH_LOCALE,
  EMAARPASS_OAUTH_RETURN,
  EMAARPASS_OAUTH_STATE,
} from "@/services/emaarpassSessionCookies";

import {
  exchangeAuthorizationCode,
  getEmaarPassRedirectUri,
  getUserProfile,
} from "@/services/oauthService";

import {
  getCustomerByEmaarId,
  createCustomer,
} from "@/services/websiteServer";
import { getPublicOriginFromRequest } from "@/lib/getPublicOriginFromRequest";

/** Log SSO callback query params without leaking the one-time authorization code. */
function logSsoCallbackParams(searchParams: URLSearchParams) {
  const entries: Record<string, string | number | boolean> = {};
  searchParams.forEach((value, key) => {
    if (key === "code") {
      entries.code = value ? `[redacted, length=${value.length}]` : "(empty)";
      return;
    }
    entries[key] = value;
  });
  console.log("[emaarpass/callback] SSO query params:", entries);
}

/**
 * OAuth redirect_uri target
 */
export async function GET(request: NextRequest) {
  const publicOrigin = getPublicOriginFromRequest(request);

  console.log("[emaarpass/callback] Incoming URL (raw request.url):", request.url);
  console.log("[emaarpass/callback] Public origin (redirects use this):", publicOrigin);
  logSsoCallbackParams(request.nextUrl.searchParams);

  // 🌐 Locale
  const locale =
    request.cookies.get(EMAARPASS_OAUTH_LOCALE)?.value === "ar"
      ? "ar"
      : "en";

  const authPath = `/${locale}`;

  // ❌ Handle provider error
  const errParam = request.nextUrl.searchParams.get("error");
  const errDesc = request.nextUrl.searchParams.get("error_description");

  if (errParam) {
    console.log("[emaarpass/callback] SSO returned error:", { error: errParam, error_description: errDesc });
    const res = NextResponse.redirect(
      new URL(
        `${authPath}?error=${encodeURIComponent(
          errParam
        )}&detail=${encodeURIComponent(errDesc ?? "")}`,
        publicOrigin
      )
    );
    clearEmaarPassOAuthFlowCookies(res);
    return res;
  }

  // 🔐 Validate state
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState =
    request.cookies.get(EMAARPASS_OAUTH_STATE)?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    console.log("[emaarpass/callback] State/code validation failed:", {
      hasCode: Boolean(code),
      hasStateParam: Boolean(state),
      hasExpectedStateCookie: Boolean(expectedState),
      stateMatches: Boolean(expectedState && state === expectedState),
    });
    const res = NextResponse.redirect(
      new URL(`${authPath}?error=invalid_state`, publicOrigin)
    );
    clearEmaarPassOAuthFlowCookies(res);
    return res;
  }

  // 🔗 Redirect URI (must match value sent to authorize + token endpoint)
  let redirectUri: string;
  try {
    redirectUri = getEmaarPassRedirectUri();
    console.log(
      "[emaarpass/callback] EMAAR_PASS_REDIRECT_URI (sent to token exchange, must match SSO app):",
      redirectUri,
    );
  } catch {
    const res = NextResponse.redirect(
      new URL(`${authPath}?error=config`, publicOrigin)
    );
    clearEmaarPassOAuthFlowCookies(res);
    return res;
  }

  // 🔄 Exchange code → token
  const tokenResult = await exchangeAuthorizationCode(
    code,
    redirectUri
  );

  if (tokenResult.error || !tokenResult.data) {
    const msg =
      tokenResult.error?.message ?? "token_exchange_failed";

    const res = NextResponse.redirect(
      new URL(
        `${authPath}?error=token&detail=${encodeURIComponent(msg)}`,
        publicOrigin
      )
    );
    clearEmaarPassOAuthFlowCookies(res);
    return res;
  }

  // 🍪 Prepare response (we’ll override later)
  const tempRes = NextResponse.next();
  applyEmaarPassTokenCookies(tempRes, tokenResult.data);

  // 👤 Fetch profile
  let profileData: any = null;

  try {
    const profile = await getUserProfile(
      tokenResult.data.access_token
    );

    if (!profile.error && profile.data) {
      profileData = profile.data;
    }
  } catch (e) {
    console.error("PROFILE FETCH ERROR:", e);
  }

  // 🧠 Check user
  let isNewUser = false;

  if (profileData?.id) {
    try {
      const existingUser = await getCustomerByEmaarId(
        profileData.id as string
      );

      if ("data" in existingUser) {
        isNewUser = false;
      } else {
        isNewUser = true;
      }
    } catch (e) {
      console.error("DB CHECK ERROR:", e);
      isNewUser = true;
    }
  }

  // 🆕 Create user if new
  if (isNewUser && profileData) {
    try {
      await createCustomer({
        emmarId: profileData.id ?? "",
        firstName: profileData.first_name ?? "",
        lastName: profileData.last_name ?? "",
        email: profileData.email ?? "",
        mobileNumber: profileData.number ?? "",
      });
    } catch (e) {
      console.error("CREATE CUSTOMER ERROR:", e);
    }
  }

  // 🎯 Get return path (VERY IMPORTANT PART)
  const returnRaw =
    request.cookies.get(EMAARPASS_OAUTH_RETURN)?.value;

  const defaultReturnPath = `/${locale}`;
  let safeReturnPath = defaultReturnPath;

  if (returnRaw) {
    try {
      const decoded = decodeURIComponent(returnRaw);

      // 🔒 security check
      if (
        decoded.startsWith("/") &&
        !decoded.startsWith("//")
      ) {
        safeReturnPath = decoded;
      }
    } catch {
      safeReturnPath = defaultReturnPath;
    }
  }

  let returnPath: string;

  if (isNewUser) {
    // 👉 go to onboarding but keep original path
    returnPath = `/${locale}/onboarding?redirect=${encodeURIComponent(
      safeReturnPath
    )}`;
  } else {
    // 👉 go back to same page
    returnPath = safeReturnPath;
  }

  console.log("[emaarpass/callback] Post-login redirect path:", returnPath, "| isNewUser:", isNewUser);
  console.log(
    "[emaarpass/callback] Final Location:",
    new URL(returnPath, publicOrigin).toString(),
  );

  // 🚀 Final redirect response
  const redirectRes = NextResponse.redirect(
    new URL(returnPath, publicOrigin)
  );

  // 🍪 Apply auth cookies
  applyEmaarPassTokenCookies(redirectRes, tokenResult.data);

  // 🧹 Cleanup OAuth cookies
  clearEmaarPassOAuthFlowCookies(redirectRes);

  return redirectRes;
}