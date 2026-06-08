export function imageUrl(src: string | null | undefined): string {
  const path = String(src ?? "").trim();
  if (!path) return "";

  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("//") ||
    path.startsWith("data:") ||
    path.startsWith("blob:")
  ) {
    return path;
  }

  // Keep local public assets as-is.
  const staticPrefixes = ["/images/", "/icons/", "/fonts/", "/videos/"];
  if (staticPrefixes.some((prefix) => path.startsWith(prefix))) {
    return path;
  }

  const base = String(process.env.NEXT_PUBLIC_IMAGE_BASE_URL ?? "")
    .trim()
    .replace(/\/$/, "");
  if (!base) return path;

  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
