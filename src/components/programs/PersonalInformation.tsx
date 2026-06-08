"use client";

import { Info, X } from "lucide-react";
import { useMemo, useState } from "react";
import Select, { SingleValue } from "react-select";
import { Country as CSCCountry } from "country-state-city";
import worldCountries from "world-countries";
import PhoneInputField from "@/components/PhoneInputField";
import DatePickerField from "@/components/DatePickerField";
import { DetailsFormState } from "./BookingCheckoutClient";
import { subscribeWebsiteApi } from "@/services/websiteServer";

import {
  parseDobDate,
  toDisplayDobDate,
  sanitizeNameInput,
  sanitizeCityInput,
  getMaxBirthDateForMinAge,
  MIN_PROGRAM_BOOKING_AGE_YEARS,
} from "@/helpers/programs-booking/formHelpers";
import Link from "next/link";
import { useParams } from "next/navigation";

interface PersonalInformationProps {
  form: DetailsFormState;
  errors: Partial<Record<keyof DetailsFormState, string>>;
  onChange: (patch: Partial<DetailsFormState>) => void;
  today: Date;
  /** When true, show the courier delivery checkbox (from reservation `show_courier_addon`). */
  showCourierOption: boolean;
  courierFeeLabel?: string | null;
}

export default function PersonalInformation({
  form,
  errors,
  onChange,
  today,
  showCourierOption,
  courierFeeLabel,
}: PersonalInformationProps) {
  const params = useParams<{ locale?: string }>();
  const locale = typeof params?.locale === "string" ? params.locale : "en";
  const [showNewsletterPopup, setShowNewsletterPopup] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleNewsletterSubmit = async () => {
    const email = newsletterEmail.trim();
    if (!email) {
      setNewsletterMessage({ type: "error", text: "Please enter your email." });
      return;
    }

    setNewsletterSubmitting(true);
    setNewsletterMessage(null);
    try {
      const result = await subscribeWebsiteApi(email);
      if (!result.ok) {
        setNewsletterMessage({
          type: "error",
          text: result.error ?? "Failed to subscribe to newsletter.",
        });
        return;
      }
      if (result.status === "already_subscribed") {
        setNewsletterMessage({
          type: "success",
          text: "You're already subscribed.",
        });
        return;
      }
      setNewsletterMessage({
        type: "success",
        text: "Thanks! You are subscribed to our newsletter.",
      });
      setNewsletterEmail("");
    } catch (error) {
      setNewsletterMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to subscribe to newsletter.",
      });
    } finally {
      setNewsletterSubmitting(false);
    }
  };
  const allCountries = useMemo(() => CSCCountry.getAllCountries(), []);
  const nationalityByIso = useMemo(() => {
    return new Map(
      worldCountries.map((country) => [
        country.cca2,
        country.demonyms?.eng?.m ?? country.demonyms?.eng?.f ?? country.name.common,
      ])
    );
  }, []);
  const countryOptions = useMemo(
    () => allCountries.map((country) => ({ value: country.name, label: country.name })),
    [allCountries]
  );
  const nationalityOptions = useMemo(
    () => {
      const seen = new Set<string>();

      return allCountries.reduce<Array<{ value: string; label: string }>>((acc, country) => {
        const nationality = (nationalityByIso.get(country.isoCode) ?? country.name).trim();
        const dedupeKey = nationality.toLowerCase();

        if (!nationality || seen.has(dedupeKey)) {
          return acc;
        }

        seen.add(dedupeKey);
        acc.push({ value: nationality, label: nationality });
        return acc;
      }, []);
    },
    [allCountries, nationalityByIso]
  );

  const selectedNationalityOption = useMemo(
    () => nationalityOptions.find((option) => option.value === form.nationality) ?? null,
    [nationalityOptions, form.nationality]
  );
  const selectedCountryOption = useMemo(
    () => countryOptions.find((option) => option.value === form.country) ?? null,
    [countryOptions, form.country]
  );

  const selectedDobDate = useMemo(() => parseDobDate(form.dateOfBirth), [form.dateOfBirth]);

  const dobMaxSelectableDate = useMemo(
    () => getMaxBirthDateForMinAge(MIN_PROGRAM_BOOKING_AGE_YEARS, today),
    [today],
  );

  const selectStyles = {
    control: (base: any) => ({
      ...base,
      minHeight: "44px",
      backgroundColor: "#151515",
      border: "1px solid #494949",
      borderColor: "#494949",
      borderRadius: "8px",
      boxShadow: "none",
      cursor: "pointer",
      "&:hover": {
        borderColor: "#792327",
      },
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: "#1E1E1E",
      borderRadius: "8px",
      zIndex: 60,
    }),
    menuPortal: (base: any) => ({ ...base, zIndex: 60 }),
    singleValue: (base: any) => ({
      ...base,
      color: "white",
      fontFamily: "Montserrat",
      fontSize: "14px",
    }),
    input: (base: any) => ({
      ...base,
      color: "white",
      fontFamily: "Montserrat",
      fontSize: "14px",
    }),
    placeholder: (base: any) => ({
      ...base,
      color: "rgba(255,255,255,0.45)",
      fontFamily: "Montserrat",
      fontSize: "14px",
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? "rgba(255,255,255,0.08)" : "#1E1E1E",
      color: "white",
      fontFamily: "Montserrat",
      fontSize: "14px",
      cursor: "pointer",
    }),
    noOptionsMessage: (base: any) => ({
      ...base,
      color: "white",
      fontFamily: "Montserrat",
      fontSize: "14px",
    }),
    indicatorSeparator: () => ({ display: "none" }),
    dropdownIndicator: (base: any) => ({
      ...base,
      color: "rgba(255,255,255,0.7)",
      padding: "4px 8px",
    }),
  };
  return (
    <div className="w-full space-y-4 rounded-[20px] bg-surface p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block font-montserrat text-[12px] text-[#FFFFFF]">First Name *</label>
          <input
            value={form.firstName}
            onChange={(event) => onChange({ firstName: sanitizeNameInput(event.target.value) })}
            placeholder="First name"
            className="h-11 w-full rounded-[8px] border border-[#FFFFFF1A] bg-[#151515] px-3 font-montserrat text-[14px] text-white placeholder:text-white/45 transition-colors hover:border-primary-light focus:outline-none"
          />
          {errors.firstName ? <p className="mt-1 font-montserrat text-[12px] text-[#ff8a8a]">{errors.firstName}</p> : null}
        </div>
        <div>
          <label className="mb-1 block font-montserrat text-[12px] text-[#FFFFFF]">Last Name *</label>
          <input
            value={form.lastName}
            onChange={(event) => onChange({ lastName: sanitizeNameInput(event.target.value) })}
            placeholder="Last name"
            className="h-11 w-full rounded-[8px] border border-[#FFFFFF1A] bg-[#151515] px-3 font-montserrat text-[14px] text-white placeholder:text-white/45 transition-colors hover:border-primary-light focus:outline-none"
          />
          {errors.lastName ? <p className="mt-1 font-montserrat text-[12px] text-[#ff8a8a]">{errors.lastName}</p> : null}
        </div>
        <div>
          <label className="mb-1 block font-montserrat text-[12px] text-[#FFFFFF]">Nationality *</label>
          <div data-testid="customer-nationality-dropdown">
            <Select
              instanceId="booking-nationality-select"
              options={nationalityOptions}
              value={selectedNationalityOption}
              onChange={(selected: SingleValue<{ value: string; label: string }>) =>
                onChange({ nationality: selected?.value ?? "" })
              }
              placeholder="Select nationality"
              isSearchable={true}
              menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
              styles={selectStyles}
            />
          </div>
          {errors.nationality ? (
            <p className="mt-1 font-montserrat text-[12px] text-[#ff8a8a]">{errors.nationality}</p>
          ) : null}
        </div>
        <div className="">
          <DatePickerField
            value={selectedDobDate}
            onChange={(date) => onChange({ dateOfBirth: date ? toDisplayDobDate(date) : "" })}
            error={errors.dateOfBirth}
            label="Date of Birth *"
            maxDate={dobMaxSelectableDate}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block font-montserrat text-[16px] leaidng-[100%] text-[#FFFFFF]">Select Gender *</label>
        <div className="flex items-center gap-6 pt-1">
          <label className="inline-flex items-center gap-2 font-montserrat text-[13px] text-white/85">
            <input
              type="radio"
              name="gender"
              checked={form.gender === "male"}
              onChange={() => onChange({ gender: "male" })}
              className="peer sr-only"
            />
            <span data-testid="gender-male-radio" className="relative h-4 w-4 rounded-full border border-white/40 bg-black peer-checked:border-primary-light peer-checked:bg-primary-light">
              <span className="absolute left-1/2 top-1/2 hidden h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white peer-checked:block" />
            </span>
            Male
          </label>
          <label className="inline-flex items-center gap-2 font-montserrat text-[13px] text-white/85">
            <input
              type="radio"
              name="gender"
              checked={form.gender === "female"}
              onChange={() => onChange({ gender: "female" })}
              className="peer sr-only"
            />
            <span data-testid="gender-female-radio" className="relative h-4 w-4 rounded-full border border-white/40 bg-black peer-checked:border-primary-light peer-checked:bg-primary-light">
              <span className="absolute left-1/2 top-1/2 hidden h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white peer-checked:block" />
            </span>
            Female
          </label>
        </div>
        {errors.gender ? <p className="mt-1 font-montserrat text-[12px] text-[#ff8a8a]">{errors.gender}</p> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block font-montserrat text-[12px] text-[#FFFFFF]">Email Address *</label>
          <input
            type="email"
            value={form.email}
            // disabled={true}
            onChange={(event) => onChange({ email: event.target.value.replace(/\s/g, "") })}
            placeholder="name@email.com"
            className="h-11 w-full rounded-[8px] border border-[#FFFFFF1A] bg-[#151515] px-3 font-montserrat text-[14px] text-white/70 placeholder:text-white/45 transition-colors hover:border-primary-light focus:outline-none"
          />
          {errors.email ? <p className="mt-1 font-montserrat text-[12px] text-[#ff8a8a]">{errors.email}</p> : null}
        </div>
        <div>
          <PhoneInputField
            value={form.mobileNumber}
            // disabled={true}
            onChange={(value) => onChange({ mobileNumber: value })}
            error={errors.mobileNumber}
            label="Mobile Number *"
            variant="booking"
            textStyle={{ color: "#FFFFFF70" }}
          />
        </div>
      </div>

      <h2 className="pt-2 font-optima text-[30px] leading-[100%]">Address Details</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block font-montserrat text-[12px] text-[#FFFFFF]">Country *</label>
          <div data-testid="customer-country-dropdown">
            <Select
              instanceId="booking-country-select"
              options={countryOptions}
              value={selectedCountryOption}
              onChange={(selected: SingleValue<{ value: string; label: string }>) =>
                onChange({ country: selected?.value ?? "" })
              }
              placeholder="Select country"
              isSearchable={true}
              menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
              styles={selectStyles}
            />
          </div>
          {errors.country ? <p className="mt-1 font-montserrat text-[12px] text-[#ff8a8a]">{errors.country}</p> : null}
        </div>
        <div>
          <label className="mb-1 block font-montserrat text-[12px] text-[#FFFFFF]">City *</label>
          <input
            value={form.city}
            onChange={(event) => onChange({ city: sanitizeCityInput(event.target.value) })}
            placeholder="City"
            className="h-11 w-full rounded-[8px] border border-[#FFFFFF1A] bg-[#151515] px-3 font-montserrat text-[14px] text-white placeholder:text-white/45 transition-colors hover:border-primary-light focus:outline-none"
          />
          {errors.city ? <p className="mt-1 font-montserrat text-[12px] text-[#ff8a8a]">{errors.city}</p> : null}
        </div>
      </div>

      <div className="rounded-[10px] border border-[#FFFFFF1A] bg-[#494949] p-4 space-y-4">
        <p className="inline-flex items-center gap-1 font-montserrat text-[14px] leading-[100%] font-bold text-[#D2D2D2]">
          <Info size={14} className="text-[#D2D2D2]" />
          Information Update
        </p>
        <p className=" font-montserrat text-[14px] leading-[120%] font-normal text-white">
          Your personal details are protected at all times. To update this information, please write to us at <span className="underline cursor-pointer">customerservice@ubyemaar.com</span>
        </p>
        <p className=" font-montserrat text-[14px] leading-[120%] font-normal text-white">
          Please{" "}
          <button
            type="button"
            onClick={() => {
              setShowNewsletterPopup(true);
              setNewsletterMessage(null);
            }}
            className="underline cursor-pointer"
          >
            Sign up
          </button>{" "}
          to receive exclusive offers and news from Dubai Opera
        </p>
        <p className="font-montserrat text-[14px] leading-[120%] font-normal text-white">
          Please Visit our{" "}
          <Link href={`/${locale}/privacy-policy`} className="underline cursor-pointer">
            Privacy Policy
          </Link>
          . to understand how we handle personal Data
        </p>
      </div>

      <label className="flex cursor-pointer items-center gap-2 w-fit">
        <input
          type="checkbox"
          checked={form.acceptedTerms}
          onChange={(event) => onChange({ acceptedTerms: event.target.checked })}
          className="peer sr-only"
        />
        <span data-testid="terms-and-conditions-checkbox" className="relative h-4 w-4 cursor-pointer rounded-sm border border-white bg-black text-transparent peer-checked:border-primary-light peer-checked:bg-primary-light peer-checked:text-white">
          <svg
            viewBox="0 0 16 16"
            className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M3.5 8.5l3 3L12.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="font-montserrat text-[14px] leading-[100%] text-white">I have read and agree to the Terms & Conditions</span>
      </label>
      {errors.acceptedTerms ? <p className="font-montserrat text-[12px] text-[#ff8a8a]">{errors.acceptedTerms}</p> : null}

      {showCourierOption ? (
        <label className="flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            checked={form.receiveCourier}
            onClick={(e) => e.stopPropagation()}
            onChange={(event) => onChange({ receiveCourier: event.target.checked })}
            className="peer sr-only"
          />
          <span className="relative mt-0.5 h-4 w-4 cursor-pointer rounded-sm border border-white bg-black text-transparent peer-checked:border-primary-light peer-checked:bg-primary-light peer-checked:text-white">
            <svg
              viewBox="0 0 16 16"
              className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M3.5 8.5l3 3L12.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>

          <div className="flex flex-col">
            <span className="font-montserrat text-[14px] leading-[140%] text-white">
              Would you like to receive/gift the tickets by courier?
            </span>

            {courierFeeLabel ? (
              <span className="font-montserrat text-[14px] leading-[140%] text-[#888888]">
                Courier Fee: {courierFeeLabel}
              </span>
            ) : null}
          </div>
        </label>
      ) : null}

      {showNewsletterPopup ? (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setShowNewsletterPopup(false)}
        >
          <div
            className="w-full max-w-md rounded-[14px] border border-white/15 bg-[#1A1A1A] p-5 text-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-optima text-[26px] leading-[100%]">Sign up</h3>
              <button
                type="button"
                onClick={() => setShowNewsletterPopup(false)}
                className="cursor-pointer rounded p-1 text-white/70 hover:bg-white/10 hover:text-white"
                aria-label="Close newsletter popup"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mb-4 font-montserrat text-[13px] text-white/70">
              Subscribe to our newsletter for updates and exclusive offers.
            </p>
            <div className="space-y-3">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(event) => setNewsletterEmail(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleNewsletterSubmit();
                  }
                }}
                placeholder="Enter your email"
                className="h-11 w-full rounded-[8px] border border-[#FFFFFF1A] bg-[#151515] px-3 font-montserrat text-[14px] text-white placeholder:text-white/45 transition-colors hover:border-primary-light focus:outline-none"
                required
                disabled={newsletterSubmitting}
              />
              <button
                type="button"
                onClick={() => {
                  void handleNewsletterSubmit();
                }}
                disabled={newsletterSubmitting}
                className="h-11 w-full rounded-[8px] bg-primary-light px-4 font-montserrat text-[14px] font-semibold text-white transition-colors hover:bg-[#5E1B1E] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {newsletterSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
            {newsletterMessage ? (
              <p
                className={`mt-3 font-montserrat text-[12px] ${newsletterMessage.type === "success" ? "text-emerald-300" : "text-[#ff8a8a]"
                  }`}
              >
                {newsletterMessage.text}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
