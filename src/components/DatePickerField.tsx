"use client";

import {
    forwardRef,
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type ComponentProps,
} from "react";
import DatePicker from "react-datepicker";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

type ReactDatePickerCustomHeaderProps = Parameters<
    NonNullable<ComponentProps<typeof DatePicker>["renderCustomHeader"]>
>[0];

/** Library typings omit `maxDate` on header props; it is passed at runtime and we override with `effectiveMaxDate`. */
type DatePickerProfileHeaderProps = ReactDatePickerCustomHeaderProps & {
    maxDate?: Date | null;
};

interface DatePickerFieldProps {
    value: Date | null;
    onChange: (date: Date | null) => void;
    error?: string;
    label?: string;
    /** Match surrounding form labels (e.g. onboarding `labelClass`). */
    labelClassName?: string;
    /** Latest selectable calendar date (inclusive). Defaults to today. */
    maxDate?: Date;
}

function formatDateForInput(date: Date | null) {
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());
    return `${day}/${month}/${year}`;
}

function formatDobInput(raw: string | null | undefined) {
    const safeRaw = typeof raw === "string" ? raw : "";
    const digits = safeRaw.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseDobInput(raw: string, maxSelectableCalendar: Date) {
    const [dayRaw, monthRaw, yearRaw] = raw.split("/");
    if (!dayRaw || !monthRaw || !yearRaw || yearRaw.length !== 4) return null;

    const day = Number(dayRaw);
    const month = Number(monthRaw);
    const year = Number(yearRaw);
    if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return null;
    if (month < 1 || month > 12 || day < 1) return null;

    const parsed = new Date(year, month - 1, day);
    if (
        parsed.getFullYear() !== year ||
        parsed.getMonth() !== month - 1 ||
        parsed.getDate() !== day
    ) {
        return null;
    }

    const cap = new Date(
        maxSelectableCalendar.getFullYear(),
        maxSelectableCalendar.getMonth(),
        maxSelectableCalendar.getDate(),
    );
    if (parsed.getTime() > cap.getTime()) return null;
    return parsed;
}

const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
] as const;

function DatePickerProfileHeader({
    date,
    changeMonth,
    changeYear,
    decreaseMonth,
    increaseMonth,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled,
    maxDate: maxDateFromPicker,
}: DatePickerProfileHeaderProps) {
    const [open, setOpen] = useState<"month" | "year" | null>(null);
    const monthWrapRef = useRef<HTMLDivElement>(null);
    const yearWrapRef = useRef<HTMLDivElement>(null);
    const monthBtnId = useId();
    const yearBtnId = useId();

    const viewMonth = date.getMonth();
    const viewYear = date.getFullYear();
    const maxDate = maxDateFromPicker ?? new Date();
    const maxYear = maxDate.getFullYear();
    const maxMonth = maxDate.getMonth();

    const years = useMemo(() => {
        const list: number[] = [];
        for (let y = maxYear; y >= maxYear - 120; y--) list.push(y);
        return list;
    }, [maxYear]);

    const close = useCallback(() => setOpen(null), []);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e: MouseEvent) => {
            const t = e.target as Node;
            if (monthWrapRef.current?.contains(t)) return;
            if (yearWrapRef.current?.contains(t)) return;
            setOpen(null);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(null);
        };
        document.addEventListener("mousedown", onDoc);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDoc);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const monthDisabled = (m: number) =>
        viewYear > maxYear || (viewYear === maxYear && m > maxMonth);

    const listClass =
        "absolute left-0 right-0 z-[10000] mt-1 max-h-[min(240px,40vh)] overflow-y-auto rounded-[10px] border border-[#3a3a3a] bg-[#1a1a1a] py-1 shadow-[0_16px_40px_rgba(0,0,0,0.55)]";

    const itemClass =
        "w-full px-4 py-2.5 text-left font-montserrat text-[13px] font-medium text-white transition-colors hover:bg-white/10 focus:bg-white/10 focus:outline-none";

    const itemActiveClass = "bg-[#792327]/40 text-white";

    const titleText = `${MONTHS[viewMonth]} ${viewYear}`;

    return (
        <div className="datepicker-profile-header w-full px-1 pb-2 pt-0">
            {/* Title first, then both arrows together: “December 1998 ‹ ›” not “‹ December 1998 ›” */}
            <div
                className="mb-2 flex justify-between items-center gap-x-2"
                aria-live="polite"
            >
                <p className="shrink-0 text-center font-optima text-[15px] font-normal leading-tight text-white sm:text-[16px]">
                    {titleText}
                </p>
                <div className="inline-flex shrink-0 items-center gap-0">
                    <button
                        type="button"
                        onClick={() => {
                            decreaseMonth();
                            close();
                        }}
                        disabled={prevMonthButtonDisabled}
                        className="cursor-pointer flex h-5 w-5 items-center justify-center rounded-lg border border-transparent text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30 sm:h-5 sm:w-5"
                        aria-label="Previous month"
                    >
                        <ChevronLeft size={18} strokeWidth={2} />
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            increaseMonth();
                            close();
                        }}
                        disabled={nextMonthButtonDisabled}
                        className="cursor-pointer flex h-5 w-5 items-center justify-center rounded-lg border border-transparent text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30 sm:h-5 sm:w-5"
                        aria-label="Next month"
                    >
                        <ChevronRight size={18} strokeWidth={2} />
                    </button>
                </div>
            </div>

            {/* Month + year dropdowns only (no side arrows) */}
            <div className="flex w-full items-center justify-center gap-2 sm:gap-3">
                <div ref={monthWrapRef} className="relative min-w-0 flex-1 sm:max-w-[200px]">
                    <button
                        id={monthBtnId}
                        type="button"
                        onClick={() => setOpen((o) => (o === "month" ? null : "month"))}
                        className="flex h-11 w-full items-center justify-between gap-2 rounded-[10px] border border-[#3a3a3a] bg-[#2a2a2a] px-3 font-montserrat text-[13px] font-medium text-white transition-colors hover:border-white/25 focus:border-[#792327] focus:outline-none focus:ring-1 focus:ring-[#792327]/60 sm:text-[14px]"
                        aria-expanded={open === "month"}
                        aria-haspopup="listbox"
                    >
                        <span className="min-w-0 truncate text-left">{MONTHS[viewMonth]}</span>
                        <span className="text-white/60" aria-hidden>
                            ▾
                        </span>
                    </button>
                    {open === "month" && (
                        <ul
                            className={listClass}
                            role="listbox"
                            aria-labelledby={monthBtnId}
                        >
                            {MONTHS.map((name, i) => {
                                const disabled = monthDisabled(i);
                                return (
                                    <li key={name} role="option" aria-selected={i === viewMonth}>
                                        <button
                                            type="button"
                                            disabled={disabled}
                                            className={`${itemClass} ${i === viewMonth ? itemActiveClass : ""} disabled:cursor-not-allowed disabled:opacity-35`}
                                            onClick={() => {
                                                if (disabled) return;
                                                changeMonth(i);
                                                close();
                                            }}
                                        >
                                            {name}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                <div ref={yearWrapRef} className="relative min-w-0 flex-1 sm:max-w-[120px]">
                    <button
                        id={yearBtnId}
                        type="button"
                        onClick={() => setOpen((o) => (o === "year" ? null : "year"))}
                        className="flex h-11 w-full items-center justify-between gap-2 rounded-[10px] border border-[#3a3a3a] bg-[#2a2a2a] px-3 font-montserrat text-[13px] font-medium text-white transition-colors hover:border-white/25 focus:border-[#792327] focus:outline-none focus:ring-1 focus:ring-[#792327]/60 sm:text-[14px]"
                        aria-expanded={open === "year"}
                        aria-haspopup="listbox"
                    >
                        <span>{viewYear}</span>
                        <span className="text-white/60" aria-hidden>
                            ▾
                        </span>
                    </button>
                    {open === "year" && (
                        <ul
                            className={listClass}
                            role="listbox"
                            aria-labelledby={yearBtnId}
                        >
                            {years.map((y) => (
                                <li key={y} role="option" aria-selected={y === viewYear}>
                                    <button
                                        type="button"
                                        className={`${itemClass} ${y === viewYear ? itemActiveClass : ""}`}
                                        onClick={() => {
                                            changeYear(y);
                                            close();
                                        }}
                                    >
                                        {y}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

/** Larger hit area; forwards ref/onClick for react-datepicker. */
const ProfileDateInput = forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement>
>(function ProfileDateInput({ className, ...props }, ref) {
    return (
        <div className="relative w-full cursor-pointer">
            <input
                ref={ref}
                {...props}
                className={
                    "box-border h-12 w-full rounded-[8px] border border-[#FFFFFF1A] bg-[#151515] px-3 font-montserrat text-[14px] text-white placeholder:text-white/45 transition-colors hover:border-primary-light outline-none ring-0 focus:border-[#FFFFFF1A] focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0" +
                    (className ?? "")
                }
            />
            <Calendar
                size={22}
                strokeWidth={1.5}
                className="pointer-events-none absolute right-4 top-1/2 z-1 -translate-y-1/2 text-white/60"
                aria-hidden
            />
        </div>
    );
});

function toCalendarDateOnly(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export default function DatePickerField({
    value,
    onChange,
    error,
    label = "Date of Birth",
    labelClassName = "mb-2 block font-montserrat text-[12px] font-normal leading-[100%] text-white",
    maxDate: maxDateProp,
}: DatePickerFieldProps) {
    const effectiveMaxDate = useMemo(
        () => toCalendarDateOnly(maxDateProp ?? new Date()),
        [maxDateProp],
    );

    const [inputValue, setInputValue] = useState(() => formatDateForInput(value));

    useEffect(() => {
        setInputValue(formatDateForInput(value));
    }, [value]);

    useEffect(() => {
        const id = "react-datepicker-css";
        if (document.getElementById(id)) return;
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = "/css/react-datepicker.min.css";
        document.head.appendChild(link);
    }, []);

    return (
        <div className="w-full">
            <label className={labelClassName}>{label}</label>
            <div
                className={`relative rounded-[10px] profile-datepicker ${error ? "ring-1 ring-red-500/70" : ""}`}
            >
                <DatePicker
                    selected={value}
                    onChange={(date: Date | null) => {
                        setInputValue(formatDateForInput(date));
                        onChange(date);
                    }}
                    onChangeRaw={(event) => {
                        const target = event?.target as HTMLInputElement | null;
                        if (!target) return;
                        const formatted = formatDobInput(target.value);
                        target.value = formatted;
                        setInputValue(formatted);

                        // Important: don't force parent `value=null` on partial input,
                        // otherwise the controlled `value` effect will wipe the user's typing.
                        if (!formatted) {
                            onChange(null);
                            return;
                        }
                        if (formatted.length === 10) {
                            onChange(parseDobInput(formatted, effectiveMaxDate));
                        }
                    }}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="dd/mm/yyyy"
                    value={inputValue}
                    maxDate={effectiveMaxDate}
                    calendarClassName="profile-cal"
                    popperClassName="datepicker-popper"
                    portalId="datepicker-portal"
                    customInput={<ProfileDateInput />}
                    renderCustomHeader={(props) => (
                        <DatePickerProfileHeader {...props} maxDate={effectiveMaxDate} />
                    )}
                    showMonthDropdown={false}
                    showYearDropdown={false}
                />
            </div>
            {error && <p className="mt-1 font-montserrat text-[12px] text-[#ff8a8a]">{error}</p>}
        </div>
    );
}
