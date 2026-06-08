"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Eye, EyeOff, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import { use } from "react";
import PhoneInputField from "@/components/PhoneInputField";
import { useRouter } from "next/navigation";

const authLabelClassName =
    "block mb-2 font-montserrat text-[12px] font-normal leading-[100%] tracking-[0] text-white";

const authInputClassName =
    "h-11 w-full rounded-[10px] border border-[#3a3a3a] bg-[#1B1B1B] px-4 font-montserrat text-[13px] text-white placeholder:text-white/35 focus:outline-none focus:border-white/25 transition-colors";

export default function LoginPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = use(params);
    const [isMounted, setIsMounted] = useState(false);
    const [loginMethod, setLoginMethod] = useState<"mobile" | "email">("mobile");
    const [mobile, setMobile] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [rememberMe, setRememberMe] = useState<boolean>(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const router = useRouter();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        const newErrors: Record<string, string> = {};

        if (loginMethod === "mobile") {
            if (!mobile || mobile.trim() === "") {
                newErrors.mobile = "Mobile number is required";
            }
        } else {
            if (!email || email.trim() === "") {
                newErrors.email = "Email address is required";
            } else if (!/\S+@\S+\.\S+/.test(email)) {
                newErrors.email = "Please enter a valid email address.";
            }
        }

        if (!password || password.trim() === "") {
            newErrors.password = "Password is required";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const submitData = {
            loginMethod,
            identifier: loginMethod === "mobile" ? mobile : email,
            password,
            rememberMe
        };
        localStorage.setItem("user", JSON.stringify(submitData));
        console.log("LOGIN SUBMITTED DATA:", submitData);
        router.push(`/${locale}`);
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-[#000000] to-[#792327] flex flex-col font-montserrat text-white selection:bg-white/20">
            {/* Simplified Header */}
            <header className="flex items-center justify-between px-6 md:px-12 py-4">
                <Link href={`/${locale}`} className="w-16 h-14 block">
                    <Image
                        src="/logo/OperaWhite.avif"
                        alt="Dubai Opera Logo"
                        width={64}
                        height={56}
                        className="w-full h-full object-contain"
                    />
                </Link>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col lg:justify-center px-5 py-10 pb-16 sm:px-6 sm:py-12 md:px-12">
                <div className="w-full">
                    <div className="grid w-full items-start gap-5 sm:gap-6 md:grid-cols-[1fr_minmax(0,582px)_1fr] md:gap-10">
                        {/* Back */}
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
                            {/* Heading */}
                            <h1 className="mb-6 font-optima text-[28px] leading-[32px] font-normal text-white sm:mb-7 sm:text-[34px] sm:leading-[38px] md:text-[40px] md:leading-[40px]">
                                Access all Emaar brands with a single login.
                            </h1>

                            <div className="w-full rounded-[20px] border border-[#2b2b2b] bg-[#1E1E1E] p-5 shadow-[0_18px_46px_rgba(0,0,0,0.35)] sm:p-6 md:p-[30px]">
                                {/* Tab Selection */}
                                <div className="flex gap-3 mb-4 sm:mb-5">
                                    <button
                                        onClick={() => setLoginMethod("mobile")}
                                        className={`flex-1 h-9 cursor-pointer rounded-[8px] transition-colors sm:h-10 ${loginMethod === "mobile" ? "bg-[#792327] font-montserrat text-[13px] font-medium leading-[21px] tracking-[0] text-center text-white border-0 sm:text-[14px]" : "bg-[#1B1B1B] border border-[#3a3a3a] text-[11px] text-white/55 sm:text-[12px]"}`}
                                    >
                                        Mobile Number
                                    </button>
                                    <button
                                        onClick={() => setLoginMethod("email")}
                                        className={`flex-1 h-9 cursor-pointer rounded-[8px] transition-colors sm:h-10 ${loginMethod === "email" ? "bg-[#792327] font-montserrat text-[13px] font-medium leading-[21px] tracking-[0] text-center text-white border-0 sm:text-[14px]" : "bg-[#1B1B1B] border border-[#3a3a3a] text-[11px] text-white/55 sm:text-[12px]"}`}
                                    >
                                        Email Address
                                    </button>
                                </div>

                                <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>

                                    {errors.global && (
                                        <div className="rounded-[8px] border border-red-500/50 bg-red-500/10 p-3 text-center text-[12px] text-red-400">
                                            {errors.global}
                                        </div>
                                    )}

                                    {/* Dynamic Input Group */}
                                    {loginMethod === "mobile" ? (
                                        <PhoneInputField
                                            value={mobile}
                                            onChange={setMobile}
                                            error={errors.mobile}
                                            variant="login"
                                            placeholder="Mobile number"
                                        />
                                    ) : (
                                        <div className="space-y-2">
                                            <label className={authLabelClassName}>
                                                Email Address
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="email"
                                                    placeholder="Email Address"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className={`${authInputClassName} pr-10`}
                                                />
                                                <Mail size={16} strokeWidth={1.5} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 pointer-events-none" />
                                            </div>
                                            {errors.email && (
                                                <p className="text-[12px] text-red-400 mt-1">{errors.email}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Password Input */}
                                    <div className="space-y-2">
                                        <label className={authLabelClassName}>
                                            Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Enter your Password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className={`${authInputClassName} pr-10`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 hover:text-white transition-colors"
                                                aria-label="Toggle password visibility"
                                            >
                                                {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <p className="text-[12px] text-red-400 mt-1">{errors.password}</p>
                                        )}
                                    </div>

                                    {/* Remember & Forgot */}
                                    <div className="flex items-center justify-between pt-1">
                                        <label className="flex items-center gap-2 cursor-pointer group select-none">
                                            <div className={`h-4 w-4 rounded-[4px] border flex items-center justify-center transition-colors ${rememberMe ? "border-[#792327] bg-[#792327]" : "border-white/40 bg-transparent group-hover:border-white/70"}`}>
                                                {rememberMe && (
                                                    <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                    </svg>
                                                )}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={rememberMe}
                                                onChange={(e) => setRememberMe(e.target.checked)}
                                            />
                                            <span className="font-montserrat text-[12px] font-normal leading-[100%] tracking-[0] text-white/75 group-hover:text-white transition-colors">Remember Me</span>
                                        </label>
                                        <Link
                                            href={`/${locale}/reset-password`}
                                            className="text-[12px] text-white/75 transition-all hover:text-white hover:underline"
                                        >
                                            Forgot Password?
                                        </Link>
                                    </div>

                                    <div className="relative">
                                        <div aria-hidden="true" className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-[#3a3a3a]" />
                                        </div>
                                        <div className="relative flex justify-center text-[11px] font-medium">
                                            <span className="px-4 text-white/50 bg-[#1E1E1E]">
                                                OR
                                            </span>
                                        </div>
                                    </div>

                                    <Link
                                        href={`/api/auth/emaarpass/authorize?mode=register&locale=${encodeURIComponent(locale)}&returnTo=${encodeURIComponent(`/${locale}`)}`}
                                        className="w-full cursor-pointer flex h-11 items-center justify-center gap-2.5 rounded-[10px] border border-[#3a3a3a] bg-[#1B1B1B] px-4 transition-colors hover:border-white/30 hover:bg-[#242424]"
                                    >
                                        Continue with Emaar PASS
                                    </Link>
                                    <div className="relative">
                                        <div aria-hidden="true" className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-[#3a3a3a]" />
                                        </div>
                                        <div className="relative flex justify-center text-[11px] font-medium">
                                            <span className="px-4 text-white/50 bg-[#1E1E1E]">
                                                OR
                                            </span>
                                        </div>
                                    </div>

                                    {/* Social Buttons */}
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            {/* Google */}
                                            <button
                                                type="button"
                                                className="w-full flex h-11 items-center justify-center gap-2.5 rounded-[10px] border border-[#3a3a3a] bg-[#1B1B1B] px-4 transition-colors hover:border-white/30 hover:bg-[#242424]"
                                            >
                                                <Image src="/logo/google.png" alt="Google" width={18} height={18} className="h-[18px] w-[18px]" />
                                                <span className="font-montserrat text-[13px] font-normal leading-[21px] tracking-[0] text-center sm:text-[14px]">Continue with Google</span>
                                            </button>
                                            {/* Facebook */}
                                            <button
                                                type="button"
                                                className="flex h-11 w-full items-center justify-center gap-2.5 rounded-[10px] border border-[#3a3a3a] bg-[#1B1B1B] px-4 transition-colors hover:border-white/30 hover:bg-[#242424]"
                                            >
                                                <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                                                    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                                                        <path
                                                            fill="#1877F2"
                                                            d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073c0 6.019 4.388 11.008 10.125 11.927V15.562H7.078v-3.489h3.047V9.414c0-3.007 1.791-4.669 4.533-4.669 1.313 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.931-1.956 1.887v2.253h3.328l-.532 3.489h-2.796V24C19.612 23.081 24 18.092 24 12.073z"
                                                        />
                                                        <path
                                                            fill="#FFFFFF"
                                                            d="M16.671 15.562l.532-3.489h-3.329V9.82c0-.954.465-1.887 1.956-1.887h1.514V4.98s-1.373-.235-2.686-.235c-2.742 0-4.533 1.662-4.533 4.669v2.659H7.078v3.489h3.047V24c.607.097 1.229.146 1.875.146s1.268-.05 1.875-.146v-8.438h2.796z"
                                                        />
                                                    </svg>
                                                </span>
                                                <span className="font-montserrat text-[13px] font-normal leading-[21px] tracking-[0] text-center sm:text-[14px]">Continue with Facebook</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Login Button */}
                                    <div className="pt-1">
                                        <button
                                            type="submit"
                                            className="h-11 w-full rounded-[10px] bg-[#792327] font-montserrat text-[15px] font-medium leading-[26px] tracking-[0] text-white capitalize transition-colors hover:bg-[#792327]/90 sm:text-[16px]"
                                        >
                                            Login
                                        </button>
                                    </div>

                                    {/* Footer Form text */}
                                    <div className="text-center pt-1">
                                        <span className="text-[10px] text-white/70 sm:text-[11px]">
                                            You don&apos;t have an account yet? <Link href={`/${locale}/signup`} className="text-white font-semibold hover:underline underline-offset-4">Sign up</Link>
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

