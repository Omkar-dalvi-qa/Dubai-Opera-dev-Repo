"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { imageUrl } from "@/utils/imageUrl";

export type GallerySlide = {
  id?: string;
  image_url: string;
  sort_order?: number;
  video_url?: string;
  youtube_url?: string;
};

type GalleryProps = {
  title?: string;
  data: GallerySlide[];
};

function getYouTubeEmbed(url?: string): string | null {
  if (!url) return null;

  try {
    const { hostname, searchParams, pathname } = new URL(url);
    if (!hostname.includes("youtube") && !hostname.includes("youtu.be")) {
      return null;
    }

    const id =
      searchParams.get("v") ||
      (hostname.includes("youtu.be") ? pathname.slice(1).split("/")[0] : null);

    return id ? `https://www.youtube.com/embed/${id}` : null;
  } catch {
    return null;
  }
}

export default function Gallery({
  title = "Gallery",
  data = [],
}: GalleryProps) {
  const [swiperInstance, setSwiperInstance] = useState<any>(null);

  const slides = useMemo(
    () => [...data].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [data],
  );

  if (!slides.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="font-optima font-normal text-[32px] text-white">
          {title}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => swiperInstance?.slidePrev()}
            className="w-10 h-10 cursor-pointer rounded-full bg-white/20 flex items-center justify-center"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>

          <button
            onClick={() => swiperInstance?.slideNext()}
            className="w-10 h-10 cursor-pointer rounded-full bg-white/20 flex items-center justify-center"
          >
            <ChevronRight size={20} className="text-white" />
          </button>
        </div>
      </div>

      <Swiper
        modules={[Navigation, Autoplay, Pagination]}
        onSwiper={setSwiperInstance}
        autoplay={{
          delay: 2000,
          disableOnInteraction: false,
        }}
        speed={2000}
        loop={slides.length > 1}
        pagination={{ clickable: true }}
        className="tours-gallery-swiper rounded-3xl overflow-hidden"
      >
        {slides.map((slide, index) => {
          const youtubeEmbed = getYouTubeEmbed(
            slide.youtube_url ?? slide.image_url,
          );
          const hasVideo = Boolean(slide.video_url);

          return (
            <SwiperSlide key={slide.id ?? `${slide.image_url}-${index}`}>
              <div className="relative w-full h-[250px] sm:h-[360px] md:h-[420px] lg:h-[500px]">
                {youtubeEmbed ? (
                  <iframe
                    src={`${youtubeEmbed}?rel=0`}
                    title={`Video ${index + 1}`}
                    allowFullScreen
                    className="absolute inset-0 h-full w-full border-0"
                  />
                ) : hasVideo ? (
                  <video
                    src={slide.video_url}
                    poster={imageUrl(slide.image_url)}
                    controls
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover bg-black"
                  />
                ) : (
                  <Image
                    src={imageUrl(slide.image_url)}
                    alt={`Gallery ${index + 1}`}
                    fill
                    className="object-cover"
                    loading="lazy"
                  />
                )}
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}
