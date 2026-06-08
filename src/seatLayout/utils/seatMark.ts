import { normalizeSeatStatusCode } from '@/lib/seat-layout/status-code';
import type { SeatLayoutRenderableSeat } from '../types/seatLayoutApi';

export type SeatLayoutSeatMark = 'normal' | 'wheelchair' | (string & {});

export function normalizeSeatMark(mark?: string | null): string {
  const value = mark?.trim().toLowerCase();
  if (!value || value === 'normal') return 'normal';
  if (value === 'weelchair' || value === 'wheelchair') return 'wheelchair';
  return value;
}

/** Shape is drawn by `SeatShapeSvg`; these are not overlay marks (avoids "SQ" on squares). */
export function isSeatShapeTypeMark(mark?: string | null): boolean {
  const normalized = normalizeSeatMark(mark);
  return (
    normalized === 'normal' ||
    normalized === 'square' ||
    normalized === 'wheelchair'
  );
}

export function resolveSeatMark(seat: { seat_type?: string | null; is_wheelchair?: boolean }): string {
  const fromType = normalizeSeatMark(seat.seat_type);
  if (!isSeatShapeTypeMark(fromType)) return fromType;
  return 'normal';
}

export function formatSeatMarkLabel(mark?: string | null): string | null {
  const normalized = normalizeSeatMark(mark);
  if (normalized === 'normal') return null;
  if (normalized === 'wheelchair') return 'Wheelchair';
  return normalized
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getSeatStatusCode(seat?: SeatLayoutRenderableSeat | null): number {
  if (!seat) return 0;
  if ('status' in seat) return normalizeSeatStatusCode(seat.status);
  if ('seat_status' in seat) return normalizeSeatStatusCode(seat.seat_status);
  return 0;
}
