import { NextRequest, NextResponse } from "next/server";

const PUBLIC_FILE = /\.(.*)$/;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ✅ Skip auth for static/public files (same as your current logic)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/logo') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/videos') ||
    pathname.startsWith('/public') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // ✅ Apply Basic Auth (only if env vars exist)
  // const auth = request.headers.get("authorization");
  // const user = process.env.BASIC_AUTH_USER;
  // const pass = process.env.BASIC_AUTH_PASS;

  // if (user && pass) {
  //   if (!auth) {
  //     return new NextResponse("Authentication required", {
  //       status: 401,
  //       headers: {
  //         "WWW-Authenticate": 'Basic realm="Secure Area"',
  //       },
  //     });
  //   }

  //   const [scheme, encoded] = auth.split(" ");

  //   if (scheme !== "Basic") {
  //     return new NextResponse("Invalid auth scheme", { status: 400 });
  //   }

  //   const decoded = Buffer.from(encoded, "base64").toString();
  //   const [reqUser, reqPass] = decoded.split(":");

  //   if (reqUser !== user || reqPass !== pass) {
  //     return new NextResponse("Unauthorized", {
  //       status: 401,
  //       headers: {
  //         "WWW-Authenticate": 'Basic realm="Secure Area"',
  //       },
  //     });
  //   }
  // }

  // ✅ Your existing locale logic (unchanged)
  const hasLocale = pathname.startsWith('/en') || pathname.startsWith('/ar');

  if (!hasLocale) {
    return NextResponse.redirect(new URL(`/en${pathname}`, request.url));
  }

  return NextResponse.next();
}
