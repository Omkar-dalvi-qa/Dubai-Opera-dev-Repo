// import type { ImageLoaderProps } from "next/image";

// export default function gumletLoader({
//   src,
//   width,
//   quality,
// }: ImageLoaderProps): string {
//   const q = quality ?? 80;

//   if (src.includes("<CURRENT_IMAGE_DOMAIN>")) {
//     const parsedUrl = new URL(src);
//     parsedUrl.hostname = "<your_gumlet_subdomain>.gumlet.io";
//     parsedUrl.searchParams.set("w", String(width));
//     parsedUrl.searchParams.set("q", String(q));
//     return parsedUrl.toString();
//   }

//   const joiner = src.includes("?") ? "&" : "?";
//   return `${src}${joiner}w=${width}&q=${q}`;
// }

type GumletLoaderProps = {
  src: string;
  width: number;
  quality?: number;
};

export default function gumletLoader({
  src,
  width,
  quality,
}: GumletLoaderProps): string {
  const imagePath = typeof src === 'object' ? (src as any).src : src;

  return `${imagePath}${imagePath.includes('?') ? '&' : '?'}w=${width}&q=${quality || 80}&auto=compress,format`;
}