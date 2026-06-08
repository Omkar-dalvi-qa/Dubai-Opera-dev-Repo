"use client";

interface PromoCodeSectionProps {
  promoCode: string;
  promoApplied: boolean;
  disabled?: boolean;
  onPromoCodeChange: (value: string) => void;
  onApply: () => void;
}

export default function PromoCodeSection({
  promoCode,
  promoApplied,
  disabled = false,
  onPromoCodeChange,
  onApply,
}: PromoCodeSectionProps) {
  return (
    <div className="mb-3 lg:mb-4 border-b border-white/15 pb-4">
      <p className="font-montserrat text-[12px] leading-[100%] text-white mb-2">Have a promo code?</p>
      <div className="flex items-center gap-2">
        <input
          value={promoCode}
          onChange={(event) => onPromoCodeChange(event.target.value)}
          placeholder="Enter your Code"
          className="h-10 flex-1 rounded-[8px] border border-[#494949] bg-[#0000004D] px-3 text-[12px] font-montserrat text-white placeholder:text-[#888888] focus:outline-none"
        />
        <button
          type="button"
          onClick={onApply}
          disabled={disabled}
          className="h-10 min-w-[78px] rounded-[8px] bg-primary-light px-3 text-[12px] font-montserrat font-semibold hover:bg-[#8e2b30] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Apply
        </button>
      </div>
      {promoCode.trim() ? (
        <p className={`mt-2 font-montserrat text-[10px] ${promoApplied ? "text-green-300" : "text-white/60"}`}>
          {promoApplied ? "Promo applied: 10% off" : "Use code OPERA10 for 10% off"}
        </p>
      ) : null}
    </div>
  );
}
