"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
export type AboutVenuesSlide = {
  imageSrc: string;
  imageAlt: string;
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

interface AboutVenuesSectionProps {
  slides: AboutVenuesSlide[];
}

export default function AboutVenuesSection({ slides }: AboutVenuesSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const pathname = usePathname();
  const t = useTranslations("about.venues");
  const locale = pathname.split("/")[1];
  const dir = locale === "ar" ? "rtl" : "ltr";
  const isRtl = dir === "rtl";

  if (slides.length === 0) return null;

  const goToPreviousSlide = () => {
    if (slides.length <= 1) return;
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNextSlide = () => {
    if (slides.length <= 1) return;
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <section className="relative w-full px-4 py-2 sm:px-6 md:px-0 md:py-10">
      <div className="mx-auto w-full max-w-[1400px] pt-10">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-optima text-[40px] font-normal leading-[100%] tracking-normal text-white md:text-[58px]">
            {t("title")}
          </h3>

          {slides.length > 1 ? (
            <div className="flex items-center gap-3 md:gap-4">
              <button
                type="button"
                onClick={goToPreviousSlide}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/28 text-white backdrop-blur-sm transition-colors hover:bg-white/36 md:h-[52px] md:w-[52px]"
                aria-label={t("showPreviousVenue")}
              >
                {isRtl ? <ChevronRight size={26} strokeWidth={1.6} /> : <ChevronLeft size={26} strokeWidth={1.6} />}
              </button>
              <button
                type="button"
                onClick={goToNextSlide}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/28 text-white backdrop-blur-sm transition-colors hover:bg-white/36 md:h-[52px] md:w-[52px]"
                aria-label={t("showNextVenue")}
              >
                {isRtl ? <ChevronLeft size={26} strokeWidth={1.6} /> : <ChevronRight size={26} strokeWidth={1.6} />}
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-10 grid items-start gap-8 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:gap-12">
          <div className="relative h-[320px] overflow-hidden rounded-[28px] border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.35)] sm:h-[400px] md:h-[460px]">
            {slides.map((slide, index) => (
              <div
                key={`${slide.imageSrc}-${index}`}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  index === currentSlide ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                <Image src={slide.imageSrc} alt={slide.imageAlt} fill className="object-cover" />
                <div className="absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-black/65 via-black/20 to-transparent" />
              </div>
            ))}

            {slides.length > 1 ? (
              <div className="absolute inset-x-0 bottom-6 z-10 flex justify-center px-6 sm:bottom-8">
                <div className="flex items-center justify-center gap-3 sm:gap-4">
                  {slides.map((slide, index) => (
                    <button
                      key={`${slide.title ?? slide.imageAlt}-indicator-${index}`}
                      type="button"
                      onClick={() => setCurrentSlide(index)}
                      aria-label={t("showSlide", { name: slide.title ?? slide.imageAlt })}
                      aria-current={index === currentSlide}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        index === currentSlide
                          ? "w-20 bg-white sm:w-24 md:w-28"
                          : "w-12 bg-white/35 hover:bg-white/55 sm:w-16 md:w-20"
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative min-h-[300px] md:min-h-[460px]" aria-live="polite">
            {slides.map((slide, index) => {
              const paragraphs = (slide.description ?? "")
                .split(/\n\s*\n/)
                .map((paragraph) => paragraph.trim())
                .filter(Boolean);

              return (
                <div
                  key={`${slide.title ?? slide.imageAlt}-content-${index}`}
                  className={`transition-opacity duration-500 md:absolute md:inset-0 ${
                    index === currentSlide ? "opacity-100" : "pointer-events-none opacity-0 md:absolute"
                  } ${index === currentSlide ? "relative" : "hidden md:block"}`}
                >
                  {slide.title ? (
                    <h4 className="font-optima text-[36px] font-normal leading-[100%] tracking-normal text-white md:text-[52px]">
                      {slide.title}
                    </h4>
                  ) : null}

                  {paragraphs.length > 0 ? (
                    <div className="mt-8 max-w-[540px] font-montserrat text-[16px] font-normal leading-[1.28] text-white/92">
                      {paragraphs.map((paragraph, paragraphIndex) => (
                        <p key={`${slide.title ?? slide.imageAlt}-paragraph-${paragraphIndex}`} className={paragraphIndex === 0 ? "" : "mt-8"}>
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
