"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const OTP_LEN = 6;
const RESEND_SECONDS = 59;

const STORAGE_DEST = "otp_verify_destination";
const STORAGE_METHOD = "otp_verify_method";
const STORAGE_OTP_VERIFIED = "pw_reset_otp_verified";

export default function VerifyOtpPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = use(params);
    const router = useRouter();
    const [initialized, setInitialized] = useState(false);
    const [destination, setDestination] = useState<string | null>(null);
    const [digits, setDigits] = useState<string[]>(() => Array(OTP_LEN).fill(""));
    const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
    const [verifyError, setVerifyError] = useState("");
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        const dest = sessionStorage.getItem(STORAGE_DEST);
        setInitialized(true);
        if (!dest) {
            router.replace(`/${locale}/reset-password`);
            return;
        }
        setDestination(dest);
    }, [locale, router]);

    useEffect(() => {
        const id = window.setInterval(() => {
            setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
        }, 1000);
        return () => window.clearInterval(id);
    }, []);

    const focusIndex = useCallback((i: number) => {
        const el = inputRefs.current[i];
        if (el) {
            el.focus();
            el.select();
        }
    }, []);

    const handleChange = (index: number, raw: string) => {
        setVerifyError("");
        const v = raw.replace(/\D/g, "").slice(-1);
        setDigits((prev) => {
            const next = [...prev];
            next[index] = v;
            return next;
        });
        if (v && index < OTP_LEN - 1) {
            focusIndex(index + 1);
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace") {
            if (digits[index]) {
                setDigits((prev) => {
                    const next = [...prev];
                    next[index] = "";
                    return next;
                });
            } else if (index > 0) {
                focusIndex(index - 1);
                setDigits((prev) => {
                    const next = [...prev];
                    next[index - 1] = "";
                    return next;
                });
            }
            e.preventDefault();
        }
        if (e.key === "ArrowLeft" && index > 0) {
            focusIndex(index - 1);
            e.preventDefault();
        }
        if (e.key === "ArrowRight" && index < OTP_LEN - 1) {
            focusIndex(index + 1);
            e.preventDefault();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LEN);
        if (!text) return;
        const next = Array(OTP_LEN)
            .fill("")
            .map((_, i) => text[i] ?? "");
        setDigits(next);
        setVerifyError("");
        const lastFilled = Math.min(text.length, OTP_LEN) - 1;
        focusIndex(lastFilled >= 0 ? lastFilled : 0);
    };

    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        const code = digits.join("");
        if (code.length !== OTP_LEN) {
            setVerifyError("Please enter the full 6-digit code.");
            return;
        }
        setVerifyError("");
        console.log("VERIFY OTP:", { destination, code });
        try {
            sessionStorage.setItem(STORAGE_OTP_VERIFIED, "1");
            sessionStorage.removeItem(STORAGE_DEST);
            sessionStorage.removeItem(STORAGE_METHOD);
        } catch {
            /* ignore */
        }
        router.push(`/${locale}/create-new-password`);
    };

    const handleResend = () => {
        if (secondsLeft > 0) return;
        console.log("RESEND OTP to:", destination);
        setSecondsLeft(RESEND_SECONDS);
        setDigits(Array(OTP_LEN).fill(""));
        focusIndex(0);
    };

    const mm = Math.floor(secondsLeft / 60);
    const ss = secondsLeft % 60;
    const timerLabel = `${mm}:${ss.toString().padStart(2, "0")}`;


    return (
        <main className="relative flex min-h-screen flex-col overflow-hidden font-montserrat text-white selection:bg-white/20">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#000000] via-[#080304] to-[#792327]"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%]"
                style={{
                    background:
                        "radial-gradient(ellipse 80% 70% at 50% 100%, rgba(121, 35, 39, 0.35), transparent 70%)",
                }}
            />

            <header className="relative flex items-center justify-between px-6 py-4 md:px-12">
                <Link href={`/${locale}`} className="block h-14 w-16">
                    <Image
                        src="/logo/OperaWhite.avif"
                        alt="Dubai Opera Logo"
                        width={64}
                        height={56}
                        className="h-full w-full object-contain"
                    />
                </Link>
            </header>

            <div className="relative flex flex-1 flex-col lg:justify-center px-5 py-10 pb-16 sm:px-6 sm:py-12 md:px-12">
                <div className="w-full">
                    <div className="grid w-full items-start gap-5 sm:gap-6 md:grid-cols-[1fr_minmax(0,582px)_1fr] md:gap-10">
                        <div className="md:justify-self-start md:pt-2">
                            <Link
                                href={`/${locale}/reset-password`}
                                className="inline-flex items-center gap-2 text-[13px] font-medium text-white/70 transition-colors hover:text-white sm:text-[14px]"
                            >
                                <ChevronLeft size={18} strokeWidth={2} />
                                Back
                            </Link>
                        </div>

                        <div className="mx-auto w-full max-w-[582px] md:mx-0 md:max-w-none">
                            <h1 className="mb-6 text-start font-optima text-[28px] font-normal leading-tight text-white sm:mb-7 sm:text-[34px] md:text-[40px] md:leading-[40px]">
                                Verify Your Identity
                            </h1>

                            <div className="mx-auto w-full rounded-[16px] border border-[#2b2b2b] bg-[#1E1E1E] p-6 shadow-[0_18px_46px_rgba(0,0,0,0.35)] sm:p-8">
                                <div className="mb-8 text-center">
                                    <p className="font-montserrat text-[13px] leading-relaxed text-white/65 sm:text-[14px]">
                                        We&apos;ve sent a 6-digit verification code to
                                    </p>
                                    <p className="mt-2 font-montserrat text-[15px] font-semibold text-white sm:text-[16px]">
                                        {destination}
                                    </p>
                                </div>

                                <form onSubmit={handleVerify} className="space-y-6">
                                    <div>
                                        <label
                                            htmlFor="otp-0"
                                            className="mb-3 block font-montserrat text-[12px] font-normal text-white"
                                        >
                                            Enter Verification Code
                                        </label>
                                        <div className="flex justify-center gap-2 sm:gap-3 w-full">
                                            {digits.map((d, i) => (
                                                <input
                                                    key={i}
                                                    id={i === 0 ? "otp-0" : undefined}
                                                    ref={(el) => {
                                                        inputRefs.current[i] = el;
                                                    }}
                                                    type="text"
                                                    inputMode="numeric"
                                                    autoComplete={i === 0 ? "one-time-code" : "off"}
                                                    maxLength={1}
                                                    value={d}
                                                    onChange={(e) => handleChange(i, e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(i, e)}
                                                    onPaste={i === 0 ? handlePaste : undefined}
                                                    onFocus={(e) => e.target.select()}
                                                    className="h-[45px] w-[45px] rounded-md border border-[#494949] bg-[#0000004D] text-center font-montserrat text-[18px] font-medium text-white outline-none transition-colors focus:border-white/35 sm:h-[70px] sm:w-[70px] sm:text-[20px]"
                                                    aria-label={`Digit ${i + 1} of ${OTP_LEN}`}
                                                />
                                            ))}
                                        </div>
                                        {verifyError && (
                                            <p className="mt-2 text-center text-[12px] text-red-400">
                                                {verifyError}
                                            </p>
                                        )}
                                    </div>

                                    <div className="text-center font-montserrat text-[13px] text-white/75 sm:text-[14px]">
                                        {secondsLeft > 0 ? (
                                            <>
                                                Resend code in{" "}
                                                <span className="font-semibold text-[#e85d5d]">
                                                    {timerLabel}
                                                </span>
                                            </>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleResend}
                                                className="font-medium text-white underline-offset-2 transition-colors hover:text-white hover:underline"
                                            >
                                                Resend code
                                            </button>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        className="h-12 w-full rounded-[10px] bg-[#792327] font-montserrat text-[15px] font-semibold text-white transition-colors hover:bg-[#792327]/90 sm:text-[16px] cursor-pointer"
                                    >
                                        Verify Code
                                    </button>
                                </form>

                                <p className="mt-6 text-center font-montserrat text-[11px] leading-relaxed text-white/55 sm:text-[12px]">
                                    Didn&apos;t receive the code? Check your spam folder or{" "}
                                    <Link
                                        href={`/${locale}/contact-us`}
                                        className="font-medium text-white/85 underline-offset-2 transition-colors hover:text-white hover:underline"
                                    >
                                        contact support
                                    </Link>
                                </p>
                            </div>
                        </div>

                        <div className="hidden md:block" aria-hidden="true" />
                    </div>
                </div>
            </div>
        </main>
    );
}
