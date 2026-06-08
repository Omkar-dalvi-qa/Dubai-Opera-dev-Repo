import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface BannerProps {
  subtitle?: string;
  title: string;
  /** When set with `titleScript`, renders a two-part headline (Optima + script). */
  titleOptima?: string;
  titleScript?: string;
  showOverlay?: boolean;
  mediaType?: "video" | "image";
  mediaSrc?: string;
  height?: string;
  mobileHeight?: string;
  backHref?: string;
  backLabel?: string;
  hideMobileGradient?: boolean;
  className?: string;
  isBannerImageOverlay?: boolean;
}

export default function Banner({
  subtitle = "WHAT'S ON",
  title,
  titleOptima,
  titleScript,
  showOverlay = true,
  mediaType,
  height,
  mobileHeight = "250px",
  mediaSrc,
  backHref,
  backLabel = "Back",
  hideMobileGradient = false,
  className = "",
}: BannerProps) {
  const hasSubtitle = subtitle.trim().length > 0;
  const hasSplitTitle =
    Boolean(titleOptima?.trim()) || Boolean(titleScript?.trim());
  const videoClassName = "absolute inset-0 h-full w-full object-cover";

  const sectionClassName = height
    ? "relative w-full flex flex-col items-center justify-center overflow-hidden"
    : "relative w-full lg:mt-0 lg:py-10 xl:py-24 py-16 flex flex-col items-center justify-center overflow-hidden";

  const sectionStyle = {
    "--mobile-h": mobileHeight,
    "--desktop-h": height || "auto",
  } as React.CSSProperties;
  const mobileTextOverlayBackground = hideMobileGradient
    ? "transparent"
    : `linear-gradient(
    to top,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0) 40%,
    rgba(0, 0, 0, 0) 70%
  )`;

  return (
    <section
      className={`banner-section ${sectionClassName} ${className}`}
      style={sectionStyle}
    >
      <style>{`
        .banner-section {
          height: var(--mobile-h) !important;
          min-height: var(--mobile-h) !important;
          margin-top: 0 !important;
        }
        @media (min-width: 1024px) {
          .banner-section {
            height: var(--desktop-h) !important;
            min-height: var(--desktop-h) !important;
            margin-top: 0 !important;
          }
        }
        @media (max-width: 1023px) {
          .banner-video-wrapper {
             z-index: 6 !important;
          }
          .banner-text-overlay {
            z-index: 20 !important;
          background: ${mobileTextOverlayBackground};
          }
        }
      `}</style>
      {mediaType === "video" && mediaSrc && (
        <div className="banner-video-wrapper absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-b from-black/90 to-transparent pointer-events-none z-1" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-linear-to-t from-[#000000] via-[#000000]/80 to-transparent pointer-events-none z-1" />
          <video
            className={videoClassName}
            src={mediaSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden
          />
        </div>
      )}
      {mediaType === "image" && mediaSrc && (
        <Image
          src={mediaSrc}
          alt="image banner"
          fill
          priority
          className="absolute inset-0 object-cover"
          aria-hidden
        />
      )}
       {/* news page */}
      {mediaType === "image" && mediaSrc && (
        <div
          className={`${hideMobileGradient ? "hidden md:block " : ""} absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black`}
        />
      )}
      {backHref ? (
        <Link
          href={backHref}
          className="absolute left-4 top-7 md:top-10 z-14 inline-flex  items-center gap-1 text-sm text-white/90 transition-colors hover:text-white md:left-6 lg:left-12 lg:top-[20%] font-montserrat"
        >
          <ChevronLeft size={20} />
          {backLabel}
        </Link>
      ) : null}

{showOverlay && (
<div
        className="absolute inset-0 pointer-events-none z-11 hidden md:block"
        style={{
          background: `radial-gradient(
            ellipse 80% 40% at 50% 50%,
            rgba(0, 0, 0, 0.72) 0%,
            rgba(0, 0, 0, 0.45) 40%,
            transparent 100%
          )`,
        }}
      />
)}

      <div className="banner-text-overlay absolute inset-0 z-12 flex flex-col items-center justify-center sm:px-6 text-center">
        {hasSubtitle && (
          <p className="font-optima font-normal text-[20px] leading-[100%] tracking-[0.5em] md:text-[30px] md:leading-none md:tracking-[0.5em] md:uppercase text-white text-center mb-3">
            {subtitle}
          </p>
        )}

        <h1 className="text-white text-center">
         
            <span className="font-optima whitespace-pre-line font-normal text-[32px] leading-[100%] tracking-widest md:uppercase md:text-[70px] md:leading-none md:tracking-widest text-white">
              {title}
            </span>
        </h1>
      </div>
    </section>
  );
}
