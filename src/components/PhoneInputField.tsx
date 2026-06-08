"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";
import {
    getCountries,
    getCountryCallingCode,
    type Country,
} from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import Select, { components, type InputActionMeta, SingleValue } from "react-select";

interface PhoneInputFieldProps {
    value: string;
    onChange: (value: string) => void;
    error?: string;
    label?: string;
    labelClassName?: string;
    placeholder?: string;
    textStyle?: CSSProperties;
    variant?: "default" | "booking" | "login" | "signup";
    disabled?: boolean;
    menuZIndex?: number;
    maxMenuHeight?: number;
}

const ALL_COUNTRIES = getCountries();

type CountryOption = {
    value: Country;
    label: string;
    dialCode: string;
};

export default function PhoneInputField({
    value,
    onChange,
    error,
    label = "Mobile Number",
    labelClassName,
    placeholder = "Mobile Number",
    textStyle,
    variant = "default",
    disabled = false,
    menuZIndex = 10,
    maxMenuHeight = 200,
}: PhoneInputFieldProps) {
    const [country, setCountry] = useState<Country>("AE");
    /** Country dropdown search: digits only, max 3 (calling code length). */
    const [countrySearchInput, setCountrySearchInput] = useState("");
    const countryOptions = useMemo<CountryOption[]>(
        () =>
            ALL_COUNTRIES.map((code) => ({
                value: code,
                label: `${code} +${getCountryCallingCode(code)}`,
                dialCode: getCountryCallingCode(code),
            })),
        []
    );

    const selectedCountryOption = useMemo(
        () => countryOptions.find((option) => option.value === country) ?? countryOptions[0],
        [country, countryOptions]
    );

    const inferredFromValue = useMemo(() => {
        const raw = typeof value === "string" ? value.trim() : "";
        if (!raw.startsWith("+")) return null;
        const digits = raw.replace(/[^\d+]/g, "");
        if (!digits.startsWith("+")) return null;
        const onlyDigits = digits.slice(1).replace(/\D/g, "");
        if (!onlyDigits) return null;

        let best: CountryOption | null = null;
        for (const opt of countryOptions) {
            if (onlyDigits.startsWith(opt.dialCode)) {
                if (!best || opt.dialCode.length > best.dialCode.length) best = opt;
            }
        }
        return best;
    }, [countryOptions, value]);

    useEffect(() => {
        if (!inferredFromValue) return;
        if (inferredFromValue.value !== country) {
            setCountry(inferredFromValue.value);
        }
        // Don't include `country` as a dependency to avoid flip-flopping when users edit quickly.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inferredFromValue]);

    const Flag = selectedCountryOption ? flags[selectedCountryOption.value] : undefined;
    const dialCode =
        inferredFromValue?.dialCode ??
        selectedCountryOption?.dialCode ??
        getCountryCallingCode(country);

    // Strip dial code prefix to show only the local digits.
    const displayValue = value.startsWith(`+${dialCode}`)
        ? value.slice(dialCode.length + 1)
        : value.replace(/^\+/, "");

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled) return;
        let digits = e.target.value.replace(/\D/g, "");

        if (digits.length > 11) digits = digits.slice(0, 11);

        onChange(digits ? `+${dialCode}${digits}` : "");
    };

    const handleCountryChange = (selected: SingleValue<CountryOption>) => {
        if (disabled) return;
        if (!selected) return;

        const newCountry = selected.value;
        setCountry(newCountry);
        setCountrySearchInput("");

        const digits = displayValue.replace(/\D/g, "");
        onChange(digits ? `+${selected.dialCode}${digits}` : "");
    };

    const handleCountrySelectInputChange = (newValue: string, meta: InputActionMeta) => {
        switch (meta.action) {
            case "input-change": {
                const digits = newValue.replace(/\D/g, "").slice(0, 3);
                setCountrySearchInput(digits);
                break;
            }
            case "menu-close":
            case "set-value":
                setCountrySearchInput("");
                break;
            default:
                setCountrySearchInput(newValue);
        }
    };

    const filterCountryByDialCode = (option: { data: CountryOption }, inputValue: string) => {
        const digits = inputValue.replace(/\D/g, "").slice(0, 3);
        if (!digits) return true;
        return option.data.dialCode.startsWith(digits);
    };

    const isBooking = variant === "booking";
    const isLogin = variant === "login";
    const isSignup = variant === "signup";
    const isCompact = isBooking || isLogin || isSignup;

    return (
        <div className={isCompact ? "space-y-1" : "space-y-2.5"}>
            {label && (
                <label
                    style={textStyle}
                    className={
                        labelClassName || (isBooking
                            ? "mb-1 block font-montserrat text-[12px] text-[#FFFFFF]"
                            : isLogin
                                ? "mb-2 block font-montserrat text-[12px] font-normal leading-[100%] tracking-[0] text-white"
                                : isSignup
                                    ? "mb-2 block font-montserrat text-[12px] font-normal leading-none tracking-[0] text-white/90"
                                    : "block text-[14px] text-white/90")
                    }
                >
                    {label}
                </label>
            )}

            <div className={`flex items-stretch ${isCompact ? "gap-2" : "gap-3"}`}>
                <div className={`shrink-0 ${isBooking ? "w-[130px]" : isSignup ? "w-[98px] sm:w-[108px]" : "w-[140px]"}`}>
                    <Select
                        instanceId={`phone-country-${variant}`}
                        options={countryOptions}
                        value={selectedCountryOption}
                        onChange={handleCountryChange}
                        isDisabled={disabled}
                        isSearchable={true}
                        inputValue={countrySearchInput}
                        onInputChange={handleCountrySelectInputChange}
                        filterOption={filterCountryByDialCode}
                        classNamePrefix={isBooking ? "phone-country-booking" : isSignup ? "phone-country-signup" : "phone-country-default"}
                        menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
                        menuPlacement="auto"
                        maxMenuHeight={maxMenuHeight}
                        menuShouldScrollIntoView={false}
                        styles={{
                            control: (base) => ({
                                ...base,
                                minHeight: isBooking ? "44px" : isLogin ? "52px" : isSignup ? "40px" : "52px",
                                backgroundColor: isBooking ? "#151515" : isLogin || isSignup ? "#1B1B1B" : "#1E1E1E",
                                borderColor: isLogin || isSignup ? "#3a3a3a" : "#494949",
                                borderWidth: "1px",
                                borderStyle: "solid",
                                borderRadius: isBooking ? "8px" : "10px",
                                boxShadow: "none",
                                cursor: "pointer",
                                color: "white",
                                padding: isBooking ? "0 4px" : isLogin || isSignup ? "0 17px" : "0 6px",
                                "&:hover": {
                                    borderColor: "#792327",
                                },
                            }),
                            menu: (base) => ({
                                ...base,
                                backgroundColor: "#1E1E1E",
                                borderRadius: "8px",
                                zIndex: menuZIndex,
                                overflow: "hidden",
                            }),
                            menuPortal: (base) => ({ ...base, zIndex: menuZIndex }),
                            menuList: (base) => ({
                                ...base,
                                maxHeight: maxMenuHeight,
                                overflowY: "auto",
                                paddingTop: 0,
                                paddingBottom: 0,
                            }),
                            singleValue: (base) => ({
                                ...base,
                                color: "white",
                                marginLeft: 0,
                                marginRight: 0,
                                fontSize: isSignup ? "12px" : "14px",
                            }),
                            option: (base, state) => ({
                                ...base,
                                backgroundColor: state.isFocused ? "rgba(255,255,255,0.08)" : "#1E1E1E",
                                color: "white",
                                cursor: "pointer",
                            }),
                            valueContainer: (base) => ({
                                ...base,
                                padding: "0",
                                color: "white",
                            }),
                            input: (base) => ({
                                ...base,
                                color: "white",
                            }),
                            placeholder: (base) => ({
                                ...base,
                                color: "rgba(255,255,255,0.45)",
                            }),
                            noOptionsMessage: (base) => ({
                                ...base,
                                color: "white",
                            }),
                            indicatorSeparator: () => ({ display: "none" }),
                            dropdownIndicator: (base) => ({
                                ...base,
                                color: "rgba(255,255,255,0.8)",
                                padding: isSignup ? "3px" : "4px",
                            }),
                        }}
                        components={{
                            Option: (props) => {
                                const OptionFlag = flags[props.data.value];

                                return (
                                    <components.Option {...props}>
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-[16px] w-6 shrink-0 items-center overflow-hidden rounded-[2px]">
                                                {OptionFlag ? <OptionFlag title={props.data.value} /> : null}
                                            </span>
                                            <span className="font-montserrat text-[13px] text-white" style={textStyle}>
                                                {props.data.value} +{props.data.dialCode}
                                            </span>
                                        </div>
                                    </components.Option>
                                );
                            },
                            SingleValue: (props) => (
                                <components.SingleValue {...props}>
                                    <div className={`flex items-center pl-2 ${isSignup ? "gap-1.5" : "gap-2"}`}>
                                        <span className="flex h-[16px] w-6 shrink-0 items-center overflow-hidden rounded-[2px]">
                                            {Flag ? <Flag title={country} /> : null}
                                        </span>
                                        <span
                                            className={`whitespace-nowrap font-montserrat font-medium text-white ${isSignup ? "text-[12px]" : "text-[14px]"}`}
                                            style={textStyle}
                                        >
                                            +{dialCode}
                                        </span>
                                    </div>
                                </components.SingleValue>
                            ),
                        }}
                    />
                </div>

                <input
                    type="tel"
                    value={displayValue}
                    onChange={handleNumberChange}
                    placeholder={placeholder}
                    maxLength={11}
                    disabled={disabled}
                    style={textStyle}
                    className={
                        isBooking
                            ? "h-11 w-full rounded-[8px] border border-white/20 bg-[#151515] px-3 font-montserrat text-[14px] text-white placeholder:text-white/45 transition-colors hover:border-primary-light focus:outline-none"
                            : isLogin
                                ? "box-border h-[52px] w-full rounded-[10px] border border-[#3a3a3a] bg-[#151515] px-4 font-montserrat text-[15px] text-white placeholder:text-white/35 transition-colors focus:outline-none focus:border-white/25"
                                : isSignup
                                    ? "h-10 w-full rounded-[10px] border border-[#3a3a3a] bg-[#1B1B1B] px-4 font-montserrat text-[13px] text-white placeholder:text-white/35 focus:outline-none focus:border-white/25 transition-colors"
                                    : "w-full rounded-[10px] border border-[#494949] bg-[#1E1E1E] px-4 py-3.5 text-[15px] text-white placeholder:text-white/40 transition-colors focus:border-white/20 focus:outline-none"
                    }
                />
            </div>

            {error && (
                <p className={isBooking ? "font-montserrat text-[12px] text-[#ff8a8a]" : isLogin || isSignup ? "mt-1 text-[12px] text-red-400" : "text-red-500 text-[13px]"}>
                    {error}
                </p>
            )}
        </div>
    );
}
