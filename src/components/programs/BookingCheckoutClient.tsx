"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Country as CSCCountry } from "country-state-city";
import worldCountries from "world-countries";
import { SelectedAddonDetail } from "@/components/programs/BookingTicketPanel";
import { BOOKING_ADDON_ITEMS } from "@/components/programs/bookingConstants";
import {
  useExternalEventBookingState,
  type ReservationSummary,
} from "@/contexts/program-event/ExternalEventDetailsContext";
import { resolveReservationSummary } from "@/components/programs/bookingSeatReservationUtils";
import { getExternalEventReservationbyId } from "@/services/externalEventReservationClient";
import PersonalInformation from "./PersonalInformation";
import ShippingInformationSection, { ShippingFormState } from "@/components/shop/ShippingInformationSection";
import {
  parseDobDate,
  // toDisplayDobDate,
  normalizeDobValue,
  NAME_VALIDATION_REGEX,
  CITY_VALIDATION_REGEX,
  EMAIL_VALIDATION_REGEX,
  isProgramBookingDobAllowed,
  MIN_PROGRAM_BOOKING_AGE_YEARS,
} from "@/helpers/programs-booking/formHelpers";
import { getCustomerByEmaarId } from "@/services/websiteServer";
import { useAuth } from "@/contexts/auth/AuthContext";
import { toast } from "sonner";
interface BookingCheckoutClientProps {
  eventTitle: string;
  summaryImageSrc?: string;
  summaryDateTime?: string;
  backHref: string;
  selectedAddons: SelectedAddonDetail[];
}

export type DetailsFormState = {
  firstName: string;
  lastName: string;
  nationality: string;
  dateOfBirth: string;
  gender: "male" | "female" | "";
  email: string;
  mobileNumber: string;
  country: string;
  city: string;
  acceptedTerms: boolean;
  receiveCourier: boolean;
};

const defaultState: DetailsFormState = {
  firstName: "",
  lastName: "",
  nationality: "",
  dateOfBirth: "",
  gender: "",
  email: "",
  mobileNumber: "",
  country: "",
  city: "",
  acceptedTerms: false,
  receiveCourier: false,
};

type ApiSelectedAddon = {
  id?: number | string;
  quantity?: number;
  price?: number | string;
  name?: string;
};

export default function BookingCheckoutClient({
  eventTitle,
  summaryImageSrc,
  summaryDateTime,
  backHref,
  selectedAddons,
}: BookingCheckoutClientProps) {



  const {
    reservationId,
    selectedSeatLabels: contextSelectedSeatLabels,
    selectedAddons: contextSelectedAddons,
    customer,
    setSelectedAddons,
    setCustomer,
    shipping,
    setShipping,
    setReservationSummary,
    visitTickets,
    setVisitTickets,
    requestCheckoutSubmit,
  } = useExternalEventBookingState();

  const effectiveSelectedAddons = contextSelectedAddons.length > 0 ? contextSelectedAddons : selectedAddons;

  const [addonQuantities, setAddonQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(effectiveSelectedAddons.map((addon) => [addon.id, addon.quantity])),
  );

  const addonMetaById = useMemo(() => {
    const map = new Map<string, { label: string; price: string }>();
    for (const a of effectiveSelectedAddons) {
      map.set(a.id, { label: a.label || "", price: String(a.price ?? "0") });
    }
    return map;
  }, [effectiveSelectedAddons]);
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const [hasPrefilledFromAuth, setHasPrefilledFromAuth] = useState(false);
  const [hasPrefilledFromCustomer, setHasPrefilledFromCustomer] = useState(false);
   const [form, setForm] = useState<DetailsFormState>(defaultState);
  const [shippingForm, setShippingForm] = useState<ShippingFormState>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    streetAddress: "",
    city: "",
    emirate: "",
    postalCode: "",
    saveAddress: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof DetailsFormState, string>>>({});
  const [shippingErrors, setShippingErrors] = useState<Partial<Record<keyof ShippingFormState, string>>>({});
  const [showCourierOption, setShowCourierOption] = useState(false);
  const [courierPrice, setCourierPrice] = useState<number | null>(null);

  useEffect(() => {
    if (String(reservationId).trim().length === 0) return;

    let cancelled = false;
    void (async () => {
      try {
        const res = await getExternalEventReservationbyId(reservationId);
        if (cancelled) return;

        const data = (res as { data?: Record<string, unknown> })?.data;
        if (!data) return;

        setShowCourierOption(data.show_courier_addon === true);
        const price = Number(data.courier_price);
        if (Number.isFinite(price)) setCourierPrice(price);

        const mergedSummary = resolveReservationSummary(data);
        if (mergedSummary) {
          setReservationSummary(mergedSummary as ReservationSummary);
        }
      } catch {
        // Checkout still works without courier option.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reservationId, setReservationSummary]);

  useEffect(() => {
    if (authLoading) return;
    if (user?.emmarId) return;
    void refreshUser().catch(() => {
      // Keep checkout usable even if auth refresh fails.
    });
  }, [authLoading, refreshUser, user?.emmarId]);

  const allCountries = useMemo(() => CSCCountry.getAllCountries(), []);
  const nationalityByIso = useMemo(
    () =>
      new Map(
        worldCountries.map((country) => [
          country.cca2.toUpperCase(),
          (country.demonyms?.eng?.m ?? country.demonyms?.eng?.f ?? country.name.common).trim(),
        ]),
      ),
    [],
  );

  const resolveCountryName = useCallback(
    (value: string) => {
      const raw = String(value ?? "").trim();
      if (!raw) return "";
      const byIso = allCountries.find((country) => country.isoCode.toLowerCase() === raw.toLowerCase());
      if (byIso) return byIso.name;
      const byName = allCountries.find((country) => country.name.toLowerCase() === raw.toLowerCase());
      return byName?.name ?? raw;
    },
    [allCountries],
  );

  const resolveNationality = useCallback(
    (value: string) => {
      const raw = String(value ?? "").trim();
      if (!raw) return "";
      const upperRaw = raw.toUpperCase();
      const byIso = nationalityByIso.get(upperRaw);
      if (byIso) return byIso;

      const matched = worldCountries.find((country) => {
        const demonym = (
          country.demonyms?.eng?.m ??
          country.demonyms?.eng?.f ??
          country.name.common
        ).trim();
        return (
          country.name.common.toLowerCase() === raw.toLowerCase() ||
          demonym.toLowerCase() === raw.toLowerCase()
        );
      });
      if (!matched) return raw;
      return (
        matched.demonyms?.eng?.m ??
        matched.demonyms?.eng?.f ??
        matched.name.common
      ).trim();
    },
    [nationalityByIso],
  );

  useEffect(() => {
    if (authLoading || !user || hasPrefilledFromAuth) return;
    const firstName = typeof user.first_name === "string" ? user.first_name.trim() : "";
    const lastName = typeof user.last_name === "string" ? user.last_name.trim() : "";
    const email = typeof user.email === "string" ? user.email.trim() : "";
    const mobile =
      typeof user.phone_number === "string"
        ? user.phone_number.trim()
        : typeof (user as any).number === "string"
        ? (user as any).number.trim()
        : "";
    const nationalityRaw =
      typeof (user as any).nationality === "string" ? String((user as any).nationality).trim() : "";
    const countryRaw = typeof (user as any).country === "string" ? String((user as any).country).trim() : "";
    const city = typeof (user as any).city === "string" ? String((user as any).city).trim() : "";
    const rawDobValue = (user as any)?.dob || (user as any)?.date_of_birth;
    const dobRaw =
      rawDobValue instanceof Date
        ? rawDobValue.toISOString()
        : typeof rawDobValue === "string"
          ? rawDobValue.trim()
          : "";
    const normalizedNationality = resolveNationality(nationalityRaw);
    const normalizedCountry = resolveCountryName(countryRaw);
    const normalizedDob = normalizeDobValue(dobRaw);
    const normalizedGender = (() => {
      const raw = typeof (user as any).gender === "string" ? String((user as any).gender).trim().toLowerCase() : "";
      if (raw === "male" || raw === "m") return "male";
      if (raw === "female" || raw === "f") return "female";
      return "";
    })();

    setForm((prev) => ({
      ...prev,
      firstName: prev.firstName || firstName,
      lastName: prev.lastName || lastName,
      email: prev.email || email,
      mobileNumber: prev.mobileNumber || mobile,
      nationality: prev.nationality || normalizedNationality,
      country: prev.country || normalizedCountry,
      city: prev.city || city,
      dateOfBirth: prev.dateOfBirth || normalizedDob,
      gender: prev.gender || (normalizedGender as DetailsFormState["gender"]),
    }));
    setHasPrefilledFromAuth(true);
  }, [authLoading, user, hasPrefilledFromAuth, resolveCountryName, resolveNationality]);

  useEffect(() => {
    if (authLoading || !user?.emmarId || hasPrefilledFromCustomer) return;

    let isActive = true;
    void (async () => {
      try {
        const res = await getCustomerByEmaarId(String(user.emmarId));
        if (!isActive || !("data" in res) || !res.data) return;

        const customer = res.data;
        const mobile =
          typeof customer.mobileNumber === "string"
            ? customer.mobileNumber.trim()
            : typeof (customer as any).phone_number === "string"
              ? String((customer as any).phone_number).trim()
              : "";
        const normalizedGender = (() => {
          const raw = typeof customer.gender === "string" ? customer.gender.trim().toLowerCase() : "";
          if (raw === "male" || raw === "m") return "male";
          if (raw === "female" || raw === "f") return "female";
          return "";
        })();
        const normalizedNationality = resolveNationality(String(customer.nationality ?? "").trim());
        const normalizedCountry = resolveCountryName(String(customer.country ?? "").trim());
        const normalizedDob = normalizeDobValue(String(customer.dob ?? "").trim());

        setForm((prev) => ({
          ...prev,
          firstName: prev.firstName || (customer.firstName ?? "").trim(),
          lastName: prev.lastName || (customer.lastName ?? "").trim(),
          email: prev.email || (customer.email ?? "").trim(),
          mobileNumber: prev.mobileNumber || mobile,
          nationality: prev.nationality || normalizedNationality,
          dateOfBirth: prev.dateOfBirth || normalizedDob,
          gender: prev.gender || (normalizedGender as DetailsFormState["gender"]),
          country: prev.country || normalizedCountry,
          city: prev.city || (customer.city ?? "").trim(),
        }));
      } catch {
        // Keep checkout usable even when profile details cannot be fetched.
      } finally {
        if (isActive) setHasPrefilledFromCustomer(true);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [authLoading, hasPrefilledFromCustomer, user?.emmarId, resolveCountryName, resolveNationality]);

  const countryOptions = useMemo(
    () => allCountries.map((country) => ({ value: country.name, label: country.name })),
    [allCountries]
  );

  const today = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    return now;
  }, []);

  const courierFeeLabel =
    showCourierOption && courierPrice != null ? `AED ${courierPrice}` : null;

  useEffect(() => {
    if (showCourierOption) return;
    setForm((prev) => (prev.receiveCourier ? { ...prev, receiveCourier: false } : prev));
    setShipping({ receiveCourier: false });
  }, [setShipping, showCourierOption]);

  const validate = useCallback(() => {
    const nextErrors: Partial<Record<keyof DetailsFormState, string>> = {};
    const nextShippingErrors: Partial<Record<keyof ShippingFormState, string>> = {};

    if (!form.firstName.trim()) nextErrors.firstName = "First name is required.";
    else if (!NAME_VALIDATION_REGEX.test(form.firstName.trim())) nextErrors.firstName = "Use letters only.";

    if (!form.lastName.trim()) nextErrors.lastName = "Last name is required.";
    else if (!NAME_VALIDATION_REGEX.test(form.lastName.trim())) nextErrors.lastName = "Use letters only.";

    if (!form.nationality.trim()) nextErrors.nationality = "Nationality is required.";

    // Date of birth: must be real, not in the future, and age 12+ (under-12 cannot book).
    const dobText = form.dateOfBirth.trim();
    if (!dobText) {
      nextErrors.dateOfBirth = "Date of birth is required.";
    } else {
      const parsedDob = parseDobDate(dobText);
      if (!parsedDob) {
        nextErrors.dateOfBirth = "Enter a valid date.";
      } else if (parsedDob.getTime() > today.getTime()) {
        nextErrors.dateOfBirth = "Cannot be in the future.";
      } else if (!isProgramBookingDobAllowed(parsedDob, today)) {
        nextErrors.dateOfBirth = `Only guests aged ${MIN_PROGRAM_BOOKING_AGE_YEARS} and older can book. Please choose a valid date of birth.`;
      }
    }

    if (!form.gender) nextErrors.gender = "Required.";

    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!EMAIL_VALIDATION_REGEX.test(form.email.trim())) {
      nextErrors.email = "Invalid email.";
    }

    if (!form.mobileNumber.trim()) {
      nextErrors.mobileNumber = "Mobile is required.";
    } else if (!/^\+\d{8,15}$/.test(form.mobileNumber.trim())) {
      nextErrors.mobileNumber = "Invalid mobile.";
    }

    if (!form.country.trim()) nextErrors.country = "Required.";
    if (!form.city.trim()) {
      nextErrors.city = "City is required.";
    } else if (!CITY_VALIDATION_REGEX.test(form.city.trim())) {
      nextErrors.city = "Letters only.";
    }

    if (!form.acceptedTerms) nextErrors.acceptedTerms = "Accept terms.";

    if (form.receiveCourier) {
      if (!shippingForm.firstName.trim()) nextShippingErrors.firstName = "Required.";
      if (!shippingForm.lastName.trim()) nextShippingErrors.lastName = "Required.";
      if (!shippingForm.email.trim()) nextShippingErrors.email = "Required.";
      if (!shippingForm.phone.trim()) nextShippingErrors.phone = "Required.";
      if (!shippingForm.streetAddress.trim()) nextShippingErrors.streetAddress = "Required.";
      if (!shippingForm.city.trim()) nextShippingErrors.city = "Required.";
      if (!shippingForm.emirate.trim()) nextShippingErrors.emirate = "Required.";
    }

    setErrors(nextErrors);
    setShippingErrors(nextShippingErrors);
    return Object.keys(nextErrors).length === 0 && Object.keys(nextShippingErrors).length === 0;
  }, [form, shippingForm, today]);

  const proceedToPayment = useCallback(() => {
    const customerPayload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      mobile: form.mobileNumber.trim(),
      country: form.country.trim(),
      city: form.city.trim(),
      nationality: form.nationality.trim(),
      dateOfBirth: form.dateOfBirth.trim(),
      gender: form.gender,
      acceptedTerms: form.acceptedTerms,
      receiveCourier: form.receiveCourier,
    };
    const shippingPayload = {
      receiveCourier: form.receiveCourier,
      firstName: shippingForm.firstName.trim(),
      lastName: shippingForm.lastName.trim(),
      email: shippingForm.email.trim(),
      phone: shippingForm.phone.trim(),
      streetAddress: shippingForm.streetAddress.trim(),
      city: shippingForm.city.trim(),
      emirate: shippingForm.emirate.trim(),
      postalCode: shippingForm.postalCode.trim(),
      saveAddress: shippingForm.saveAddress,
    };

    if (!validate()) {
      console.log("Checkout validation failed. Current form values:", {
        customerPayload,
        shippingPayload,
      });
      return {
        isValid: false,
        customerPayload,
        shippingPayload,
      };
    }

    console.log("Checkout -> Payment payload:", {
      customerPayload,
      shippingPayload,
    });

    if (String(reservationId).trim().length === 0) {
      toast.error("Reservation expired or missing. Please review seats and addons again.");
      return {
        isValid: false,
        customerPayload,
        shippingPayload,
      };
    }

    setCustomer(customerPayload);
    setShipping(shippingPayload);
    return {
      isValid: true,
      customerPayload,
      shippingPayload,
    };
  }, [
    form,
    reservationId,
    shippingForm,
    setCustomer,
    setShipping,
    validate,
  ]);

  useEffect(() => {
    requestCheckoutSubmit.current = proceedToPayment;
    return () => {
      requestCheckoutSubmit.current = null;
    };
  }, [proceedToPayment, requestCheckoutSubmit]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    proceedToPayment();
  };

  const mutableSelectedAddons = useMemo(
    () =>
      Object.entries(addonQuantities)
        .filter(([, quantity]) => quantity > 0)
        .map(([id, quantity]) => {
          const fromContext = addonMetaById.get(id);
          const matched = BOOKING_ADDON_ITEMS.find((item) => item.id === id);
          return {
            id,
            quantity,
            label: (fromContext?.label && String(fromContext.label).trim()) || matched?.title || "",
            price:
              fromContext?.price != null
                ? String(fromContext.price)
                : matched?.price != null
                  ? String(matched.price)
                  : "0",
          };
        }),
    [addonQuantities, addonMetaById],
  );

  useEffect(() => {
    if (effectiveSelectedAddons.length === 0) return;
    if (Object.keys(addonQuantities).length > 0) return;
    setAddonQuantities(Object.fromEntries(effectiveSelectedAddons.map((addon) => [addon.id, addon.quantity])));
  }, [addonQuantities, effectiveSelectedAddons]);

  const contextSelectedAddonsRef = useRef(contextSelectedAddons);
  useEffect(() => {
    contextSelectedAddonsRef.current = contextSelectedAddons;
  }, [contextSelectedAddons]);

  useEffect(() => {
    const current = contextSelectedAddonsRef.current;
    // Prevent wiping hydrated API add-ons during initial mount:
    // context may already have addons while local addonQuantities is still empty.
    if (Object.keys(addonQuantities).length === 0 && current.length > 0) {
      return;
    }
    const currentById = new Map(current.map((addon) => [addon.id, addon]));
    const next = mutableSelectedAddons.map((addon) => {
      const currentAddon = currentById.get(addon.id);
      const safeLabel =
        String(addon.label ?? "").trim() ||
        String(currentAddon?.label ?? "").trim() ||
        `Add-on ${addon.id}`;
      return {
        ...addon,
        label: safeLabel,
      };
    });
    if (current.length === next.length) {
      const byId = new Map(current.map((a) => [a.id, a]));
      let same = true;
      for (const n of next) {
        const c = byId.get(n.id);
        if (!c) { same = false; break; }
        if (c.quantity !== n.quantity) { same = false; break; }
        if (String(c.price ?? "") !== String(n.price ?? "")) { same = false; break; }
        if (String(c.label ?? "") !== String(n.label ?? "")) { same = false; break; }
      }
      if (same) return;
    }
    setSelectedAddons(next);
  }, [addonQuantities, mutableSelectedAddons, setSelectedAddons]);

  useEffect(() => {
    if (!customer.firstName && !customer.lastName && !customer.email && !customer.mobile && !customer.country && !customer.city) {
      return;
    }
    setForm((prev) => ({
      ...prev,
      firstName: prev.firstName || customer.firstName,
      lastName: prev.lastName || customer.lastName,
      email: prev.email || customer.email,
      mobileNumber: prev.mobileNumber || customer.mobile,
      country: prev.country || customer.country,
      city: prev.city || customer.city,
      nationality: prev.nationality || customer.nationality,
      dateOfBirth: prev.dateOfBirth || customer.dateOfBirth,
      gender: prev.gender || (customer.gender as any) || "",
      acceptedTerms: prev.acceptedTerms || customer.acceptedTerms,
      receiveCourier: prev.receiveCourier || customer.receiveCourier,
    }));
  }, [customer]);

  useEffect(() => {
    if (!shipping.receiveCourier) return;
    setForm((prev) => ({ ...prev, receiveCourier: true }));
    setShippingForm((prev) => ({
      ...prev,
      firstName: prev.firstName || shipping.firstName,
      lastName: prev.lastName || shipping.lastName,
      email: prev.email || shipping.email,
      phone: prev.phone || shipping.phone,
      streetAddress: prev.streetAddress || shipping.streetAddress,
      city: prev.city || shipping.city,
      emirate: prev.emirate || shipping.emirate,
      postalCode: prev.postalCode || shipping.postalCode,
      saveAddress: prev.saveAddress || shipping.saveAddress,
    }));
  }, [shipping]);

  /**
   * Prefill shipping from personal details when courier is enabled.
   * Names copy only while empty so shipping can differ from the profile name.
   * Email and phone always mirror personal info (read-only in shipping UI).
   */
  useEffect(() => {
    if (!form.receiveCourier) return;
    setShippingForm((prev) => ({
      ...prev,
      firstName: prev.firstName || form.firstName,
      lastName: prev.lastName || form.lastName,
      email: form.email,
      phone: form.mobileNumber,
    }));
    setShippingErrors((prev) => {
      const next = { ...prev };
      delete next.email;
      delete next.phone;
      return next;
    });
  }, [form.receiveCourier, form.firstName, form.lastName, form.email, form.mobileNumber]);



  return (
    <div>
      <div className="mt-6 flex items-center justify-between gap-4 mb-4">
        <h1 className="font-optima text-[30px] leading-[36px] lg:text-[44px]">Complete your Booking</h1>
      </div>

      <div className="">
        <div className="w-full space-y-6">
          <form onSubmit={handleSubmit} className="w-full">
            <PersonalInformation
              form={form}
              errors={errors}
              onChange={(patch) => {
                setForm((prev) => ({ ...prev, ...patch }));
                if ("receiveCourier" in patch) {
                  setShipping({ receiveCourier: Boolean(patch.receiveCourier) });
                  setCustomer({ receiveCourier: Boolean(patch.receiveCourier) });
                }
                setErrors((prev) => {
                  const next = { ...prev };
                  for (const key of Object.keys(patch) as Array<keyof DetailsFormState>) {
                    delete next[key];
                  }
                  return next;
                });
              }}
              today={today}
              showCourierOption={showCourierOption}
              courierFeeLabel={courierFeeLabel}
            />
          </form>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${form.receiveCourier
              ? "max-h-[1400px] opacity-100 translate-y-0"
              : "max-h-0 opacity-0 -translate-y-1 pointer-events-none"
              }`}
          >
            <ShippingInformationSection
              value={shippingForm}
              errors={shippingErrors}
              onChange={(patch) => {
                setShippingForm((prev) => ({ ...prev, ...patch }));
                setShippingErrors((prev) => {
                  const next = { ...prev };
                  for (const key of Object.keys(patch) as Array<keyof ShippingFormState>) {
                    delete next[key];
                  }
                  return next;
                });
              }}
            />
          </div>
        </div>

      </div>

    </div>
  );
}
