"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import PhoneInputField from "@/components/PhoneInputField";

const STORAGE_DEST = "otp_verify_destination";
const STORAGE_METHOD = "otp_verify_method";

const authLabelClassName =
    "block mb-2 font-montserrat text-[12px] font-normal leading-[100%] tracking-[0] text-white";

const authInputClassName =
    "h-11 w-full rounded-[10px] border border-[#3a3a3a] bg-[#1B1B1B] px-4 font-montserrat text-[13px] text-white placeholder:text-white/35 focus:outline-none focus:border-white/25 transition-colors";

/** Reasonable RFC 5322–style check; rejects obvious junk without being overly strict. */
const EMAIL_RE =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

function validateEmailForReset(raw: string): string | undefined {
    const email = raw.trim();
    if (!email) return "Email address is required.";
    if (email.length > 254) return "Email address is too long.";
    if (/\s/.test(email)) return "Email address cannot contain spaces.";
    if (!EMAIL_RE.test(email)) return "Please enter a valid email address.";
    return undefined;
}

function validateMobileForReset(raw: string): string | undefined {
    const mobile = raw.trim();
    if (!mobile) return "Mobile number is required.";
    if (!mobile.startsWith("+")) {
        return "Please enter a complete number with country code.";
    }
    const digits = mobile.replace(/\D/g, "");
    if (digits.length < 8) return "Mobile number is too short.";
    if (digits.length > 15) return "Mobile number is too long.";
    return undefined;
}

export default function ResetPasswordPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = use(params);
    const router = useRouter();
    const [resetMethod, setResetMethod] = useState<"mobile" | "email">("mobile");
    const [mobile, setMobile] = useState("");
    const [email, setEmail] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        const newErrors: Record<string, string> = {};

        if (resetMethod === "mobile") {
            const msg = validateMobileForReset(mobile);
            if (msg) newErrors.mobile = msg;
        } else {
            const msg = validateEmailForReset(email);
            if (msg) newErrors.email = msg;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const identifier = resetMethod === "mobile" ? mobile.trim() : email.trim();
        console.log("RESET PASSWORD — send verification code:", {
            method: resetMethod,
            identifier,
        });
        try {
            sessionStorage.setItem(STORAGE_DEST, identifier);
            sessionStorage.setItem(STORAGE_METHOD, resetMethod);
        } catch {
            /* ignore quota / private mode */
        }
        router.push(`/${locale}/verify-otp`);
    };

    const switchTab = (method: "mobile" | "email") => {
        setResetMethod(method);
        setErrors({});
    };

    return (
        <main className="flex min-h-screen flex-col bg-gradient-to-b from-[#000000] to-[#792327] font-montserrat text-white selection:bg-white/20">
            <header className="flex items-center justify-between px-6 py-4 md:px-12">
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

            <div className="flex flex-1 flex-col lg:justify-center px-5 py-10 pb-16 sm:px-6 sm:py-12 md:px-12">
                <div className="w-full">
                    <div className="grid w-full items-start gap-5 sm:gap-6 md:grid-cols-[1fr_minmax(0,582px)_1fr] md:gap-10">
                        <div className="md:justify-self-start md:pt-2">
                            <Link
                                href={`/${locale}`}
                                className="inline-flex items-center gap-2 text-[13px] font-medium text-white/70 transition-colors hover:text-white sm:text-[14px]"
                            >
                                <ChevronLeft size={18} strokeWidth={2} />
                                Back
                            </Link>
                        </div>

                        <div className="mx-auto w-full max-w-[582px] md:mx-0 md:max-w-none">
                            <h1 className="mb-6 text-start font-optima text-[28px] font-normal leading-tight text-white sm:mb-7 sm:text-[34px] md:text-[40px] md:leading-[40px]">
                                Reset Your Password
                            </h1>

                            <div className="w-full rounded-[20px] border border-[#2b2b2b] bg-[#1E1E1E] p-5 shadow-[0_18px_46px_rgba(0,0,0,0.35)] sm:p-6 md:p-[30px]">
                                <p className="mb-4 font-montserrat text-[12px] leading-relaxed text-white/70 sm:mb-5 sm:text-[13px]">
                                    Enter your registered mobile number or email address and we&apos;ll send you a
                                    verification code to reset your password.
                                </p>

                                <div className="mb-4 flex gap-3 sm:mb-5">
                                    <button
                                        type="button"
                                        onClick={() => switchTab("mobile")}
                                        className={`h-9 flex-1 cursor-pointer rounded-[8px] transition-colors sm:h-10 ${
                                            resetMethod === "mobile"
                                                ? "border-0 bg-[#792327] text-center font-montserrat text-[13px] font-medium leading-[21px] tracking-[0] text-white sm:text-[14px]"
                                                : "border border-[#3a3a3a] bg-[#1B1B1B] text-[11px] text-white/55 sm:text-[12px]"
                                        }`}
                                    >
                                        Mobile Number
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => switchTab("email")}
                                        className={`h-9 flex-1 cursor-pointer rounded-[8px] transition-colors sm:h-10 ${
                                            resetMethod === "email"
                                                ? "border-0 bg-[#792327] text-center font-montserrat text-[13px] font-medium leading-[21px] tracking-[0] text-white sm:text-[14px]"
                                                : "border border-[#3a3a3a] bg-[#1B1B1B] text-[11px] text-white/55 sm:text-[12px]"
                                        }`}
                                    >
                                        Email Address
                                    </button>
                                </div>

                                <form
                                    className="space-y-4 sm:space-y-5"
                                    onSubmit={handleSubmit}
                                    noValidate
                                >
                                    {resetMethod === "mobile" ? (
                                        <PhoneInputField
                                            value={mobile}
                                            onChange={(v) => {
                                                setMobile(v);
                                                setErrors((p) => ({ ...p, mobile: "" }));
                                            }}
                                            error={errors.mobile}
                                            variant="login"
                                            placeholder="Mobile number"
                                        />
                                    ) : (
                                        <div className="space-y-2">
                                            <label className={authLabelClassName}>Email Address</label>
                                            <div className="relative">
                                                <input
                                                    type="email"
                                                    autoComplete="email"
                                                    placeholder="Enter your Email Address"
                                                    value={email}
                                                    onChange={(e) => {
                                                        setEmail(e.target.value);
                                                        setErrors((p) => ({ ...p, email: "" }));
                                                    }}
                                                    aria-invalid={Boolean(errors.email)}
                                                    className={`${authInputClassName} pr-10 ${errors.email ? "border-red-500/70" : ""}`}
                                                />
                                                <Mail
                                                    size={16}
                                                    strokeWidth={1.5}
                                                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/45"
                                                    aria-hidden
                                                />
                                            </div>
                                            {errors.email && (
                                                <p className="mt-1 text-[12px] text-red-400">{errors.email}</p>
                                            )}
                                        </div>
                                    )}

                                    <div className="pt-1">
                                        <button
                                            type="submit"
                                            className="h-11 w-full rounded-[10px] bg-[#792327] font-montserrat text-[15px] font-medium leading-[26px] tracking-[0] text-white transition-colors hover:bg-[#792327]/90 sm:h-12 sm:text-[16px] cursor-pointer"
                                        >
                                            Send Verification Code
                                        </button>
                                    </div>

                                    <div className="pt-1 text-center">
                                        <span className="text-[10px] text-white/70 sm:text-[11px]">
                                            Remember your password?{" "}
                                            <Link
                                                href={`/${locale}`}
                                                className="font-semibold text-white underline-offset-4 hover:underline"
                                            >
                                                Login
                                            </Link>
                                        </span>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div className="hidden md:block" />
                    </div>
                </div>
            </div>
        </main>
    );
}
