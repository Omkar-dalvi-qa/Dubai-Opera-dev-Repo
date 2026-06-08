"use client";

import React, { useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import Image from "next/image";
import Link from "next/link";
import type { Swiper as SwiperType } from "swiper";

import type { WebsiteBanner } from "@/types/website";

function getValidCtaHref(url: string | null | undefined): string | null {
    const trimmed = String(url ?? "").trim();
    if (!trimmed || trimmed === "#") return null;
    if (trimmed.startsWith("/")) return trimmed;

    try {
        const parsed = new URL(trimmed);
        if (parsed.protocol === "http:" || parsed.protocol === "https:") {
            return trimmed;
        }
    } catch {
        return null;
    }

    return null;
}

function isExternalCtaHref(href: string, isExternal?: boolean): boolean {
    if (isExternal) return true;
    return /^https?:\/\//i.test(href);
}

export default function MainBanner({ slides }: { slides: WebsiteBanner[] }) {
    const swiperRef = useRef<SwiperType | null>(null);

    const displaySlides = slides?.length > 0 ? slides : [];

    const [activeIndex, setActiveIndex] = useState(0);

    const handleSlideChange = (swiper: SwiperType) => {
        if (swiper.realIndex !== activeIndex) {
            setActiveIndex(swiper.realIndex);
        }
    };

    return (
        <div dir="ltr" className="relative w-full">
            <div className="relative h-[60vh] w-full overflow-hidden group lg:h-[60vh]">
            <Swiper
                modules={[Autoplay, Navigation, Pagination, EffectFade]}
                effect="fade"
                fadeEffect={{ crossFade: true }}
                speed={1000}
                initialSlide={0}
                observer={true}
                observeParents={true}
                autoplay={{
                    delay: 2000,
                    disableOnInteraction: false,
                }}
                loop={true}
                pagination={{
                    clickable: true,
                    el: ".custom-pagination",
                    renderBullet: (index, className) => {
                        return `<span class="${className} custom-bullet"></span>`;
                    },
                }}
                navigation={{
                    nextEl: ".swiper-button-next-custom",
                    prevEl: ".swiper-button-prev-custom",
                }}
                onSwiper={(swiper) => {
                    swiperRef.current = swiper;
                }}
                onInit={(swiper) => {
                    setActiveIndex(swiper.realIndex);
                    if (swiper.pagination && swiper.pagination.el) {
                        swiper.pagination.render();
                        swiper.pagination.update();
                    }
                }}
                onSlideChange={handleSlideChange}
                className="w-full h-full"
            >
                {displaySlides.map((slide, idx) => {
                    const videoSrc = slide.mediaType === "VIDEO" ? (slide.videoUrl || slide.youtubeUrl || slide.videoPath) : undefined;
                    const imgSrc = slide.image || slide.imagePath;
                    const mobileImgSrc = slide.mobileImage || slide.mobileImagePath || slide.image;
                    const ctaHref = getValidCtaHref(slide.ctaUrl);
                    const ctaIsExternal = ctaHref ? isExternalCtaHref(ctaHref, slide.isExternal) : false;
                    const slideClassName =
                        "relative flex h-full w-full items-center justify-center" +
                        (ctaHref ? " cursor-pointer" : "");

                    const slideMedia = (isActive: boolean) => (
                        <div
                            className={`absolute inset-0 h-full w-full transition-opacity duration-1000 ${isActive ? "opacity-100" : "opacity-80"}`}
                        >
                            {videoSrc ? (
                                <video
                                    src={videoSrc}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="h-full w-full object-cover"
                                />
                            ) : imgSrc ? (
                                <>
                                    <div className="relative hidden h-full w-full sm:block">
                                        <Image
                                            src={imgSrc}
                                            alt={slide.title ?? ""}
                                            fill
                                            className="hidden object-contain sm:block xl:object-cover"
                                            priority={idx === 0}
                                            fetchPriority={idx === 0 ? "high" : "auto"}
                                            quality={80}
                                            sizes="50vw"
                                        />
                                    </div>
                                    <div className="relative block h-full w-full sm:hidden">
                                        <Image
                                            src={mobileImgSrc}
                                            alt={slide.title ?? ""}
                                            fill
                                            className="block object-contain sm:hidden"
                                            priority={idx === 0}
                                            fetchPriority={idx === 0 ? "high" : "auto"}
                                            quality={80}
                                            sizes="100vw"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="h-full w-full bg-neutral-900" />
                            )}
                        </div>
                    );

                    return (
                        <SwiperSlide key={slide.id || idx}>
                            {({ isActive }) =>
                                ctaHref && ctaIsExternal ? (
                                    <a
                                        href={ctaHref}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={slideClassName}
                                        aria-label={slide.ctaText || slide.title || "Open banner link"}
                                    >
                                        {slideMedia(isActive)}
                                    </a>
                                ) : ctaHref ? (
                                    <Link
                                        href={ctaHref}
                                        className={slideClassName}
                                        aria-label={slide.ctaText || slide.title || "Open banner link"}
                                    >
                                        {slideMedia(isActive)}
                                    </Link>
                                ) : (
                                    <div className={slideClassName}>{slideMedia(isActive)}</div>
                                )
                            }
                        </SwiperSlide>
                    );
                })}
            </Swiper>
            </div>

            <div className="flex w-full justify-center px-6 py-3 md:px-16 md:py-4">
                <div className="custom-pagination flex min-h-[10px] min-w-[300px] items-center justify-center gap-3" />
            </div>
        </div>
    );
}
