import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { EMAARPASS_ACCESS_COOKIE } from "@/services/emaarpassSessionCookies";

/** GET — lightweight check: do we have an auth session cookie? */
export async function GET() {
    const jar = await cookies();
    const hasSession = Boolean(jar.get(EMAARPASS_ACCESS_COOKIE)?.value);
    return NextResponse.json({ hasSession });
}

