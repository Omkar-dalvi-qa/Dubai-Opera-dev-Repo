/** Numeric seat status codes shared by the sbseat-layout editor and POS viewer. */
export type SeatLayoutStatusCode = 0 | 1 | 2 | 3 | 4;

const API_STATUS_TO_CODE: Record<number, SeatLayoutStatusCode> = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
};

const NAME_TO_CODE: Record<string, SeatLayoutStatusCode> = {
  AVAILABLE: 0,
  HOLD: 1,
  BOOKED: 2,
  RESERVED: 3,
  BLOCKED: 4,
  SOLD: 2,
};

/** Normalize API / Prisma status (number or enum name) to a layout status code. */
export function normalizeSeatStatusCode(value: unknown): SeatLayoutStatusCode {
  if (typeof value === "string") {
    const upper = value.trim().toUpperCase();
    if (upper in NAME_TO_CODE) return NAME_TO_CODE[upper];
    const asNum = Number(value);
    if (Number.isFinite(asNum) && asNum in API_STATUS_TO_CODE) {
      return API_STATUS_TO_CODE[asNum];
    }
    return 0;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return API_STATUS_TO_CODE[value] ?? 0;
  }
  return 0;
}

export function isSeatStatusUnavailable(code: SeatLayoutStatusCode): boolean {
  return code !== 0;
}
