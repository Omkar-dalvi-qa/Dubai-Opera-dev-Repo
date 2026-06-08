"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export interface TimelineStep {
  title: string;
  duration?: string | null;
}

export interface TimelineTabProps {
  /** e.g. "Approx. 2 hours and 40 minutes including an intermission" */
  heading?: string;
  /** Latecomer policy bold sentence */
  latecomerPolicy?: string;
  /** Timeline steps (label + optional duration like "40 Mins") */
  steps?: TimelineStep[];
}

export default function TimelineTab({
  heading="",
  latecomerPolicy="",
  steps = [],
}: TimelineTabProps) {
  const [visible, setVisible] = useState<number[]>([]);
  const latecomerPolicyHtml = (latecomerPolicy ?? "")
    .replaceAll("&nbsp;", " ")
    .replaceAll("\u00A0", " ");

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    steps.forEach((_, i) => {
      timeouts.push(
        setTimeout(() => {
          setVisible((prev) => [...prev, i]);
        }, i * 120)
      );
    });
    return () => timeouts.forEach((t) => clearTimeout(t));
  }, [steps.length]);

  return (
    <div className="text-white max-w-[680px]">
      <h2 className="font-optima font-normal text-[24px] leading-[32px] md:text-[32px] md:leading-[100%] tracking-normal text-white mb-2 md:mb-6">
        Timeline & Duration
      </h2>

      {/* Duration with clock icon */}
      <div className="flex items-center gap-2.5 mb-6">
        <span
          className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-white/40 shrink-0"
          aria-hidden
        >
          <Clock size={14} className="text-white/80" strokeWidth={2} />
        </span>
        <span className="font-montserrat font-normal text-[14px] leading-[23px] md:text-[16px] md:leading-[34px] tracking-normal text-white/95 space-y-6">
          {heading}
        </span>
      </div>

      {/* Latecomer policy */}
      <div className="font-montserrat font-normal text-[14px] leading-[23px] md:text-[16px] md:leading-[34px] tracking-normal text-white/95 mb-9 lg:mb-10 space-y-2">
        <p>
          <span className="font-bold text-white w-full max-w-full min-w-0 whitespace-normal wrap-anywhere" dangerouslySetInnerHTML={{ __html: latecomerPolicyHtml }} />
        </p>
      </div>

      {/* Timeline: one row per step — dot (centered) beside card, line behind dots */}
      <div className="relative flex flex-col gap-2.5">
        {/* Continuous vertical line behind dots (centered in dot column) */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/15 left-[16px] -translate-x-1/2"
          aria-hidden
        />

        {steps.map((item, i) => (
          <div
            key={i}
            className="relative flex items-center gap-4 min-h-[48px]"
          >
            {/* Left: dot column — dot vertically centered with this row (card) */}
            <div className="w-8 shrink-0 flex justify-center items-center self-stretch">
              <div
                className={`w-3 h-3 rounded-full border-2 border-white bg-transparent shrink-0 transition-all duration-300 relative z-10 ${visible.includes(i) ? "border-black" : ""
                  }`}
                aria-hidden
              />
            </div>

            {/* Right: card */}
            <div
              className={`flex-1 flex items-center justify-between px-5 py-3.5 rounded-md border min-h-[48px] transition-all duration-300 ease-out cursor-default min-w-0
                bg-white/5 border-white/10
                hover:bg-white/10 hover:border-white/20 hover:shadow-[0_4px_24px_rgba(0,0,0,0.35)]
                ${visible.includes(i) ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-[18px]"}`}
            >
              <span className="font-montserrat font-normal text-[16px] leading-[100%] tracking-normal text-white">
                {item.title}
              </span>
              {item.duration != null &&
                item.duration !== "" &&
                item.title.trim().toLowerCase() !== "end" &&
                item.title.trim().toLowerCase() !== "opening" && (
                <span className="font-montserrat font-normal text-[16px] leading-[100%] tracking-normal text-white">
                  {item.duration}  mins
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
