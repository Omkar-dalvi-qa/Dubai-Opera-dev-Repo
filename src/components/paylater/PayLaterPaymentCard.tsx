"use client";

import { Check, CreditCard, Lock } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  postExternalEventReservationTransaction,
  postExternalEventUpgPayment,
} from "@/services/externalEventReservationClient";
import { encryptUpgCardData } from "@/utils/encryptUpgCardData";
import { useAuth } from "@/contexts/auth/AuthContext";

type PaymentMethod = { id: number; name: string; code: string };

type PaymentErrors = {
  cardNumber?: string;
  cardholderName?: string;
  expiryDate?: string;
  cvv?: string;
};

interface PayLaterPaymentClientProps {
  locale: string;
  reservationId: string | null;
  token?: string;
  amount?: string;
  currency?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  payNowRef?: MutableRefObject<(() => void) | null>;
}

export default function PayLaterPaymentClient({
  locale,
  reservationId,
  token = "",
  amount = "0.00",
  currency = "AED",
  customerName = "Guest",
  customerEmail = "guest@example.com",
  customerPhone = "-",
  payNowRef,
}: PayLaterPaymentClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [activeMethod, setActiveMethod] = useState<PaymentMethod>({ id: 0, name: "", code: "" });
  const [paymentModes, setPaymentModes] = useState<PaymentMethod[]>([]);
  const [paymentModesLoading, setPaymentModesLoading] = useState(false);
  const [paymentMethodChanging, setPaymentMethodChanging] = useState(false);

  const [cardNumber, setCardNumber] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [saveCard, setSaveCard] = useState(false);
  const [errors, setErrors] = useState<PaymentErrors>({});

  const CARD_PAYMENT_CODES = useMemo(() => new Set(["VISA", "DEBIT_CARD", "CREDIT_CARD"]), []);
  const ONE_CLICK_PAYMENT_CODES = useMemo(() => new Set(["GOOGLE_PAY", "APPLE_PAY"]), []);
  const isCardPayment = CARD_PAYMENT_CODES.has(activeMethod.code);
  const isOneClickPayment = ONE_CLICK_PAYMENT_CODES.has(activeMethod.code);
  const paymentUiBusy = paymentModesLoading || paymentMethodChanging;

  useEffect(() => {
    if (!paymentMethodChanging) return;
    const id = window.setTimeout(() => setPaymentMethodChanging(false), 250);
    return () => window.clearTimeout(id);
  }, [paymentMethodChanging, activeMethod.id]);

  useEffect(() => {
    const fetchPaymentModes = async () => {
      setPaymentModesLoading(true);
      try {
        const response = await fetch("/api/external/payment-modes");
        const data = await response.json();
        if (data?.success && Array.isArray(data?.data)) {
          setPaymentModes(data.data);
          if (data.data.length > 0) setActiveMethod(data.data[0]);
        } else {
          toast.error(data?.message || "Failed to fetch payment modes.");
          setPaymentModes([]);
          setActiveMethod({ id: 0, name: "", code: "" });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to fetch payment modes.";
        toast.error(msg);
        setPaymentModes([]);
        setActiveMethod({ id: 0, name: "", code: "" });
      } finally {
        setPaymentModesLoading(false);
      }
    };
    void fetchPaymentModes();
  }, []);

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiryDate = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const formatCardholderName = (value: string) => value.replace(/[^a-zA-Z\s]/g, "").toUpperCase();

  const validatePayment = (): boolean => {
    if (!isCardPayment) {
      setErrors({});
      return true;
    }

    const nextErrors: PaymentErrors = {};
    const cleanCardNumber = cardNumber.replace(/\s/g, "");
    const [rawMonth, rawYear] = expiryDate.split("/");
    const month = Number(rawMonth);
    const year = Number(rawYear);

    if (!/^\d{16}$/.test(cleanCardNumber)) nextErrors.cardNumber = "Enter a valid 16-digit card number.";
    if (!cardholderName.trim() || cardholderName.trim().length < 3) {
      nextErrors.cardholderName = "Enter valid cardholder name.";
    }

    if (!/^\d{2}\/\d{4}$/.test(expiryDate) || Number.isNaN(month) || Number.isNaN(year) || month < 1 || month > 12) {
      nextErrors.expiryDate = "Enter valid expiry (MM/YYYY).";
    } else {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      if (year < currentYear || (year === currentYear && month < currentMonth)) {
        nextErrors.expiryDate = "Card is expired.";
      }
    }

    if (!/^\d{3,4}$/.test(cvv)) nextErrors.cvv = "Enter valid CVV.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handlePaymentButton = async () => {
    if (!validatePayment()) return;
    if (String(reservationId).trim().length === 0) {
      toast.error("Reservation is missing.");
      return;
    }

    try {
      const basePayload: Record<string, unknown> = {
        customer_name: customerName,
        email: customerEmail,
        phone: customerPhone,
        payment_mode_id: activeMethod.id,
        ...(token ? { token } : {}),
      };

      const data: any = isCardPayment
        ? await (async () => {
            const [expiryMonth = "", expiryYear = ""] = expiryDate.split("/");
            console.log("[PayLaterPaymentCard] expiryMonth", {
              amount,
              currency,
              cardNumber: cardNumber.replace(/\s/g, ""),
              cardHolderName: cardholderName.trim(),
              expiryMonth,
              expiryYear,
              cvv,
            });
            const encrypted_upg = await encryptUpgCardData({
              amount,
              currency,
              cardNumber: cardNumber.replace(/\s/g, ""),
              cardHolderName: cardholderName.trim(),
              expiryMonth,
              expiryYear,
              cvv,
            });
            return postExternalEventUpgPayment(String(reservationId), { ...basePayload, encrypted_upg });
          })()
        : await postExternalEventReservationTransaction({
            reservation_id: reservationId,
            external_user_id: user?.emmarId ?? "",
            ...basePayload,
            payment_notes: "",
          });

      const isSuccess = isCardPayment
        ? String(data?.data?.status ?? "").trim().toLowerCase() === "success"
        : data?.success === true;

      if (!isSuccess) {
        const errorMessage = data?.data?.error_message || data?.message || "Payment failed. Please try again.";
        toast.error(errorMessage);
        return;
      }

      const authUrl = typeof data?.data?.auth_url === "string" ? data.data.auth_url.trim() : "";
      if (isCardPayment && authUrl) {
        window.location.href = authUrl;
        return;
      }

      const transactionId =
        data?.data?.id ??
        data?.data?.transaction_id ??
        data?.data?.order_id ??
        data?.data?.payment_id;

      const url = new URL(`/${locale}/booking/confirmation`, window.location.origin);
      if (transactionId) url.searchParams.set("transactionId", String(transactionId));
      router.push(url.pathname + url.search);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Payment failed. Please try again.";
      toast.error(msg);
    }
  };

  const payNowHandlerRef = useRef(handlePaymentButton);
  payNowHandlerRef.current = handlePaymentButton;

  useEffect(() => {
    if (!payNowRef) return;
    payNowRef.current = () => payNowHandlerRef.current();
    return () => {
      payNowRef.current = null;
    };
  }, [payNowRef]);

  return (
    <div>
      <div className="mt-4 mb-4 flex items-center justify-between gap-4">
        <h1 className="font-optima text-[30px] leading-[36px] lg:text-[44px]">Payment Method</h1>
      </div>

      <section className="w-full rounded-[20px] bg-surface p-5">
        <div className="flex flex-wrap items-center gap-2">
          {paymentModes.length > 0 &&
            paymentModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  if (activeMethod.id === mode.id) return;
                  setPaymentMethodChanging(true);
                  setActiveMethod(mode);
                }}
                disabled={paymentUiBusy}
                className={`h-11 min-w-[76px] cursor-pointer rounded-[8px] border px-4 font-montserrat text-[16px] font-semibold ${
                  activeMethod.id === mode.id
                    ? "border-primary-light bg-[#7923274D] text-white"
                    : "border-[#494949] bg-[#151515] text-white"
                }`}
              >
                {mode.name}
              </button>
            ))}
        </div>

        {paymentUiBusy ? (
          <p className="mt-3 font-montserrat text-[13px] text-white/70">Loading...</p>
        ) : isOneClickPayment ? (
          <div className="mt-6 rounded-[10px] border border-white/15 bg-[#151515] p-4">
            <p className="font-montserrat text-[14px] text-white/85">
              Continue with {activeMethod.name} to complete your purchase securely in one step.
            </p>
            <button
              type="button"
              onClick={handlePaymentButton}
              disabled={paymentUiBusy}
              className="mt-4 h-11 w-full rounded-[10px] bg-primary-light font-montserrat text-[16px] font-semibold text-white hover:bg-[#8e2b30] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Continue with {activeMethod.name}
            </button>
          </div>
        ) : isCardPayment ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2">
              <h1 className="font-montserrat text-[20px] leading-[100%] font-medium text-white">
                Pay with {activeMethod.name}
              </h1>
              <CreditCard size={24} className="text-white" />
            </div>

            <div>
              <label className="mb-1 block font-montserrat text-[14px] text-white">Card Number*</label>
              <input
                value={cardNumber}
                onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
                placeholder="1234 5678 9012 3456"
                disabled={paymentUiBusy}
                className="h-11 w-full rounded-[8px] border border-[#FFFFFF1A] bg-[#151515] px-3 font-montserrat text-[14px] text-white placeholder:text-white/45 focus:outline-none"
              />
              {cardNumber.replace(/\s/g, "") === "1234567890123456" && (
                <div className="mt-2 flex items-center gap-2 rounded-[8px] border border-[#05DF7280] bg-[#05DF721A] p-2">
                  <Check size={16} className="text-[#05DF72]" />
                  <p className="font-montserrat text-[13px] text-[#05DF72]">
                    Emirates NBD detected - 10% discount applied!
                  </p>
                </div>
              )}
              {errors.cardNumber ? (
                <p className="mt-1 font-montserrat text-[12px] text-[#ff8a8a]">{errors.cardNumber}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-1 block font-montserrat text-[14px] text-white">Cardholder Name*</label>
              <input
                type="text"
                value={cardholderName}
                onChange={(event) => setCardholderName(formatCardholderName(event.target.value))}
                placeholder="Name on card"
                disabled={paymentUiBusy}
                className="h-11 w-full rounded-[8px] border border-[#FFFFFF1A] bg-[#151515] px-3 font-montserrat text-[14px] text-white placeholder:text-white/45 focus:outline-none"
              />
              {errors.cardholderName ? (
                <p className="mt-1 font-montserrat text-[12px] text-[#ff8a8a]">{errors.cardholderName}</p>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-montserrat text-[14px] text-white">Expiry Date*</label>
                <input
                  value={expiryDate}
                  onChange={(event) => setExpiryDate(formatExpiryDate(event.target.value))}
                  placeholder="MM/YYYY"
                  disabled={paymentUiBusy}
                  className="h-11 w-full rounded-[8px] border border-[#FFFFFF1A] bg-[#151515] px-3 font-montserrat text-[14px] text-white placeholder:text-white/45 focus:outline-none"
                />
                {errors.expiryDate ? (
                  <p className="mt-1 font-montserrat text-[12px] text-[#ff8a8a]">{errors.expiryDate}</p>
                ) : null}
              </div>
              <div>
                <label className="mb-1 block font-montserrat text-[14px] text-white">CVV*</label>
                <input
                  value={cvv}
                  name="security_code_field"
                  inputMode="numeric"
                  autoComplete="off"
                  autoCorrect="off"
                  data-lpignore="true"        // LastPass / password managers
                  data-1p-ignore="true"       // 1Password
                  data-bwignore="true"  
                  onChange={(event) => setCvv(event.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="123"
                  disabled={paymentUiBusy}
                  className="h-11 w-full rounded-[8px] border border-[#FFFFFF1A] bg-[#151515] px-3 font-montserrat text-[14px] text-white placeholder:text-white/45 focus:outline-none"
                />
                {errors.cvv ? <p className="mt-1 font-montserrat text-[12px] text-[#ff8a8a]">{errors.cvv}</p> : null}
              </div>
            </div>

            <label className="mt-1 flex items-center gap-2">
              <input
                type="checkbox"
                checked={saveCard}
                onChange={(event) => setSaveCard(event.target.checked)}
                disabled={paymentUiBusy}
                className="peer sr-only"
              />
              <span className="relative h-4 w-4 cursor-pointer rounded-sm border border-white bg-black text-transparent peer-checked:border-primary-light peer-checked:bg-primary-light peer-checked:text-white">
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
              <span className="font-montserrat text-[13px] text-white/85">Save this card for future purchases</span>
            </label>

            <div className="rounded-[10px] border border-white/20 bg-[#181818] p-3">
              <div className="flex items-center gap-2">
                <Lock size={14} className="text-[#05DF72]" />
                <div>
                  <p className="font-montserrat text-[14px] font-semibold leading-[100%] text-[#05DF72] lg:text-white">
                    Secure Payment
                  </p>
                  <p className="mt-1 font-montserrat text-[12px] leading-[16px] text-[#FFFFFF99]">
                    Your payment information is encrypted and secure.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePaymentButton}
              disabled={paymentUiBusy}
              className="h-11 w-full rounded-[10px] bg-primary-light font-montserrat text-[16px] font-semibold text-white hover:bg-[#8e2b30] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Pay Now
            </button>
          </div>
        ) : activeMethod.code ? (
          <div className="mt-6 rounded-[10px] border border-white/15 bg-[#151515] p-4">
            <p className="font-montserrat text-[14px] text-white/85">
              Continue with {activeMethod.name} to complete your purchase securely in one step.
            </p>
            {/* <button
              type="button"
              onClick={handlePaymentButton}
              disabled={paymentUiBusy}
              className="mt-4 h-11 w-full rounded-[10px] bg-primary-light font-montserrat text-[16px] font-semibold text-white hover:bg-[#8e2b30] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Continue with {activeMethod.name}
            </button> */}
          </div>
        ) : null}
      </section>
    </div>
  );
}
