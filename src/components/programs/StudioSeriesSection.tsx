"use client";

import Link from "next/link";
import Image from "next/image";
import { StudioSeriesSlide } from "./SliderDescription";

interface StudioSeriesSectionProps {
  title?: string;
  introTitle?: string;
  introDescription?: string;
  cards: StudioSeriesSlide[];
  layout?: "slider" | "stacked";
}

export type { StudioSeriesSlide };

export default function StudioSeriesSection({
  introTitle,
  introDescription,
  cards,
  layout = "stacked",
}: StudioSeriesSectionProps) {
  if (cards.length === 0) return null;

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 z-8 h-40 bg-linear-to-b from-black via-black to-transparent opacity-60" />
     <section className="relative overflow-hidden w-full px-4 md:px-8 lg:px-16 py-0 md:py-10">
      <div className="relative z-10 max-w-[1400px] mx-auto">
        {introTitle && (
          <h2 className="font-optima font-normal text-white text-center text-[28px] leading-[110%] md:text-[34px] lg:text-[40px] lg:leading-[100%] tracking-normal max-w-[600px] mx-auto mb-4 lg:mb-8">
            {introTitle}
          </h2>
        )}
        {introDescription && (
          <p className="font-montserrat text-white text-center text-[14px] leading-[145%] md:text-[15px] lg:text-[16px] lg:leading-[120%] max-w-[780px] tracking-normal mx-auto mb-10 md:mb-16 ">
            {introDescription}
          </p>
        )}

        <div className="space-y-8">
        <h3 className="font-optima font-normal text-white text-left text-[28px] leading-[110%] md:text-[34px] lg:text-[40px] lg:leading-[100%] tracking-normal capitalize mb-4 lg:mb-8">
          Discover our studio concept series
        </h3>
          {cards.map((card, index) => (
            <article
              key={`${card.thumbnailUrl}-${index}`}
              className=""
            >
              <div className={`grid gap-5 md:gap-6 ${layout === "stacked" ? "lg:grid-cols-[58%_42%] lg:items-center" : ""}`}>
                <div className="relative h-[220px] overflow-hidden rounded-[14px] sm:h-[280px] lg:h-[400px]">
                  <Image src={card.thumbnailUrl || "/images/fallback.png"} alt={card.imageAlt} fill className="object-cover" />
                </div>

                <div className="space-y-4 px-1 py-1 md:px-2">
                  {card.title ? (
                    <h3 className="font-optima text-[36px] leading-[102%] text-white md:text-[44px]">
                      {card.title}
                    </h3>
                  ) : null}
                  {card.description ? (
                    <p className="max-w-[440px] whitespace-pre-line font-montserrat text-[16px] leading-[120%] font-normal text-white">
                      {card.description}
                    </p>
                  ) : null}
                  <Link
                    href={card.ctaHref ?? "#"}
                    className="inline-flex h-11 items-center justify-center rounded-[8px] bg-primary-light px-7 font-montserrat text-[16px] font-semibold leading-[100%] text-white transition-colors hover:bg-[#8e2b30]"
                  >
                    {card.ctaLabel ?? "Book Tickets"}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
    
      </div>
    </section>
    </div>
  );
}
