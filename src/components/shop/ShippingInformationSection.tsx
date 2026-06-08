"use client";

import { MapPin, Package } from "lucide-react";

export type ShippingFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  streetAddress: string;
  city: string;
  emirate: string;
  postalCode: string;
  saveAddress: boolean;
};


export const COURIER_ADDON_ID = 99;

export function courierFullDetails(shipping: ShippingFormState) {
  return {
    first_name: shipping.firstName.trim(),
    last_name: shipping.lastName.trim(),
    email: shipping.email.trim(),
    phone: shipping.phone.trim(),
    street_address: shipping.streetAddress.trim(),
    city: shipping.city.trim(),
    emirate: shipping.emirate.trim(),
    postal_code: shipping.postalCode.trim(),
    save_address: shipping.saveAddress,
  };
}

export function courierAddonItem() {
  return { id: COURIER_ADDON_ID, quantity: 1 };
}

type ShippingInformationSectionProps = {
  value: ShippingFormState;
  errors: Partial<Record<keyof ShippingFormState, string>>;
  onChange: (patch: Partial<ShippingFormState>) => void;
};

function sanitizeNameInput(value: string): string {
  return value.replace(/[^A-Za-z\s'-]/g, "");
}

function sanitizeCityInput(value: string): string {
  return value.replace(/[^A-Za-z\s'.-]/g, "");
}

function sanitizePhoneInput(value: string, maxDigits: number): string {
  return value.replace(/\D/g, "").slice(0, maxDigits);
}

export default function ShippingInformationSection({ value, errors, onChange }: ShippingInformationSectionProps) {
  return (
    <section className="w-full rounded-[20px] bg-surface p-5">
      <div className="flex items-center gap-2">
        <Package size={18} className="text-primary-light" />
        <h2 className="font-montserrat text-[18px] leading-[100%] font-semibold text-white">Shipping Information</h2>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block font-montserrat text-[12px] font-semibold text-white">First Name *</label>
          <input
            value={value.firstName}
            onChange={(event) => onChange({ firstName: sanitizeNameInput(event.target.value) })}
            placeholder="First Name"
            className="h-11 w-full rounded-[10px] border border-[#FFFFFF1A] bg-[#151515] px-3 font-montserrat text-[14px] text-white placeholder:text-white/35 focus:outline-none"
          />
          {errors.firstName ? <p className="mt-1 font-montserrat text-[12px] text-[#ff8a8a]">{errors.firstName}</p> : null}
        </div>
        <div>
          <label className="mb-1 block font-montserrat text-[12px] font-semibold text-white">Last Name *</label>
          <input
            value={value.lastName}
            onChange={(event) => onChange({ lastName: sanitizeNameInput(event.target.value) })}
            placeholder="Last Name"
            className="h-11 w-full rounded-[10px] border border-[#FFFFFF1A] bg-[#151515] px-3 font-montserrat text-[14px] text-white placeholder:text-white/35 focus:outline-none"
          />
          {errors.lastName ? <p className="mt-1 font-montserrat text-[12px] text-[#ff8a8a]">{errors.lastName}</p> : null}
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1 block font-montserrat text-[12px] font-semibold text-white">Email Address *</label>
        <input
          value={value.email}
          disabled={true}
          onChange={(event) => onChange({ email: event.target.value.replace(/\s/g, "") })}
          placeholder="your.email@example.com"
          className="h-11 w-full rounded-[10px] border border-[#FFFFFF1A] bg-[#151515] px-3 font-montserrat text-[14px] text-white/70 placeholder:text-white/35 focus:outline-none"
        />
        {errors.email ? <p className="mt-1 font-montserrat text-[12px] text-[#ff8a8a]">{errors.email}</p> : null}
      </div>

      <div className="mt-4">
        <label className="mb-1 block font-montserrat text-[12px] font-semibold text-white">Phone Number *</label>
        <input
          value={value.phone}
          disabled={true}
          onChange={(event) => onChange({ phone: sanitizePhoneInput(event.target.value, 11) })}
          placeholder="+971 50 123 4567"
          className="h-11 w-full rounded-[10px] border border-[#FFFFFF1A] bg-[#151515] px-3 font-montserrat text-[14px] text-white/70 placeholder:text-white/35 focus:outline-none"
        />
        {errors.phone ? <p className="mt-1 font-montserrat text-[12px] text-[#ff8a8a]">{errors.phone}</p> : null}
      </div>

      <div className="mt-5 border-t border-[#FFFFFF1A] pt-5">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-primary-light" />
          <h3 className="font-montserrat text-[18px] leading-[100%] font-semibold text-white">Delivery Address</h3>
        </div>

        <div className="mt-4">
          <label className="mb-1 block font-montserrat text-[12px] font-semibold text-white">Street Address *</label>
          <input
            value={value.streetAddress}
            onChange={(event) => onChange({ streetAddress: event.target.value })}
            placeholder="Street address"
            className="h-11 w-full rounded-[10px] border border-[#FFFFFF1A] bg-[#151515] px-3 font-montserrat text-[14px] text-white placeholder:text-white/35 focus:outline-none"
          />
          {errors.streetAddress ? (
            <p className="mt-1 font-montserrat text-[12px] text-[#ff8a8a]">{errors.streetAddress}</p>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block font-montserrat text-[12px] font-semibold text-white">City *</label>
            <input
              value={value.city}
              onChange={(event) => onChange({ city: sanitizeCityInput(event.target.value) })}
              placeholder="City"
              className="h-11 w-full rounded-[10px] border border-[#FFFFFF1A] bg-[#151515] px-3 font-montserrat text-[14px] text-white placeholder:text-white/35 focus:outline-none"
            />
            {errors.city ? <p className="mt-1 font-montserrat text-[12px] text-[#ff8a8a]">{errors.city}</p> : null}
          </div>
          <div>
            <label className="mb-1 block font-montserrat text-[12px] font-semibold text-white">Emirate *</label>
            <input
              value={value.emirate}
              onChange={(event) => onChange({ emirate: sanitizeCityInput(event.target.value) })}
              placeholder="Emirate"
              className="h-11 w-full rounded-[10px] border border-[#FFFFFF1A] bg-[#151515] px-3 font-montserrat text-[14px] text-white placeholder:text-white/35 focus:outline-none"
            />
            {errors.emirate ? <p className="mt-1 font-montserrat text-[12px] text-[#ff8a8a]">{errors.emirate}</p> : null}
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1 block font-montserrat text-[12px] font-semibold text-white">Postal Code</label>
          <input
            value={value.postalCode}
            onChange={(event) => onChange({ postalCode: event.target.value.replace(/\D/g, "").slice(0, 6) })}
            placeholder="Postal Code (optional)"
            className="h-11 w-full rounded-[10px] border border-[#FFFFFF1A] bg-[#151515] px-3 font-montserrat text-[14px] text-white placeholder:text-white/35 focus:outline-none"
          />
        </div>

        <label className="mt-4 inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.saveAddress}
            onChange={(event) => onChange({ saveAddress: event.target.checked })}
            className="h-4 w-4 cursor-pointer appearance-none bg-surface border border-white rounded-sm checked:bg-primary-light checked:border-white relative after:content-[''] after:absolute after:hidden checked:after:block after:left-[5px] after:top-[2px] after:w-[4px] after:h-[8px] after:border-white after:border-r-2 after:border-b-2 after:rotate-45"
          />

          <span className="font-montserrat text-[13px] text-white">Save this address for future orders</span>
        </label>
      </div>
    </section>
  );
}
