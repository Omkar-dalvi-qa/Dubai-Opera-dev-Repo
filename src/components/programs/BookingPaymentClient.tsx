"use client";

import { Check, CreditCard, Lock } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SelectedAddonDetail } from "@/components/programs/BookingTicketPanel";
// import BookingGiftCardSection from "@/components/programs/BookingGiftCardSection";
import { BOOKING_ADDON_ITEMS } from "@/components/programs/bookingConstants";
import { useExternalEventBookingState } from "@/contexts/program-event/ExternalEventDetailsContext";
import {
  postExternalEventReservationTransaction,
  postExternalEventUpgPayment,
  getExternalEventReservationbyId,
} from "@/services/externalEventReservationClient";
import { encryptUpgCardData } from "@/utils/encryptUpgCardData";
import { toast } from "sonner";

type PaymentMethod = { id: number; name: string; code: string };

type ApiPaymentMode = {
  id?: number;
  name?: string;
  code?: string;
};

export type BookingPaymentFlowType = "booking" | "shop";

interface BookingPaymentClientProps {
  /** Booking uses ticket panel + program context seats; shop uses the payment form only when wired from shop routes. */
  flowType?: BookingPaymentFlowType;
  backHref: string;
  nextHref?: string;
  eventTitle?: string;
  summaryImageSrc?: string;
  summaryDateTime?: string;
  selectedAddons: SelectedAddonDetail[];
  /** When `flowType` is shop, parent may set this ref so layout chrome can trigger the same Pay Now handler (validation + navigation). */
  shopPayNowRef?: MutableRefObject<(() => void) | null>;
}

type PaymentErrors = {
  cardNumber?: string;
  cardholderName?: string;
  expiryDate?: string;
  cvv?: string;
};

export default function BookingPaymentClient({
  flowType = "booking",
  nextHref,
  selectedAddons,
  shopPayNowRef,
}: BookingPaymentClientProps) {
  const {
    selectedAddons: contextSelectedAddons,
    reservationId,
    reservationSummary,
    customer,
    details,
    setSelectedAddons,
    setPaymentMethod,
    paymentDetails,
    setPaymentDetails,
    requestPaymentSubmit,
  } = useExternalEventBookingState();
  const effectiveSelectedAddons = contextSelectedAddons.length > 0 ? contextSelectedAddons : selectedAddons;



  const router = useRouter();
  const pathname = usePathname();
  const bookingBasePath = useMemo(
    () => pathname.replace(/\/(seats|addons|checkout|payment|confirmation)$/, ""),
    [pathname],
  );
  const [activeMethod, setActiveMethod] = useState<PaymentMethod>({ id: 0, name: "", code: "" });
  const [paymentModes, setPaymentModes] = useState<PaymentMethod[]>([]);
  const [paymentModesLoading, setPaymentModesLoading] = useState(false);
  const [paymentMethodChanging, setPaymentMethodChanging] = useState(false);
  const [addonQuantities, setAddonQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(effectiveSelectedAddons.map((addon) => [addon.id, addon.quantity])),
  );
  
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

  const addonMetaById = useMemo(() => {
    const map = new Map<string, { label: string; price: string }>();
    for (const a of effectiveSelectedAddons) {
      map.set(a.id, { label: a.label || "", price: String(a.price ?? "0") });
    }
    return map;
  }, [effectiveSelectedAddons]);

  const [cardNumber, setCardNumber] = useState(paymentDetails.cardNumber || "");
  const [cardholderName, setCardholderName] = useState(paymentDetails.cardholderName || "");
  const [expiryDate, setExpiryDate] = useState(paymentDetails.expiryDate || "");
  const [cvv, setCvv] = useState(paymentDetails.cvv || "");
  const [saveCard, setSaveCard] = useState(paymentDetails.saveCard || false);
  const [errors, setErrors] = useState<PaymentErrors>({});

  useEffect(() => {
    const fetchPaymentModes = async () => {
      setPaymentModesLoading(true);
      try {
        const response = await fetch("/api/external/payment-modes");
        const data = await response.json();
        if (data?.success && Array.isArray(data?.data)) {
          const filteredData = data?.data?.filter((mode: PaymentMethod) => mode?.name == "Credit Card" || mode?.name == "Debit Card") ?? [];
          setPaymentModes(filteredData);
          if (filteredData.length > 0) setActiveMethod(filteredData[0]);
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
    fetchPaymentModes();
  }, []);
  
  // Sync context with local state
  useEffect(() => {
    if (isCardPayment) {
      setPaymentDetails({
        cardNumber,
        cardholderName,
        expiryDate,
        saveCard,
      });
    }
  }, [cardNumber, cardholderName, expiryDate, saveCard, isCardPayment, setPaymentDetails]);

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
    // Avoid infinite loop when there are no selected addons.
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

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiryDate = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const formatCardholderName = (value: string) => {
    return value.replace(/[^a-zA-Z\s]/g, "").toUpperCase();
  };

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

    if (!/^\d{16}$/.test(cleanCardNumber)) {
      nextErrors.cardNumber = "Enter a valid 16-digit card number.";
    }
    
    if (!cardholderName.trim() || cardholderName.trim().length < 3) {
      nextErrors.cardholderName = "Enter valid cardholder name.";
    }

    if (!/^\d{2}\/\d{4}$/.test(expiryDate) || isNaN(month) || isNaN(year) || month < 1 || month > 12) {
      nextErrors.expiryDate = "Enter valid expiry (MM/YYYY).";
    } else {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      if (year < currentYear || (year === currentYear && month < currentMonth)) {
        nextErrors.expiryDate = "Card is expired.";
      }
    }

    if (!/^\d{3}$/.test(cvv)) {
      nextErrors.cvv = "Enter valid CVV.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handlePaymentButton = async () => {
    if (!validatePayment()) return;

    // Persist selection in context for downstream steps.
    if (activeMethod.code === "GOOGLE_PAY") setPaymentMethod("googlePay");
    else if (activeMethod.code === "APPLE_PAY") setPaymentMethod("applePay");
    else if (isCardPayment) setPaymentMethod("visa");
    if (isCardPayment) {
      setPaymentDetails({
        cardNumber,
        cardholderName,
        expiryDate,
        saveCard,
      });
    }

    const bookingSuccess = nextHref || `${bookingBasePath}/confirmation`;
    const bookingFailed = `${bookingBasePath}/booking-failed`;

    if (flowType === "booking") {
      const reservation_id = reservationId;
      if (String(reservation_id).trim().length === 0) {
        toast.error("Reservation is missing. Please go back and try again.");
        return;
      }
      try {
        const basePayload = {
          customer_name: `${customer.firstName} ${customer.lastName}`.trim(),
          email: customer.email,
          phone: customer.mobile,
          payment_mode_id: activeMethod.id,
        };

        const data: any = isCardPayment
       
        
          ? await (async () => {
              const grandTotal = Number(reservationSummary?.grand_total ?? 0);
              const [expiryMonth = "", expiryYear = ""] = expiryDate.split("/");
              const reservationDetails = await getExternalEventReservationbyId(String(reservation_id)).catch(
                () => null,
              );
              const currencyFromReservation = String(
                (reservationDetails as any)?.data?.reservation_items?.[0]?.currency?.code ?? "",
              )
                .trim()
                .toUpperCase();
              const currencyFromDetails = String(
                (details as Record<string, unknown> | null)?.currency ?? "",
              )
                .trim()
                .toUpperCase();
              const currencyCode = currencyFromReservation || currencyFromDetails || "AED";
              const encrypted_upg = await encryptUpgCardData({
                amount: Number.isFinite(grandTotal) ? grandTotal.toFixed(2) : "0.00",
                currency: currencyCode || "AED",
                cardNumber: cardNumber.replace(/\s/g, ""),
                cardHolderName: cardholderName.trim(),
                expiryMonth,
                expiryYear,
                cvv,
              });

              // console.log("[BookingPaymentClient] Pay Now currency source:", {
              //   reservation_id,
              //   currencyFromReservation,
              //   currencyFromDetails,
              //   currencyCode,
              // });

              return postExternalEventUpgPayment(String(reservation_id), {
                ...basePayload,
                encrypted_upg
              });
            })()
          : await postExternalEventReservationTransaction({
              reservation_id,
              ...basePayload,
              payment_notes: "",
            });

        const isSuccess = isCardPayment
          ? String(data?.data?.status ?? "")
              .trim()
              .toLowerCase() === "success"
          : data?.success === true;

        if (isSuccess) {
          const authUrl =
            typeof data?.data?.auth_url === "string" ? data.data.auth_url.trim() : "";
          if (isCardPayment && authUrl) {
            window.location.href = authUrl;
            return;
          }
          const transactionId =
            data?.data?.id ??
            data?.data?.transaction_id ??
            data?.data?.order_id ??
            data?.data?.payment_id;
          const url = new URL(bookingSuccess, window.location.origin);
          if (transactionId) {
            url.searchParams.set("transactionId", String(transactionId));
          }
          router.push(url.pathname + url.search);
        } else {
          const errorMessage =
            data?.data?.error_message || data?.message || "Payment transaction failed. Please try again.";
          toast.error(errorMessage);
          const failedSearch = typeof window !== "undefined" ? window.location.search : "";
          router.push(`${bookingFailed}${failedSearch}`);
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Payment transaction failed. Please try again.";
        toast.error(msg);
        return;
      }
    }
  };

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void handlePaymentButton();
  };

  const goToNextStepRef = useRef(handlePaymentButton);
  goToNextStepRef.current = handlePaymentButton;

  useEffect(() => {
    requestPaymentSubmit.current = () => goToNextStepRef.current();
    return () => {
      requestPaymentSubmit.current = null;
    };
  }, [requestPaymentSubmit]);

  useEffect(() => {
    if (!shopPayNowRef) return;
    const run = () => goToNextStepRef.current();
    shopPayNowRef.current = run;
    return () => {
      shopPayNowRef.current = null;
    };
  }, [shopPayNowRef]);

  return (
    <div>
      {flowType === "booking" && (
        <div className="mt-6 flex items-center justify-between gap-4 mb-4">
          <h1 className="font-optima text-[30px] leading-[36px] lg:text-[44px]">Payment Method</h1>
        </div>
      )}


      <form onSubmit={handleFormSubmit}>
        <section className="w-full rounded-[20px] bg-surface p-5">
          <div className="flex flex-wrap items-center gap-2">
            {paymentModes?.length > 0 && paymentModes?.map((mode) => (
              <button
                key={mode?.id}
                type="button"
                onClick={() => {
                  if (activeMethod?.id === mode?.id) return;
                  setPaymentMethodChanging(true);
                  setActiveMethod(mode);
                }}
                disabled={paymentUiBusy}
                className={`h-11 min-w-[76px] rounded-[8px] border px-4 font-montserrat text-[16px] font-semibold cursor-pointer ${
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
            <p className="mt-3 font-montserrat text-[13px] text-white/70">Loading…</p>
          ) : 

          ( <>{isOneClickPayment ? (
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
                <h1 className="font-montserrat text-[20px] leading-[100%] font-medium text-white">Pay with {activeMethod.name}</h1>
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
                  data-testid="payment-card-number"
                />
                {cardNumber.replace(/\s/g, "") === "1234567890123456" && (
                  <div className="mt-2 flex items-center gap-2 rounded-[8px] border border-[#05DF7280] bg-[#05DF721A] p-2">
                    <Check size={16} className="text-[#05DF72]" />
                    <p className="font-montserrat text-[13px] text-[#05DF72]">
                      Emirates NBD detected - 10% discount applied!
                    </p>
                  </div>
                )}
                {errors.cardNumber ? <p className="mt-1 font-montserrat text-[12px] text-[#ff8a8a]">{errors.cardNumber}</p> : null}
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
                  {errors.expiryDate ? <p className="mt-1 font-montserrat text-[12px] text-[#ff8a8a]">{errors.expiryDate}</p> : null}
                </div>
                <div>
                  <label className="mb-1 block font-montserrat text-[14px] text-white">CVV*</label>
                  <input
                    name="security_code_field"
                    value={cvv}
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    autoCorrect="off"
                    data-lpignore="true"        // LastPass / password managers
                    data-1p-ignore="true"       // 1Password
                    data-bwignore="true"        // Bitwarden
                    onChange={(e) =>
                      setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    placeholder="123"
                    className="h-11 w-full rounded-[8px] border border-[#FFFFFF1A] bg-[#151515] px-3 font-montserrat text-[14px] text-white placeholder:text-white/45 focus:outline-none"
                    disabled={paymentUiBusy}
                    data-testid="payment-cvv"
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
                    <p className="font-montserrat lg:text-[14px] leading-[100%] font-semibold text-[#05DF72] lg:text-white">Secure Payment</p>
                    <p className="mt-1 font-montserrat text-[12px] leading-[16px] text-[#FFFFFF99]">
                      Your payment information is encrypted and secure.
                    </p>
                  </div>
                </div>
              </div>

              {/* <button
                type="button"
                onClick={handlePaymentButton}
                className="h-11 w-full rounded-[10px] bg-primary-light font-montserrat text-[16px] font-semibold text-white hover:bg-[#8e2b30]"
              >
                <span className="inline-flex items-center gap-2">
                  <CreditCard size={16} />
                  Pay Now
                </span>
              </button> */}
            </div>
          ) : activeMethod.code === "CASH" ? (
            <div className="mt-6 rounded-[10px] border border-white/15 bg-[#151515] p-4">
              <p className="font-montserrat text-[14px] text-white/85">
                Continue with {activeMethod.name} to complete your purchase securely in one step.
                <button
                type="button"
                onClick={handlePaymentButton}
                disabled={paymentUiBusy}
                className="mt-4 h-11 w-full rounded-[10px] bg-primary-light font-montserrat text-[16px] font-semibold text-white hover:bg-[#8e2b30] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continue with {activeMethod.name}
              </button>
              </p>
            </div>
          ) : activeMethod.code === "LOYALTY" ? (
            <div className="mt-6 rounded-[10px] border border-white/15 bg-[#151515] p-4">
              <p className="font-montserrat text-[14px] text-white/85">
                Continue with {activeMethod.name} to complete your purchase securely in one step.
                <button
                type="button"
                onClick={handlePaymentButton}
                disabled={paymentUiBusy}
                className="mt-4 h-11 w-full rounded-[10px] bg-primary-light font-montserrat text-[16px] font-semibold text-white hover:bg-[#8e2b30] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continue with {activeMethod.name}
              </button>
              </p>
            </div>
          ) : activeMethod.code === "WALLET" ? (
            <div className="mt-6 rounded-[10px] border border-white/15 bg-[#151515] p-4">
              <p className="font-montserrat text-[14px] text-white/85">
                Continue with {activeMethod.name} to complete your purchase securely in one step.
                <button
                type="button"
                onClick={handlePaymentButton}
                disabled={paymentUiBusy}
                className="mt-4 h-11 w-full rounded-[10px] bg-primary-light font-montserrat text-[16px] font-semibold text-white hover:bg-[#8e2b30] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continue with {activeMethod.name}
              </button>
              </p>
            </div>
          ) : activeMethod.code ? (
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
          ) : null} </>)}
        </section>
        {/* <BookingGiftCardSection /> */}
      </form>
    </div>
  );
}
