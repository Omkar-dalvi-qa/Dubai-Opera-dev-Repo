"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export interface DateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  selectedTimeSlot: string | null;
  onConfirmSelection: (selection: { date: Date; timeSlot: string }) => void;
  priceFrom: string;
  timeSlots: string[];
  minDate?: Date;
  maxDate?: Date;
  mobilePresentation?: "modal" | "sheet";
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDayName(d: Date) {
  return DAY_NAMES[d.getDay()];
}
function formatMonth(d: Date) {
  return MONTHS[d.getMonth()];
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const VISIBLE_MOBILE = 2;
const VISIBLE_DESKTOP = 4;
const MODAL_TRANSITION_MS = 400;

export default function DateRangeModal({
  isOpen,
  onClose,
  selectedDate,
  selectedTimeSlot,
  onConfirmSelection,
  priceFrom,
  timeSlots,
  minDate,
  maxDate,
  mobilePresentation = "modal",
}: DateRangeModalProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    setHasMounted(true);
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = () => setIsDesktop(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const visibleCount = hasMounted ? (isDesktop ? VISIBLE_DESKTOP : VISIBLE_MOBILE) : VISIBLE_DESKTOP;

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const rangeEnd = maxDate ?? (() => {
    const e = new Date(today);
    e.setMonth(e.getMonth() + 3);
    return e;
  })();

  const effectiveStart = useMemo(() => {
    const start = minDate ? new Date(minDate) : new Date(today);
    start.setHours(0, 0, 0, 0);
    return start.getTime() < today.getTime() ? today : start;
  }, [minDate, today]);

  const allDates = useMemo(() => {
    const out: Date[] = [];
    const cur = new Date(effectiveStart);
    cur.setHours(0, 0, 0, 0);
    const end = new Date(rangeEnd);
    end.setHours(0, 0, 0, 0);
    while (cur <= end) {
      out.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  }, [effectiveStart, rangeEnd]);

  const [offset, setOffset] = useState(0);
  const [activeDate, setActiveDate] = useState<Date | null>(null);
  const [activeTimeSlot, setActiveTimeSlot] = useState<string | null>(null);
  const [hasSelectedDateInSession, setHasSelectedDateInSession] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const wasOpenRef = useRef(false);
  const visible = isOpen || isExiting;

  const visibleDates = allDates.slice(offset, offset + visibleCount);
  const canGoPrev = offset > 0;
  const canGoNext = offset + visibleCount < allDates.length;
  const selectedVisibleIndex = activeDate ? visibleDates.findIndex((d) => isSameDay(d, activeDate)) : -1;
  const showTimePanel = hasSelectedDateInSession && !!activeDate && selectedVisibleIndex >= 0;
  const isMobileSheet = !isDesktop && mobilePresentation === "sheet";

  const isPast = (d: Date) => {
    const t = new Date(d);
    t.setHours(0, 0, 0, 0);
    return t.getTime() < today.getTime();
  };

  const handleCardClick = (d: Date) => {
    if (isPast(d)) return;
    setHasSelectedDateInSession(true);
    setActiveDate(d);
    setActiveTimeSlot(null);
  };

  const handleNav = (dir: "prev" | "next") => {
    if (dir === "prev" && !canGoPrev) return;
    if (dir === "next" && !canGoNext) return;
    setOffset((prev) => (dir === "next" ? prev + visibleCount : Math.max(0, prev - visibleCount)));
  };

  const selectedDateKey = selectedDate?.getTime() ?? null;

  useEffect(() => {
    if (!isOpen) return;
    setHasSelectedDateInSession(false);
    setActiveDate(null);
    setActiveTimeSlot(null);
    const dateToShow = selectedDate ?? null;
    if (dateToShow && allDates.length > 0) {
      const index = allDates.findIndex((d) => isSameDay(d, dateToShow));
      if (index >= 0) {
        const startOffset = Math.min(index, Math.max(0, allDates.length - visibleCount));
        setOffset(startOffset);
      }
    }
  }, [isOpen, selectedDateKey, allDates, visibleCount]);

  useEffect(() => {
    if (visible) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [visible]);

  useEffect(() => {
    if (isOpen) {
      setIsExiting(false);
      setIsReady(false);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsReady(true));
      });
      return () => cancelAnimationFrame(id);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) wasOpenRef.current = true;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen && wasOpenRef.current) {
      wasOpenRef.current = false;
      setIsExiting(true);
      const t = setTimeout(() => {
        setIsExiting(false);
        setIsReady(false);
      }, MODAL_TRANSITION_MS);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex ${isMobileSheet ? "items-end justify-stretch p-0" : "items-center justify-center p-4"} transition-opacity ease-out ${
        isReady && !isExiting ? "opacity-100" : "opacity-0"
      }`}
      style={{ background: isMobileSheet ? "transparent" : "rgba(0,0,0,0.75)", transitionDuration: `${MODAL_TRANSITION_MS}ms` }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="select-date-title"
      onClick={(e) => {
        if (isMobileSheet) return;
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${isMobileSheet ? "max-w-none mx-0 rounded-t-[24px]" : "max-w-[1000px] mx-4 rounded-[20px]"} overflow-hidden transition-all ease-out ${
          isReady && !isExiting ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        style={{
          background: "linear-gradient(145deg, #1e1e1e 0%, #181818 100%)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.07)",
          transitionDuration: `${MODAL_TRANSITION_MS}ms`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between px-4 py-4 lg:px-6 lg:py-6 ${isMobileSheet ? "border-b border-white/10" : ""}`}>
          <h2
            id="select-date-title"
            className="text-white font-montserrat font-bold m-0"
            style={{ fontSize: 22, letterSpacing: "-0.02em" }}
          >
            Select Date
          </h2>
          <button
            type="button"
            onClick={onClose}
            className=" text-white cursor-pointer"
            aria-label="Close"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Carousel: 3 cards, prev/next */}
        <div className="flex items-center gap-3 px-2 py-4 lg:px-6 lg:pb-8">
          <button
            type="button"
            onClick={() => handleNav("prev")}
            disabled={!canGoPrev}
            className="shrink-0 w-6 h-6 lg:w-11 lg:h-11 rounded-full flex items-center justify-center border-0 transition-colors disabled:cursor-not-allowed"
            style={{
              background: canGoPrev ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
              color: canGoPrev ? "white" : "rgba(255,255,255,0.2)",
              cursor: canGoPrev ? "pointer" : "not-allowed",
            }}
            onMouseEnter={(e) => {
              if (canGoPrev) e.currentTarget.style.background = "rgba(255,255,255,0.22)";
            }}
            onMouseLeave={(e) => {
              if (canGoPrev) e.currentTarget.style.background = "rgba(255,255,255,0.12)";
            }}
            aria-label="Previous dates"
          >
            <ChevronLeft size={18} strokeWidth={2} />
          </button>

          {/* Cards container */}
          <div className="flex-1">
            <div
              className="flex rounded-[14px] overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.09)" }}
            >
              {visibleDates.map((d, idx) => {
                const selected = activeDate && isSameDay(d, activeDate);
                const isAvailable = !isPast(d);

                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    onClick={() => isAvailable && handleCardClick(d)}
                    disabled={!isAvailable}
                    className="relative flex-1 flex flex-col items-center justify-center border-0 cursor-pointer transition-colors disabled:cursor-not-allowed font-montserrat py-4 lg:px-10 lg:py-12"
                    style={{
                      padding: "",
                      background: selected
                        ? "rgba(220,38,38,0.18)"
                        : isAvailable
                          ? "rgba(255,255,255,0.03)"
                          : "rgba(255,255,255,0.01)",
                      borderRight: idx < visibleDates.length - 1 ? "1px solid rgba(255,255,255,0.09)" : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (isAvailable && !selected) e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                    }}
                    onMouseLeave={(e) => {
                      if (!selected) {
                        e.currentTarget.style.background = isAvailable ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.01)";
                      }
                    }}
                  >
                    {selected && (
                      <div
                        className="absolute top-0 left-0 right-0 h-0.5"
                        style={{
                          background: "linear-gradient(90deg, #dc2626, #ef4444)",
                        }}
                      />
                    )}
                    <span
                      className={`font-montserrat text-[13px] font-medium mb-1.5 md:font-normal md:text-[18px] md:leading-[150%] md:tracking-normal md:text-right ${isAvailable ? "text-white/50" : "text-white/20"} md:text-[#FFFFFF7A]`}
                    >
                      {formatDayName(d)}
                    </span>
                    <span
                      className={`font-montserrat font-semibold text-[20px] leading-[28px] lg:text-[37px] lg:leading-[125%] tracking-normal text-center ${isAvailable ? "text-[#EBEBEB]" : "text-white/20"}`}
                    >
                      {d.getDate()} {formatMonth(d)}
                    </span>
                    {isAvailable ? (
                      <span className="font-montserrat font-normal text-[12px] lg:text-[15px] lg:leading-[12px] tracking-normal text-center text-[#FFFFFF7A] mt-2.5">
                        From: {priceFrom}
                      </span>
                    ) : (
                      <span
                        className="text-xs mt-2.5"
                        style={{ color: "rgba(255,255,255,0.18)" }}
                      >
                        Unavailable
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div
              className={`overflow-hidden transition-all duration-400 ease-out ${
                showTimePanel
                  ? "max-h-[320px] opacity-100 translate-y-0 mt-1"
                  : "max-h-0 opacity-0 -translate-y-2 mt-0 pointer-events-none"
              }`}
            >
              <div
                className="grid"
                style={{ gridTemplateColumns: `repeat(${Math.max(visibleDates.length, 1)}, minmax(0, 1fr))` }}
              >
                <div
                  className="w-full px-px"
                  style={{ gridColumn: `${Math.max(selectedVisibleIndex + 1, 1)} / span 1` }}
                >
                  <div className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="font-montserrat text-xs text-[#FFFFFF7A] mb-3">choose time:</p>
                    <div className="space-y-2">
                      {timeSlots.map((slot) => (
                        <label key={slot} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="event-time-slot"
                            value={slot}
                            checked={activeTimeSlot === slot}
                            onChange={() => setActiveTimeSlot(slot)}
 className="h-4 w-4 cursor-pointer appearance-none bg-black border border-white/40 rounded-full checked:bg-primary-light relative
  after:content-[''] after:absolute after:hidden checked:after:block
  after:w-2 after:h-2 after:bg-white after:rounded-full
  after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2"                          />
                          <span className="font-montserrat text-sm text-white">{slot}</span>
                        </label>
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={!activeTimeSlot}
                      onClick={() => {
                        if (!activeDate || !activeTimeSlot) return;
                        onConfirmSelection({ date: activeDate, timeSlot: activeTimeSlot });
                        onClose();
                      }}
                      className="mt-4 h-8 px-4 rounded-md bg-[#792327] text-white font-montserrat text-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleNav("next")}
            disabled={!canGoNext}
            className="shrink-0 w-6 h-6 lg:w-11 lg:h-11 rounded-full flex items-center justify-center border-0 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: canGoNext ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
              color: canGoNext ? "white" : "rgba(255,255,255,0.2)",
              cursor: canGoNext ? "pointer" : "not-allowed",
            }}
            onMouseEnter={(e) => {
              if (canGoNext) e.currentTarget.style.background = "rgba(255,255,255,0.22)";
            }}
            onMouseLeave={(e) => {
              if (canGoNext) e.currentTarget.style.background = "rgba(255,255,255,0.12)";
            }}
            aria-label="Next dates"
          >
            <ChevronRight size={18} strokeWidth={2} />
          </button>
        </div>

      </div>
    </div>
  );
}
