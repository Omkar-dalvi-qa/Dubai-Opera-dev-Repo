"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { SeedLayoutSvg, type SeedData, type SeatPriceOption, getTypeColor } from './SeedLayoutSvg';
import { cn } from '@/lib/utils';
import { useIsMobile } from '../hooks/useIsMobile';
import type {
  SeatLayoutResponse,
} from '../types/seatLayoutApi';
import { getSeatStatusCode } from '../utils/seatMark';
import { isUnknownSeatClassLabel } from '../utils/seatClassLabel';
import { parseLayoutData } from '../utils/parseLayoutData';
import { X, ShoppingCart, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

export interface SelectedSeatInfo {
  seat_chart_id: string;
  zone_id: string | null;
  zone_name?: string | null;
  seat_row_name: string | null;
  seat_number: string | null;
  gate_name?: string | null;
  gate_id?: string | null;
  layout_seat_id: string;
  seat_status: string;
  is_reserved: boolean;
  is_booked: boolean;
  seat_release_time: string;
  /** Price of the seat (from `seat_price` in the layout data). */
  seat_price: number;
  /** Selected price label when a seat type has multiple prices. */
  selected_price_name?: string | null;
  /** Display name of the seat (e.g. "A-12"). */
  sl_seat_name: string | null;
  /** Seat type ID used for ticket class grouping. */
  screen_seat_type_id: number | null;
  /** Seat class label (e.g. "Gold", "Silver"). */
  seat_class: string | null;
  /** Seat mark such as `normal`, `wheelchair`, or another venue-specific label. */
  seat_type: string | null;
}

interface SeedLayoutRendererProps {
  layoutData: SeatLayoutResponse;
  onSelectionChange?: (seats: SelectedSeatInfo[]) => void;
  showBookPanel?: boolean;
  currencyCode?: string;
  /** Layout seat ids to pre-select when reopening a cart session. */
  initialSelectedSeatIds?: string[];
  /** Held seats for this reservation (may appear in `blocked_seats`) — still togglable. */
  ownedSeatIds?: string[];
}

export function SeedLayoutRenderer({
  layoutData,
  onSelectionChange,
  showBookPanel = false,
  initialSelectedSeatIds,
  ownedSeatIds: ownedSeatIdsProp,
}: SeedLayoutRendererProps) {
  const [activeClass, setActiveClass] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());
  const [selectedSeedMap, setSelectedSeedMap] = useState<Map<string, SeedData>>(new Map());
  // const [showBookPanel] = useState<boolean>(false);

  // Mobile-specific state
  const isMobile = useIsMobile();
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const onSelectionChangeRef = useRef(onSelectionChange);

  const currencyCode = layoutData.data.currency_code ?? '₹';

  const { seeds, elements, classes, typeColors, standingSections } = useMemo(
    () => parseLayoutData(layoutData.data),
    [layoutData],
  );

  const ownedSeatIds = useMemo(() => {
    const ids = new Set<string>();
    for (const id of ownedSeatIdsProp ?? []) {
      const t = String(id ?? "").trim();
      if (t) ids.add(t);
    }
    for (const id of initialSelectedSeatIds ?? []) {
      const t = String(id ?? "").trim();
      if (t) ids.add(t);
    }
    return ids;
  }, [ownedSeatIdsProp, initialSelectedSeatIds]);

  const initialSelectionAppliedRef = useRef(false);

  // Keep ref in sync with latest callback (avoids stale closures)
  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  useEffect(() => {
    initialSelectionAppliedRef.current = false;
  }, [initialSelectedSeatIds, layoutData.data.chart_id, layoutData.data.schedule_id]);

  useEffect(() => {
    if (initialSelectionAppliedRef.current) return;
    if (!initialSelectedSeatIds?.length) return;
    if (!seeds.length && standingSections.length === 0) return;

    const idSet = new Set(initialSelectedSeatIds.map((id) => String(id).trim()).filter(Boolean));
    const nextSeats = new Set<string>();
    const nextMap = new Map<string, SeedData>();

    const tryAddSeed = (seed: SeedData) => {
      if (isUnknownSeatClassLabel(seed.type)) return;
      const raw = seed.rawData;
      const rawSeatId =
        raw && "seat_id" in raw && raw.seat_id != null
          ? String(raw.seat_id).trim()
          : "";
      if (idSet.has(seed.id) || (rawSeatId && idSet.has(rawSeatId))) {
        nextSeats.add(seed.id);
        nextMap.set(seed.id, seed);
      }
    };

    for (const seed of seeds) tryAddSeed(seed);
    for (const section of standingSections) {
      for (const seed of section.seeds) tryAddSeed(seed);
    }

    if (nextMap.size === 0) return;

    initialSelectionAppliedRef.current = true;
    setSelectedSeats(nextSeats);
    setSelectedSeedMap(nextMap);
  }, [initialSelectedSeatIds, seeds, standingSections]);

  // ─── Emit selection changes to parent ────────────────────────
  useEffect(() => {
    if (!onSelectionChangeRef.current) return;

    const seatInfos: SelectedSeatInfo[] = Array.from(selectedSeedMap.values()).map(seed => {
      const raw = seed.rawData;

      let rowName: string | null = null;
      let seatNumber: string | null = null;
      if (seed.name && seed.name.includes('-')) {
        const parts = seed.name.split('-');
        rowName = parts[0];
        seatNumber = parts[1];
      }

      const seatStatus = getSeatStatusCode(raw);

      return {
        seat_chart_id: layoutData.data.chart_id
          ?? (raw && 'seat_chart_id' in raw ? raw.seat_chart_id ?? '' : ''),
        zone_id: raw?.zone_id ?? null,
        zone_name: raw?.zone_name ?? null,
        seat_row_name: rowName,
        seat_number: seatNumber,
        gate_name: raw?.gate_name ?? null,
        gate_id: raw?.gate_id ?? null,
        layout_seat_id: seed.id,
        seat_status: seatStatus === 1 ? 'SOLD' : seatStatus === 2 ? 'HOLD' : 'AVAILABLE',
        is_reserved: seatStatus === 2,
        is_booked: seatStatus === 1,
        seat_release_time: new Date().toISOString(),
        seat_price: Number(seed.price) || 0,
        selected_price_name: seed.selectedPriceOption?.name ?? null,
        sl_seat_name: seed.name || null,
        screen_seat_type_id: raw && 'ticket_class_id' in raw
          ? Number(raw.ticket_class_id) || null
          : raw && 'screen_seat_type_id' in raw
            ? Number(raw.screen_seat_type_id) || null
            : null,
        seat_class: seed.type || null,
        seat_type: seed.seatMark === 'normal' ? null : seed.seatMark,
      };
    });

    onSelectionChangeRef.current(seatInfos);
  }, [layoutData.data.chart_id, selectedSeedMap]);

  // ─── Seat toggle handler ─────────────────────────────────────
  const handleSeatToggle = useCallback((seed: SeedData) => {
    setSelectedSeats(prev => {
      const next = new Set(prev);
      if (next.has(seed.id)) {
        next.delete(seed.id);
      } else {
        next.add(seed.id);
      }
      return next;
    });
    setSelectedSeedMap(prev => {
      const next = new Map(prev);
      if (next.has(seed.id)) {
        next.delete(seed.id);
      } else {
        next.set(seed.id, seed);
      }
      return next;
    });
  }, []);

  const handleSeatPriceSelect = useCallback((seed: SeedData, priceOption: SeatPriceOption) => {
    if (isUnknownSeatClassLabel(seed.type)) return;
    const pricedSeed: SeedData = {
      ...seed,
      price: priceOption.price,
      selectedPriceOption: priceOption,
    };

    setSelectedSeats(prev => {
      const next = new Set(prev);
      next.add(seed.id);
      return next;
    });
    setSelectedSeedMap(prev => {
      const next = new Map(prev);
      next.set(seed.id, pricedSeed);
      return next;
    });
  }, []);

  const handleStandingSectionSelect = useCallback((sectionId: string) => {
    const section = standingSections.find((standingSection) => standingSection.id === sectionId);
    if (!section) return;

    const nextSeed = section.seeds.find((seed) => !seed.isBooked && !selectedSeats.has(seed.id));
    if (!nextSeed) return;

    if ((nextSeed.priceOptions?.length ?? 0) > 1) {
      handleSeatPriceSelect(nextSeed, nextSeed.priceOptions![0]);
      return;
    }

    setSelectedSeats(prev => {
      const next = new Set(prev);
      next.add(nextSeed.id);
      return next;
    });
    setSelectedSeedMap(prev => {
      const next = new Map(prev);
      next.set(nextSeed.id, nextSeed);
      return next;
    });
  }, [handleSeatPriceSelect, selectedSeats, standingSections]);

  // ─── Remove a single seat ────────────────────────────────────
  const removeSeat = useCallback((id: string) => {
    setSelectedSeats(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setSelectedSeedMap(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // ─── Clear all ───────────────────────────────────────────────
  const clearAll = useCallback(() => {
    setSelectedSeats(new Set());
    setSelectedSeedMap(new Map());
    setSheetExpanded(false);
  }, []);

  // ─── Bottom sheet swipe gesture ──────────────────────────────
  const handleSheetTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleSheetTouchEnd = useCallback((e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientY - touchStartY.current;
    if (delta < -40) {
      // Swipe up → expand
      setSheetExpanded(true);
    } else if (delta > 40) {
      // Swipe down → collapse
      setSheetExpanded(false);
    }
  }, []);

  // ─── Compute totals ──────────────────────────────────────────
  const selectedList = Array.from(selectedSeedMap.values());
  const totalPrice = selectedList.reduce((sum, s) => sum + (s.price || 0), 0);

  const resolveClassColor = useCallback(
    (cls: string) => typeColors[cls.toLowerCase()] || getTypeColor(cls),
    [typeColors],
  );

  const toggleClass = useCallback((cls: string) => {
    setActiveClass((current) => (current === cls ? null : cls));
  }, []);

  const classButtonClassName = (selected: boolean) =>
    cn(
      "font-semibold transition-all whitespace-nowrap border",
      selected
        ? "text-gray-900 shadow-sm"
        : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900",
    );

  const classButtonStyle = (cls: string, selected: boolean) => {
    if (!selected) return undefined;
    const color = resolveClassColor(cls);
    return {
      backgroundColor: `color-mix(in srgb, ${color} 22%, white)`,
      borderColor: color,
    } as const;
  };

  if (seeds.length === 0 && standingSections.length === 0) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white text-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading seat layout…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[60vh] lg:h-[calc(100vh-200px)] flex flex-col">
      {/* SVG Canvas Area */}
      <div className="flex-1 relative">
        <SeedLayoutSvg
          seeds={seeds}
          elements={elements}
          standingSections={standingSections}
          activeClass={activeClass}
          selectedSeats={selectedSeats}
          ownedSeatIds={ownedSeatIds}
          onSeatToggle={handleSeatToggle}
          onSeatPriceSelect={handleSeatPriceSelect}
          onStandingSectionSelect={handleStandingSectionSelect}
          currencyCode={currencyCode}
          customTypeColors={typeColors}
          isMobile={isMobile}
        />
      </div>

      {/* ─── Class Filter Bar ─────────────────────────────────── */}
      {isMobile ? (
        /* ── MOBILE: Horizontal scrollable strip at top ───────── */
        <div className="absolute top-0 left-0 right-0 z-10 safe-top">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-gray-200/60 bg-white/90 px-2 py-1.5 backdrop-blur-md">
            {classes.map((cls) => {
              const selected = activeClass === cls;
              return (
                <button
                  key={cls}
                  type="button"
                  onClick={() => toggleClass(cls)}
                  style={classButtonStyle(cls, selected)}
                  className={cn(
                    classButtonClassName(selected),
                    "shrink-0 rounded-full px-2.5 py-1 text-[11px]",
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: resolveClassColor(cls) }}
                    />
                    {cls}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── DESKTOP: Left-side vertical pill bar ─────────────── */
        <div className="absolute left-3 top-1/2 z-10 flex max-h-[85vh] -translate-y-1/2 flex-col gap-0.5 overflow-y-auto rounded-xl border border-gray-200 bg-white/90 p-1 shadow-lg backdrop-blur-md">
          {classes.map((cls) => {
            const selected = activeClass === cls;
            return (
              <button
                key={cls}
                type="button"
                onClick={() => toggleClass(cls)}
                style={classButtonStyle(cls, selected)}
                className={cn(
                  classButtonClassName(selected),
                  "rounded-lg px-2.5 py-1.5 text-xs",
                )}
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: resolveClassColor(cls) }}
                  />
                  {cls}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ─── Bottom: Selection Summary ───────────────────────── */}
      {showBookPanel && (
        <>
          {isMobile ? (
            /* ── MOBILE: Compact bottom sheet ─────────────────────── */
            <div
              ref={sheetRef}
              onTouchStart={handleSheetTouchStart}
              onTouchEnd={handleSheetTouchEnd}
              className={cn(
                "absolute bottom-0 left-0 right-0 z-20 transition-all duration-300 ease-out safe-bottom",
                selectedList.length > 0
                  ? "translate-y-0 opacity-100"
                  : "translate-y-full opacity-0 pointer-events-none"
              )}
            >
              <div className="mx-2 mb-2 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
                {/* Drag Handle */}
                <div
                  className="pt-2.5 pb-1 cursor-grab active:cursor-grabbing"
                  onClick={() => setSheetExpanded(prev => !prev)}
                >
                  <div className="drag-handle" />
                </div>

                {/* Collapsed state — always visible */}
                <div className="flex items-center gap-3 px-3 pb-3">
                  {/* Seat count + price */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <ShoppingCart className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {selectedList.length} seat{selectedList.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {totalPrice > 0 ? `${currencyCode}${totalPrice.toLocaleString()}` : 'Price TBD'}
                      </p>
                    </div>
                  </div>

                  {/* Expand/collapse toggle */}
                  <button
                    onClick={() => setSheetExpanded(prev => !prev)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                    aria-label={sheetExpanded ? 'Collapse' : 'Expand'}
                  >
                    {sheetExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronUp className="w-4 h-4" />
                    )}
                  </button>

                  {/* Book button */}
                  <button className="px-4 py-2 bg-primary text-white font-bold text-sm rounded-xl hover:shadow-lg transition-all active:scale-95 shrink-0">
                    Book Now
                  </button>
                </div>



                {/* Expanded state — seat chips + actions */}
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-out",
                    sheetExpanded ? "max-h-[40vh] opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <div className="border-t border-gray-100 px-3 pt-3 pb-3">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Selected Seats
                      </span>
                      <button
                        onClick={clearAll}
                        className="text-[10px] font-semibold text-red-400 hover:text-red-600 transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear All
                      </button>
                    </div>

                    {/* Seat chip grid */}
                    <div className="flex flex-wrap gap-1.5 max-h-[25vh] overflow-y-auto scrollbar-hide">
                      {selectedList.map(seat => (
                        <span
                          key={seat.id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-700 border border-gray-200 rounded-full text-[10px] font-semibold"
                        >
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: typeColors[seat.type.toLowerCase()] || getTypeColor(seat.type) }}
                          />
                          {seat.name || seat.id}
                          <span className="text-gray-400">
                            {currencyCode}{seat.price.toLocaleString()}
                          </span>
                          <button
                            onClick={() => removeSeat(seat.id)}
                            className="ml-0.5 hover:text-red-500 transition-colors"
                            aria-label={`Remove seat ${seat.name || seat.id}`}
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ── DESKTOP: Full-width summary bar ──────────────────── */
            <div
              className={cn(
                "absolute bottom-0 left-0 right-0 z-20 transition-all duration-300 ease-out",
                selectedList.length > 0
                  ? "translate-y-0 opacity-100"
                  : "translate-y-full opacity-0 pointer-events-none"
              )}
            >
              <div className="mx-4 mb-4 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl p-4">
                <div className="flex items-center gap-4">
                  {/* Icon & count */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {selectedList.length} seat{selectedList.length !== 1 ? 's' : ''} selected
                      </p>
                      <p className="text-xs text-gray-500">
                        {totalPrice > 0 ? `${currencyCode}${totalPrice.toLocaleString()}` : 'Price TBD'}
                      </p>
                    </div>
                  </div>

                  {/* Seat chips (scrollable) */}
                  <div className="flex-1 overflow-x-auto flex gap-2 py-1 px-2 min-w-0">
                    {selectedList.map(seat => (
                      <span
                        key={seat.id}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-full text-xs font-semibold"
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: typeColors[seat.type.toLowerCase()] || getTypeColor(seat.type) }}
                        />
                        {seat.name || seat.id}
                        <span className="text-gray-400">
                          {currencyCode}{seat.price.toLocaleString()}
                        </span>
                        <button
                          onClick={() => removeSeat(seat.id)}
                          className="ml-0.5 hover:text-red-500 transition-colors"
                          aria-label={`Remove seat ${seat.name || seat.id}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Actions */}

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={clearAll}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      aria-label="Clear all selections"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all hover:-translate-y-0.5 active:translate-y-0">
                      Book Now
                    </button>
                  </div>


                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
