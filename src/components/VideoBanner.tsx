"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Heart, MapPin, Share2 } from "lucide-react";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { isValidLocale, type Locale } from "@/i18n/config";
import { imageUrl } from "@/utils/imageUrl";

function isVideoFileUrl(url: string): boolean {
  return /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(String(url ?? "").trim());
}

function toYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;

  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([^&?/]+)/
  );

  const id = match?.[1];
  if (!id) return null;

  return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&rel=0&modestbranding=1&playsinline=1`;
}

interface VideoBannerProps {
  /** API `media_url` — may be a video or image; drives hero when set. */
  mediaUrl?: string | null;
  /** Preferred hero image URL (e.g. website banner from `images[]`). */
  websiteBannerUrl?: string | null;
  /** Mobile hero image URL (e.g. mobile banner from `images[]`). */
  mobileBannerUrl?: string | null;
  /** API `thumbnail_url` — poster for video hero, or image hero when there is no `media_url`. */
  thumbnailUrl?: string | null;
  /** Fallback clip when API sends no usable hero media (e.g. program default). Disabled in useMemo — see comment block there; empty hero uses `/images/fallback.png`. */
  fallbackVideoSrc?: string;
  /** Alias for `fallbackVideoSrc` (e.g. studio pages that only pass a single clip). */
  videoSrc?: string;
  backHref?: string;
  title?: string;
  venueName?: string;
  scheduleScreenNames?: string[];
}

export default function VideoBanner({
  mediaUrl,
  websiteBannerUrl,
  mobileBannerUrl,
  fallbackVideoSrc,
  videoSrc,
  backHref = "",
  title,
  venueName = "Dubai Opera House",
  scheduleScreenNames = [],
}: VideoBannerProps) {
  const pathname = usePathname();
  const localeSegment = pathname.split("/")[1] ?? "";
  const locale: Locale = isValidLocale(localeSegment) ? localeSegment : "en";
  const isArabic = locale === "ar";

  const [isFavorite, setIsFavorite] = useState(false);
  const venueLabel = useMemo(() => {
    const screenNames = Array.from(
      new Set((scheduleScreenNames ?? []).map((name) => String(name ?? "").trim()).filter(Boolean)),
    );
    return screenNames.length > 0 ? screenNames.join(", ") : venueName;
  }, [scheduleScreenNames, venueName]);

  const {
    mediaType,
    videoSrc: resolvedVideo,
    imageSrc: resolvedImage,
    mobileImageSrc: resolvedMobileImage,
    youtubeEmbedUrl,
    poster,
  } = useMemo(() => {
    const media = String(mediaUrl ?? "").trim();
    const banner = String(websiteBannerUrl ?? "").trim();
    const mobileBanner = String(mobileBannerUrl ?? "").trim();
    const yt = toYouTubeEmbedUrl(media);

    // Order: 1) website banner image, 2) YouTube (from mediaUrl), 3) video file (from mediaUrl), 4) static fallback image
    if (banner) {
      return {
        mediaType: "image" as const,
        imageSrc: banner,
        mobileImageSrc: mobileBanner,
        videoSrc: "",
        youtubeEmbedUrl: "",
        poster: undefined,
      };
    }

    if (yt) {
      return {
        mediaType: "youtube" as const,
        videoSrc: "",
        imageSrc: "",
        mobileImageSrc: "",
        youtubeEmbedUrl: yt,
        poster: undefined,
      };
    }

    if (media && isVideoFileUrl(media)) {
      return {
        mediaType: "video" as const,
        videoSrc: media,
        imageSrc: "",
        mobileImageSrc: "",
        youtubeEmbedUrl: "",
        poster: undefined,
      };
    }

    // Default hero video when nothing else matched (disabled — show `/images/fallback.png` instead).
    // const fallbackVideo = String(fallbackVideoSrc ?? videoSrc ?? "").trim();
    // if (fallbackVideo) {
    //   return {
    //     mediaType: "video" as const,
    //     videoSrc: fallbackVideo,
    //     imageSrc: "",
    //     mobileImageSrc: "",
    //     youtubeEmbedUrl: "",
    //     poster: undefined,
    //   };
    // }

    return {
      mediaType: "image" as const,
      imageSrc: "/images/fallback.png",
      mobileImageSrc: "/images/fallback.png",
      videoSrc: "",
      youtubeEmbedUrl: "",
      poster: undefined,
    };
  }, [mediaUrl, websiteBannerUrl, mobileBannerUrl, fallbackVideoSrc, videoSrc]);

  const videoPlay = resolvedVideo;
  const posterImage = poster ? imageUrl(poster) : undefined;
  const bannerImage = imageUrl(resolvedImage);
  const mobileBannerImage = imageUrl(resolvedMobileImage || resolvedImage);

  const hasImage = Boolean(resolvedImage);
  const hasYoutube = Boolean(youtubeEmbedUrl);
  const hasVideo = Boolean(resolvedVideo);

  const useImage = mediaType === "image" && hasImage;
  const useYoutube = mediaType === "youtube" && hasYoutube;
  const useVideo = !useImage && mediaType === "video" && hasVideo;

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: title ?? document.title,
          url: window.location.href,
        })
        .catch(() => {
          navigator.clipboard?.writeText(window.location.href);
        });
    } else {
      navigator.clipboard?.writeText(window.location.href);
    }
  };

  const mediaAlt = title ? `${title} — banner` : "Event banner";

  const BackChevron = isArabic ? ChevronRight : ChevronLeft;
  const backLabel = isArabic ? "رجوع" : "Back";

  return (
    <section className="w-full">
      <div className="relative w-full h-full">
        {useImage ? (
          <>
            <Image
              src={mobileBannerImage}
              alt={mediaAlt}
              priority
              fetchPriority="high"
              className="w-full h-full object-cover md:hidden "
              width={1000}
              height={1000}
              sizes="100vw"
            />
            <Image
              src={bannerImage}
              alt={mediaAlt}
              width={1000}
              height={1000}
              priority
              fetchPriority="high"
              className="hidden w-full h-full xl:h-[550px] object-contain 2xl:object-cover md:block"
              sizes="100vw"
            />
          </>
        ) : useYoutube ? (
          <iframe
            className="h-full w-full"
            src={youtubeEmbedUrl}
            title={mediaAlt}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : useVideo ? (
          <video
            className="h-full w-full object-cover"
            src={videoPlay}
            poster={posterImage}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : null}
               <div className="absolute bottom-0 left-0 w-full h-1/3 bg-linear-to-t from-[#000000] via-[#000000]/80 to-transparent pointer-events-none z-1" />

        <div className="pointer-events-none absolute inset-0 z-10 px-4 md:px-8 lg:px-12">
          <div className="relative mx-auto h-full w-full max-w-650 lg:max-w-7xl">
            <Link
              href={backHref}
              lang={isArabic ? "ar" : "en"}
              className={`pointer-events-auto absolute ${isArabic ? "right-0" : "left-0"} top-24 inline-flex max-w-[550px] -translate-y-1/2 items-center gap-1 font-montserrat text-[14px] leading-[31px] text-white transition-colors hover:text-white`}
            >
              {isArabic ? (
                <>
                  {backLabel}
                  <BackChevron size={20} aria-hidden />
                </>
              ) : (
                <>
                  <BackChevron size={20} aria-hidden />
                  {backLabel}
                </>
              )}
            </Link>
          </div>
        </div>
      </div>

      {title && (
        <div className="w-full px-4 pt-4 pb-3 md:px-8  md:pb-4 lg:px-12">
          <div className="mx-auto w-full max-w-650 lg:max-w-7xl">
            <div className="lg:hidden">
              <div className="flex items-end gap-3">
                <h1 className="min-w-0 flex-1 font-optima text-[36px] font-normal leading-[40px] tracking-normal text-white">
                  {title}
                </h1>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white"
                    aria-label="Share"
                  >
                    <Share2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFavorite((v) => !v)}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border border-white/20 ${isFavorite ? "bg-black/45 text-primary-light" : "bg-black/45 text-white"
                      }`}
                    aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Heart size={16} stroke="white" fill={isFavorite ? "#792327" : "none"} />
                  </button>
                </div>
              </div>
              <p className="mt-1 inline-flex items-center gap-1.5 font-montserrat text-[12px] font-normal leading-[100%] text-white/85">
                <MapPin size={14} className="shrink-0" />
                {venueLabel}
              </p>
            </div>

            <div className="hidden lg:block">
              <h1 className="max-w-7xl font-optima text-[40px] font-normal leading-[50px] tracking-normal text-white">
                {title}
              </h1>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
