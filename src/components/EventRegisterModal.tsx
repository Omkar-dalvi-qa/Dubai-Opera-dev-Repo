"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import PhoneInputField from "@/components/PhoneInputField";
import { useAuth } from "@/contexts/auth/AuthContext";
import { postEventRegistered } from "@/services/websiteServer";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  eventName?: string;
};

type FormErrors = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  eventName: string;
};

const emptyErrors: FormErrors = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  eventName: "",
};

const labelClass = "mb-1 block font-montserrat text-[11px] text-white";
const inputClass =
  "h-11 w-full rounded-[8px] border border-[#3a3a3a] bg-[#1B1B1B] px-3 font-montserrat text-[14px] text-white focus:outline-none focus:border-white/25";
const errorInputClass = "border-red-500/70";

export default function EventRegisterModal({ isOpen, onClose, eventName }: Props) {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [event, setEvent] = useState("");
  const [errors, setErrors] = useState<FormErrors>(emptyErrors);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setErrors(emptyErrors);

    if (user) {
      setFirstName(String(user.firstName ?? user.first_name ?? ""));
      setLastName(String(user.lastName ?? user.last_name ?? ""));
      setEmail(String(user.email ?? ""));
      setPhone(String(user.mobileNumber ?? user.phone_number ?? ""));
    } else {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
    }

    setEvent(eventName ?? "");
  }, [isOpen, user, eventName]);

  const validate = () => {
    const next: FormErrors = {
      firstName: firstName.trim() ? "" : "First name is required",
      lastName: lastName.trim() ? "" : "Last name is required",
      email: email.trim() ? "" : "Email is required",
      phone: phone.trim() ? "" : "Phone is required",
      eventName: event.trim() ? "" : "Event name is required",
    };
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const body = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      eventName: event.trim(),
    };

    setIsSubmitting(true);
    try {
      const result = await postEventRegistered(body);
      toast.success(result.message);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative flex max-h-[90vh] w-full max-w-[480px] flex-col rounded-2xl border border-white/10 bg-[#1E1E1E] p-4 shadow-2xl sm:p-5">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2 top-2 cursor-pointer text-white/80 hover:text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="shrink-0 pr-8 font-optima text-[22px] leading-tight text-white">Event Register</h2>

        <form className="mt-3 flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit} noValidate>
          <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
            <div>
              <label className={labelClass}>
                First Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (errors.firstName) setErrors((p) => ({ ...p, firstName: "" }));
                }}
                className={`${inputClass} ${errors.firstName ? errorInputClass : ""}`}
                disabled={isSubmitting}
              />
              {errors.firstName && <p className="mt-1 text-[11px] text-red-400">{errors.firstName}</p>}
            </div>

            <div>
              <label className={labelClass}>
                Last Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (errors.lastName) setErrors((p) => ({ ...p, lastName: "" }));
                }}
                className={`${inputClass} ${errors.lastName ? errorInputClass : ""}`}
                disabled={isSubmitting}
              />
              {errors.lastName && <p className="mt-1 text-[11px] text-red-400">{errors.lastName}</p>}
            </div>

            <div>
              <label className={labelClass}>
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((p) => ({ ...p, email: "" }));
                }}
                className={`${inputClass} ${errors.email ? errorInputClass : ""}`}
                disabled={isSubmitting}
              />
              {errors.email && <p className="mt-1 text-[11px] text-red-400">{errors.email}</p>}
            </div>

            <div>
              <PhoneInputField
                value={phone}
                onChange={(value) => {
                  setPhone(value);
                  if (errors.phone) setErrors((p) => ({ ...p, phone: "" }));
                }}
                label="Phone *"
                labelClassName={labelClass}
                variant="booking"
                menuZIndex={9999}
                maxMenuHeight={160}
                disabled={isSubmitting}
                error={errors.phone}
              />
            </div>

            <div>
              <label className={labelClass}>
                Event Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={event}
                onChange={(e) => {
                  setEvent(e.target.value);
                  if (errors.eventName) setErrors((p) => ({ ...p, eventName: "" }));
                }}
                className={`${inputClass} ${errors.eventName ? errorInputClass : ""}`}
                readOnly={Boolean(eventName)}
                disabled={isSubmitting}
              />
              {errors.eventName && <p className="mt-1 text-[11px] text-red-400">{errors.eventName}</p>}
            </div>
          </div>

          <div className="mt-3 flex shrink-0 justify-end gap-2 border-t border-white/10 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 font-montserrat text-[13px] text-white/90 hover:text-white disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex min-w-[88px] items-center justify-center rounded-[8px] bg-[#792327] px-4 py-1.5 font-montserrat text-[13px] text-white hover:bg-[#792327]/90 disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
