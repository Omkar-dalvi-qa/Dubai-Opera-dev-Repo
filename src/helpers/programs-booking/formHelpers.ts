import { ExternalEvent } from "@/services/eventServer";

/** Minimum completed age (years) required for programme booking checkout. */
export const MIN_PROGRAM_BOOKING_AGE_YEARS = 12;

/**
 * Latest calendar birth date still allowed so the person has completed
 * `minAgeYears` years by `reference` (uses local date parts of `reference`).
 */
export function getMaxBirthDateForMinAge(
  minAgeYears: number,
  reference: Date = new Date(),
): Date {
  const y = reference.getFullYear();
  const m = reference.getMonth();
  const d = reference.getDate();
  return new Date(y - minAgeYears, m, d);
}

export function isBirthDateAtLeastAge(
  birthDate: Date,
  minAgeYears: number,
  reference: Date = new Date(),
): boolean {
  const maxBirth = getMaxBirthDateForMinAge(minAgeYears, reference);
  return birthDate.getTime() <= maxBirth.getTime();
}

/** Programme checkout: guest must have already turned 12 (birthday on or before the cutoff date). */
export function isProgramBookingDobAllowed(
  birthDate: Date,
  reference: Date = new Date(),
): boolean {
  return isBirthDateAtLeastAge(birthDate, MIN_PROGRAM_BOOKING_AGE_YEARS, reference);
}

export function parseDobDate(value: string): Date | null {
  if (!value) return null;
  const trimmed = value.trim();

  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const day = Number(slashMatch[1]);
    const month = Number(slashMatch[2]);
    const year = Number(slashMatch[3]);
    const parsed = new Date(year, month - 1, day);
    if (
      !Number.isNaN(parsed.getTime()) &&
      parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day
    ) {
      return parsed;
    }
    return null;
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    const parsed = new Date(year, month - 1, day);
    if (
      !Number.isNaN(parsed.getTime()) &&
      parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day
    ) {
      return parsed;
    }
  }
  return null;
}

export function toDisplayDobDate(date: Date): string {
  const day = `${date.getDate()}`.padStart(2, "0");
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/** Normalize API/user DOB strings (ISO or DD/MM/YYYY) to the checkout display format DD/MM/YYYY. */
export function normalizeDobValue(raw: string): string {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return "";
  const parsed = parseDobDate(trimmed);
  if (parsed) return toDisplayDobDate(parsed);
  return trimmed;
}

export function formatDobInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8); // allow only numbers

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function sanitizeNameInput(value: string): string {
  return value.replace(/[^A-Za-z\s'-]/g, "");
}

export function sanitizeCityInput(value: string): string {
  return value.replace(/[^A-Za-z\s'.-]/g, "");
}

export function sanitizePhoneInput(value: string, maxDigits: number): string {
  return value.replace(/\D/g, "").slice(0, maxDigits);
}

const cardDateOpts: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

export function formatCardDate(event: ExternalEvent): string {
  const startDate = event.start_date?.split("T")[0];
  const endDate = event.end_date?.split("T")[0];
  if (startDate == endDate) return new Date(startDate ?? "").toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return `${new Date(startDate ?? "").toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })} to ${new Date(endDate ?? "").toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}`;
}

export function formatHHMMTo12Hour(dateString?: string | null): string {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatCardDateRange(event: ExternalEvent): string {
  const start =
    event.start_date ?? event.startDate ?? event.eventStartDate;
  const end = event.end_date ?? event.endDate ?? event.eventEndDate;
  if (start && end) {
    const ds = new Date(start);
    const de = new Date(end);
    if (!Number.isNaN(ds.getTime()) && !Number.isNaN(de.getTime())) {
      if (ds.toDateString() === de.toDateString()) {
        return ds.toLocaleDateString("en-GB", cardDateOpts);
      }
      return `${ds.toLocaleDateString("en-GB", cardDateOpts)} - ${de.toLocaleDateString("en-GB", cardDateOpts)}`;
    }
  }
  if (start) {
    const ds = new Date(start);
    if (!Number.isNaN(ds.getTime())) {
      return ds.toLocaleDateString("en-GB", cardDateOpts);
    }
  }
  return "";
}
export const NAME_VALIDATION_REGEX = /^[A-Za-z][A-Za-z\s'-]*$/;
export const CITY_VALIDATION_REGEX = /^[A-Za-z][A-Za-z\s'.-]*$/;
export const EMAIL_VALIDATION_REGEX = /^[A-Za-z0-9._-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}$/;
