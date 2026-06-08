"use client";

import { useState, useEffect } from "react";
import Select, { MultiValue, SingleValue, components, ValueContainerProps, OptionProps } from "react-select";
import { Check } from "lucide-react";
import CalendarPicker from "@/components/CalendarPicker";

function OptionWithCheckbox<Option, IsMulti extends boolean>(props: OptionProps<Option, IsMulti>) {
  const { children, isSelected, innerProps } = props;
  return (
    <div {...innerProps} className="flex items-center gap-3 px-5 py-2.5 cursor-pointer hover:bg-white/10">
      <div
        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? "bg-primary border-primary" : "border-white/40"
          }`}
      >
        {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
      </div>
      <span className="text-white font-montserrat font-normal text-base leading-[100%] text-left capitalize flex-1 min-w-0">{children}</span>
    </div>
  );
}

function ValueContainerWithCount<Option, IsMulti extends boolean>(
  props: ValueContainerProps<Option, IsMulti>
) {
  const { children, selectProps } = props;
  const value = selectProps.value;
  const isMulti = Boolean(selectProps.isMulti);
  const count = Array.isArray(value) ? value.length : value ? 1 : 0;
  const placeholder = String(selectProps.placeholder ?? "");
  const menuIsOpen = selectProps.menuIsOpen ?? false;
  const isVenueSelect = selectProps.classNamePrefix === "venue-select";
  const isCategorySelect = selectProps.classNamePrefix === "category-select";
  const singleSelectedLabel =
    !Array.isArray(value) && value && typeof value === "object" && "label" in value
      ? String((value as { label?: string }).label ?? "")
      : "";
  const multiSelectedLabels =
    Array.isArray(value) && value.length > 0
      ? value
        .map((v) =>
          v && typeof v === "object" && "label" in (v as any)
            ? String((v as any).label ?? "")
            : "",
        )
        .filter(Boolean)
      : [];
  const singleDisplayLabel =
    isVenueSelect && singleSelectedLabel.length > 10 ? `${singleSelectedLabel.slice(0, 10)}...` : singleSelectedLabel;
  const multiDisplayLabel = (() => {
    if (multiSelectedLabels.length === 0) return placeholder;
    if (isCategorySelect) {
      if (multiSelectedLabels.length === 1) return multiSelectedLabels[0] ?? placeholder;
      return `${placeholder} ${count}`;
    }
    return `${placeholder} ${count}`;
  })();
  const displayLabel = isMulti ? multiDisplayLabel : singleDisplayLabel || placeholder;
  const shouldTruncateLabel = !(isCategorySelect && isMulti && count > 1);

  return (
    <components.ValueContainer {...props}>
      <div className="relative flex h-[40px] w-full items-center min-w-0">
        <div
          className="pointer-events-none absolute inset-0 flex items-center px-2 pr-7 min-w-0 overflow-hidden"
          style={{ visibility: menuIsOpen ? "hidden" : "visible" }}
        >
          <span
            className={`block w-full min-w-0 text-white font-montserrat font-normal text-base leading-[1.2] text-left capitalize whitespace-nowrap ${shouldTruncateLabel ? "overflow-hidden text-ellipsis" : ""}`}
          >
            {displayLabel}
          </span>
        </div>
        <div className="relative z-10 flex flex-1 items-center min-w-0">{children}</div>
      </div>
    </components.ValueContainer>
  );
}

export const DATE_FILTERS = ["Upcoming", "Past Shows"] as const;

export type FiltersDateState = {
  datePreset: (typeof DATE_FILTERS)[number] | null;
  calendarDate: Date | null;
  venueValue: string | null;
  seasonValue: string | null;
  categoryIds: string[];
};


export type FiltersOption = { value: string; label: string };

const filterFont = {
  fontFamily: "Montserrat",
  fontWeight: 400,
  fontSize: "16px",
  lineHeight: "100%",
  letterSpacing: "0%",
  textAlign: "left" as const,
  textTransform: "capitalize" as const,
};

const darkSelectStyles = {
  control: (base: object) => ({
    ...base,
    ...filterFont,
    backgroundColor: "#1E1E1E",
    borderColor: "transparent",
    borderWidth: "0",
    minHeight: "40px",
    height: "40px",
    padding: "0 4px 0 2px",
    overflow: "visible",
    cursor: "pointer",
    borderRadius: "7px",
    outline: "none",
    boxShadow: "none",
    "&:hover": { borderColor: "transparent" },
  }),
  valueContainer: (base: object) => ({
    ...base,
    padding: "0 4px",
    overflow: "visible",
    alignItems: "center",
  }),
  menu: (
    base: object,
    state: { selectProps?: { classNamePrefix?: string | null } }
  ) => ({
    ...base,
    backgroundColor: "#1E1E1E",
    borderRadius: "8px",
    minWidth: state.selectProps?.classNamePrefix === "venue-select" ? "180px" : "100%",
    zIndex: 20,
  }),
  menuPortal: (base: object) => ({
    ...base,
    zIndex: 20,
  }),
  menuList: (base: object) => ({
    ...base,
    backgroundColor: "#1E1E1E",
  }),
  option: (
    base: object,
    state: { isSelected: boolean; isFocused: boolean; selectProps: { isMulti?: boolean } }
  ) => ({
    ...base,
    ...filterFont,
    backgroundColor:
      state.selectProps?.isMulti === false && state.isFocused
        ? "rgba(255,255,255,0.1)"
        : "#1E1E1E",
    color: "white",
    cursor: "pointer",
    "&:hover": {
      backgroundColor: state.selectProps?.isMulti === false ? "rgba(255,255,255,0.1)" : "#1E1E1E",
    },
    "&:active": { backgroundColor: "#1E1E1E" },
  }),
  multiValue: (base: object) => ({
    ...base,
    backgroundColor: "rgba(92, 24, 34, 0.6)",
  }),
  multiValueLabel: (base: object) => ({
    ...base,
    color: "white",
  }),
  singleValue: (base: object) => ({
    ...base,
    ...filterFont,
    color: "white",
  }),
  placeholder: (base: object) => ({
    ...base,
    ...filterFont,
    color: "white",
  }),
  input: (base: object) => ({
    ...base,
    ...filterFont,
    color: "white",
  }),
  indicatorSeparator: () => ({ display: "none" }),
  clearIndicator: (base: object) => ({
    ...base,
    color: "rgba(255,255,255,0.8)",
    padding: "4px 2px",
    cursor: "pointer",
    "&:hover": { color: "rgba(255,255,255,0.8)", backgroundColor: "transparent" },
  }),
  dropdownIndicator: (base: object, state: { selectProps?: { menuIsOpen?: boolean } }) => ({
    ...base,
    color: "rgba(255,255,255,0.8)",
    padding: "4px 2px",
    transform: state.selectProps?.menuIsOpen ? "rotate(180deg)" : "rotate(0deg)",
    transition: "transform 0.35s ease",
  }),
};

interface FiltersProps {
  title?: string;
  titleOptima?: string;
  titleScript?: string;
  showControls?: boolean;
  showVenueFilter?: boolean;
  showDateFilters?: boolean;
  showCalendarFilter?: boolean;
  showCategoryFilter?: boolean;
  showSeasonsFilter?: boolean;
  forceColumnLayout?: boolean;
  titleAlign?: "left" | "center";
  /** Built from event venues (unique labels). When empty, the venue dropdown is hidden. */
  venueOptions?: FiltersOption[];
  /** API-backed screen options (preferred over `venueOptions` when provided). */
  screenOptions?: FiltersOption[];
  /** API-backed category options (optional override). */
  categoryOptions?: FiltersOption[];
  /** API-backed season options (optional override). */
  seasonOptions?: FiltersOption[];
  /** Fired when date preset, calendar, or venue selection changes (including initial mount). */
  onFiltersChange?: (state: FiltersDateState) => void;
}

export default function Filters({
  title = "",
  showControls = true,
  showVenueFilter = true,
  showDateFilters = true,
  showCalendarFilter = true,
  showCategoryFilter = true,
  showSeasonsFilter = false,
  forceColumnLayout = false,
  venueOptions = [],
  screenOptions,
  categoryOptions,
  seasonOptions,
  onFiltersChange,
}: FiltersProps) {
  const [activeDateFilter, setActiveDateFilter] = useState<string>("Upcoming");
  const [venueArea, setVenueArea] = useState<SingleValue<{ value: string; label: string }>>(null);
  const [category, setCategory] = useState<MultiValue<{ value: string; label: string }>>([]);
  const [seasonFilter, setSeasonFilter] = useState<SingleValue<{ value: string; label: string }>>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [venueLikeOptions, setVenueLikeOptions] = useState<FiltersOption[]>(
    screenOptions && screenOptions.length > 0 ? screenOptions : venueOptions
  );
  const [categoryOptionsValue, setCategoryOptionsValue] = useState<FiltersOption[]>(categoryOptions ?? []);
  const isPastShowsSection = title.trim().toLowerCase() === "past seasons";
  const seasonOptionsValue = seasonOptions ?? [];

  useEffect(() => {
    if (!seasonFilter) return;
    const stillExists = seasonOptionsValue.some((option) => option.value === seasonFilter.value);
    if (!stillExists) {
      setSeasonFilter(null);
    }
  }, [seasonOptionsValue, seasonFilter]);

  useEffect(() => {
    const preset =
      DATE_FILTERS.includes(activeDateFilter as (typeof DATE_FILTERS)[number])
        ? (activeDateFilter as (typeof DATE_FILTERS)[number])
        : null;
    onFiltersChange?.({
      datePreset: preset,
      calendarDate: selectedDate,
      venueValue: venueArea?.value ?? null,
      seasonValue: seasonFilter?.value ?? null,
      categoryIds: category.map((c) => String(c.value)),
    });
  }, [activeDateFilter, selectedDate, venueArea, seasonFilter, category, onFiltersChange]);

  useEffect(() => {
    let mounted = true;

    const getScreens = async () => {
      const response = await fetch("/api/external/master/screens", { cache: "no-store" });
      const json = (await response.json().catch(() => null)) as
        | { data?: FiltersOption[] }
        | null;
      const screens = json?.data ?? [];
      if (!mounted) return;
      if (screens.length > 0) {
        setVenueLikeOptions(screens);
      }
    };

    void getScreens();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const getCategories = async () => {
      const response = await fetch("/api/external/master/categories", { cache: "no-store" });
      const json = (await response.json().catch(() => null)) as
        | { data?: FiltersOption[] }
        | null;
      const categories = json?.data ?? [];
      if (!mounted) return;
      if (categories.length > 0) {
        setCategoryOptionsValue(categories);
      }
    };

    void getCategories();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="w-full md:py-8 bg-transparent text-left px-4 md:px-8 lg:px-12 overflow-x-auto lg:overflow-x-hidden">
      <div
        className={`flex  w-full  ${forceColumnLayout ? "" : "flex-col  gap-4 lg:flex-row items-center lg:justify-between"
          }`}
      >

        <div className="lg:w-[20%]">
          <span
            className={`inline font-optima font-normal text-[26px] md:text-[40px] md:leading-[100%] capitalize md:tracking-normal "`}
          >
            {title}
          </span>
        </div>

        <div className="lg:w-[80%] w-full">
          {showControls ? (
            <div
              className={`flex w-full gap-3 hideScrollbar ${forceColumnLayout
                ? "flex-row overflow-x-auto items-center"
                : isPastShowsSection
                  ? "flex-row flex-nowrap overflow-x-auto items-center justify-center lg:justify-end"
                  : "flex-row overflow-x-auto items-center md:flex-wrap md:overflow-visible  justify-start md:justify-center lg:justify-end"
                }`}
            >
              {showSeasonsFilter && seasonOptionsValue.length > 0 && (
                <div className="w-[160px] shrink-0 md:w-[200px] min-w-0">
                  <Select
                    instanceId="seasons-filter-select"
                    options={seasonOptionsValue}
                    value={seasonFilter}
                    onChange={setSeasonFilter}
                    placeholder="Seasons"
                    isMulti={false}
                    isSearchable={false}
                    styles={darkSelectStyles}
                    classNamePrefix="seasons-filter-select"
                    menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
                  />
                </div>
              )}

              {showDateFilters && (
                <div className="flex shrink-0 flex-nowrap gap-2 md:flex-wrap md:w-auto md:justify-center md:gap-3">
                  {DATE_FILTERS.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveDateFilter(filter)}
                      className={`px-4 h-[39px] whitespace-nowrap cursor-pointer rounded-[6px] font-montserrat font-medium text-base leading-[100%] text-center capitalize transition-colors shadow-[0_0_11px_0_rgba(255,255,255,0)] ${activeDateFilter === filter
                        ? "bg-primary text-white"
                        : "bg-[#1E1E1E] text-white hover:opacity-90"
                        }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              )}

              {showVenueFilter && venueLikeOptions.length > 0 && (
                <div className="w-[150px] shrink-0 md:w-[180px] min-w-0">
                  <Select
                    instanceId="venue-area-select"
                    options={venueLikeOptions}
                    value={venueArea}
                    onChange={setVenueArea}
                    placeholder="Venue Area"
                    isClearable
                    isMulti={false}
                    styles={darkSelectStyles}
                    classNamePrefix="venue-select"
                    menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
                    components={{
                      ValueContainer: ValueContainerWithCount,
                      MultiValue: () => null,
                      SingleValue: () => null,
                      Placeholder: () => null,
                    }}
                  />
                </div>
              )}

              {showCategoryFilter && categoryOptionsValue.length > 0 && (
                <div className="w-[170px] shrink-0  min-w-0">
                  <Select
                    instanceId="category-select"
                    options={categoryOptionsValue}
                    value={category}
                    onChange={(value) => setCategory(value as MultiValue<{ value: string; label: string }>)}
                    placeholder="Category"
                    isClearable
                    isSearchable={false}
                    isMulti
                    closeMenuOnSelect={false}
                    hideSelectedOptions={false}
                    styles={darkSelectStyles}
                    classNamePrefix="category-select"
                    menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
                    components={{
                      Option: OptionWithCheckbox,
                      ValueContainer: ValueContainerWithCount,
                      MultiValue: () => null,
                      SingleValue: () => null,
                      Placeholder: () => null,
                    }}
                  />
                </div>
              )}
              {showCalendarFilter && (
                <div className={`${isPastShowsSection ? "md:block" : ""} shrink-0`}>
                  <CalendarPicker
                    mode="single"
                    selected={selectedDate}
                    onChange={setSelectedDate}
                    buttonClassName="w-10 h-10 rounded-[7px] flex items-center justify-center cursor-pointer bg-[#1E1E1E] text-white hover:bg-primary hover:border-primary transition-colors"
                  />
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
