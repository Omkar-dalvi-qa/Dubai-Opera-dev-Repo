"use client";

import { Check, X } from "lucide-react";

export function evaluatePassword(pw: string) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
}

export function RequirementRow({
  protocol,
  children,
}: {
  protocol: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 font-montserrat text-[11px] leading-tight sm:text-[12px]">
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
          protocol ? "text-[#00C950]" : "text-white/35"
        }`}
        aria-hidden
      >
        {protocol ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={2.5} />}
      </span>
      <span className={protocol ? "text-white/90" : "text-white/45"}>{children}</span>
    </div>
  );
}

export function ToggleRow({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-4">
      <div>
        <h3 className="font-montserrat text-[16px] font-medium leading-[24px] tracking-[0] text-white">
          {label}
        </h3>
        <p className="mt-1 font-montserrat text-[14px] font-normal leading-[20px] tracking-[0] text-white/55">
          {description}
        </p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={enabled}
        className={`relative h-7 w-13 rounded-full border transition-colors ${
          enabled ? "border-[#b93b42] bg-[#9f2930]" : "border-[#494949] bg-[#494949]"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
            enabled ? "left-7" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

