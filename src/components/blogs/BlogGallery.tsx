"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectFade } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";
import "swiper/css/effect-fade";

interface BlogGalleryProps {
  images: string[];
  title?: string;
}

export default function BlogGallery({ images, title = "Gallery" }: BlogGalleryProps) {
  const swiperRef = useRef<SwiperType | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const isSingleSlide = images.length <= 1;

  if (images.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-optima text-[30px] text-white sm:text-[36px]">{title}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => swiperRef.current?.slidePrev()}
            disabled={isSingleSlide || currentSlide === 0}
            className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30 md:h-10 md:w-10 cursor-pointer ${isSingleSlide || currentSlide === 0 ? "cursor-not-allowed opacity-50" : ""
              }`}
            aria-label="Previous gallery image"
          >
            <ChevronLeft size={18} className="text-white" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => swiperRef.current?.slideNext()}
            disabled={isSingleSlide || currentSlide === images.length - 1}
            className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30 md:h-10 md:w-10 cursor-pointer ${isSingleSlide || currentSlide === images.length - 1 ? "cursor-not-allowed opacity-50" : ""
              }`}
            aria-label="Next gallery image"
          >
            <ChevronRight size={18} className="text-white" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="relative h-55 overflow-hidden rounded-[18px] border border-white/10 shadow-[0_20px_45px_rgba(0,0,0,0.5)] sm:h-85 md:h-115">
        <Swiper
          modules={[EffectFade]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          speed={700}
          onSwiper={(swiper) => (swiperRef.current = swiper)}
          onSlideChange={(swiper) => setCurrentSlide(swiper.activeIndex)}
          className="h-full w-full"
        >
          {images.map((image, index) => (
            <SwiperSlide key={`${image}-${index}`}>
              <div className="relative h-full w-full">
                <Image
                  src={image}
                  alt={`${title} ${index + 1}`}
                  fill
                  sizes="(min-width: 768px) 1120px, 100vw"
                  className="object-cover"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        <div className="absolute z-20 bottom-4 left-1/2 flex -translate-x-1/2 gap-3">
          {images.map((_, index) => (
            <button
              key={`gallery-indicator-${index}`}
              onClick={() => swiperRef.current?.slideTo(index)}
              aria-label={`Go to gallery image ${index + 1}`}
              className={`h-[7px] w-16 rounded-full transition-colors sm:w-[99px] cursor-pointer ${index === currentSlide ? "bg-white" : "bg-white/45 hover:bg-white/70"
                }`}
            />
          ))}

          
        </div>


      </div>
    </section>
  );
}
