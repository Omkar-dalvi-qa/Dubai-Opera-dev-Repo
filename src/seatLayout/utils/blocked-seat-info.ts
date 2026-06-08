import type { SeedData } from "../components/SeedLayoutSvg";
import type { SeatLayoutBlockedSeat } from "../types/seatLayoutApi";

export type BlockedSeatInfo = {
  blockedBy?: string | null;
  blockedReason?: string | null;
  blockedTypeCode?: string | null;
};

export function buildBlockedSeatInfoById(
  blockedSeats?: SeatLayoutBlockedSeat[],
): Map<string, BlockedSeatInfo> {
  const map = new Map<string, BlockedSeatInfo>();
  for (const entry of blockedSeats ?? []) {
    const seatId = entry.seat_id ?? entry.layout_seat_id;
    if (!seatId) continue;
    map.set(seatId, {
      blockedBy: entry.blocked_by ?? null,
      blockedReason: entry.blocked_reason ?? null,
      blockedTypeCode: entry.blocked_type_code ?? null,
    });
  }
  return map;
}

export function mergeBlockedInfoIntoSeed(
  seed: SeedData,
  blockedById: Map<string, BlockedSeatInfo>,
): SeedData {
  const info = blockedById.get(seed.id);
  if (!info) return seed;
  return {
    ...seed,
    blockedBy: info.blockedBy ?? seed.blockedBy,
    blockedReason: info.blockedReason ?? seed.blockedReason,
    blockedTypeCode: info.blockedTypeCode ?? seed.blockedTypeCode,
  };
}

export function formatBlockedByLabel(value?: string | null): string {
  const v = value?.trim();
  if (!v) return "—";
  if (v === "user") return "User";
  if (v === "system") return "System";
  return v.charAt(0).toUpperCase() + v.slice(1);
}

export function formatBlockedReasonLabel(value?: string | null): string {
  const v = value?.trim();
  if (!v) return "—";
  return v
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
