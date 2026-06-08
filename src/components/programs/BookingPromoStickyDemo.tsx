"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
interface BookingPromoStickyDemoProps {
  eventTitle: string;
  stepLabel?: string;
}

export default function BookingPromoStickyDemo({
  eventTitle,
  stepLabel = "Select Your Seat",
}: BookingPromoStickyDemoProps) {
  const [isPromoOpen, setIsPromoOpen] = useState(false);

  return (
    <div className="sticky top-24 z-30 mb-4">
      <div className="rounded-lg border border-white/10 bg-[#1A1112]/90 px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.22)] backdrop-blur-md md:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[11px] tracking-wide text-white flex items-center">
            <ChevronLeft className="w-4 h-4 text-white/35" />  
            <span className="px-1.5 text-white/35">{eventTitle}</span>
              <span className="px-1.5 text-white/35">/</span>
              {stepLabel}
            </p>
            <h1 className="truncate pt-2 font-optima text-[30px] leading-[1.05] text-white md:text-[38px]">
              {eventTitle}
            </h1>
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsPromoOpen((prev) => !prev)}
              className="h-9 rounded-md border border-white/15 bg-white/5 px-3.5 text-sm font-medium text-white/95 transition-colors hover:bg-white/10 cursor-pointer"
            >
              Promocode
            </button>

            {isPromoOpen ? (
              <div className="absolute transition-all duration-1000 right-0 top-11 w-[300px] rounded-xl border border-white/10 bg-[#140D0E]/95 p-3 shadow-2xl">
                <label className="mb-1.5 block text-[11px] font-medium tracking-wide text-white/70">
                  Enter promo code
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type code"
                    className="h-9 w-full rounded-md border border-white/15 bg-black/25 px-3 text-sm text-white outline-none placeholder:text-white/45 focus:border-primary/80 focus:ring-1 focus:ring-primary/40"
                  />
                  <button
                    type="button"
                    className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-white transition-all hover:brightness-105 active:scale-[0.99]"
                  >
                    Apply
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
