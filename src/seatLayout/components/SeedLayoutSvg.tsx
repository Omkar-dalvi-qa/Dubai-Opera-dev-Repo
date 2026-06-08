"use client";

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import type { SeatLayoutRenderableSeat } from '../types/seatLayoutApi';
import { getSeatStatusCode } from '../utils/seatMark';
import { isUnknownSeatClassLabel } from '../utils/seatClassLabel';
import {
  formatBlockedByLabel,
  formatBlockedReasonLabel,
} from '../utils/blocked-seat-info';
import { formatSeatMarkLabel, normalizeSeatMark } from '../utils/seatMark';
import {
  SeatShapeSvg,
  parseSeatShapeKind,
  seatBodyRotateTransform,
} from '../utils/seatShape';
import {
  effectiveElementStrokeColor,
  elementRotationGeometry,
  pathToSvgPathD,
  resolveAreaLabelPosition,
  resolveAreaLabelText,
  resolveElementFillColor,
  resolveSeatRadius,
  rotatedBoxBounds,
} from '../utils/geometryRender';
import {
  getContainerPointerPoint,
  getTooltipContentSize,
  getTooltipPlacement,
  projectSeatToContainer,
  type TooltipAnchorMode,
  type TooltipPlacement,
} from '../utils/tooltipPlacement';
import { useZoomPanSVG } from '../hooks/useZoomPanSVG';
import { ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

// ─── Configuration ──────────────────────────────────────────────
/** Adjust these to control zoom limits across the entire app */
export const ZOOM_CONFIG = {
  MIN_ZOOM: 0.2,    // Increase this (e.g., to 0.2) to zoom out LESS
  MAX_ZOOM: 2,      // Increase this (e.g., to 8) to zoom in MORE
  ZOOM_SENSITIVITY: 0.002,
  ZOOM_STEP_FACTOR: 1.3,
  FIT_PADDING: 0.05,
  /** Half of editor default seat size (22×22). */
  SEAT_RADIUS: 11,
  /** Padding around seat/geometry bounds in layout coordinates (2× former 100px default). */
  CONTENT_BOUNDS_PADDING: 200,
  /** Extra pan/zoom slack as a fraction of viewport (lets wheel-zoom track cursor at edges). */
  PAN_EXPANSION_RATIO: 0.5,
  /** Area fill fades out between `minZoom * START` and `minZoom * END` (relative to fit-to-screen). */
  AREA_FADE_START_RATIO: 1.35,
  AREA_FADE_END_RATIO: 1.85,
};

export interface SeedData {
  id: string;
  x: number;
  y: number;
  type: string;
  name: string;
  seatMark: string;
  /** Half of seat size in layout coordinates (editor uses `min(width, height) / 2`). */
  seatRadius?: number;
  /** Raw `seat_type` from API (NORMAL, SQUARE, WHEELCHAIR, …). */
  seatShape?: string;
  price: number;
  priceOptions?: SeatPriceOption[];
  selectedPriceOption?: SeatPriceOption;
  isBooked: boolean;
  /** True when the seat is permanently blocked (layout-level), not just event-booked. */
  isBlocked?: boolean;
  blockedBy?: string | null;
  blockedReason?: string | null;
  blockedTypeCode?: string | null;
  rawData?: SeatLayoutRenderableSeat;
}

export interface SeatPriceOption {
  name: string;
  price: number;
}

export interface AreaCurveHandle {
  cp1?: { x: number; y: number };
  cp2?: { x: number; y: number };
}

export interface ElementData {
  id: string;
  type: string;
  name: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  points: Array<{ x: number; y: number }>;
  /** Closed `area` edges: segment index → cubic-bezier control points. */
  curveHandles?: Record<string, AreaCurveHandle>;
  opacity: number;
  rotation: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  labelColor?: string;
  labelFontSize?: number;
  labelRotation?: number;
  labelX?: number;
  labelY?: number;
  src?: string;
  standingCapacity?: number;
  /** When `type === 'path'`, whether to close the path (maps JSON `isClosed`). */
  pathClosed?: boolean;
  /** `entry-gate` corner radius, or **`circle`** geometry radius (center x,y). */
  radius?: number;
  /** `rectangle`: corner radius (maps JSON `borderRadius`). */
  borderRadius?: number;
  /** `entry-gate`: label shown under the icon (`gateName` from JSON). */
  gateName?: string;
  /** `text` decoration: body (maps JSON `text`). */
  textContent?: string;
  /** `text` decoration: maps JSON `fontSize`. */
  textFontSize?: number;
  textAlign?: string;
  textFontFamily?: string;
  textFontWeight?: string | number;
}

export interface StandingSectionData {
  id: string;
  label: string;
  capacity: number;
  seeds: SeedData[];
}

interface Props {
  seeds: SeedData[];
  elements: ElementData[];
  standingSections?: StandingSectionData[];
  activeClass: string | null;
  selectedSeats: Set<string>;
  /** Blocked / held seats for this reservation that remain selectable (toggle off to release). */
  ownedSeatIds?: Set<string>;
  onSeatToggle: (seed: SeedData) => void;
  onSeatPriceSelect?: (seed: SeedData, priceOption: SeatPriceOption) => void;
  onStandingSectionSelect?: (sectionId: string) => void;
  currencyCode?: string;
  customTypeColors?: Record<string, string>;
  isMobile?: boolean;
}

// ─── Seat type → fill color ─────────────────────────────────────
export const TYPE_COLORS: Record<string, string> = {
  vip: '#0d9488',
  diamond: '#6366f1',
  silver: '#9ca3af',
  gold: '#f59e0b',
};

export const DEFAULT_SEAT_COLOR = '#d1d5db';

export const getTypeColor = (type: string): string =>
  TYPE_COLORS[type.toLowerCase()] ?? DEFAULT_SEAT_COLOR;

function parseSeatColorRgb(color: string): { r: number; g: number; b: number } | null {
  const c = color.trim();
  if (!c || c === 'transparent') return null;

  const hexMatch = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) hex = hex.split('').map((ch) => ch + ch).join('');
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  const rgbMatch = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(c);
  if (rgbMatch) {
    return {
      r: Number(rgbMatch[1]),
      g: Number(rgbMatch[2]),
      b: Number(rgbMatch[3]),
    };
  }

  return null;
}

/** Darker stroke for selected-seat inner border. */
function darkenSeatColor(color: string, amount = 0.3): string {
  const rgb = parseSeatColorRgb(color);
  if (!rgb) return '#374151';
  const factor = 1 - amount;
  const r = Math.round(rgb.r * factor);
  const g = Math.round(rgb.g * factor);
  const b = Math.round(rgb.b * factor);
  return `rgb(${r}, ${g}, ${b})`;
}

/** Outer selection ring using the seat color at reduced opacity. */
function seatColorWithAlpha(color: string, alpha: number): string {
  const rgb = parseSeatColorRgb(color);
  if (!rgb) return `rgba(55, 65, 81, ${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function getAreaSegmentHandles(
  curveHandles: Record<string, AreaCurveHandle> | undefined,
  segmentIndex: number,
): AreaCurveHandle | undefined {
  if (!curveHandles) return undefined;
  return curveHandles[segmentIndex] ?? curveHandles[String(segmentIndex)];
}

/** Closed `area` polygon as SVG path `d` (straight edges or cubic beziers per segment). */
function areaToSvgPathD(
  points: Array<{ x: number; y: number }>,
  curveHandles?: Record<string, AreaCurveHandle>,
): string | null {
  if (points.length < 3) return null;

  const hasBezier = Boolean(curveHandles && Object.keys(curveHandles).length > 0);
  let d = `M ${points[0].x} ${points[0].y}`;

  if (hasBezier) {
    const n = points.length;
    for (let seg = 0; seg < n; seg++) {
      const segH = getAreaSegmentHandles(curveHandles, seg);
      const end = points[(seg + 1) % n];
      if (segH?.cp1 && segH?.cp2) {
        d += ` C ${segH.cp1.x} ${segH.cp1.y} ${segH.cp2.x} ${segH.cp2.y} ${end.x} ${end.y}`;
      } else {
        d += ` L ${end.x} ${end.y}`;
      }
    }
  } else {
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
  }

  return `${d} Z`;
}

function extendBoundsWithPoint(
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  p: { x: number; y: number },
): [number, number, number, number] {
  return [
    Math.min(minX, p.x),
    Math.max(maxX, p.x),
    Math.min(minY, p.y),
    Math.max(maxY, p.y),
  ];
}

function extendAreaBounds(
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  points: Array<{ x: number; y: number }>,
  curveHandles?: Record<string, AreaCurveHandle>,
): [number, number, number, number] {
  let bounds: [number, number, number, number] = [minX, maxX, minY, maxY];
  points.forEach((p) => {
    bounds = extendBoundsWithPoint(...bounds, p);
  });
  if (curveHandles) {
    Object.values(curveHandles).forEach((handles) => {
      if (handles.cp1) bounds = extendBoundsWithPoint(...bounds, handles.cp1);
      if (handles.cp2) bounds = extendBoundsWithPoint(...bounds, handles.cp2);
    });
  }
  return bounds;
}

/** Darken fill hex/rgb for a persistent area outline when stroke is not set. */
function darkenAreaColor(color: string, amount = 0.32): string {
  const c = color.trim();
  if (!c || c === 'transparent') return 'rgba(17, 24, 39, 0.55)';

  const hexMatch = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) hex = hex.split('').map((ch) => ch + ch).join('');
    const factor = 1 - amount;
    const r = Math.round(parseInt(hex.slice(0, 2), 16) * factor);
    const g = Math.round(parseInt(hex.slice(2, 4), 16) * factor);
    const b = Math.round(parseInt(hex.slice(4, 6), 16) * factor);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  const rgbMatch = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(c);
  if (rgbMatch) {
    const factor = 1 - amount;
    return `rgb(${Math.round(Number(rgbMatch[1]) * factor)}, ${Math.round(Number(rgbMatch[2]) * factor)}, ${Math.round(Number(rgbMatch[3]) * factor)})`;
  }

  return 'rgba(17, 24, 39, 0.55)';
}

function areaBorderStyle(el: ElementData): { stroke: string; strokeWidth: number } {
  const hasExplicitStroke = Boolean(
    el.strokeColor && el.strokeColor !== 'transparent' && el.strokeWidth > 0,
  );
  return {
    stroke: hasExplicitStroke
      ? el.strokeColor
      : darkenAreaColor(resolveElementFillColor(el)),
    strokeWidth: hasExplicitStroke ? el.strokeWidth : 2,
  };
}

/** Map JSON `textAlign` to SVG `textAnchor` and x offset for a center-based box (`cx`, `width`). */
function geometryTextPlacement(
  textAlign: string | undefined,
  cx: number,
  width: number,
): { textAnchor: 'start' | 'middle' | 'end'; x: number } {
  const a = (textAlign || 'center').toLowerCase();
  if (a === 'left' || a === 'start') {
    return { textAnchor: 'start', x: width > 0 ? cx - width / 2 : cx };
  }
  if (a === 'right' || a === 'end') {
    return { textAnchor: 'end', x: width > 0 ? cx + width / 2 : cx };
  }
  return { textAnchor: 'middle', x: cx };
}

/** Radius for `type === 'circle'` geometry (center `x`,`y`). */
function geometryCircleRadius(el: ElementData): number {
  if (typeof el.radius === 'number' && el.radius > 0) return el.radius;
  const w = el.width > 0 ? el.width : 0;
  const h = el.height > 0 ? el.height : 0;
  if (w > 0 && h > 0) return Math.min(w, h) / 2;
  if (w > 0) return w / 2;
  if (h > 0) return h / 2;
  return 0;
}

/** Lucide-style “login / entry” glyph paths in 24×24 viewBox (stroke-only). */
const ENTRY_GATE_ICON_PATH =
  'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3';

function EntryGateDecoration({ el }: { el: ElementData }) {
  const w = Math.max(el.width, 24);
  const h = Math.max(el.height, 16);
  const pad = Math.min(w, h) * 0.08;
  const r = Math.min(
    typeof el.radius === 'number' && el.radius > 0 ? el.radius : Math.min(w, h) * 0.15,
    w / 2,
    h / 2,
  );

  const labelText = el.gateName || el.label || el.name || 'Gate';
  const fontSize = Math.max(7, Math.min(w, h) * 0.16);
  const iconScale = (Math.min(w, h) - pad * 2) * 0.42 / 24;

  const fill = el.fillColor && el.fillColor !== 'transparent' ? el.fillColor : '#ffffff';
  const stroke = el.strokeColor && el.strokeColor !== 'transparent' ? el.strokeColor : '#111827';
  const sw = el.strokeWidth > 0 ? el.strokeWidth : 1.5;

  return (
    <g style={{ pointerEvents: 'none' }} transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation || 0})`}>
      <g transform={`translate(${-w / 2}, ${-h / 2})`}>
        <rect
          x={0}
          y={0}
          width={w}
          height={h}
          rx={r}
          ry={r}
          fill={fill}
          fillOpacity={el.opacity}
          stroke={stroke}
          strokeWidth={sw}
          strokeOpacity={el.opacity}
          vectorEffect="non-scaling-stroke"
        />
        <g transform={`translate(${w / 2}, ${h * 0.38}) scale(${iconScale}) translate(-12, -12)`}>
          <path
            d={ENTRY_GATE_ICON_PATH}
            fill="none"
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            opacity={el.opacity}
          />
        </g>
        <text
          x={w / 2}
          y={h - pad - 1}
          textAnchor="middle"
          dominantBaseline="auto"
          fontSize={fontSize}
          fontWeight={600}
          fill={stroke}
          fillOpacity={el.opacity}
          style={{ userSelect: 'none' }}
        >
          {labelText}
        </text>
      </g>
    </g>
  );
}

function TooltipArrow({ position }: { position: TooltipPlacement['arrowPosition'] }) {
  if (position === 'top') {
    return (
      <div className="absolute top-0 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-t border-l border-gray-200 bg-white" />
    );
  }

  return (
    <div className="absolute bottom-0 left-1/2 h-3 w-3 -translate-x-1/2 translate-y-1/2 rotate-45 border-b border-r border-gray-200 bg-white" />
  );
}

function seatRotationDeg(seed: SeedData): number {
  const raw = seed.rawData;
  if (raw && 'rotation' in raw && typeof raw.rotation === 'number' && Number.isFinite(raw.rotation)) {
    return raw.rotation;
  }
  return 0;
}

function SeatMarkGlyphs({ x, y, r, mark }: { x: number; y: number; r: number; mark: string }) {
  const normalized = normalizeSeatMark(mark);
  if (normalized === 'normal') return null;

  if (normalized === 'wheelchair') {
    return (
      <>
        <circle
          cx={x}
          cy={y}
          r={r - 2}
          fill="none"
          stroke="#ffffff"
          strokeWidth={1.4}
          strokeDasharray="2 2"
          style={{ pointerEvents: 'none' }}
        />
        <text
          x={x}
          y={y + 4}
          textAnchor="middle"
          fontSize={12}
          fill="#ffffff"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {'\u267F'}
        </text>
      </>
    );
  }

  return (
    <text
      x={x}
      y={y + 4}
      textAnchor="middle"
      fontSize={8}
      fontWeight={700}
      fill="#ffffff"
      style={{ pointerEvents: 'none', userSelect: 'none' }}
    >
      {normalized.slice(0, 2).toUpperCase()}
    </text>
  );
}

export function SeedLayoutSvg({
  seeds,
  elements,
  standingSections = [],
  activeClass,
  selectedSeats,
  ownedSeatIds,
  onSeatToggle,
  onSeatPriceSelect,
  onStandingSectionSelect,
  currencyCode,
  customTypeColors,
  isMobile,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  /** Area fill + labels — visible at overview zoom, hidden when zoomed into seats. */
  const areaOverviewRef = useRef<SVGGElement>(null);
  /** Invisible area polygons for tap-to-zoom at overview zoom. */
  const areaHitsRef = useRef<SVGGElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [hoveredSeat, setHoveredSeat] = useState<{
    seed: SeedData;
    pointerX: number;
    pointerY: number;
    seatX: number;
    seatY: number;
    anchorMode: TooltipAnchorMode;
  } | null>(null);
  const [hoveredStandingSection, setHoveredStandingSection] = useState<{
    section: StandingSectionData;
    remaining: number;
    pointerX: number;
    pointerY: number;
  } | null>(null);
  const tooltipHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const standingSectionsById = useMemo(
    () => new Map(standingSections.map((section) => [section.id, section])),
    [standingSections],
  );

  /** Blocked in layout but held/selected by this reservation — still available to the user. */
  const isSeatUnavailable = useCallback(
    (seed: SeedData) => {
      if (isUnknownSeatClassLabel(seed.type)) return true;
      if (!seed.isBooked) return false;
      if (ownedSeatIds?.has(seed.id)) return false;
      if (selectedSeats instanceof Set && selectedSeats.has(seed.id)) return false;
      return true;
    },
    [ownedSeatIds, selectedSeats],
  );

  const isSeatSelected = useCallback(
    (seed: SeedData) =>
      selectedSeats instanceof Set ? selectedSeats.has(seed.id) : false,
    [selectedSeats],
  );

  const isOwnedHold = useCallback(
    (seed: SeedData) =>
      Boolean(seed.isBooked && ownedSeatIds?.has(seed.id) && !isSeatSelected(seed)),
    [ownedSeatIds, isSeatSelected],
  );

  const getStandingRemaining = useCallback((sectionId: string) => {
    const section = standingSectionsById.get(sectionId);
    if (!section) return 0;

    return section.seeds.filter((seed) => !seed.isBooked && !selectedSeats.has(seed.id)).length;
  }, [selectedSeats, standingSectionsById]);

  // Helper to get color, prioritizing custom colors
  const getDynamicColor = useCallback((type: string) => {
    const lowerType = type.toLowerCase();
    if (customTypeColors && customTypeColors[lowerType]) {
      return customTypeColors[lowerType];
    }
    return TYPE_COLORS[lowerType] ?? DEFAULT_SEAT_COLOR;
  }, [customTypeColors]);

  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);
  /** Keeps seat tooltip visible through programmatic zoom after selection. */
  const suppressTooltipClearRef = useRef(false);
  const tooltipClearSuppressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const suppressTooltipClearDuring = useCallback((ms: number) => {
    if (tooltipClearSuppressTimerRef.current) {
      clearTimeout(tooltipClearSuppressTimerRef.current);
    }
    suppressTooltipClearRef.current = true;
    tooltipClearSuppressTimerRef.current = setTimeout(() => {
      suppressTooltipClearRef.current = false;
      tooltipClearSuppressTimerRef.current = null;
    }, ms);
  }, []);

  const cancelTooltipHide = useCallback(() => {
    if (tooltipHideTimer.current) {
      clearTimeout(tooltipHideTimer.current);
      tooltipHideTimer.current = null;
    }
  }, []);

  const hideTooltipSoon = useCallback(() => {
    cancelTooltipHide();
    tooltipHideTimer.current = setTimeout(() => {
      suppressTooltipClearRef.current = false;
      if (tooltipClearSuppressTimerRef.current) {
        clearTimeout(tooltipClearSuppressTimerRef.current);
        tooltipClearSuppressTimerRef.current = null;
      }
      setHoveredSeat(null);
      setHoveredStandingSection(null);
      tooltipHideTimer.current = null;
    }, 180);
  }, [cancelTooltipHide]);

  useEffect(() => {
    return () => {
      if (tooltipHideTimer.current) clearTimeout(tooltipHideTimer.current);
      if (tooltipClearSuppressTimerRef.current) {
        clearTimeout(tooltipClearSuppressTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setHoveredStandingSection((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        remaining: getStandingRemaining(prev.section.id),
      };
    });
  }, [getStandingRemaining, selectedSeats]);

  // ─── Content bounding box (rotation-aware so group-rotated layouts fit correctly) ──
  const contentBounds = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    const expand = (b: { minX: number; maxX: number; minY: number; maxY: number }) => {
      if (b.minX < minX) minX = b.minX;
      if (b.maxX > maxX) maxX = b.maxX;
      if (b.minY < minY) minY = b.minY;
      if (b.maxY > maxY) maxY = b.maxY;
    };

    seeds.forEach(s => {
      const sr = resolveSeatRadius(s);
      const shapeKind = parseSeatShapeKind(s.seatShape);
      const rot = seatRotationDeg(s);
      const size = sr * 2;
      if (shapeKind !== "NORMAL" && rot !== 0) {
        expand(rotatedBoxBounds(s.x, s.y, size, size, rot));
      } else {
        expand({ minX: s.x - sr, maxX: s.x + sr, minY: s.y - sr, maxY: s.y + sr });
      }
    });

    elements.forEach(el => {
      if ((el.type === 'area' || el.type === 'path') && el.points.length > 0) {
        const geom = elementRotationGeometry(el);
        [minX, maxX, minY, maxY] = extendAreaBounds(minX, maxX, minY, maxY, geom.points, geom.curveHandles);
      } else if (el.type === 'image') {
        expand(rotatedBoxBounds(el.x, el.y, el.width, el.height, el.rotation ?? 0));
      } else if (el.type === 'standing-section' || el.type === 'rectangle') {
        const w = el.width;
        const h = el.height;
        if (w > 0 && h > 0) expand(rotatedBoxBounds(el.x, el.y, w, h, el.rotation ?? 0));
      } else if (el.type === 'entry-gate') {
        const gw = Math.max(el.width, 8);
        const gh = Math.max(el.height, 8);
        expand(rotatedBoxBounds(el.x, el.y, gw, gh, el.rotation ?? 0));
      } else if (el.type === 'circle') {
        const cr = geometryCircleRadius(el);
        if (cr > 0) expand({ minX: el.x - cr, maxX: el.x + cr, minY: el.y - cr, maxY: el.y + cr });
      } else if (el.type === 'text') {
        const w = el.width;
        const h = el.height;
        const fs = el.textFontSize ?? el.labelFontSize ?? 16;
        const tw = w > 0 ? w : Math.max(8 * fs, 48);
        const th = h > 0 ? h : Math.max(fs * 1.2, 12);
        expand(rotatedBoxBounds(el.x, el.y, tw, th, el.rotation ?? 0));
      }
    });

    const padding = ZOOM_CONFIG.CONTENT_BOUNDS_PADDING;
    return {
      minX: minX - padding,
      maxX: maxX + padding,
      minY: minY - padding,
      maxY: maxY + padding,
    };
  }, [seeds, elements]);

  const contentSize = {
    width: contentBounds.maxX === -Infinity ? 0 : contentBounds.maxX - contentBounds.minX,
    height: contentBounds.maxY === -Infinity ? 0 : contentBounds.maxY - contentBounds.minY,
  };

  const layoutFitPadding = isMobile ? 0.05 : ZOOM_CONFIG.FIT_PADDING;

  const fitToScreenZoom = useMemo(() => {
    if (
      viewportSize.width <= 0 ||
      viewportSize.height <= 0 ||
      contentSize.width <= 0 ||
      contentSize.height <= 0
    ) {
      return ZOOM_CONFIG.MIN_ZOOM;
    }

    const scaleX = viewportSize.width / contentSize.width;
    const scaleY = viewportSize.height / contentSize.height;
    return Math.min(scaleX, scaleY) * (1 - layoutFitPadding);
  }, [
    viewportSize.width,
    viewportSize.height,
    contentSize.width,
    contentSize.height,
    layoutFitPadding,
  ]);

  const seatBelowGap = ZOOM_CONFIG.SEAT_RADIUS + 12;

  // ─── Overview vs seat-detail zoom: filled areas on top at load; border-only when zoomed in ─
  const handleScaleChange = useCallback((scale: number) => {
    const minZoom = fitToScreenZoom;
    const fadeStart = minZoom * ZOOM_CONFIG.AREA_FADE_START_RATIO;
    const fadeEnd = Math.max(
      fadeStart + minZoom * 0.05,
      minZoom * ZOOM_CONFIG.AREA_FADE_END_RATIO,
    );

    let overviewOpacity = 1;
    let hitsPointerEvents: 'auto' | 'none' = 'auto';
    if (scale >= fadeEnd) {
      overviewOpacity = 0;
      hitsPointerEvents = 'none';
    } else if (scale > fadeStart) {
      const t = (scale - fadeStart) / (fadeEnd - fadeStart);
      overviewOpacity = 1 - t;
      hitsPointerEvents = t > 0.5 ? 'none' : 'auto';
    }

    const overviewOpacityStr = String(overviewOpacity);
    if (areaOverviewRef.current) {
      areaOverviewRef.current.style.opacity = overviewOpacityStr;
    }
    if (areaHitsRef.current) {
      areaHitsRef.current.style.opacity = overviewOpacityStr;
      areaHitsRef.current.style.pointerEvents = hitsPointerEvents;
    }
  }, [fitToScreenZoom]);

  const { resetView, zoomIn, zoomOut, zoomToContentPoint, zoomToFitRect, getScale } = useZoomPanSVG(svgRef, gRef, {
    contentSize,
    contentOrigin: { x: contentBounds.minX, y: contentBounds.minY },
    viewportSize,
    minZoom: fitToScreenZoom,
    maxZoom: isMobile ? Math.max(1.2, fitToScreenZoom) : ZOOM_CONFIG.MAX_ZOOM,
    zoomSensitivity: ZOOM_CONFIG.ZOOM_SENSITIVITY,
    zoomStepFactor: ZOOM_CONFIG.ZOOM_STEP_FACTOR,
    fitPadding: layoutFitPadding,
    panExpansionRatio: ZOOM_CONFIG.PAN_EXPANSION_RATIO,
    onScaleChange: (scale) => {
      handleScaleChange(scale);
      if (suppressTooltipClearRef.current) return;
      setHoveredSeat((prev) => (prev ? null : prev));
      setHoveredStandingSection((prev) => (prev ? null : prev));
    },
  });

  // Re-apply area fade when fit zoom changes (resize / layout bounds) without a pan/zoom event.
  useEffect(() => {
    handleScaleChange(getScale());
  }, [fitToScreenZoom, handleScaleChange, getScale]);

  // ─── Track viewport size ──────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(entries => {
      setViewportSize({
        width: entries[0].contentRect.width,
        height: entries[0].contentRect.height,
      });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // ─── Initial fit ──────────────────────────────────────────────
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (viewportSize.width > 0 && !hasInitialized.current) {
      resetView();
      hasInitialized.current = true;
    }
  }, [viewportSize, resetView]);

  // ─── Zoom to cumulative bounds when a ticket class is selected ──
  const prevActiveClassRef = useRef<string | null>(null);
  useEffect(() => {
    if (viewportSize.width <= 0) return;

    const prevActiveClass = prevActiveClassRef.current;
    if (prevActiveClass === activeClass) return;

    prevActiveClassRef.current = activeClass;

    if (!activeClass) {
      resetView();
      return;
    }

    const classSeeds = [
      ...seeds.filter((seed) => seed.type === activeClass),
      ...standingSections.flatMap((section) =>
        section.seeds.filter((seed) => seed.type === activeClass),
      ),
    ];
    if (classSeeds.length === 0) return;

    const seatPadding = ZOOM_CONFIG.SEAT_RADIUS * 2;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    classSeeds.forEach((seed) => {
      if (seed.x - seatPadding < minX) minX = seed.x - seatPadding;
      if (seed.x + seatPadding > maxX) maxX = seed.x + seatPadding;
      if (seed.y - seatPadding < minY) minY = seed.y - seatPadding;
      if (seed.y + seatPadding > maxY) maxY = seed.y + seatPadding;
    });

    const padding = isMobile ? -0.05 : 0.1;

    zoomToFitRect(minX, minY, maxX, maxY, padding);
  }, [
    activeClass,
    seeds,
    standingSections,
    viewportSize.width,
    zoomToFitRect,
    resetView,
    isMobile,
  ]);

  // ─── Pointer tracking (mouse + touch) ─────────────────────────
  const handlePointerDown = useCallback((e: React.MouseEvent) => {
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleTouchPointerDown = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      mouseDownPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, []);

  /** Returns true if the pointer moved too far (i.e. it was a drag, not a tap) */
  const wasDrag = useCallback((clientX: number, clientY: number): boolean => {
    if (!mouseDownPos.current) return false;
    const dx = Math.abs(clientX - mouseDownPos.current.x);
    const dy = Math.abs(clientY - mouseDownPos.current.y);
    return dx > 5 || dy > 5;
  }, []);

  // ─── Core seat selection logic (shared by mouse + touch) ──────
  const performSeatSelect = useCallback(
    (seed: SeedData) => {
      if (isUnknownSeatClassLabel(seed.type)) return;

      // ─── Log the requested seat object structure ────────────────
      let rowName = null;
      let seatNumber = null;
      if (seed.name && seed.name.includes('-')) {
        const parts = seed.name.split('-');
        rowName = parts[0];
        seatNumber = parts[1];
      }

      const raw = seed.rawData;

      const seatStatus = getSeatStatusCode(raw);

      const seatLogObj = {
        seat_chart_id: raw && 'seat_chart_id' in raw ? raw.seat_chart_id ?? '' : '',
        zone_id: raw?.zone_id ?? null,
        zone_name: raw?.zone_name ?? null,
        seat_row_name: rowName,
        seat_number: seatNumber,
        gate_name: raw?.gate_name ?? null,
        gate_id: raw?.gate_id ?? null,
        layout_seat_id: seed.id,
        seat_status: seatStatus === 1 ? "SOLD" : seatStatus === 2 ? "HOLD" : "AVAILABLE",
        is_reserved: seatStatus === 2,
        is_booked: seatStatus === 1,
        seat_release_time: new Date().toISOString()
      };

      console.log("Clicked Seat Object:", seatLogObj);
      // ────────────────────────────────────────────────────────────

      const isCurrentlySelected = selectedSeats instanceof Set && selectedSeats.has(seed.id);
      onSeatToggle(seed);

      if (!isCurrentlySelected) {
        // On mobile, force a deeper zoom so individual seats are clearly tappable
        const mobileScale = isMobile ? Math.max(getScale(), 1.2) : undefined;
        zoomToContentPoint(seed.x, seed.y, mobileScale);
      }
    },
    [onSeatToggle, selectedSeats, zoomToContentPoint, isMobile, getScale]
  );

  const showTooltipForSeat = useCallback((seed: SeedData, clientX: number, clientY: number, force = false) => {
    const scale = getScale();
    if (!force && scale < 0.4) return;

    const container = containerRef.current;
    const svg = svgRef.current;
    const zoomGroup = gRef.current;
    if (!container || !svg || !zoomGroup) return;

    const pointer = getContainerPointerPoint(container, clientX, clientY);
    const seatPoint = projectSeatToContainer(container, svg, zoomGroup, contentBounds, seed.x, seed.y) ?? pointer;
    const hasMultiplePrices =
      !isSeatUnavailable(seed) && (seed.priceOptions?.length ?? 0) > 1;
    const anchorMode: TooltipAnchorMode = hasMultiplePrices ? 'seat-below' : 'pointer-above';

    cancelTooltipHide();
    setHoveredStandingSection(null);
    setHoveredSeat({
      seed,
      pointerX: pointer.x,
      pointerY: pointer.y,
      seatX: seatPoint.x,
      seatY: seatPoint.y,
      anchorMode,
    });
  }, [cancelTooltipHide, contentBounds, getScale, isSeatUnavailable]);

  const pinSeatTooltip = useCallback(
    (seed: SeedData, clientX: number, clientY: number) => {
      suppressTooltipClearDuring(750);
      showTooltipForSeat(seed, clientX, clientY, true);
      // Re-anchor after selection zoom animation (~600ms).
      window.setTimeout(() => {
        showTooltipForSeat(seed, clientX, clientY, true);
      }, 650);
    },
    [showTooltipForSeat, suppressTooltipClearDuring],
  );

  const moveSeatTooltip = useCallback((seed: SeedData, clientX: number, clientY: number) => {
    if (getScale() < 0.4) return;

    const container = containerRef.current;
    if (!container) return;

    const pointer = getContainerPointerPoint(container, clientX, clientY);
    setHoveredSeat((prev) => {
      if (!prev || prev.seed.id !== seed.id || prev.anchorMode === 'seat-below') return prev;
      return {
        ...prev,
        pointerX: pointer.x,
        pointerY: pointer.y,
      };
    });
  }, [getScale]);

  const showTooltipForStandingSection = useCallback((sectionId: string, clientX: number, clientY: number) => {
    const section = standingSectionsById.get(sectionId);
    const container = containerRef.current;
    if (!section || !container) return;

    const pointer = getContainerPointerPoint(container, clientX, clientY);

    cancelTooltipHide();
    setHoveredSeat(null);
    setHoveredStandingSection({
      section,
      remaining: getStandingRemaining(sectionId),
      pointerX: pointer.x,
      pointerY: pointer.y,
    });
  }, [cancelTooltipHide, getStandingRemaining, standingSectionsById]);

  const moveStandingTooltip = useCallback((sectionId: string, clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container) return;

    const pointer = getContainerPointerPoint(container, clientX, clientY);
    setHoveredStandingSection((prev) => {
      if (!prev || prev.section.id !== sectionId) return prev;
      return {
        ...prev,
        pointerX: pointer.x,
        pointerY: pointer.y,
      };
    });
  }, []);

  // ─── Mouse click handler (seats) ──────────────────────────────
  const handleSeatClick = useCallback(
    (e: React.MouseEvent, seed: SeedData) => {
      if (wasDrag(e.clientX, e.clientY)) return;
      e.stopPropagation();
      if (isSeatUnavailable(seed)) return;

      const isCurrentlySelected = selectedSeats instanceof Set && selectedSeats.has(seed.id);
      if (!isCurrentlySelected && (seed.priceOptions?.length ?? 0) > 1) {
        pinSeatTooltip(seed, e.clientX, e.clientY);
        return;
      }

      performSeatSelect(seed);
      pinSeatTooltip(seed, e.clientX, e.clientY);
    },
    [wasDrag, performSeatSelect, selectedSeats, pinSeatTooltip, isSeatUnavailable]
  );

  // ─── Touch tap handler (seats) — instant, no 300ms delay ──────
  const handleSeatTouchEnd = useCallback(
    (e: React.TouchEvent, seed: SeedData) => {
      const touch = e.changedTouches[0];
      if (wasDrag(touch.clientX, touch.clientY)) return;
      e.preventDefault(); // Prevent subsequent synthetic click
      e.stopPropagation();
      if (isSeatUnavailable(seed)) return;

      const isCurrentlySelected = selectedSeats instanceof Set && selectedSeats.has(seed.id);
      if (!isCurrentlySelected && (seed.priceOptions?.length ?? 0) > 1) {
        pinSeatTooltip(seed, touch.clientX, touch.clientY);
        return;
      }

      performSeatSelect(seed);
      pinSeatTooltip(seed, touch.clientX, touch.clientY);
    },
    [wasDrag, performSeatSelect, selectedSeats, pinSeatTooltip, isSeatUnavailable]
  );

  // ─── Core area zoom logic (shared by mouse + touch) ───────────
  const performAreaZoom = useCallback(
    (el: ElementData) => {
      if (el.points.length < 2) return;

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      const geom = elementRotationGeometry(el);
      [minX, maxX, minY, maxY] = extendAreaBounds(minX, maxX, minY, maxY, geom.points, geom.curveHandles);

      // On mobile: use negative padding to zoom PAST the bounding box (deeper zoom)
      // On desktop: keep the comfortable 0.15 padding
      const padding = isMobile ? -2 : 0.15;
      zoomToFitRect(minX, minY, maxX, maxY, padding);
    },
    [zoomToFitRect, isMobile]
  );

  // ─── Mouse click handler (areas) ──────────────────────────────
  const handleAreaClick = useCallback(
    (e: React.MouseEvent, el: ElementData) => {
      if (wasDrag(e.clientX, e.clientY)) return;
      e.stopPropagation();
      performAreaZoom(el);
    },
    [wasDrag, performAreaZoom]
  );

  // ─── Touch tap handler (areas) — instant, no 300ms delay ──────
  const handleAreaTouchEnd = useCallback(
    (e: React.TouchEvent, el: ElementData) => {
      const touch = e.changedTouches[0];
      if (wasDrag(touch.clientX, touch.clientY)) return;
      e.preventDefault(); // Prevent subsequent synthetic click
      e.stopPropagation();
      performAreaZoom(el);
    },
    [wasDrag, performAreaZoom]
  );

  const performStandingSectionSelect = useCallback((sectionId: string) => {
    onStandingSectionSelect?.(sectionId);
  }, [onStandingSectionSelect]);

  const handleStandingSectionClick = useCallback(
    (e: React.MouseEvent, el: ElementData) => {
      if (wasDrag(e.clientX, e.clientY)) return;
      e.stopPropagation();

      if (getStandingRemaining(el.id) < 1) return;

      performStandingSectionSelect(el.id);
    },
    [getStandingRemaining, performStandingSectionSelect, wasDrag]
  );

  const handleStandingSectionTouchEnd = useCallback(
    (e: React.TouchEvent, el: ElementData) => {
      const touch = e.changedTouches[0];
      if (wasDrag(touch.clientX, touch.clientY)) return;
      e.preventDefault();
      e.stopPropagation();

      if (getStandingRemaining(el.id) < 1) return;

      performStandingSectionSelect(el.id);
    },
    [getStandingRemaining, performStandingSectionSelect, wasDrag]
  );

  const imageElements = elements.filter(el => el.type === 'image');
  const pathElements = elements.filter(el => el.type === 'path');
  const rectangleElements = elements.filter(el => el.type === 'rectangle');
  const textElements = elements.filter(el => el.type === 'text');
  const circleElements = elements.filter(el => el.type === 'circle');
  const entryGateElements = elements.filter(el => el.type === 'entry-gate');
  const areaElements = elements.filter(el => el.type === 'area');
  const standingSectionElements = elements.filter(el => el.type === 'standing-section');

  const standingTooltipLayout = useMemo(() => {
    if (!hoveredStandingSection || viewportSize.width <= 0) return null;

    const size = getTooltipContentSize({
      kind: 'standing',
      hasPrice: Boolean(hoveredStandingSection.section.seeds[0]),
    });

    return {
      size,
      placement: getTooltipPlacement({
        anchorMode: 'pointer-above',
        pointer: { x: hoveredStandingSection.pointerX, y: hoveredStandingSection.pointerY },
        seat: { x: hoveredStandingSection.pointerX, y: hoveredStandingSection.pointerY },
        containerSize: viewportSize,
        tooltipSize: size,
        seatBelowGap,
        allowOverflow: true,
      }),
    };
  }, [hoveredStandingSection, seatBelowGap, viewportSize]);

  const seatTooltipLayout = useMemo(() => {
    if (!hoveredSeat || viewportSize.width <= 0) return null;

    const size = getTooltipContentSize({
      kind: 'seat',
      isBooked: isSeatUnavailable(hoveredSeat.seed),
      priceOptionCount: hoveredSeat.seed.priceOptions?.length,
    });

    return {
      size,
      placement: getTooltipPlacement({
        anchorMode: hoveredSeat.anchorMode,
        pointer: { x: hoveredSeat.pointerX, y: hoveredSeat.pointerY },
        seat: { x: hoveredSeat.seatX, y: hoveredSeat.seatY },
        containerSize: viewportSize,
        tooltipSize: size,
        seatBelowGap,
        allowOverflow: hoveredSeat.anchorMode === 'pointer-above',
      }),
    };
  }, [hoveredSeat, seatBelowGap, viewportSize, isSeatUnavailable]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-transparent">
      {/* ─── Zoom controls ─────────────────────────────────────── */}
      <div className="absolute top-6 right-6 flex flex-col gap-1.5 z-10">
        <button
          onClick={zoomIn}
          className={isMobile
            ? "p-3 bg-white/80 backdrop-blur-md border border-gray-200 rounded-xl text-gray-600 active:bg-gray-100 transition-all shadow-lg"
            : "p-3 bg-white/90 backdrop-blur-md border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors shadow-xl"
          }
          aria-label="Zoom in"
        >
          <ZoomIn className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
        </button>
        <button
          onClick={resetView}
          className={isMobile
            ? "p-3 bg-white/80 backdrop-blur-md border border-gray-200 rounded-xl text-gray-600 active:bg-gray-100 transition-all shadow-lg"
            : "p-3 bg-white/90 backdrop-blur-md border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors shadow-xl"
          }
          aria-label="Fit to screen"
        >
          <RefreshCw className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
        </button>
        <button
          onClick={zoomOut}
          className={isMobile
            ? "p-3 bg-white/80 backdrop-blur-md border border-gray-200 rounded-xl text-gray-600 active:bg-gray-100 transition-all shadow-lg"
            : "p-3 bg-white/90 backdrop-blur-md border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors shadow-xl"
          }
          aria-label="Zoom out"
        >
          <ZoomOut className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
        </button>
      </div>

      <div className="absolute inset-0 overflow-hidden">
      {/* ─── SVG Canvas ────────────────────────────────────────── */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        className="touch-none select-none"
        style={{ cursor: 'grab' }}
      >
        <defs>
          <pattern id="blocked-pattern" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="8" fill="#e2e8f0" />
            <line x1="0" y1="0" x2="0" y2="8" stroke="#cbd5e1" strokeWidth="4" />
          </pattern>
        </defs>
        <g ref={gRef}>

            {/* Layer 1: Image elements (venue floor plan) */}
            {imageElements.map(el => {
              const imgX = el.x - el.width / 2;
              const imgY = el.y - el.height / 2;
              return (
                <image
                  key={el.id}
                  href={el.src}
                  x={imgX}
                  y={imgY}
                  width={el.width}
                  height={el.height}
                  opacity={el.opacity}
                  style={{ pointerEvents: 'none' }}
                  transform={el.rotation ? `rotate(${el.rotation}, ${el.x}, ${el.y})` : undefined}
                />
              );
            })}

            {pathElements.map((el) => {
              const geom = elementRotationGeometry(el);
              const d = pathToSvgPathD(
                geom.points,
                geom.curveHandles,
                el.pathClosed ?? false,
              );
              if (!d) return null;

              const fillColor = resolveElementFillColor(el);
              const hasFill = fillColor !== 'transparent';
              const strokeColor = effectiveElementStrokeColor(el);
              const baseStrokeWidth = el.strokeWidth > 0 ? el.strokeWidth : 2;
              const strokeW = baseStrokeWidth;

              return (
                <path
                  key={el.id}
                  d={d}
                  fill={hasFill ? fillColor : 'none'}
                  fillOpacity={hasFill ? el.opacity : undefined}
                  stroke={strokeColor}
                  strokeWidth={strokeW}
                  strokeOpacity={el.opacity}
                  vectorEffect="non-scaling-stroke"
                  style={{ pointerEvents: 'none' }}
                />
              );
            })}

            {rectangleElements.map((el) => {
              const w = el.width;
              const h = el.height;
              if (w <= 0 || h <= 0) return null;

              const left = el.x - w / 2;
              const top = el.y - h / 2;
              const cx = el.x;
              const cy = el.y;
              const br = el.borderRadius ?? 0;
              const rx = Math.max(0, Math.min(br, w / 2, h / 2));

              const fillColor = resolveElementFillColor(el);
              const hasFill = fillColor !== 'transparent';
              const hasStroke = Boolean(el.strokeColor && el.strokeColor !== 'transparent');
              const strokeW = hasStroke ? (el.strokeWidth > 0 ? el.strokeWidth : 1) : 0;
              const groupTransform = el.rotation ? `rotate(${el.rotation}, ${cx}, ${cy})` : undefined;

              const labelText = (el.label || el.name || '').trim();
              const fontSize = el.labelFontSize ?? Math.max(10, Math.min(Math.min(w, h) * 0.12, 72));
              const textFill = el.labelColor
                ?? (hasStroke ? el.strokeColor : '#111827');
              const labelTransform = el.labelRotation
                ? `rotate(${el.labelRotation}, ${cx}, ${cy})`
                : undefined;

              return (
                <g key={el.id} style={{ pointerEvents: 'none' }} transform={groupTransform}>
                  <rect
                    x={left}
                    y={top}
                    width={w}
                    height={h}
                    rx={rx}
                    ry={rx}
                    fill={hasFill ? fillColor : 'none'}
                    fillOpacity={hasFill ? el.opacity : undefined}
                    stroke={hasStroke ? el.strokeColor : 'none'}
                    strokeWidth={strokeW}
                    strokeOpacity={hasStroke ? el.opacity : undefined}
                    vectorEffect="non-scaling-stroke"
                  />
                  {labelText ? (
                    <text
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={fontSize}
                      fontWeight={600}
                      fill={textFill}
                      fillOpacity={el.opacity}
                      transform={labelTransform}
                      style={{ userSelect: 'none', paintOrder: 'stroke', stroke: 'rgba(255,255,255,0.85)', strokeWidth: 3 }}
                    >
                      {labelText}
                    </text>
                  ) : null}
                </g>
              );
            })}

            {circleElements.map((el) => {
              const cr = geometryCircleRadius(el);
              if (cr <= 0) return null;

              const fillColor = resolveElementFillColor(el);
              const hasFill = fillColor !== 'transparent';
              const hasStroke = Boolean(el.strokeColor && el.strokeColor !== 'transparent');
              const strokeW = hasStroke ? (el.strokeWidth > 0 ? el.strokeWidth : 1) : 0;
              const groupTransform = el.rotation ? `rotate(${el.rotation}, ${el.x}, ${el.y})` : undefined;

              const labelText = (el.label || el.name || '').trim();
              const fontSize = el.labelFontSize ?? Math.max(8, Math.min(cr * 0.42, 22));
              const textFill = el.labelColor
                ?? (hasStroke ? el.strokeColor : '#111827');

              return (
                <g key={el.id} style={{ pointerEvents: 'none' }} transform={groupTransform}>
                  <circle
                    cx={el.x}
                    cy={el.y}
                    r={cr}
                    fill={hasFill ? fillColor : 'none'}
                    fillOpacity={hasFill ? el.opacity : undefined}
                    stroke={hasStroke ? el.strokeColor : 'none'}
                    strokeWidth={strokeW}
                    strokeOpacity={hasStroke ? el.opacity : undefined}
                    vectorEffect="non-scaling-stroke"
                  />
                  {labelText ? (
                    <text
                      x={el.x}
                      y={el.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={fontSize}
                      fontWeight={600}
                      fill={textFill}
                      fillOpacity={el.opacity}
                      style={{ userSelect: 'none', paintOrder: 'stroke', stroke: 'rgba(255,255,255,0.85)', strokeWidth: 3 }}
                    >
                      {labelText}
                    </text>
                  ) : null}
                </g>
              );
            })}

            {textElements.map((el) => {
              const body = (el.textContent ?? el.label ?? el.name ?? '').trim();
              if (!body) return null;

              const cx = el.x;
              const cy = el.y;
              const w = el.width;
              const h = el.height;
              const fontSize = el.textFontSize ?? el.labelFontSize ?? Math.max(10, Math.min(h > 0 ? h * 0.9 : 18, 160));
              const { textAnchor, x: textX } = geometryTextPlacement(el.textAlign, cx, w);

              const hasFill = Boolean(el.fillColor && el.fillColor !== 'transparent');
              const hasStroke = Boolean(el.strokeColor && el.strokeColor !== 'transparent');
              const strokeW = hasStroke ? (el.strokeWidth > 0 ? el.strokeWidth : 1) : 0;

              const groupTransform = el.rotation ? `rotate(${el.rotation}, ${cx}, ${cy})` : undefined;
              const labelTransform = el.labelRotation ? `rotate(${el.labelRotation}, ${cx}, ${cy})` : undefined;

              const fontFamily = el.textFontFamily?.replace(/['"]/g, '');
              const fontWeight = el.textFontWeight ?? 'normal';

              return (
                <g key={el.id} style={{ pointerEvents: 'none' }} transform={groupTransform}>
                  <text
                    x={textX}
                    y={cy}
                    textAnchor={textAnchor}
                    dominantBaseline="central"
                    fontSize={fontSize}
                    fontFamily={fontFamily || 'Arial, Helvetica, sans-serif'}
                    fontWeight={fontWeight}
                    fill={hasFill ? el.fillColor : '#000000'}
                    fillOpacity={el.opacity}
                    stroke={hasStroke ? el.strokeColor : 'none'}
                    strokeWidth={hasStroke ? strokeW : undefined}
                    strokeOpacity={hasStroke ? el.opacity : undefined}
                    transform={labelTransform}
                    style={{ userSelect: 'none' }}
                  >
                    {body}
                  </text>
                </g>
              );
            })}

            {entryGateElements.map((el) => (
              <EntryGateDecoration key={el.id} el={el} />
            ))}

            {/* Seats (areas sit above when zoomed out; borders above seats when zoomed in) */}
            {seeds.map(seed => {
              const seatR = resolveSeatRadius(seed);
              const isActive = !activeClass || activeClass === seed.type;
              const isSelected = isSeatSelected(seed);
              const isBooked = isSeatUnavailable(seed);
              const shapeKind = parseSeatShapeKind(seed.seatShape);
              const rot = seatRotationDeg(seed);
              const bodyTransform = seatBodyRotateTransform(
                seed.x,
                seed.y,
                shapeKind,
                rot,
              );
              const seatColor = getDynamicColor(seed.type);
              const showLegacyMarkGlyphs =
                shapeKind === 'NORMAL' && normalizeSeatMark(seed.seatMark) !== 'normal';

              if (!isActive) {
                return (
                  <g key={seed.id} style={{ pointerEvents: 'none' }}>
                    <g transform={bodyTransform}>
                      <SeatShapeSvg
                        cx={seed.x}
                        cy={seed.y}
                        r={seatR}
                        fill={seatColor}
                        shapeKind={shapeKind}
                        opacity={0.08}
                      />
                      {showLegacyMarkGlyphs ? (
                        <SeatMarkGlyphs x={seed.x} y={seed.y} r={seatR} mark={seed.seatMark} />
                      ) : null}
                    </g>
                  </g>
                );
              }

              if (isBooked) {
                // BLOCKED (layout-level) = solid grey. BOOKED/RESERVED/HOLD = faded category color.
                const bookedFill = seed.isBlocked ? '#9ca3af' : seatColor;
                const bookedOpacity = seed.isBlocked ? 0.85 : 0.3;
                return (
                  <g
                    key={seed.id}
                    onMouseEnter={(e) => {
                      showTooltipForSeat(seed, e.clientX, e.clientY);
                    }}
                    onMouseMove={(e) => moveSeatTooltip(seed, e.clientX, e.clientY)}
                    onMouseLeave={hideTooltipSoon}
                  >
                    <g transform={bodyTransform}>
                      <SeatShapeSvg
                        cx={seed.x}
                        cy={seed.y}
                        r={seatR}
                        fill={bookedFill}
                        shapeKind={shapeKind}
                        opacity={bookedOpacity}
                        style={{ cursor: 'not-allowed' }}
                      />
                      <SeatShapeSvg
                        cx={seed.x}
                        cy={seed.y}
                        r={seatR}
                        fill="none"
                        stroke="#cbd5e1"
                        strokeWidth={1}
                        shapeKind={shapeKind}
                        opacity={0.5}
                        style={{ pointerEvents: 'none' }}
                      />
                      {showLegacyMarkGlyphs ? (
                        <SeatMarkGlyphs x={seed.x} y={seed.y} r={seatR} mark={seed.seatMark} />
                      ) : null}
                    </g>
                  </g>
                );
              }

              const fillColor = seatColor;
              const selectedBorderColor = darkenSeatColor(seatColor);
              const selectedRingColor = seatColorWithAlpha(seatColor, 0.45);

              return (
                <g
                  key={seed.id}
                  onMouseDown={handlePointerDown}
                  onTouchStart={handleTouchPointerDown}
                  onClick={(e) => handleSeatClick(e, seed)}
                  onTouchEnd={(e) => handleSeatTouchEnd(e, seed)}
                  onMouseEnter={(e) => {
                    showTooltipForSeat(seed, e.clientX, e.clientY);
                  }}
                  onMouseMove={(e) => moveSeatTooltip(seed, e.clientX, e.clientY)}
                  onMouseLeave={hideTooltipSoon}
                  style={{ cursor: 'pointer' }}
                  className="hover:brightness-90 transition-all duration-200 origin-center"
                  data-seat-element="true"
                  data-seat-id={seed.id}
                  data-seat-type={seed.type ?? ""}
                  data-seat-status={isBooked ? "unavailable" : isSelected ? "selected" : "available"}
                >
                  {isSelected && (
                    <circle
                      cx={seed.x}
                      cy={seed.y}
                      r={seatR + 4}
                      fill="none"
                      stroke={selectedRingColor}
                      strokeWidth={2}
                      vectorEffect="non-scaling-stroke"
                    >
                      <animate attributeName="r" values={`${seatR + 3};${seatR + 5};${seatR + 3}`} dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="stroke-opacity" values="0.55;0.2;0.55" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <g transform={bodyTransform}>
                    <SeatShapeSvg
                      cx={seed.x}
                      cy={seed.y}
                      r={seatR}
                      fill={fillColor}
                      stroke={isSelected ? selectedBorderColor : 'transparent'}
                      strokeWidth={isSelected ? 2.5 : 0}
                      shapeKind={shapeKind}
                      seatMark={!isSelected && !showLegacyMarkGlyphs ? seed.seatMark : undefined}
                    />
                    {!isSelected && showLegacyMarkGlyphs ? (
                      <SeatMarkGlyphs x={seed.x} y={seed.y} r={seatR} mark={seed.seatMark} />
                    ) : null}
                  </g>
                  {isSelected && (
                    <path
                      d={`M${seed.x - 4},${seed.y} L${seed.x - 1},${seed.y + 3} L${seed.x + 5},${seed.y - 3}`}
                      fill="none"
                      stroke="white"
                      strokeWidth={2}
                      vectorEffect="non-scaling-stroke"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ pointerEvents: 'none' }}
                    />
                  )}
                </g>
              );
            })}

            {/* Area fill + labels on top at overview zoom (fade out when zoomed into seats) */}
            <g
              ref={areaOverviewRef}
              style={{ transition: 'opacity 0.2s ease', pointerEvents: 'none' }}
            >
              {areaElements.map((el) => {
                const geom = elementRotationGeometry(el);
                const areaPathD = areaToSvgPathD(geom.points, geom.curveHandles);
                if (!areaPathD) return null;
                const fillColor = resolveElementFillColor(el);
                const labelText = resolveAreaLabelText(el);
                const { x: labelX, y: labelY } = resolveAreaLabelPosition(el);
                const labelRot = el.labelRotation ?? 0;
                return (
                  <g key={`${el.id}-overview`} style={{ pointerEvents: 'none' }}>
                    {fillColor !== 'transparent' ? (
                      <path
                        d={areaPathD}
                        fill={fillColor}
                        fillOpacity={el.opacity ?? 1}
                        stroke="none"
                      />
                    ) : null}
                    {labelText ? (
                      <text
                        x={labelX}
                        y={labelY}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={el.labelFontSize || 18}
                        fill={el.labelColor || '#111827'}
                        fontWeight="700"
                        opacity={el.opacity ?? 1}
                        style={{
                          userSelect: 'none',
                          paintOrder: 'stroke',
                          stroke: 'rgba(255,255,255,0.85)',
                          strokeWidth: 3,
                        }}
                        transform={
                          labelRot
                            ? `rotate(${labelRot}, ${labelX}, ${labelY})`
                            : undefined
                        }
                      >
                        {labelText}
                      </text>
                    ) : null}
                  </g>
                );
              })}
            </g>

            {/* Area borders — always visible; only outline remains when zoomed in */}
            <g style={{ pointerEvents: 'none' }}>
              {areaElements.map((el) => {
                const geom = elementRotationGeometry(el);
                const areaPathD = areaToSvgPathD(geom.points, geom.curveHandles);
                if (!areaPathD) return null;
                const { stroke, strokeWidth } = areaBorderStyle(el);
                return (
                  <path
                    key={`${el.id}-border`}
                    d={areaPathD}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    strokeOpacity={1}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </g>

            {/* Tap area to zoom into seats (overview only) */}
            <g
              ref={areaHitsRef}
              style={{ transition: 'opacity 0.2s ease' }}
            >
              {areaElements.map((el) => {
                const geom = elementRotationGeometry(el);
                const areaPathD = areaToSvgPathD(geom.points, geom.curveHandles);
                if (!areaPathD) return null;
                return (
                  <path
                    key={`${el.id}-hit`}
                    d={areaPathD}
                    fill="rgba(0,0,0,0.001)"
                    stroke="none"
                    style={{ cursor: 'pointer' }}
                    onMouseDown={handlePointerDown}
                    onTouchStart={handleTouchPointerDown}
                    onClick={(e) => handleAreaClick(e, el)}
                    onTouchEnd={(e) => handleAreaTouchEnd(e, el)}
                  />
                );
              })}
            </g>

            {/* Standing sections stay visible and clickable at every zoom level */}
            <g>
              {standingSectionElements.map(el => {
                const section = standingSectionsById.get(el.id);
                const remaining = getStandingRemaining(el.id);
                const label = el.label || section?.label || el.name || 'Standing';
                const w = el.width;
                const h = el.height;
                const left = el.x - w / 2;
                const top = el.y - h / 2;
                const cx = el.x;
                const cy = el.y;
                const isSoldOut = remaining < 1;

                return (
                  <g
                    key={el.id}
                    onMouseDown={handlePointerDown}
                    onTouchStart={handleTouchPointerDown}
                    onClick={(e) => handleStandingSectionClick(e, el)}
                    onTouchEnd={(e) => handleStandingSectionTouchEnd(e, el)}
                    onMouseEnter={(e) => showTooltipForStandingSection(el.id, e.clientX, e.clientY)}
                    onMouseMove={(e) => moveStandingTooltip(el.id, e.clientX, e.clientY)}
                    onMouseLeave={hideTooltipSoon}
                    style={{ cursor: isSoldOut ? 'not-allowed' : 'pointer' }}
                  >
                    <g transform={el.rotation ? `rotate(${el.rotation}, ${cx}, ${cy})` : undefined}>
                      <rect
                        x={left}
                        y={top}
                        width={w}
                        height={h}
                        rx={8}
                        fill={el.fillColor}
                        fillOpacity={isSoldOut ? Math.min(el.opacity, 0.45) : el.opacity}
                        stroke={el.strokeColor !== 'transparent' ? el.strokeColor : '#94a3b8'}
                        strokeWidth={el.strokeWidth || 1.5}
                        strokeOpacity={0.6}
                        vectorEffect="non-scaling-stroke"
                        className="hover:brightness-110 transition-all duration-200"
                      />
                      <text
                        x={cx}
                        y={cy - 8}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={el.labelFontSize || 16}
                        fill={el.labelColor || '#111827'}
                        fontWeight="700"
                        style={{ pointerEvents: 'none', textShadow: '0 1px 4px rgba(255,255,255,0.8)' }}
                        transform={el.labelRotation ? `rotate(${el.labelRotation}, ${cx}, ${cy})` : undefined}
                      >
                        {label}
                      </text>
                      <text
                        x={cx}
                        y={cy + 12}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={12}
                        fill={isSoldOut ? '#b91c1c' : '#374151'}
                        fontWeight="600"
                        style={{ pointerEvents: 'none' }}
                        transform={el.labelRotation ? `rotate(${el.labelRotation}, ${cx}, ${cy})` : undefined}
                      >
                        {isSoldOut ? 'Sold out' : `${remaining} left`}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>

        </g>
      </svg>
      </div>

      <div className="pointer-events-none absolute inset-0 z-50 overflow-visible">
      {standingTooltipLayout && hoveredStandingSection && (
        <div
          className="absolute z-50 rounded-2xl border border-gray-200 bg-white p-3 text-xs text-gray-900 shadow-2xl pointer-events-none"
          style={{
            left: standingTooltipLayout.placement.left,
            top: standingTooltipLayout.placement.top,
            transform: standingTooltipLayout.placement.transform,
            width: standingTooltipLayout.size.width,
            minHeight: standingTooltipLayout.size.height,
          }}
        >
          <div className="font-semibold text-gray-900">
            {hoveredStandingSection.section.label}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            {hoveredStandingSection.remaining > 0
              ? `${hoveredStandingSection.remaining} of ${hoveredStandingSection.section.capacity} spots left`
              : 'No spots left'}
          </div>
          {hoveredStandingSection.section.seeds[0] && (
            <div className="mt-3 rounded-xl bg-gray-50 px-3 py-2">
              <div className="text-[11px] font-medium text-gray-500">From</div>
              <div className="mt-0.5 text-lg font-bold text-gray-900">
                {currencyCode || '₹'}{hoveredStandingSection.section.seeds[0].price.toLocaleString()}
              </div>
            </div>
          )}
          <TooltipArrow position={standingTooltipLayout.placement.arrowPosition} />
        </div>
      )}

      {seatTooltipLayout && hoveredSeat && (
        <div
          className={`absolute z-50 rounded-2xl border border-gray-200 bg-white p-3 text-xs text-gray-900 shadow-2xl ${hoveredSeat.anchorMode === 'seat-below' ? 'pointer-events-auto' : 'pointer-events-none'}`}
          style={{
            left: seatTooltipLayout.placement.left,
            top: seatTooltipLayout.placement.top,
            transform: seatTooltipLayout.placement.transform,
            width: seatTooltipLayout.size.width,
            minHeight: seatTooltipLayout.size.height,
          }}
          onMouseEnter={hoveredSeat?.anchorMode === 'seat-below' ? cancelTooltipHide : undefined}
          onMouseLeave={hoveredSeat?.anchorMode === 'seat-below' ? hideTooltipSoon : undefined}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: getDynamicColor(hoveredSeat.seed.type) }}
                />
                <span className="truncate font-semibold text-gray-900">{hoveredSeat.seed.type}</span>
              </div>
              <div className="mt-0.5 truncate text-[11px] text-gray-500">
                Seat {hoveredSeat.seed.name || hoveredSeat.seed.id}
              </div>
              {formatSeatMarkLabel(hoveredSeat.seed.seatMark) &&
                !isSeatUnavailable(hoveredSeat.seed) && (
                <div className="mt-1 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                  {formatSeatMarkLabel(hoveredSeat.seed.seatMark)}
                </div>
              )}
            </div>
            {isSeatSelected(hoveredSeat.seed) ? (
              <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-600">
                Selected
              </span>
            ) : isSeatUnavailable(hoveredSeat.seed) ? (
              <span className="shrink-0 rounded-full bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600">
                {isUnknownSeatClassLabel(hoveredSeat.seed.type)
                  ? "Unknown"
                  : hoveredSeat.seed.isBlocked
                    ? "Blocked"
                    : "Unavailable"}
              </span>
            ) : isOwnedHold(hoveredSeat.seed) ? (
              <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                Your seat
              </span>
            ) : null}
          </div>

          {!isSeatUnavailable(hoveredSeat.seed) && (hoveredSeat.seed.priceOptions?.length ?? 0) <= 1 && (
            <div className="mt-3 rounded-xl bg-gray-50 px-3 py-2">
              <div className="text-[11px] font-medium text-gray-500">Price</div>
              <div className="mt-0.5 text-lg font-bold text-gray-900">
                {currencyCode || '₹'}{hoveredSeat.seed.price.toLocaleString()}
              </div>
            </div>
          )}

          {!isSeatUnavailable(hoveredSeat.seed) && (hoveredSeat.seed.priceOptions?.length ?? 0) > 1 && (
            <div className="mt-3">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Select Price
              </div>
              <div className="grid grid-cols-2 gap-2">
              {hoveredSeat.seed.priceOptions?.map((option) => (
                <button
                  key={`${hoveredSeat.seed.id}-${option.name}-${option.price}`}
                  type="button"
                  className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-left transition-all hover:border-primary hover:bg-primary/5 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeatPriceSelect?.(hoveredSeat.seed, option);
                    setHoveredSeat(null);
                  }}
                >
                  <span className="block truncate text-[11px] font-medium text-gray-500">
                    {option.name}
                  </span>
                  <span className="mt-0.5 block text-base font-bold text-gray-900">
                    {currencyCode || '₹'}{option.price.toLocaleString()}
                  </span>
                </button>
              ))}
              </div>
            </div>
          )}

          {isSeatUnavailable(hoveredSeat.seed) && (
            <div className="mt-3 space-y-1.5 rounded-xl bg-gray-50 px-3 py-2 text-[11px]">
              <div className="font-semibold text-gray-700">Seat unavailable</div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Blocked by</span>
                <span className="font-medium text-gray-900">
                  {formatBlockedByLabel(hoveredSeat.seed.blockedBy)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Reason</span>
                <span className="font-medium text-gray-900">
                  {formatBlockedReasonLabel(hoveredSeat.seed.blockedReason)}
                </span>
              </div>
              {hoveredSeat.seed.blockedTypeCode ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Block type</span>
                  <span className="font-medium text-gray-900">
                    {hoveredSeat.seed.blockedTypeCode}
                  </span>
                </div>
              ) : null}
            </div>
          )}
          <TooltipArrow position={seatTooltipLayout.placement.arrowPosition} />
        </div>
      )}

      </div>

    </div>
  );
}
