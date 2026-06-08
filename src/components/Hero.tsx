"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { heroStore } from "@/store/heroStore";

interface Slide {
  id: number;
  image: string;
  bgImage?: string;
  textColor?: 'dark' | 'light';
  video?: string;
  subtitle1: string;
  subtitle2: string;
  titleMain: string;
  titleItalic: string;
}

type BannerRecord = {
  banner_id: number;
  banner_image_url: string;
  header_1: string;
  header_2: string;
  banner_name: string;
};

function mapBannersToSlides(banners: BannerRecord[]): Slide[] {
  return banners.map((b) => ({
    id: b.banner_id,
    image: b.banner_image_url,
    subtitle1: b.header_1,
    subtitle2: b.header_2,
    titleMain: b.banner_name,
    titleItalic: "",
    textColor: "light" as const,
  }));
}

const DEFAULT_SLIDES: Slide[] = [
  {
    id: 1,
    image: "/images/hero1.webp",
    bgImage: "/images/Main.webp",
    textColor: 'dark',
    // video: "https://cdn.pixabay.com/video/2020/05/25/40112-424075591_large.mp4",
    subtitle1: "Discover",
    subtitle2: "Dubai Opera",
    titleMain: "HOUSE OF",
    titleItalic: "Cultures",
  },
  {
    id: 2,
    image: "https://api-dubai-opera.nuviotech.co/uploads/gallery/1759830854576-products_hero100_mos.jpg",
    subtitle1: "Experience",
    subtitle2: "World Class",
    titleMain: "SPECTACULAR",
    titleItalic: "Performances",
  },
  {
    id: 3,
    image: "https://api-dubai-opera.nuviotech.co/uploads/gallery/1759737307709-1920x650_wicked.jpg",
    subtitle1: "Unforgettable",
    subtitle2: "Moments",
    titleMain: "SYMPHONY OF",
    titleItalic: "Arts",
  },
  {
    id: 4,
    image: "https://api-dubai-opera.nuviotech.co/uploads/gallery/1759826930194-nut_landscape.jpg",
    subtitle1: "Immersive",
    subtitle2: "Entertainment",
    titleMain: "THEATER OF",
    titleItalic: "Dreams",
  },
];

interface HeroProps {
  /** When provided and non-empty, replaces the default hero slides (e.g. API banners). */
  slides?: BannerRecord[];
}

export default function Hero({ slides: bannerSlides }: HeroProps) {
  const slides = useMemo(() => {
    if (bannerSlides?.length) return mapBannersToSlides(bannerSlides);
    return DEFAULT_SLIDES;
  }, [bannerSlides]);

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    setCurrentSlide((i) => (i < slides.length ? i : 0));
  }, [slides]);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = useCallback((index: number) => {
    if (index !== currentSlide) setCurrentSlide(index);
  }, [currentSlide]);

  // Auto-advance carousel
  // useEffect(() => {
  //   const interval = setInterval(nextSlide, 6000);
  //   return () => clearInterval(interval);
  // }, [nextSlide]);

  // Sync with global store for Navbar
  useEffect(() => {
    heroStore.setSlide(currentSlide);
    return () => heroStore.setSlide(-1); // reset when unmounting Hero
  }, [currentSlide]);

  const slide = slides[currentSlide]!;

  return (
    <section
      className="relative w-full h-screen min-h-[100vh] flex flex-col justify-start items-center overflow-hidden"
      aria-label="Hero carousel"
    >
      {/* Background Images/Videos with Crossfade */}
      {slides.map((s, index) => (
        <div
          key={s.id}
          className={`absolute inset-0 z-0 transition-opacity duration-1200 ease-out ${index === currentSlide ? "opacity-100 z-1" : "opacity-0 pointer-events-none"
            }`}
        >
          {s.video ? (
            <video
              src={s.video}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : s.bgImage ? (
            <>
              <div
                className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url('${s.bgImage}')` }}
              />
              <div
                className="absolute inset-0 w-full h-full bg-cover bg-bottom bg-no-repeat z-10"
                style={{ backgroundImage: `url('${s.image}')` }}
              />
            </>
          ) : (
            <div
              className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url('${s.image}')` }}
            />
          )}

          {/* Dark gradient overlay conditionally */}
          {s.textColor !== 'dark' && (
            <>
              <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/30 to-background-dark pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />
            </>
          )}
          {/* Bottom fade into page */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-background-dark to-transparent pointer-events-none z-10" />
        </div>
      ))}

      {/* Content - centered with refined typography */}
      <div className="relative z-20 text-center px-4 sm:px-6 max-w-7xl mx-auto mt-[150px]">
        <div key={currentSlide}>
          <div className={`mb-4 sm:mb-6 animate-fade-in-up uppercase font-optima ${slide.textColor === 'dark' ? 'text-[#1a1a1a]' : 'text-white/90 text-shadow'}`}>
            <p className="text-xl sm:text-2xl md:text-[30px] tracking-[0.3em] mb-1 sm:mb-2 leading-none">
              {slide.subtitle1}
            </p>
            <p className="text-2xl sm:text-3xl md:text-[42px] tracking-[0.45em] ml-[0.45em] leading-none">
              {slide.subtitle2}
            </p>
          </div>
          <h1 className={`flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 animate-fade-in-up delay-200 ${slide.textColor === 'dark' ? 'text-[#1a1a1a]' : 'text-white text-shadow'}`}>
            <span className="text-4xl sm:text-5xl md:text-[60px] lg:text-[70px] font-optima uppercase tracking-[0.1em] whitespace-nowrap">{slide.titleMain}</span>
            <span className="text-4xl sm:text-6xl md:text-[60px] lg:text-[70px] font-petit-formal whitespace-nowrap transform md:translate-y-2 md:-mt-4">{slide.titleItalic}</span>
          </h1>
        </div>
      </div>

      {/* Carousel Controls - bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-6 sm:px-8 lg:px-12 py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Spacer for balance */}
          <div className="hidden sm:block w-12 h-12 shrink-0" aria-hidden />
          {/* Slide indicators - centered */}
          <div className="flex items-center justify-center gap-3 sm:flex-1" role="tablist" aria-label="Slide navigation">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                role="tab"
                aria-selected={index === currentSlide}
                aria-label={`Go to slide ${index + 1}`}
                className={`lg:h-[10px] lg:w-[140px] h-[5px] w-[60px] rounded-full transition-all duration-300 cursor-pointer ${index === currentSlide
                  ? "bg-white"
                  : "bg-white/40 hover:bg-white/60"
                  }`}
              />
            ))}
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
              <ChevronRight size={22} className="text-white" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
