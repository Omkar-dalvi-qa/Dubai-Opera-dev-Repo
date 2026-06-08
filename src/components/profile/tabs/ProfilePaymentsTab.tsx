"use client";

import { Check, ChevronLeft, Lock, Plus } from "lucide-react";
import GiftCard, { type GiftCardItem } from "@/components/profile/payments/GiftCard";
import SavedCard, { type SavedPaymentCard } from "@/components/profile/payments/SavedCard";

export type PaymentErrors = {
  cardNumber?: string;
  cardholderName?: string;
  expiryDate?: string;
  cvv?: string;
};

export default function ProfilePaymentsTab({
  isAddingCard,
  setIsAddingCard,
  cardNumber,
  setCardNumber,
  cardholderName,
  setCardholderName,
  expiryDate,
  setExpiryDate,
  cvv,
  setCvv,
  saveCard,
  setSaveCard,
  setAsDefault,
  setSetAsDefault,
  errors,
  setErrors,
  paymentCards,
  setPaymentCards,
  giftCards,
  setGiftCards,
}: {
  isAddingCard: boolean;
  setIsAddingCard: (v: boolean) => void;
  cardNumber: string;
  setCardNumber: (v: string) => void;
  cardholderName: string;
  setCardholderName: (v: string) => void;
  expiryDate: string;
  setExpiryDate: (v: string) => void;
  cvv: string;
  setCvv: (v: string) => void;
  saveCard: boolean;
  setSaveCard: (v: boolean) => void;
  setAsDefault: boolean;
  setSetAsDefault: (v: boolean) => void;
  errors: PaymentErrors;
  setErrors: (e: PaymentErrors) => void;
  paymentCards: SavedPaymentCard[];
  setPaymentCards: React.Dispatch<React.SetStateAction<SavedPaymentCard[]>>;
  giftCards: GiftCardItem[];
  setGiftCards: React.Dispatch<React.SetStateAction<GiftCardItem[]>>;
}) {
  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiryDate = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const formatCardholderName = (value: string) => value.replace(/[^a-zA-Z\s]/g, "").toUpperCase();

  const validatePayment = (): boolean => {
    const nextErrors: PaymentErrors = {};
    const cleanCardNumber = cardNumber.replace(/\s/g, "");
    const [rawMonth, rawYear] = expiryDate.split("/");
    const month = Number(rawMonth);
    const year = Number(rawYear);

    if (!/^\d{16}$/.test(cleanCardNumber)) {
      nextErrors.cardNumber = "Enter a valid 16-digit card number.";
    }
    if (!cardholderName.trim() || cardholderName.trim().length < 3) {
      nextErrors.cardholderName = "Enter valid cardholder name.";
    }
    if (!/^\d{2}\/\d{2}$/.test(expiryDate) || Number.isNaN(month) || Number.isNaN(year) || month < 1 || month > 12) {
      nextErrors.expiryDate = "Enter valid expiry (MM/YY).";
    } else {
      const now = new Date();
      const currentYear = now.getFullYear() % 100;
      const currentMonth = now.getMonth() + 1;
      if (year < currentYear || (year === currentYear && month < currentMonth)) {
        nextErrors.expiryDate = "Card is expired.";
      }
    }
    if (!/^\d{3,4}$/.test(cvv)) {
      nextErrors.cvv = "Enter valid CVV.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const setDefaultPaymentCard = (id: string) => {
    setPaymentCards((prev) => prev.map((c) => ({ ...c, isDefault: c.id === id })));
  };

  const removePaymentCard = (id: string) => {
    setPaymentCards((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (next.length === 0) return next;
      if (!next.some((c) => c.isDefault)) {
        return next.map((c, i) => ({ ...c, isDefault: i === 0 }));
      }
      return next;
    });
  };

  const handleAddCard = () => {
    if (!validatePayment()) return;

    const newCard: SavedPaymentCard = {
      id: `card-${Date.now()}`,
      type: "visa",
      lastFour: cardNumber.replace(/\s/g, "").slice(-4),
      holderName: cardholderName,
      expiry: expiryDate,
      isDefault: setAsDefault,
    };

    if (setAsDefault) {
      setPaymentCards((prev) => prev.map((c) => ({ ...c, isDefault: false })));
    }

    setPaymentCards((prev) => [...prev, newCard]);
    setIsAddingCard(false);
    setCardNumber("");
    setCardholderName("");
    setExpiryDate("");
    setCvv("");
    setSetAsDefault(false);
    setSaveCard(false);
    setErrors({});
  };

  if (isAddingCard) {
    return (
      <div className="max-w-[1048px] space-y-6">
        <button
          type="button"
          onClick={() => setIsAddingCard(false)}
          className="flex items-center gap-3 text-white hover:text-white/80 transition-colors"
        >
          <ChevronLeft size={24} />
          <span className="font-optima text-[24px] lg:text-[32px]">Add a New Card</span>
        </button>

        <div className="rounded-[20px] bg-surface p-6 lg:p-8 border border-white/5">
          <div className="space-y-6">
            <div>
              <label className="block text-[14px] font-medium text-white/70 mb-2">Card Number*</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="1234 5678 9012 3456"
                className={`w-full bg-[#0000004D] border rounded-[10px] px-4 py-3 text-white placeholder:text-white/20 focus:outline-none transition-colors ${
                  errors.cardNumber ? "border-[#ff8a8a]" : "border-[#494949] focus:border-white/30"
                }`}
              />
              {errors.cardNumber && <p className="mt-1 text-[12px] text-[#ff8a8a]">{errors.cardNumber}</p>}
            </div>

            <div>
              <label className="block text-[14px] font-medium text-white/70 mb-2">Cardholder Name*</label>
              <input
                type="text"
                value={cardholderName}
                onChange={(e) => setCardholderName(formatCardholderName(e.target.value))}
                placeholder="Name on card"
                className={`w-full bg-[#0000004D] border rounded-[10px] px-4 py-3 text-white placeholder:text-white/20 focus:outline-none transition-colors ${
                  errors.cardholderName ? "border-[#ff8a8a]" : "border-[#494949] focus:border-white/30"
                }`}
              />
              {errors.cardholderName && (
                <p className="mt-1 text-[12px] text-[#ff8a8a]">{errors.cardholderName}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[14px] font-medium text-white/70 mb-2">Expiry Date*</label>
                <input
                  type="text"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                  placeholder="MM/YY"
                  className={`w-full bg-[#0000004D] border rounded-[10px] px-4 py-3 text-white placeholder:text-white/20 focus:outline-none transition-colors ${
                    errors.expiryDate ? "border-[#ff8a8a]" : "border-[#494949] focus:border-white/30"
                  }`}
                />
                {errors.expiryDate && <p className="mt-1 text-[12px] text-[#ff8a8a]">{errors.expiryDate}</p>}
              </div>
              <div>
                <label className="block text-[14px] font-medium text-white/70 mb-2">CVV*</label>
                <input
                  type="password"
                  name="security_code_field"
                  inputMode="numeric"
                  autoComplete="off"
                  autoCorrect="off"
                  data-lpignore="true"        // LastPass / password managers
                  data-1p-ignore="true"       // 1Password
                  data-bwignore="true"  
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="123"
                  className={`w-full bg-[#0000004D] border rounded-[10px] px-4 py-3 text-white placeholder:text-white/20 focus:outline-none transition-colors ${
                    errors.cvv ? "border-[#ff8a8a]" : "border-[#494949] focus:border-white/30"
                  }`}
                />
                {errors.cvv && <p className="mt-1 text-[12px] text-[#ff8a8a]">{errors.cvv}</p>}
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 group cursor-pointer">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={setAsDefault}
                    onChange={(e) => setSetAsDefault(e.target.checked)}
                  />
                  <div className="h-5 w-5 rounded-[4px] border border-white/20 bg-[#0D0D0D] flex items-center justify-center transition-all peer-checked:bg-[#792327] peer-checked:border-[#792327]">
                    <Check size={14} className="text-white scale-0 transition-transform peer-checked:scale-100" />
                  </div>
                </div>
                <span className="font-montserrat text-[14px] text-white">Set as default payment method</span>
              </label>

              <label className="flex items-center gap-3 group cursor-pointer">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={saveCard}
                    onChange={(e) => setSaveCard(e.target.checked)}
                  />
                  <div className="h-5 w-5 rounded-[4px] border border-white/20 bg-[#0D0D0D] flex items-center justify-center transition-all peer-checked:bg-[#792327] peer-checked:border-[#792327]">
                    <Check size={14} className="text-white scale-0 transition-transform peer-checked:scale-100" />
                  </div>
                </div>
                <span className="font-montserrat text-[14px] text-white">Save this card for future purchases</span>
              </label>
            </div>

            <div className="rounded-[10px] border border-white/20 bg-[#181818] p-3">
              <div className="flex items-center gap-2">
                <Lock size={14} className="text-[#05DF72]" />
                <div>
                  <p className="font-montserrat lg:text-[14px] leading-[100%] font-semibold text-[#05DF72] lg:text-white">
                    Secure Payment
                  </p>
                  <p className="mt-1 font-montserrat text-[12px] leading-[16px] text-[#FFFFFF99]">
                    Your payment information is encrypted and secure.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={handleAddCard}
                className="w-full bg-[#792327] hover:bg-[#8e2b30] text-white py-4 rounded-[12px] font-bold text-[16px] transition-colors"
              >
                Add Card
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1048px] space-y-8">
      {/* <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <h2 className="font-optima text-[28px] lg:text-[30px] leading-[45px] text-white">Payment Methods</h2>
          <button
            type="button"
            onClick={() => setIsAddingCard(true)}
            className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-[10px] bg-[#792327] px-4 font-montserrat text-[13px] font-semibold text-white transition-colors hover:bg-[#8e2b30] sm:h-10 sm:w-auto sm:text-[14px] cursor-pointer"
          >
            <Plus size={18} strokeWidth={2} className="shrink-0" aria-hidden />
            Add New Card
          </button>
        </div>

        <div className="space-y-4">
          {paymentCards.map((card) => (
            <SavedCard
              key={card.id}
              card={card}
              isDefault={card.isDefault}
              onSetDefault={() => setDefaultPaymentCard(card.id)}
              onDelete={() => removePaymentCard(card.id)}
            />
          ))}
        </div>
      </div> */}

      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 border-t border-white/5 pt-8">
          <h2 className="font-optima text-[28px] lg:text-[30px] leading-[45px] text-white">Gifts Cards</h2>
          {/* <button
            type="button"
            className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-[10px] bg-[#792327] px-4 font-montserrat text-[13px] font-semibold text-white transition-colors hover:bg-[#8e2b30] sm:h-10 sm:w-auto sm:text-[14px]"
          >
            <Plus size={18} strokeWidth={2} className="shrink-0" aria-hidden />
            Add Gift Card
          </button> */}
        </div>

        <div className="space-y-4">
          {giftCards.length === 0 ? (
            <p className="font-montserrat text-[14px] text-white/60">No gift cards available</p>
          ) : (
            giftCards.map((card) => (
              <GiftCard key={card.id} card={card} onDelete={() => setGiftCards((prev) => prev.filter((c) => c.id !== card.id))} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

