import { NextResponse } from "next/server";
import { clearEmaarPassSessionCookies } from "@/services/emaarpassSessionCookies";

/** POST — clear EmaarPASS session cookies (client-side sign-out). */
export async function POST() {
    const res = NextResponse.json({ ok: true });
    clearEmaarPassSessionCookies(res);
    return res;
}
