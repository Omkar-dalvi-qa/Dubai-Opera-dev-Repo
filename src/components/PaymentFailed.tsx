"use client";

import { AlertCircle, AlertTriangle, ArrowLeft, CreditCard } from "lucide-react";
import React, { useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { clearBookingSessionStorage } from "@/contexts/program-booking/bookingStorage";

interface PaymentFailedProps {
  transactionId?: string;
  orderId?: string;
  failureReason?: string;
  status?: string;
  dateTime?: string;
}

const PaymentFailed: React.FC<PaymentFailedProps> = ({
  transactionId,
  orderId,
  failureReason,
  status,
  dateTime,
}) => {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale || "en";
  const searchParams = useSearchParams();
  const queryTransactionId = searchParams.get("transaction_id")?.trim();
  const queryOrderId = searchParams.get("order_id")?.trim();
  const queryMessage = searchParams.get("message")?.trim();
  const queryStatus = searchParams.get("status")?.trim();
  const queryDateTime = searchParams.get("date_time")?.trim();

  const resolvedTransactionId = queryTransactionId || transactionId || "-";
  const resolvedOrderId = queryOrderId || orderId || "-";
  const failureReasonMessage = queryMessage || failureReason || "Payment could not be processed.";
  const resolvedStatus = queryStatus || status || "FAILURE";
  const resolvedDateTime =
    queryDateTime || dateTime || new Date().toLocaleString();

  useEffect(() => {
    clearBookingSessionStorage();
  }, []);

  return (
      <div className="">
      <div className="flex min-h-[calc(100vh-182px)] items-center justify-center">
        <div className="w-full max-w-[600px] overflow-hidden overflow-y-auto  rounded-[20px] bg-surface px-5 py-5 shadow-2xl">
          <div className="mb-3 flex justify-center">
            <div className="group relative flex h-10 w-10 items-center justify-center">
              <div className="absolute inset-0 scale-150 animate-pulse rounded-full bg-[#FF4D4D]/10" />
              <AlertTriangle size={39} className="text-[#FB2C36]" strokeWidth={2.5} />
            </div>
          </div>

          <div className="mb-1 text-center">
            <h1 className="font-inter text-[25px] font-bold leading-[32px] tracking-tight text-white">
              Payment Failed
            </h1>
            <p className="font-inter text-[16px] leading-[29px] text-[#FFFFFFB2]">
              Unfortunately, your booking could not be completed
            </p>
          </div>

          <div className="mb-2 rounded-[24px] bg-[#151515] p-5 shadow-inner border border-[#7923274D]">
            <div className="mb-2 flex items-start gap-4">
              <CreditCard size={20} className="text-[#FF4D4D]" />
              <div className="flex flex-col">
                <h2 className="font-inter text-[18px] leading-[27px] font-semibold text-white">Transaction Declined</h2>
                <p className="font-inter text-[14px] leading-[20px] text-[#777777]">
                  Your payment could not be processed ({resolvedStatus})
                </p>
                {/* "Your payment could not be processed" */}
              </div>
            </div>
            <div className="rounded-[16px] border border-[#792327] bg-[#79232733] p-5">
              <div className="mb-1 flex items-center gap-2">
                <AlertCircle size={18} className="text-[#FF4D4D]" />
                <h3 className="font-inter text-[15px] font-semibold text-white">Reason:</h3>
              </div>
              <p className="font-inter text-[14px] leading-[20px] text-[#FFFFFF99]">{failureReasonMessage}</p>
              {/* <ul className="space-y-1.5 pl-4">
                {[
                  failureReasonMessage,
                  "Invalid or expired card details",
                  "Insufficient funds in your account",
                  "Card limit exceeded",
                  "Incorrect CVV or security code",
                  "Technical error during processing",
                ].map((issue, i) => (
                  <li key={i} className="flex items-center gap-2 font-inter text-[14px] leading-[20px] text-[#FFFFFF99]">
                    <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-[#FFFFFF99]" />
                    {issue}
                  </li>
                ))}
              </ul> */}
            </div>
          </div>

          <div className="mb-3 space-y-1 rounded-[20px] border border-[#494949] p-3 bg-[#161616]">
            <div className="flex items-center justify-between font-inter text-sm">
              <span className="text-[#FFFFFF99] text-[16px] leading-[24px]">Transaction ID:</span>
              <span className="font-bold tracking-wider text-white">{resolvedTransactionId}</span>
            </div>
            <div className="flex items-center justify-between font-inter text-sm">
              <span className="text-[#FFFFFF99] text-[16px] leading-[24px]">Order ID:</span>
              <span className="font-bold tracking-wider text-white">{resolvedOrderId}</span>
            </div>
            <div className="flex items-center justify-between font-inter text-sm">
              <span className="text-[#FFFFFF99] text-[16px] leading-[24px]">Date & Time:</span>
              <span className="font-bold text-white">{resolvedDateTime}</span>
            </div>
          </div>

          <div className="mb-2 flex flex-col gap-4 sm:flex-row">
            <Link
              href={`/${locale || "en"}`}
              onClick={clearBookingSessionStorage}
              className="flex flex-1 items-center justify-center gap-3 rounded-[10px] bg-[#FFFFFF1A] py-3 font-inter text-[16px] leading-[24px] font-medium text-white transition-all hover:bg-[#2A2A2A] active:scale-[0.98] cursor-pointer"
            >
              <ArrowLeft size={18} />
              Go Back
            </Link>
          </div>

          <div className="border-t border-white/5 pt-2 text-center font-montserrat text-[12px] leading-[16px] text-[#FFFFFF80]">
            Need help? Contact our support team at{" "}
            <a href="mailto:support@dubaiopera.com" className="font-medium text-[#BB2B32] hover:underline decoration-[#FF4D4D]/30 underline-offset-4 transition-colors hover:text-[#FF6666] hover:decoration-[#FF6666]">
              support@dubaiopera.com
            </a>{" "}
            or call{" "}
            <a href="tel:+97144408888" className="font-medium text-[FFFFFF80] hover:text-white transition-colors">
              +971 4 440 8888
            </a>
            {/* "Need help? Contact our support team..." */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;
