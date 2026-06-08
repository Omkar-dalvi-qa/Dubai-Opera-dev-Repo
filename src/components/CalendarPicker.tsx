"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type TriggerMode = "icon" | "field";

type SingleProps = {
  mode: "single";
  selected: Date | null;
  onChange: (date: Date | null) => void;
  buttonClassName?: string;
  minDate?: Date;
  maxDate?: Date;
  /** When set, only these dates are selectable (passed to react-datepicker `includeDates`). */
  allowedDates?: Date[];
  /** If true, apply a special class to available/event days. */
  highlightEventDays?: boolean;
  variant?: "dob" | "default";
  /**
   * `field` = one full-width control (label + icon) opens the picker.
   * `icon` = icon-only button (default).
   */
  trigger?: TriggerMode;
  /** Shown inside the field trigger when no date is selected. */
  datePlaceholder?: string;
};

type RangeProps = {
  mode: "range";
  startDate: Date | null;
  endDate: Date | null;
  onChange: (range: [Date | null, Date | null]) => void;
  buttonClassName?: string;
  /** When set, clicking the calendar opens this instead of the built-in datepicker (e.g. DateRangeModal) */
  onOpenSelectDateModal?: () => void;
  /** Disable dates before this (e.g. pass start of today to disable past dates) */
  minDate?: Date;
  /** Disable dates after this */
  maxDate?: Date;
  allowedDates?: Date[];
  /** If true, apply a special class to available/event days. */
  highlightEventDays?: boolean;
  variant?: "dob" | "default";
  trigger?: TriggerMode;
  datePlaceholder?: string;
};

type CalendarPickerProps = SingleProps | RangeProps;

type DatePickerTriggerButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  trigger?: TriggerMode;
  datePlaceholder?: string;
};

const DatePickerTriggerButton = forwardRef<HTMLButtonElement, DatePickerTriggerButtonProps>(
  ({ trigger = "icon", datePlaceholder = "DD/MM/YYYY", className, value, "aria-label": ariaLabel, ...rest }, ref) => {
    const showField = trigger === "field";
    const raw = typeof value === "string" ? value.trim() : "";
    const displayText = raw ? raw : datePlaceholder;

    return (
      <button
        type="button"
        ref={ref}
        className={className}
        aria-label={ariaLabel ?? "Open calendar"}
        {...rest}
      >
        {showField ? (
          <>
            <span className="min-w-0 flex-1 truncate text-left font-montserrat font-normal leading-[100%] tracking-normal text-inherit">
              {displayText}
            </span>
            <Calendar size={20} className="shrink-0" />
          </>
        ) : (
          <Calendar size={20} />
        )}
      </button>
    );
  },
);

DatePickerTriggerButton.displayName = "DatePickerTriggerButton";

export default function CalendarPicker(props: CalendarPickerProps) {
  const trigger = props.trigger ?? "icon";
  const datePlaceholder = props.datePlaceholder ?? "DD/MM/YYYY";

  const defaultIconTrigger =
    "w-10 h-10 rounded flex items-center justify-center cursor-pointer bg-[#1E1E1E] border border-white/20 text-white hover:bg-primary hover:border-primary transition-colors";
  const defaultFieldTrigger =
    "w-full flex items-center justify-between gap-3 rounded-[4px] bg-[#292929] px-4 py-4 cursor-pointer text-white font-montserrat font-normal text-[14px] leading-[100%] border-0 hover:opacity-95 transition-opacity";

  const buttonClassName = props.buttonClassName ?? (trigger === "field" ? defaultFieldTrigger : defaultIconTrigger);

  const isDOB = props.variant === "dob";

  // common DOB config
  const dobConfig = isDOB
    ? {
        showMonthDropdown: true,
        showYearDropdown: true,
        dropdownMode: "select" as const,
        scrollableYearDropdown: true,
        yearDropdownItemNumber: 100,
        openToDate: props.mode === "single" ? props.selected || new Date(2000, 0) : undefined,
      }
    : {};

  if (props.mode === "single") {
    const dayClassName = (date: Date) => {
      if (!("highlightEventDays" in props) || !props.highlightEventDays) return "";
      const minOk = props.minDate ? date.getTime() > new Date(props.minDate).setHours(0, 0, 0, 0) : true;
      const maxOk = props.maxDate ? date.getTime() < new Date(props.maxDate).setHours(0, 0, 0, 0) : true;
      return minOk && maxOk ? "event-day" : "";
    };
    return (
      <div className="relative">
        <DatePicker
          selected={props.selected}
          onChange={(date: Date | null) => props.onChange(date)}
          dateFormat="dd/MM/yyyy"
          {...(props.minDate ? { minDate: props.minDate } : {})}
          {...(props.maxDate ? { maxDate: props.maxDate } : {})}
          {...(props.allowedDates?.length ? { includeDates: props.allowedDates } : {})}
          dayClassName={dayClassName}
          {...dobConfig}
          openToDate={props.selected || undefined}
          customInput={
            <DatePickerTriggerButton trigger={trigger} datePlaceholder={datePlaceholder} className={buttonClassName} />
          }
          popperPlacement="bottom-end"
          popperClassName="datepicker-popper datepicker-popper-elevated"
          showPopperArrow={false}
          popperProps={{ strategy: "fixed" }}
          portalId="calendar-datepicker-portal"
        />
      </div>
    );
  }

  if (props.onOpenSelectDateModal) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={props.onOpenSelectDateModal}
          className={buttonClassName}
          aria-label="Open calendar to select date range"
        >
          <Calendar size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <DatePicker
        selectsRange
        startDate={props.startDate}
        endDate={props.endDate}
        onChange={(dates: [Date | null, Date | null]) => props.onChange(dates)}
        dateFormat="dd/MM/yyyy"
        minDate={props.minDate}
        maxDate={props.maxDate}
        {...(props.allowedDates?.length ? { includeDates: props.allowedDates } : {})}
        dayClassName={(date) => {
          if (!("highlightEventDays" in props) || !props.highlightEventDays) return "";
          const minOk = props.minDate ? date.getTime() >= new Date(props.minDate).setHours(0, 0, 0, 0) : true;
          const maxOk = props.maxDate ? date.getTime() <= new Date(props.maxDate).setHours(0, 0, 0, 0) : true;
          return minOk && maxOk ? "event-day" : "";
        }}
        customInput={
          <DatePickerTriggerButton
            trigger={trigger}
            datePlaceholder={datePlaceholder}
            className={buttonClassName}
            aria-label="Open calendar to select date range"
          />
        }
        popperPlacement="bottom-end"
        popperClassName="datepicker-popper datepicker-popper-elevated"
        showPopperArrow={false}
        popperProps={{ strategy: "fixed" }}
        portalId="calendar-datepicker-portal"
      />
    </div>
  );
}
