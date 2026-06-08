"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

/* ────────────────────────────────────────────────────────────────────────────
 * Hero Carousel — Client Component
 *
 * Receives slide data as props from the SSR parent (home page).
 * The first slide is always the static branding slide; API banners follow.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface HeroSlide {
  banner_description?: string;
  banner_id: number;
  banner_image_url?: string;
  banner_link?: string | null;
  banner_name?: string;
  header_1?: string;
  header_2?: string;
  video?: string;
  textColor?: "dark" | "light";
}

interface HeroProps {
  slides: HeroSlide[];
}

export default function BannerSlider({ slides }: HeroProps) {
  // console.log(slides, 'slides Hero1');
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = useCallback(
    (index: number) => {
      if (index !== currentSlide) setCurrentSlide(index);
    },
    [currentSlide],
  );

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  const slide = slides[currentSlide];

  if (!slide) return null;

  // Active indicator cycles through 4 fixed buttons: 0 → 1 → 2 → 3 → 0 → ...
  const activeIndicator = currentSlide % 4;

  return (
    <section
      className="relative w-full h-screen overflow-hidden"
      aria-label="Hero carousel"
    >
      {/* Background Images/Videos with Crossfade */}
      {slides.map((s, index) => (
        <Link
          href={s.banner_link ?? "#"}
          key={s.banner_id}
          className={`absolute inset-0 flex justify-center items-center transition-opacity duration-[1200ms] ease-out ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
        >
          {s.video ? (
            <video
              src={s.video}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-contain"
            />
          ) : s.banner_image_url ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={s.banner_image_url}
                alt={s.banner_name ?? ""}
                fill
                className="object-contain"
                priority={index === 0}
              />
            </div>
          ) : null}

          {/* Bottom fade into page */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background-dark to-transparent pointer-events-none z-10" />
        </Link>
      ))}

      {/* Content - centered with refined typography */}
      {/* <div className="absolute top-0 left-0 right-0 z-20 text-center px-4 sm:px-6 max-w-7xl mx-auto mt-[150px] w-full left-1/2 -translate-x-1/2">
        <div key={currentSlide}>
          <div
            className={`mb-4 sm:mb-6 animate-fade-in-up uppercase font-optima ${slide.textColor === "dark"
                ? "text-[#1a1a1a]"
                : "text-white/90 text-shadow"
              }`}
          >
            <p className="text-xl sm:text-2xl md:text-[30px] tracking-[0.3em] mb-1 sm:mb-2 leading-none">
              {slide.header_1}
            </p>
            <p className="text-2xl sm:text-3xl md:text-[42px] tracking-[0.45em] ml-[0.45em] leading-none">
              {slide.header_2}
            </p>
          </div>
          <h1
            className={`flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 animate-fade-in-up delay-200 ${slide.textColor === "dark"
                ? "text-[#1a1a1a]"
                : "text-white text-shadow"
              }`}
          >
            <span className="text-4xl sm:text-5xl md:text-[60px] lg:text-[70px] font-optima uppercase tracking-[0.1em] whitespace-nowrap">
              {slide.banner_name}
            </span>
          </h1>
        </div>
      </div> */}

      {/* Carousel Controls - bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-6 sm:px-8 lg:px-12 py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Spacer for balance */}
          <div className="hidden sm:block w-12 h-12 shrink-0" aria-hidden />

          {/* Slide indicators - centered */}
          <div
            className="flex items-center justify-center gap-3 sm:flex-1"
            role="tablist"
            aria-label="Slide navigation"
          >
            {[0, 1, 2, 3].map((i) => {
              const offset = (i - activeIndicator + 4) % 4;
              const targetSlide = (currentSlide + offset) % slides.length;
              return (
                <button
                  key={i}
                  onClick={() => goToSlide(targetSlide)}
                  role="tab"
                  aria-selected={i === activeIndicator}
                  aria-label={`Go to slide ${targetSlide + 1}`}
                  className={`lg:h-[10px] lg:w-[140px] h-[5px] w-[60px] rounded-full transition-all duration-300 cursor-pointer ${i === activeIndicator
                    ? "bg-white"
                    : "bg-white/40 hover:bg-white/60"
                    }`}
                />
              );
            })}
          </div>

          {/* Navigation arrows */}
          <div className="flex items-center justify-end gap-3 shrink-0">
            <button
              onClick={prevSlide}
              className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 hover:border-white/30 transition-all duration-300"
              aria-label="Previous slide"
            >
              <ChevronLeft size={22} className="text-white" strokeWidth={1.5} />
            </button>
            <button
              onClick={nextSlide}
              className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 hover:border-white/30 transition-all duration-300"
              aria-label="Next slide"
            >
              <ChevronRight
                size={22}
                className="text-white"
                strokeWidth={1.5}
              />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}