"use client";

import { useMemo } from "react";

interface BookingTimerProps {
  remainingSeconds: number;
  totalSeconds: number;
  className?: string;
}

function formatRemaining(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

const RADIUS = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function BookingTimer({ remainingSeconds, totalSeconds, className }: BookingTimerProps) {
  const offset = useMemo(() => {
    const fraction = remainingSeconds / totalSeconds;
    return CIRCUMFERENCE - CIRCUMFERENCE * fraction;
  }, [remainingSeconds, totalSeconds]);

  const isDanger = remainingSeconds <= 60;
  const arcColor = isDanger ? "#ef4444" : "#BB2B32";

  return (
    <div className={className ?? "flex items-center gap-2"}>
      <p
        className={`font-montserrat text-[20px] leading-[100%] transition-colors duration-500 ${isDanger ? "text-[#ef4444] bg-[#FB2C362E]" : "text-[#6BCF8C] bg-[#6BCF8C2E]"} px-4 py-2 rounded-[8px] font-semibold`}
      >
        {formatRemaining(remainingSeconds)}
         {/* <span className="text-[16px]">mins</span> */}
      </p>
      {/* <svg width="32" height="32" viewBox="0 0 40 40" className="-rotate-90 shrink-0">
        <circle
          cx="20" cy="20" r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2.5"
        />
        <circle
          cx="20" cy="20" r={RADIUS}
          fill="none"
          stroke={arcColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.5s ease" }}
        />
        <circle
          cx="20" cy="20" r={RADIUS}
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeDasharray={`2 ${CIRCUMFERENCE - 2}`}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg> */}
    </div>
  );
}