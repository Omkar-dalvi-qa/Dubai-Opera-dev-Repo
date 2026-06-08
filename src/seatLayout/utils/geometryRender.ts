/**
 * Shared geometry helpers so POS SVG matches sbseat-layout editor canvas drawing.
 */
import type { ElementData } from "../components/SeedLayoutSvg";

const DEFAULT_AREA_FILL = "#e0edff";

type CanvasPoint = { x: number; y: number };
type CurveHandle = {
  cp1?: CanvasPoint;
  cp2?: CanvasPoint;
};
type CurveHandleMap = Record<string, CurveHandle>;

type CanvasItemLike = {
  type: string;
  x: number;
  y: number;
  rotation?: number;
  points?: CanvasPoint[];
  curveHandles?: CurveHandleMap;
};

function boundsFromPoints(points: CanvasPoint[]): {
  centerX: number;
  centerY: number;
} {
  if (points.length === 0) {
    return { centerX: 0, centerY: 0 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return {
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

function rotatePointAround(
  p: CanvasPoint,
  cx: number,
  cy: number,
  cos: number,
  sin: number,
): CanvasPoint {
  const dx = p.x - cx;
  const dy = p.y - cy;
  return {
    x: cx + dx * cos - dy * sin,
    y: cy + dx * sin + dy * cos,
  };
}

function pathRotationGeometry(item: CanvasItemLike): {
  points: CanvasPoint[];
  curveHandles?: CurveHandleMap;
} {
  const points = item.points ?? [];
  if (!points.length) return { points, curveHandles: item.curveHandles };
  const deg = item.rotation ?? 0;
  if (Math.abs(deg) < 1e-6) return { points, curveHandles: item.curveHandles };

  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const cx = item.x;
  const cy = item.y;
  const rotatePt = (p: CanvasPoint) => rotatePointAround(p, cx, cy, cos, sin);

  const rotatedPoints = points.map(rotatePt);
  let rotatedHandles: CurveHandleMap | undefined;
  if (item.curveHandles) {
    rotatedHandles = {};
    for (const [key, h] of Object.entries(item.curveHandles)) {
      rotatedHandles[key] = {
        cp1: h.cp1 ? rotatePt(h.cp1) : undefined,
        cp2: h.cp2 ? rotatePt(h.cp2) : undefined,
      };
    }
  }

  return { points: rotatedPoints, curveHandles: rotatedHandles };
}

export type AreaCurveHandle = {
  cp1?: { x: number; y: number };
  cp2?: { x: number; y: number };
};

function getSegmentHandles(
  curveHandles: Record<string, AreaCurveHandle> | undefined,
  segmentIndex: number,
): AreaCurveHandle | undefined {
  if (!curveHandles) return undefined;
  return curveHandles[segmentIndex] ?? curveHandles[String(segmentIndex)];
}

/** Read fill from API geometry (`fillColor` or legacy `fill`). */
export function resolveGeometryFillFromShape(
  type: string,
  shape: Record<string, unknown>,
): string {
  const raw =
    (typeof shape.fillColor === "string" && shape.fillColor) ||
    (typeof shape.fill === "string" && shape.fill) ||
    "";
  const trimmed = raw.trim();
  if (trimmed && trimmed !== "transparent" && trimmed !== "none") {
    return trimmed;
  }
  if (type === "area") return DEFAULT_AREA_FILL;
  return "transparent";
}

/** Resolved fill for renderer elements (areas default to light blue). */
export function resolveElementFillColor(el: ElementData): string {
  const raw = el.fillColor?.trim() ?? "";
  if (raw && raw !== "transparent" && raw !== "none") return raw;
  if (el.type === "area") return DEFAULT_AREA_FILL;
  return "transparent";
}

export function resolveAreaLabelText(el: ElementData): string {
  return (el.label || el.name || "").trim();
}

export function resolveAreaLabelPosition(el: ElementData): {
  x: number;
  y: number;
} {
  return {
    x: el.labelX ?? el.x,
    y: el.labelY ?? el.y,
  };
}

/** Stroke color aligned with editor `effectivePathStrokeColor`. */
export function effectiveElementStrokeColor(el: ElementData): string {
  const raw = el.strokeColor?.trim();
  if (raw && raw !== "transparent" && raw !== "none") return raw;
  return el.type === "area" ? "#3b82f6" : "rgba(0, 0, 0, 0.9)";
}

/**
 * Rotation pivot for path/area. Stored `x`/`y` is often 0 while `points` are absolute
 * world coordinates (legacy SVG import).
 */
export function resolveElementPivot(el: ElementData): { x: number; y: number } {
  const hasAnchor =
    Number.isFinite(el.x) &&
    Number.isFinite(el.y) &&
    (el.x !== 0 || el.y !== 0);
  if (hasAnchor) return { x: el.x, y: el.y };
  if (el.points?.length) {
    const bounds = boundsFromPoints(el.points);
    return { x: bounds.centerX, y: bounds.centerY };
  }
  return { x: el.x, y: el.y };
}

/** Apply stored rotation around element center (same as editor `pathRotationGeometry`). */
export function elementRotationGeometry(el: ElementData): {
  points: CanvasPoint[];
  curveHandles?: CurveHandleMap;
} {
  const pivot = resolveElementPivot(el);
  const item: CanvasItemLike = {
    type: el.type,
    x: pivot.x,
    y: pivot.y,
    rotation: el.rotation ?? 0,
    points: el.points,
    curveHandles: el.curveHandles,
  };
  return pathRotationGeometry(item);
}

/** Open or closed path / polyline as SVG `d` (straight segments or cubic beziers). */
export function pathToSvgPathD(
  points: Array<{ x: number; y: number }>,
  curveHandles: Record<string, AreaCurveHandle> | undefined,
  close: boolean,
): string | null {
  if (points.length < 2) return null;

  const hasBezier = Boolean(curveHandles && Object.keys(curveHandles).length > 0);
  let d = `M ${points[0].x} ${points[0].y}`;

  const segmentCount = close ? points.length : points.length - 1;

  if (hasBezier) {
    for (let seg = 0; seg < segmentCount; seg++) {
      const segH = getSegmentHandles(curveHandles, seg);
      const end = points[close ? (seg + 1) % points.length : seg + 1];
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

  if (close) d += " Z";
  return d;
}

/** Default seat half-size (editor `DEFAULT_SEAT_SIZE` 22 → r 11). */
export const DEFAULT_SEAT_RADIUS = 11;

/**
 * Axis-aligned bounding box of a rotated rectangle.
 * Used by contentBounds so that group-rotated items don't shift the layout origin.
 */
export function rotatedBoxBounds(
  cx: number,
  cy: number,
  w: number,
  h: number,
  rotDeg: number,
): { minX: number; maxX: number; minY: number; maxY: number } {
  if (Math.abs(rotDeg) < 1e-6) {
    return { minX: cx - w / 2, maxX: cx + w / 2, minY: cy - h / 2, maxY: cy + h / 2 };
  }
  const rad = (rotDeg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const hw = (w * cos + h * sin) / 2;
  const hh = (w * sin + h * cos) / 2;
  return { minX: cx - hw, maxX: cx + hw, minY: cy - hh, maxY: cy + hh };
}

export function resolveSeatRadius(seed: {
  seatRadius?: number;
  rawData?: unknown;
}): number {
  if (
    typeof seed.seatRadius === "number" &&
    Number.isFinite(seed.seatRadius) &&
    seed.seatRadius > 0
  ) {
    return seed.seatRadius;
  }
  const raw = seed.rawData;
  if (raw && typeof raw === "object" && ("width" in raw || "height" in raw)) {
    const dims = raw as { width?: number; height?: number };
    const w = Number(dims.width) || 22;
    const h = Number(dims.height) || 22;
    const half = Math.min(w, h) / 2;
    if (half > 0) return half;
  }
  return DEFAULT_SEAT_RADIUS;
}
