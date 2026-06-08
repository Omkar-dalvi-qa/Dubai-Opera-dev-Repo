// app/api/revalidate/route.ts
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-revalidate-secret");

  // if (secret !== process.env.REVALIDATE_SECRET) {
  //   return Response.json({ ok: false, message: "Invalid secret" }, { status: 401 });
  // }

  const body = await request.json();
  const rawPath = typeof body.path === "string" ? body.path.trim() : "";
  if (rawPath) {
    const path = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
    revalidatePath(path);
    return Response.json({
      ok: true,
      revalidated: true,
      path,
      now: new Date().toISOString(),
    });
  }

  const locale = body.locale;
  const slug = body.slug;

  if (!locale || !slug) {
    return Response.json(
      { ok: false, message: "Missing locale or slug" },
      { status: 400 }
    );
  }

  const normalizedSlug = String(slug).replace(/^\/+/, "");
  const path = normalizedSlug ? `/${locale}/${normalizedSlug}` : `/${locale}`;

  revalidatePath(path);

  return Response.json({
    ok: true,
    revalidated: true,
    path,
    now: new Date().toISOString(),
  });
}
