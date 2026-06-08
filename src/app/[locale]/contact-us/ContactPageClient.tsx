"use client";

import { useState } from "react";
import Banner from "@/components/programs/Banner";
import PhoneInputField from "@/components/PhoneInputField";
import { MapPin, Phone, Mail } from "lucide-react";
import Select, { type SingleValue } from "react-select";
import Partners from "@/components/Partners";
import { useTranslations } from "next-intl";
import type { PartnerCategory } from "@/types/website";

type EnquiryOption = { value: string; label: string };

export default function ContactPageClient({ partnerCategories }: { partnerCategories: PartnerCategory[] }) {
  const t = useTranslations("contact");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    enquiryType: "",
    details: "",
  });
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    enquiryType: "",
    details: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
  
    let updatedValue = value;
  
    // 👇 Apply letters-only restriction
    if (name === "firstName" || name === "lastName") {
      updatedValue = value.replace(/[^A-Za-z]/g, "");
    }
  
    setFormData((prev) => ({
      ...prev,
      [name]: updatedValue,
    }));
  
    // Clear error on change
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSelectChange = (selectedOption: SingleValue<EnquiryOption>) => {
    setFormData({ ...formData, enquiryType: selectedOption?.value ?? "" });
    if (errors.enquiryType) {
      setErrors({ ...errors, enquiryType: "" });
    }
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (errors.phone) {
      setErrors({ ...errors, phone: "" });
    }
  };

  const validateForm = () => {
    const errors = {
      firstName: "",
      lastName: "",
      email: "",
      enquiryType: "",
      details: "",
      phone: "",
    };
  
    let isValid = true;
  
    const nameRegex = /^[a-zA-Z\s'-]{2,50}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const phoneRegex = /^[0-9]{8,15}$/;
  
    // First Name
    if (!formData.firstName?.trim()) {
      errors.firstName = t("validation.firstNameRequired");
      isValid = false;
    } else if (!nameRegex.test(formData.firstName.trim())) {
      errors.firstName = t("validation.firstNameInvalid");
      isValid = false;
    }
  
    // Last Name
    if (!formData.lastName?.trim()) {
      errors.lastName = t("validation.lastNameRequired");
      isValid = false;
    } else if (!nameRegex.test(formData.lastName.trim())) {
      errors.lastName = t("validation.lastNameInvalid");
      isValid = false;
    }
  
    // Email
    const email = formData.email?.trim();
    if (!email) {
      errors.email = t("validation.emailRequired");
      isValid = false;
    } else if (!emailRegex.test(email)) {
      errors.email = t("validation.emailInvalid");
      isValid = false;
    }
  
    // Phone
    const cleanedPhone = phone?.replace(/\D/g, ""); // remove non-numeric
    if (!cleanedPhone) {
      errors.phone = t("validation.phoneRequired");
      isValid = false;
    } else if (!phoneRegex.test(cleanedPhone)) {
      errors.phone = t("validation.phoneInvalid");
      isValid = false;
    }
  
    // Enquiry Type
    if (!formData.enquiryType) {
      errors.enquiryType = t("validation.enquiryTypeRequired");
      isValid = false;
    }
  
    // Details
    if (!formData.details?.trim()) {
      errors.details = t("validation.detailsRequired");
      isValid = false;
    } else if (formData.details.trim().length < 10) {
      errors.details = t("validation.detailsMin");
      isValid = false;
    }
  
    setErrors(errors);
    return isValid;
  };
  const parsePhone = (raw: string): { countryCode: string; mobileNumber: string } => {
    const trimmed = String(raw ?? "").trim();
    const normalized = trimmed.replace(/[^\d+]/g, "");
    const m = normalized.match(/^\+(\d{1,3})(\d{4,})$/);
    if (!m) return { countryCode: "", mobileNumber: trimmed };
    return { countryCode: `+${m[1]}`, mobileNumber: m[2] };
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setSubmitSuccess(null);
    if (!validateForm()) return;

    const { countryCode, mobileNumber } = parsePhone(phone);

    setIsSubmitting(true);
    try {
      const res = await fetch("https://cms-opera.enpointe.io/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          countryCode,
          mobileNumber,
          enquiryType: formData.enquiryType,
          enquiryDetails: formData.details.trim(),
        }),
      });

      const contentType = res.headers.get("content-type") ?? "";
      const json = contentType.includes("application/json") ? ((await res.json()) as unknown) : null;
      const text = json ? null : await res.text();

      if (!res.ok) {
        const msg =
          (json && typeof json === "object" && "message" in json ? String((json as any).message ?? "") : "") ||
          text ||
          t("messages.submitFailed", { status: String(res.status) });
        setSubmitError(msg);
        return;
      }

      setSubmitSuccess(t("messages.submitSuccess"));
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        enquiryType: "",
        details: "",
      });
      setPhone("");
    } catch (e) {
      setSubmitError((e as Error)?.message ?? t("messages.networkError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const enquiryOptions: EnquiryOption[] = [
    { value: "general", label: t("enquiryOptions.general") },
    { value: "tickets", label: t("enquiryOptions.tickets") },
    { value: "press", label: t("enquiryOptions.press") },
  ];

  return (
    <main>
      <div className="min-h-screen overflow-x-clip bg-[#0B0B0B] text-white relative">
        <Banner
          subtitle=""
          title={t("bannerTitle")}
          mediaType="image"
          height="60vh"
          mobileHeight="30vh"
          mediaSrc="/images/AncillaryBg.jpg"
          hideMobileGradient
          showOverlay={false}
        />
      <div className="bg-linear-to-b from-[#060102] via-[#792327] to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 relative z-10">
            <div className="mb-8">
              <h2 className="text-3xl lg:text-[40px] lg:leading-[40px] font-optima text-white mb-2 tracking-wide text-shadow-sm">
                {t("heading")}
              </h2>
              <p className="text-white/60 text-[18px] leading-[21px] font-montserrat">
                {t("subheading")}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-start">
              <div className="lg:col-span-3 w-full">
                <div className="bg-surface rounded-[16px] p-6 lg:p-8 w-full shadow-lg relative z-10">
                  {submitError ? (
                    <div className="mb-5 rounded-[10px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {submitError}
                    </div>
                  ) : null}
                  {submitSuccess ? (
                    <div className="mb-5 rounded-[10px] border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                      {submitSuccess}
                    </div>
                  ) : null}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                    <div className="space-y-2">
                      <label className="text-[12px] leading-[100%] font-normal text-[#FFFFFF]">
                        {t("form.firstNameLabel")}
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        placeholder={t("form.firstNamePlaceholder")}
                        value={formData.firstName}
                        onChange={handleChange}
                        className={`w-full rounded-[10px] border mt-1 ${
                          errors.firstName ? "border-red-500" : "border-[#494949]"
                        } bg-[#151515] px-4 py-3 h-11 text-[13px] text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none transition-colors`}
                      />
                      {errors.firstName && (
                        <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[12px] leading-[100%] font-normal text-[#FFFFFF]">
                        {t("form.lastNameLabel")}
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        placeholder={t("form.lastNamePlaceholder")}
                        value={formData.lastName}
                        onChange={handleChange}
                        className={`w-full rounded-[10px] border mt-1 ${
                          errors.lastName ? "border-red-500" : "border-[#494949]"
                        } bg-[#151515] px-4 py-3 h-11 text-[13px] text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none transition-colors`}
                      />
                      {errors.lastName && (
                        <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 w-full gap-5 mb-5">
                    <div className="space-y-2">
                      <PhoneInputField
                        label={t("form.mobileNumberLabel")}
                        value={phone}
                        onChange={handlePhoneChange}
                        variant="login"
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                    <div className="space-y-2">
                      <label className="text-[12px] leading-[100%] font-normal text-[#FFFFFF]">
                        {t("form.emailLabel")}
                      </label>
                      <input
                        type="email"
                        name="email"
                        placeholder={t("form.emailPlaceholder")}
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full rounded-[10px] border mt-1 ${
                          errors.email ? "border-red-500" : "border-[#494949]"
                        } bg-[#151515] px-4 py-3 h-11 text-[13px] text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none transition-colors`}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[12px] leading-[100%] font-normal text-[#FFFFFF]">
                        {t("form.enquiryTypeLabel")}
                      </label>
                      <Select
                        options={enquiryOptions}
                        value={
                          enquiryOptions.find((opt) => opt.value === formData.enquiryType) ||
                          null
                        }
                        onChange={handleSelectChange}
                        placeholder={t("form.enquiryTypePlaceholder")}
                        name="enquiryType"
                        instanceId="enquiryType-select"
                        styles={{
                          control: (base) => ({
                            ...base,
                            backgroundColor: "#151515",
                            borderColor: errors.enquiryType ? "#ef4444" : "#494949",
                            borderRadius: "10px",
                            height: "44px",
                            minHeight: "44px",
                            boxShadow: "none",
                            cursor: "pointer",
                            "&:hover": {
                              borderColor: errors.enquiryType
                                ? "#ef4444"
                                : "rgba(255, 255, 255, 0.2)",
                            },
                            marginTop: "4px",
                          }),
                          menu: (base) => ({
                            ...base,
                            backgroundColor: "#151515",
                            border: "1px solid #494949",
                            borderRadius: "10px",
                            overflow: "hidden",
                            zIndex: 20,
                          }),
                          option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isFocused ? "#2A2A2A" : "#151515",
                            color: "white",
                            cursor: "pointer",
                            fontSize: "13px",
                            "&:active": { backgroundColor: "#333333" },
                          }),
                          singleValue: (base) => ({
                            ...base,
                            color: "white",
                            fontSize: "13px",
                          }),
                          placeholder: (base) => ({
                            ...base,
                            color: "rgba(255, 255, 255, 0.3)",
                            fontSize: "13px",
                          }),
                          input: (base) => ({
                            ...base,
                            color: "white",
                            fontSize: "13px",
                            margin: "0px",
                          }),
                          valueContainer: (base) => ({ ...base, padding: "0 16px" }),
                          indicatorSeparator: () => ({ display: "none" }),
                          dropdownIndicator: (base) => ({
                            ...base,
                            color: "rgba(255, 255, 255, 0.5)",
                            "&:hover": { color: "white" },
                          }),
                        }}
                      />
                      {errors.enquiryType && (
                        <p className="text-red-500 text-xs mt-1">{errors.enquiryType}</p>
                      )}
                    </div>
                  </div>

                  <div className="mb-6 space-y-2">
                    <label className="text-[12px] leading-[100%] font-normal text-[#FFFFFF]">
                      {t("form.detailsLabel")}
                    </label>
                    <textarea
                      name="details"
                      placeholder={t("form.detailsPlaceholder")}
                      value={formData.details}
                      onChange={handleChange}
                      rows={5}
                      className={`w-full rounded-[10px] border mt-1 ${
                        errors.details ? "border-red-500" : "border-[#494949]"
                      } bg-[#151515] px-4 py-3 text-[13px] text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none transition-colors resize-none`}
                    />
                    {errors.details && (
                      <p className="text-red-500 text-xs mt-1">{errors.details}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full bg-[#75262A] hover:bg-[#8A2D32] transition-colors text-white font-medium py-3 rounded-[8px] text-[15px] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? t("form.submitting") : t("form.submitEnquiry")}
                  </button>
                </div>
              </div>
              <div className="lg:col-span-2 w-full">
                <div className="bg-surface rounded-[16px] p-6 lg:p-8 w-full flex flex-col gap-8 shadow-lg h-fit relative z-10">
                  <div className="flex items-start gap-4">
                    <MapPin
                      className="text-[#8A2D32] w-5 h-5 shrink-0"
                      strokeWidth={1.5}
                    />
                    <div className="text-[14px] leading-[1.6] text-white font-montserrat">
                      {t("contactInfo.addressLine1")} <br />
                      {t("contactInfo.addressLine2")}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Phone
                      className="text-[#8A2D32] w-5 h-5 shrink-0"
                      strokeWidth={1.5}
                    />
                    <div className="text-[14px] text-white font-montserrat">04 440 8888</div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Mail
                      className="text-[#8A2D32] w-5 h-5 shrink-0"
                      strokeWidth={1.5}
                    />
                    <div className="text-[14px] text-white font-montserrat">
                      boxoffice@dubaiopera.com
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-10 lg:pt-24">
              <h2 className="text-3xl lg:text-[40px] font-optima text-white mb-6 lg:mb-8">
                {t("ourLocation")}
              </h2>
              <div className="w-full h-[400px] lg:h-[550px] rounded-[24px] overflow-hidden relative shadow-2xl bg-[#141414]">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3610.1581452632296!2d55.2738734!3d25.1979929!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f42861c8340d5%3A0x6bba8ff79c882101!2sDubai%20Opera!5e0!3m2!1sen!2sae!4v1700000000000!5m2!1sen!2sae"
                  className="w-full h-full border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="absolute inset-0 pointer-events-none ring-1 ring-white/10 rounded-[24px]" />

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-[90%] sm:w-auto">
                  <a
                    href="https://maps.google.com/?q=Dubai+Opera"
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#75262A] hover:bg-[#8A2D32] transition-colors text-white font-medium py-3.5 px-12 rounded-[8px] whitespace-nowrap text-[15px] shadow-lg flex items-center justify-center"
                  >
                    {t("openInMaps")}
                  </a>
                </div>
              </div>
            </div>
          </div>
          <Partners partnerCategories={partnerCategories} />
        </div>
      </div>

    </main>
  );
}

