"use client";

import { Info } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Country as CSCCountry, City } from "country-state-city";
import { useRouter, useSearchParams } from "next/navigation";
import { use } from "react";
import PhoneInputField from "@/components/PhoneInputField";
import Select, { SingleValue, StylesConfig } from "react-select";
import { useAuth } from "@/contexts/auth/AuthContext";
import { toast } from "sonner";
import { subscribeWebsiteApi, updateCustomer } from "@/services/websiteServer";
import worldCountries from "world-countries";
import { EmaarPassUserProfile } from "@/types/emaarpass";

const DatePickerField = dynamic(() => import("@/components/DatePickerField"), {
    ssr: false,
    loading: () => <div className="h-[52px] w-full rounded-[10px] bg-[#1B1B1B]" />,
});

const inputClass =
    "box-border h-[52px] w-full rounded-[10px] border border-[#3a3a3a] bg-[#1B1B1B] px-4 py-3.5 font-montserrat text-[15px] text-white placeholder:text-white/40 transition-colors focus:outline-none focus:border-white/25";

const labelClass = "mb-2 block font-montserrat text-[12px] font-normal leading-[100%] text-white";
type SelectOption = { value: string; label: string };

const titleOptions: SelectOption[] = [
    { value: "Mr", label: "Mr" },
    { value: "Ms", label: "Ms" },
    { value: "Mrs", label: "Mrs" },
    { value: "Dr", label: "Dr" },
];

const buildSelectStyles = (hasError = false): StylesConfig<SelectOption, false> => ({
    control: (base, state) => ({
        ...base,
        minHeight: "50px",
        backgroundColor: "#0000004D",
        borderRadius: "10px",
        border: hasError ? "1px solid rgba(239, 68, 68, 0.7)" : "1px solid #494949",
        boxShadow: "none",
        cursor: state.isDisabled ? "not-allowed" : "pointer",
        padding: "0 6px",
        opacity: state.isDisabled ? 0.5 : 1,
        "&:hover": {
            border: hasError ? "1px solid rgba(239, 68, 68, 0.7)" : "1px solid rgba(255,255,255,0.3)",
        },
    }),
    menu: (base) => ({
        ...base,
        backgroundColor: "#1E1E1E",
        borderRadius: "10px",
        border: "1px solid #494949",
        zIndex: 60,
        overflow: "hidden",
    }),
    menuPortal: (base) => ({ ...base, zIndex: 60 }),
    singleValue: (base) => ({
        ...base,
        color: "white",
        fontFamily: "Montserrat",
        fontSize: "14px",
    }),
    placeholder: (base) => ({
        ...base,
        color: "rgba(255,255,255,0.45)",
        fontFamily: "Montserrat",
        fontSize: "14px",
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isFocused ? "rgba(255,255,255,0.08)" : "#1E1E1E",
        color: "white",
        fontFamily: "Montserrat",
        fontSize: "14px",
        cursor: "pointer",
    }),
    input: (base) => ({
        ...base,
        color: "white",
        fontFamily: "Montserrat",
        fontSize: "14px",
    }),
    indicatorSeparator: () => ({ display: "none" }),
    dropdownIndicator: (base) => ({
        ...base,
        color: "rgba(255,255,255,0.75)",
        padding: "6px",
    }),
});

function formatDateYYYYMMDD(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function parseMaybeDate(value: unknown): Date | null {
    if (typeof value !== "string" || !value.trim()) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

type FormState = {
    title: string;
    firstName: string;
    lastName: string;
    nationalityCode: string;
    dob: Date | null;
    isNewsLetterSubscribed: boolean;
    isOnboardingCompleted: boolean;
    gender: string;
    email: string;
    mobile: string;
    address: {
        line1: string;
        countryCode: string;
        city: string;
        zip: string;
    };
};

type FormErrors = Partial<Record<keyof FormState | "nationality" | "address", string>>;

const initialFormState: FormState = {
    title: "",
    firstName: "",
    lastName: "",
    nationalityCode: "",
    dob: null,
    gender: "",
    email: "",
    mobile: "",
    isNewsLetterSubscribed: false,
    isOnboardingCompleted: false,
    address: {
        line1: "",
        countryCode: "",
        city: "",
        zip: "",
    },
};

export default function RegisterOnboardingPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = use(params);

    const [form, setForm] = useState<FormState>(initialFormState);
    const [errors, setErrors] = useState<FormErrors>({});
    const [pageError, setPageError] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);
    const [hasPrefilled, setHasPrefilled] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, setUser, isLoading: authLoading, error: authError, } = useAuth();
    const [isNewsLetterSubscribed, setIsNewsLetterSubscribed] = useState(false);

    const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: "" }));
    };

    const updateAddress = <K extends keyof FormState["address"]>(
        key: K,
        value: FormState["address"][K],
    ) => {
        setForm((prev) => ({ ...prev, address: { ...prev.address, [key]: value } }));
    };

    const allCountries = CSCCountry.getAllCountries();
    const nationalityByIso = useMemo(() => {
        return new Map(
          worldCountries.map((country) => [
            country.cca2,
            country.demonyms?.eng?.m ?? country.demonyms?.eng?.f ?? country.name.common,
          ])
        );
      }, []);
      const nationalityOptions = useMemo(
        () => {
          const seen = new Set<string>();
    
          return allCountries.reduce<Array<{ value: string; label: string }>>((acc, country) => {
            const nationality = (nationalityByIso.get(country.isoCode) ?? country.name).trim();
            const dedupeKey = `${country.isoCode.toLowerCase()}:${nationality.toLowerCase()}`;
    
            if (!nationality || seen.has(dedupeKey)) {
              return acc;
            }
    
            seen.add(dedupeKey);
            // Keep state as ISO code, render label as nationality (demonym) or country name fallback.
            acc.push({ value: country.isoCode, label: nationality });
            return acc;
          }, []);
        },
        [allCountries, nationalityByIso]
      );
    
      const selectedNationalityOption = useMemo(
        () => nationalityOptions.find((option) => option.value === form.nationalityCode) ?? null,
        [nationalityOptions, form.nationalityCode]
      );
    const selectedTitleOption = useMemo(
        () => titleOptions.find((option) => option.value === form.title) ?? null,
        [form.title],
    );

    const countryOptions = useMemo(
        () => allCountries.map((country) => ({ value: country.isoCode, label: country.name })),
        [allCountries],
    );
    const selectedCountryOption = useMemo(
        () => countryOptions.find((option) => option.value === form.address.countryCode) ?? null,
        [countryOptions, form.address.countryCode],
    );

    const cities = form.address.countryCode
        ? (City.getCitiesOfCountry(form.address.countryCode) ?? [])
        : [];
    const cityOptions = useMemo(
        () => cities.map((c) => ({ value: c.name, label: c.name })),
        [cities],
    );
    const selectedCityOption = useMemo(
        () => cityOptions.find((option) => option.value === form.address.city) ?? null,
        [cityOptions, form.address.city],
    );

    useEffect(() => {
        updateAddress("city", "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.address.countryCode]);

    useEffect(() => {
        if (authLoading) return;
        if (!user || (user && user?.isOnboardingCompleted)) {
            router.replace(`/${locale}`);
            return;
        }
        if (hasPrefilled) return;

        if (typeof user?.firstName === "string" && user?.firstName.trim()) {
            updateField("firstName", user.firstName);
        }
        if (typeof user?.lastName === "string" && user?.lastName.trim()) {
            updateField("lastName", user.lastName);
        }
        if (typeof user?.email === "string" && user?.email.trim()) {
            updateField("email", user?.email);
        }
        if (typeof user?.mobileNumber === "string" && user?.mobileNumber.trim()) {
            updateField("mobile", user?.mobileNumber);
        }

        const dobParsed = parseMaybeDate(user?.date_of_birth);
        if (dobParsed) updateField("dob", dobParsed);

        if (typeof user?.gender === "string" && user?.gender.trim()) {
            const normalized = user?.gender.trim().toLowerCase();
            if (normalized === "male") updateField("gender", "Male");
            else if (normalized === "female") updateField("gender", "Female");
            else updateField("gender", user.gender);
        }

        if (typeof user?.nationality === "string" && user?.nationality.trim()) {
            const nat = user?.nationality.trim();
            const match =
                allCountries.find((c) => c.isoCode.toLowerCase() === nat.toLowerCase()) ??
                allCountries.find((c) => c.name.toLowerCase() === nat.toLowerCase());
            if (match) updateField("nationalityCode", match.isoCode);
        }

        if (typeof user?.address_1 === "string") updateAddress("line1", user?.address_1);
        if (typeof user?.address_city === "string") updateAddress("city", user?.address_city);
        if (typeof user?.address_zip === "string") updateAddress("zip", user?.address_zip);

        if (typeof user?.address_country === "string" && user?.address_country.trim()) {
            const ac = user?.address_country.trim();
            const match =
                allCountries.find((c) => c.isoCode.toLowerCase() === ac.toLowerCase()) ??
                allCountries.find((c) => c.name.toLowerCase() === ac.toLowerCase());
            if (match) updateAddress("countryCode", match.isoCode);
        }

        setHasPrefilled(true);
    }, [allCountries, authLoading, hasPrefilled, locale, router, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const redirect = searchParams.get("redirect");
        setIsSaving(true);
        const nationalityLabel =
            nationalityByIso.get(form.nationalityCode) ??
            allCountries.find((c) => c.isoCode === form.nationalityCode)?.name ??
            "";
        const countryLabel =
            allCountries.find((c) => c.isoCode === form.address.countryCode)?.name ??
            form.address.countryCode;

        try {
            const body = {
                title: form.title,
                firstName: form.firstName,
                lastName: form.lastName,
                nationality: nationalityLabel,
                dob: form.dob ? formatDateYYYYMMDD(form.dob) : "",
                gender: form.gender,
                email: form.email,
                isNewsLetterSubscribed: isNewsLetterSubscribed,
                isOnboardingCompleted: true,
                mobileNumber: form.mobile,
                address: form.address.line1,
                country: countryLabel,
                city: form.address.city,
                zipCode: form.address.zip,
            };
            if (isNewsLetterSubscribed) {
                try {
                  const result = await subscribeWebsiteApi(form.email);
                  if (!result.ok) {
                    toast.error(result.error ?? "Something went wrong");
                  }
                } catch (err) {
                    console.error(err);
                    toast.error("Failed to subscribe to newsletter");
                }
            }
            const res = await updateCustomer(user?.id as string, body);
            if (res.ok && res?.data?.data) {
                setUser(res?.data?.data as EmaarPassUserProfile ?? user);
                toast.success("Profile updated successfully");
                if (redirect) {
                    router.push(redirect);
                } else {
                    router.push(`/${locale}/my-account`);
                }
            } else {
                toast.error("Failed to update profile");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading || !user) {
        return <div className="min-h-screen bg-linear-to-b from-[#000000] via-[#0a0405] to-[#792327] pt-20 pb-16 font-montserrat text-white selection:bg-white/20 sm:pt-24 md:pt-28"  >
            <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
                <div className="flex items-center justify-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
            </div>
        </div>;
    }

    return (
        <main className="min-h-screen bg-linear-to-b from-[#000000] via-[#0a0405] to-[#792327] pt-20 pb-16 font-montserrat text-white selection:bg-white/20 sm:pt-24 md:pt-28">
            <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
                <h1 className="mb-8 text-center font-optima text-[26px] font-normal leading-tight text-white sm:mb-10 sm:text-[30px] md:text-[34px]">
                    Continue Register
                </h1>
                <form onSubmit={handleSubmit} className="flex flex-col gap-8 sm:gap-10">
                    <div className="rounded-[20px] border border-[#2b2b2b] bg-[#1E1E1E] p-5 shadow-[0_18px_46px_rgba(0,0,0,0.35)] sm:p-6 md:p-8">
                        {/* Personal Information */}
                        <section className="space-y-5">
                            <h2 className="font-montserrat text-[18px] font-medium text-white md:text-[20px]">
                                Personal Information
                            </h2>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-4">
                                <div className="md:col-span-2">
                                    <label className={labelClass}>Title</label>
                                    <Select
                                        instanceId="onboarding-title-select"
                                        options={titleOptions}
                                        value={selectedTitleOption}
                                        placeholder="Select"
                                        onChange={(selected: SingleValue<SelectOption>) => {
                                            updateField("title", selected?.value ?? "");
                                        }}
                                        styles={buildSelectStyles(Boolean(errors.title))}
                                        isSearchable={false}
                                        menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
                                    />
                                    {errors.title && (
                                        <p className="mt-1 text-[12px] text-red-400">{errors.title}</p>
                                    )}
                                </div>

                                <div className="md:col-span-5">
                                    <label className={labelClass}>First Name</label>
                                    <input
                                        type="text"
                                        value={form.firstName}
                                        onChange={(e) => {
                                            updateField("firstName", e.target.value);
                                        }}
                                        className={`${inputClass} ${errors.firstName ? "border-red-500/70" : ""}`}
                                    />
                                    {errors.firstName && (
                                        <p className="mt-1 text-[12px] text-red-400">{errors.firstName}</p>
                                    )}
                                </div>

                                <div className="md:col-span-5">
                                    <label className={labelClass}>Last Name</label>
                                    <input
                                        type="text"
                                        value={form.lastName}
                                        onChange={(e) => {
                                            updateField("lastName", e.target.value);
                                        }}
                                        className={`${inputClass} ${errors.lastName ? "border-red-500/70" : ""}`}
                                    />
                                    {errors.lastName && (
                                        <p className="mt-1 text-[12px] text-red-400">{errors.lastName}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4">
                                <div className="w-full min-w-0">
                                    <label className={labelClass}>Nationality</label>
                                    <Select
                                        instanceId="onboarding-nationality-select"
                                        options={nationalityOptions}
                                        value={selectedNationalityOption}
                                        placeholder="Select nationality"
                                        onChange={(selected: SingleValue<SelectOption>) => {
                                            updateField("nationalityCode", selected?.value ?? "");
                                            setErrors((prev) => ({ ...prev, nationality: "" }));
                                        }}
                                        isSearchable
                                        menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
                                        styles={buildSelectStyles(Boolean(errors.nationality))}
                                    />
                                    {errors.nationality && (
                                        <p className="mt-1 text-[12px] text-red-400">{errors.nationality}</p>
                                    )}
                                </div>

                                <div className="w-full min-w-0">
                                    <DatePickerField
                                        value={form.dob}
                                        onChange={(date) => {
                                            updateField("dob", date);
                                        }}
                                        error={errors.dob}
                                        labelClassName={labelClass}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 pt-1">
                                <h3 className="font-montserrat text-[15px] font-medium text-white md:text-[16px]">
                                    Select Gender
                                </h3>
                                <div className="flex flex-wrap items-center gap-6 sm:gap-8">
                                    {["Male", "Female"].map((g) => (
                                        <label key={g} className="group flex cursor-pointer items-center gap-2.5">
                                            <div
                                                onClick={() => {
                                                    updateField("gender", g);
                                                }}
                                                className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 transition-colors ${form.gender === g ? "border-primary-light" : "border-white/50"}`}
                                            >
                                                {form.gender === g && (
                                                    <div className="h-[9px] w-[9px] rounded-full bg-[#792327]" />
                                                )}
                                            </div>
                                            <input
                                                type="radio"
                                                name="gender"
                                                value={g}
                                                className="hidden"
                                                checked={form.gender === g}
                                                onChange={(e) => {
                                                    updateField("gender", e.target.value);
                                                }}
                                            />
                                            <span className="text-[14px] text-white/90 transition-colors group-hover:text-white">
                                                {g}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                {errors.gender && (
                                    <p className="text-[12px] text-red-400">{errors.gender}</p>
                                )}
                            </div>
                        </section>

                        <div className="my-8 border-t border-[#3a3a3a] sm:my-10" aria-hidden="true" />

                        {/* Contact details */}
                        <section className="space-y-4">
                            <h2 className="font-montserrat text-[18px] font-medium text-white md:text-[20px]">
                                Contact details
                            </h2>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4">
                                <div className="w-full min-w-0">
                                    <label className={labelClass}>Email Address</label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        disabled
                                        onChange={(e) => {
                                            updateField("email", e.target.value);
                                        }}
                                        className={`${inputClass} ${errors.email ? "border-red-500/70" : ""}`}
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-[12px] text-red-400">{errors.email}</p>
                                    )}
                                </div>

                                <div className="w-full min-w-0">
                                    <PhoneInputField
                                        value={form.mobile}
                                        disabled
                                        onChange={(v) => {
                                            updateField("mobile", v);
                                            setErrors((p) => ({ ...p, mobile: "" }));
                                        }}
                                        error={errors.mobile}
                                        label="Mobile Number"
                                        variant="login"
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer group select-none">
                                <div className={`h-4 w-4 rounded-[4px] border flex items-center justify-center transition-colors ${isNewsLetterSubscribed ? "border-[#792327] bg-[#792327]" : "border-white/40 bg-transparent group-hover:border-white/70"}`}>
                                {isNewsLetterSubscribed && (
                                        <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    )}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={isNewsLetterSubscribed}
                                    onChange={(e) => {
                                        setIsNewsLetterSubscribed(e.target.checked);
                                    }}
                                />
                                <span className="font-montserrat text-[12px] font-normal leading-[100%] tracking-[0] text-white/75 group-hover:text-white transition-colors">Subscribe to newsletter</span>
                            </label>

                            <div className="flex gap-3 rounded-[10px] bg-[#2a2a2a] p-4 sm:p-5">
                                <Info
                                    className="mt-0.5 h-5 w-5 shrink-0 text-white/90"
                                    strokeWidth={2}
                                />
                                <div>
                                    <p className="mb-1 font-montserrat text-[13px] font-bold text-white sm:text-[14px]">
                                        Information Update
                                    </p>
                                    <p className="font-montserrat text-[12px] leading-relaxed text-white/90 sm:text-[13px]">
                                        Your personal details are protected at all times. To update this
                                        information, please write to us at{" "}
                                        <a
                                            href="mailto:customerservice@ubyemaar.com"
                                            className="underline decoration-white/80 underline-offset-2 transition-colors hover:text-white"
                                        >
                                            customerservice@ubyemaar.com
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </section>

                        <div className="my-8 border-t border-[#3a3a3a] sm:my-10" aria-hidden="true" />

                        {/* Address Details */}
                        <section className="space-y-4">
                            <h2 className="font-montserrat text-[18px] font-medium text-white md:text-[20px]">
                                Address Details
                            </h2>

                            <div>
                                <label className={labelClass}>Address</label>
                                <input
                                    type="text"
                                    placeholder="Full Address"
                                    value={form.address.line1}
                                    onChange={(e) => updateAddress("line1", e.target.value)}
                                    className={inputClass}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-4">
                                <div>
                                    <label className={labelClass}>Country</label>
                                    <Select
                                        instanceId="onboarding-country-select"
                                        options={countryOptions}
                                        value={selectedCountryOption}
                                        placeholder="Select country"
                                        onChange={(selected: SingleValue<SelectOption>) => {
                                            updateAddress("countryCode", selected?.value ?? "");
                                        }}
                                        isSearchable
                                        menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
                                        styles={buildSelectStyles()}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>City</label>
                                    <Select
                                        instanceId="onboarding-city-select"
                                        options={cityOptions}
                                        value={selectedCityOption}
                                        placeholder={
                                            form.address.countryCode ? "Select city" : "Select country first"
                                        }
                                        onChange={(selected: SingleValue<SelectOption>) => {
                                            updateAddress("city", selected?.value ?? "");
                                        }}
                                        isSearchable
                                        isDisabled={!form.address.countryCode || cityOptions.length === 0}
                                        menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
                                        styles={buildSelectStyles()}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Zip Code/Postal code</label>
                                    <input
                                        type="text"
                                        placeholder="12345"
                                        value={form.address.zip}
                                        onChange={(e) => updateAddress("zip", e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Actions — below card, full width on mobile */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
                        <button
                            type="button"
                            onClick={() => router.push(`/${locale}`)}
                            className="h-12 w-full rounded-[10px] border border-[#792327] bg-[#1E1E1E]/80 font-montserrat text-[15px] font-medium text-white transition-colors hover:bg-[#2a2a2a] sm:h-[52px] sm:min-w-[200px] sm:max-w-[280px] sm:flex-1"
                        >
                            Back to Home page
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving || authLoading}
                            className="h-12 w-full rounded-[10px] bg-[#792327] font-montserrat text-[15px] font-semibold text-white transition-colors hover:bg-[#792327]/90 sm:h-[52px] sm:min-w-[200px] sm:max-w-[280px] sm:flex-1"
                        >
                            {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
