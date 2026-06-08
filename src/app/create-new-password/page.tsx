"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, ChevronLeft, Eye, EyeOff, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";

const STORAGE_OTP_VERIFIED = "pw_reset_otp_verified";
const STORAGE_SHOW_SUCCESS = "pw_reset_show_success";

const labelClass =
    "mb-2 block font-montserrat text-[12px] font-normal leading-[100%] tracking-[0] text-white";

const inputClass =
    "h-11 w-full rounded-[10px] border border-[#3a3a3a] bg-[#1B1B1B] px-4 font-montserrat text-[13px] text-white placeholder:text-white/35 transition-colors focus:outline-none focus:border-white/25";

function evaluatePassword(pw: string) {
    return {
        length: pw.length >= 8,
        upper: /[A-Z]/.test(pw),
        lower: /[a-z]/.test(pw),
        number: /[0-9]/.test(pw),
        special: /[^A-Za-z0-9]/.test(pw),
    };
}

function RequirementRow({
    protocol,
    children,
}: {
    protocol: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-center gap-2 font-montserrat text-[12px] leading-tight sm:text-[13px]">
            <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    protocol ? "text-[#00C950]" : "text-white/35"
                }`}
                aria-hidden
            >
                {protocol ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={2.5} />}
            </span>
            <span className={protocol ? "text-white/90" : "text-white/45"}>{children}</span>
        </div>
    );
}

export default function CreateNewPasswordPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = use(params);
    const router = useRouter();
    const [initialized, setInitialized] = useState(false);
    const [allowed, setAllowed] = useState(false);

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [submitError, setSubmitError] = useState("");

    useEffect(() => {
        const ok = sessionStorage.getItem(STORAGE_OTP_VERIFIED) === "1";
        setInitialized(true);
        if (!ok) {
            router.replace(`/${locale}/reset-password`);
            return;
        }
        setAllowed(true);
    }, [locale, router]);

    const checks = useMemo(() => evaluatePassword(password), [password]);

    const allRequirementsMet =
        checks.length && checks.upper && checks.lower && checks.number && checks.special;

    const confirmTouched = confirm.length > 0;
    const passwordsMatch = password.length > 0 && confirm.length > 0 && password === confirm;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError("");

        if (!allRequirementsMet) {
            setSubmitError("Please meet all password requirements.");
            return;
        }
        if (!passwordsMatch) {
            setSubmitError("Passwords do not match.");
            return;
        }

        console.log("CREATE NEW PASSWORD — submit");
        try {
            sessionStorage.setItem(STORAGE_SHOW_SUCCESS, "1");
            sessionStorage.removeItem(STORAGE_OTP_VERIFIED);
        } catch {
            /* ignore */
        }
        router.push(`/${locale}/reset-success`);
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
                                href={`/${locale}/verify-otp`}
                                className="inline-flex items-center gap-2 text-[13px] font-medium text-white/70 transition-colors hover:text-white sm:text-[14px]"
                            >
                                <ChevronLeft size={18} strokeWidth={2} />
                                Back
                            </Link>
                        </div>

                        <div className="mx-auto w-full max-w-[582px] md:mx-0 md:max-w-none">
                            <h1 className="mb-6 text-start font-optima text-[28px] font-normal leading-tight text-white sm:mb-7 sm:text-[34px] md:text-[40px] md:leading-[40px]">
                                Create New Password
                            </h1>

                            <div className="w-full rounded-[20px] border border-[#2b2b2b] bg-[#1E1E1E] p-5 shadow-[0_18px_46px_rgba(0,0,0,0.35)] sm:p-6 md:p-[30px]">
                                <p className="mb-5 font-montserrat text-[12px] leading-relaxed text-white/65 sm:mb-6 sm:text-[13px]">
                                    Your new password must be different from previously used passwords.
                                </p>

                                <form className="space-y-5" onSubmit={handleSubmit}>
                                    <div className="space-y-2">
                                        <label className={labelClass} htmlFor="new-password">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="new-password"
                                                type={showPassword ? "text" : "password"}
                                                autoComplete="new-password"
                                                value={password}
                                                onChange={(e) => {
                                                    setPassword(e.target.value);
                                                    setSubmitError("");
                                                }}
                                                className={`${inputClass} pr-10`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((v) => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 transition-colors hover:text-white"
                                                aria-label="Toggle new password visibility"
                                            >
                                                {showPassword ? (
                                                    <EyeOff size={16} strokeWidth={1.5} />
                                                ) : (
                                                    <Eye size={16} strokeWidth={1.5} />
                                                )}
                                            </button>
                                        </div>

                                        <div className="rounded-[10px] border border-[#2f2f2f] bg-[#181818] p-4">
                                            <p className="mb-3 font-montserrat text-[12px] font-medium text-white/80 sm:text-[13px]">
                                                Password must contain:
                                            </p>
                                            <div className="space-y-2">
                                                <RequirementRow protocol={checks.length}>
                                                    At least 8 characters
                                                </RequirementRow>
                                                <RequirementRow protocol={checks.upper}>
                                                    Contains uppercase letter
                                                </RequirementRow>
                                                <RequirementRow protocol={checks.lower}>
                                                    Contains lowercase letter
                                                </RequirementRow>
                                                <RequirementRow protocol={checks.number}>
                                                    Contains number
                                                </RequirementRow>
                                                <RequirementRow protocol={checks.special}>
                                                    Contains special character
                                                </RequirementRow>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className={labelClass} htmlFor="confirm-password">
                                            Confirm New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="confirm-password"
                                                type={showConfirm ? "text" : "password"}
                                                autoComplete="new-password"
                                                placeholder="Re-enter your new password"
                                                value={confirm}
                                                onChange={(e) => {
                                                    setConfirm(e.target.value);
                                                    setSubmitError("");
                                                }}
                                                className={`${inputClass} pr-10`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirm((v) => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 transition-colors hover:text-white"
                                                aria-label="Toggle confirm password visibility"
                                            >
                                                {showConfirm ? (
                                                    <EyeOff size={16} strokeWidth={1.5} />
                                                ) : (
                                                    <Eye size={16} strokeWidth={1.5} />
                                                )}
                                            </button>
                                        </div>
                                        {confirmTouched && (
                                            <p
                                                className={`text-[12px] ${
                                                    passwordsMatch
                                                        ? "text-emerald-400"
                                                        : "text-red-400"
                                                }`}
                                                role="status"
                                            >
                                                {passwordsMatch
                                                    ? "Password match"
                                                    : "Password doesn't match"}
                                            </p>
                                        )}
                                    </div>

                                    {submitError && (
                                        <p className="text-center text-[12px] text-red-400">
                                            {submitError}
                                        </p>
                                    )}

                                    <button
                                        type="submit"
                                        className="h-12 w-full rounded-[10px] bg-[#702424] font-montserrat text-[15px] font-semibold text-white transition-colors hover:bg-[#702424]/90 sm:text-[16px]"
                                    >
                                        Reset Password
                                    </button>
                                </form>
                            </div>
                        </div>

                        <div className="hidden md:block" aria-hidden="true" />
                    </div>
                </div>
            </div>
        </main>
    );
}
