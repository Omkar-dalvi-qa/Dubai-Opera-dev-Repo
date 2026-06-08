export function isUnknownSeatClassLabel(label: string | null | undefined): boolean {
  return String(label ?? "").trim().toLowerCase() === "unknown";
}
