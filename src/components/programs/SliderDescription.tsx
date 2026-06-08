"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface StudioSeriesSlide {
  imageSrc: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  imageAlt: string;
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

interface SliderDescriptionProps {
  title: string;
  slides: StudioSeriesSlide[];
  currentSlide: number;
  onPrev: () => void;
  onNext: () => void;
  mode: "image-only" | "with-description";
  variant?: "default" | "about-venues";
}

export default function SliderDescription({
  title,
  slides,
  currentSlide,
  onPrev,
  onNext,
  mode,
  variant = "default",
}: SliderDescriptionProps) {
  const styledPhrase = "Studio Concert Series";
  const hasStyledPhrase = title.includes(styledPhrase);
  const titlePrefix = hasStyledPhrase ? title.replace(styledPhrase, "").trimEnd() : title;
  const isAboutVenues = variant === "about-venues";
  const indicatorCount = Math.max(slides.length, isAboutVenues ? 2 : slides.length);
  const useOverlayText = slides.length > 1;

  return (
    <>
      <div className={`flex items-center justify-between gap-4 ${isAboutVenues ? "mb-8" : "mb-5 md:mb-8"}`}>
        <h3
          className={
            isAboutVenues
              ? "text-[40px] leading-[100%] tracking-normal text-white font-optima font-normal"
              : "font-optima font-normal text-[24px] leading-[110%] md:text-[34px] lg:text-[40px] lg:leading-[100%] tracking-normal text-white"
          }
        >
          {hasStyledPhrase ? (
            <>
              <span className="md:hidden">{titlePrefix} </span>
              <span className="md:hidden font-petit-formal font-normal text-[24px] leading-[100%] tracking-[-1.15px] text-center align-middle">
                {styledPhrase}
              </span>
              <span className="hidden md:inline">{title}</span>
            </>
          ) : (
            title
          )}
        </h3>
        <div className={isAboutVenues ? "hidden items-center gap-3 md:flex" : "flex items-center gap-2"}>
          <button
            onClick={onPrev}
            className={
              isAboutVenues
                ? "flex h-9 w-9 items-center justify-center rounded-full bg-white/30 text-xl leading-none text-white transition-colors hover:bg-white/40"
                : "flex h-9 w-9 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30 md:h-10 md:w-10"
            }
            aria-label="Previous studio slide"
          >
            <ChevronLeft size={isAboutVenues ? 20 : 18} className="text-white" strokeWidth={1.5} />
          </button>
          <button
            onClick={onNext}
            className={
              isAboutVenues
                ? "flex h-9 w-9 items-center justify-center rounded-full bg-white/30 text-xl leading-none text-white transition-colors hover:bg-white/40"
                : "flex h-9 w-9 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30 md:h-10 md:w-10"
            }
            aria-label="Next studio slide"
          >
            <ChevronRight size={isAboutVenues ? 20 : 18} className="text-white" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {mode === "with-description" ? (
        isAboutVenues ? (
          <div className="mt-8 grid gap-8 md:grid-cols-[1.15fr_0.85fr] md:items-center md:gap-12">
            <div className="relative order-2 h-62.5 overflow-hidden rounded-[14px] border border-white/15 sm:h-80 md:order-1 md:h-95">
              {slides.map((slide, index) => (
                <div
                  key={`${slide.imageSrc}-${index}`}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    index === currentSlide ? "opacity-100" : "pointer-events-none opacity-0"
                  }`}
                >
                  <Image src={slide.imageSrc} alt={slide.imageAlt} fill className="object-cover" />
                </div>
              ))}
              <div className="absolute bottom-4 left-6 z-10 flex gap-3">
                {Array.from({ length: indicatorCount }).map((_, index) => (
                  <span
                    key={`about-indicator-${index}`}
                    className={
                      index === currentSlide
                        ? "h-0.75 w-20 rounded-full bg-white"
                        : "h-0.75 w-10 rounded-full bg-white/45 sm:w-20"
                    }
                  />
                ))}
              </div>
            </div>

            <div
              className={`relative order-1 max-w-115 md:order-2 md:flex md:h-95 md:flex-col md:justify-center ${
                useOverlayText ? "min-h-65" : ""
              }`}
            >
              {slides.map((slide, index) => {
                const paragraphs = (slide.description ?? "")
                  .split(/\n\s*\n/)
                  .map((paragraph) => paragraph.trim())
                  .filter(Boolean);

                return (
                  <div
                    key={`${slide.title ?? "slide"}-${index}`}
                    className={
                      useOverlayText
                        ? `absolute inset-0 transition-opacity duration-700 ${
                            index === currentSlide ? "opacity-100" : "pointer-events-none opacity-0"
                          }`
                        : ""
                    }
                  >
                    {slide.title && (
                      <h4 className="text-[40px] text-white font-optima font-normal leading-[100%] tracking-normal">
                        {slide.title}
                      </h4>
                    )}

                    {paragraphs.length > 0 && (
                      <div className="font-montserrat text-[16px] font-normal text-white/88" style={{ lineHeight: "1.15", letterSpacing: "0" }}>
                        {paragraphs.map((paragraph, paragraphIndex) => (
                          <p
                            key={`${slide.title ?? "slide"}-paragraph-${paragraphIndex}`}
                            className={`${paragraphIndex === 0 ? "mt-5" : "mt-4"} max-w-105`}
                          >
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    )}

                    {slide.ctaLabel && (
                      <a
                        href={slide.ctaHref ?? "#"}
                        className="mt-6 inline-flex items-center justify-center rounded-md bg-primary-light px-9 py-4 font-montserrat text-[16px] font-medium leading-[100%] tracking-normal text-white transition-colors shadow-lg"
                      >
                        {slide.ctaLabel}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:gap-10">
            <div className="relative h-60 w-full overflow-hidden rounded-3xl sm:h-85 md:h-105 lg:w-[60%]">
              {slides.map((slide, index) => (
                <div
                  key={`${slide.imageSrc}-${index}`}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    index === currentSlide ? "opacity-100" : "pointer-events-none opacity-0"
                  }`}
                >
                  <Image src={slide.imageSrc} alt={slide.imageAlt} fill className="object-cover" />
                </div>
              ))}
            </div>

            <div className="relative min-h-75 w-full md:min-h-65 lg:w-[40%]">
              {slides.map((slide, index) => (
                <div
                  key={`${slide.title ?? "slide"}-${index}`}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    index === currentSlide ? "opacity-100" : "pointer-events-none opacity-0"
                  }`}
                >
                  {slide.title && (
                    <h4 className="mb-4 font-optima text-[24px] font-normal leading-[110%] text-white md:mb-5 md:text-[36px] lg:text-[40px] lg:leading-[100%]">
                      {slide.title}
                    </h4>
                  )}
                  {slide.description && (
                    <p className="mb-6 whitespace-pre-line font-montserrat text-[14px] leading-[110%] text-white md:mb-8 md:text-[15px] lg:text-[16px] lg:leading-[120%]">
                      {slide.description}
                    </p>
                  )}
                  {slide.ctaLabel && (
                    <a
                      href={slide.ctaHref ?? "#"}
                      className="inline-flex items-center justify-center rounded-md bg-primary-light px-9 py-4 font-montserrat text-[16px] font-medium leading-[100%] tracking-normal text-white shadow-lg transition-colors"
                    >
                      {slide.ctaLabel}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        <div className="relative w-full h-65 overflow-hidden rounded-3xl sm:h-90 md:h-115">
          {slides.map((slide, index) => (
            <div
              key={`${slide.imageSrc}-${index}`}
              className={`absolute inset-0 transition-opacity duration-700 ${
                index === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <Image src={slide.imageSrc} alt={slide.imageAlt} fill className="object-cover" />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
