"use client";

// ─── Seat Layout Module ─────────────────────────────────────────
// Copy the entire `seatLayout/` folder to your project.
//
// Dependencies (npm):
//   - lucide-react
//   - clsx + tailwind-merge (for the `cn` utility at @/lib/utils)
//   - tailwindcss (v4)
//
// CSS requirements:
//   Add these to your globals.css:
//   - .scrollbar-hide  (hides scrollbar on horizontal strips)
//   - .drag-handle     (bottom sheet drag indicator)
//   - .safe-top / .safe-bottom  (safe area env() padding)
// ────────────────────────────────────────────────────────────────

export { SeedLayoutRenderer } from './components/SeedLayoutRenderer';
export type { SelectedSeatInfo } from './components/SeedLayoutRenderer';
export type {
  SeatLayoutBlockedSeat,
  SeatLayoutGeometryItem,
  SeatLayoutGeometryShape,
  SeatLayoutPayload,
  SeatLayoutRenderableSeat,
  SeatLayoutResponse,
  SeatLayoutScreenDetail,
  SeatLayoutScreenMetaData,
  SeatLayoutScreenSeat,
  SeatLayoutSeatClass,
  SeatLayoutScreenSeatType,
  SeatLayoutSeatRecord,
  SeatLayoutSeatStatusCode,
  SeatLayoutSvgElementJson,
} from './types/seatLayoutApi';
export { SeedLayoutSvg, getTypeColor, TYPE_COLORS, DEFAULT_SEAT_COLOR, ZOOM_CONFIG } from './components/SeedLayoutSvg';
export type { SeedData, ElementData, StandingSectionData } from './components/SeedLayoutSvg';
export { Seat } from './components/Seat';
export { SeatLayout } from './components/SeatLayout';
export { useZoomPanSVG } from './hooks/useZoomPanSVG';
export { useIsMobile } from './hooks/useIsMobile';
export { useBoundingBox, getPanBounds } from './hooks/useBoundingBox';
