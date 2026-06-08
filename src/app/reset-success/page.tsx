"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, CircleCheckBig } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

const STORAGE_SHOW_SUCCESS = "pw_reset_show_success";

export default function ResetSuccessPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = use(params);
    const router = useRouter();
    const [initialized, setInitialized] = useState(false);
    const [allowed, setAllowed] = useState(false);

    useEffect(() => {
        const ok = sessionStorage.getItem(STORAGE_SHOW_SUCCESS) === "1";
        setInitialized(true);
        if (!ok) {
            router.replace(`/${locale}`);
            return;
        }
        // Do not remove sessionStorage here — React Strict Mode remounts would clear it
        // and immediately redirect to login. Clear only when navigating to login.
        setAllowed(true);
    }, [locale, router]);

    const goToLogin = () => {
        try {
            sessionStorage.removeItem(STORAGE_SHOW_SUCCESS);
        } catch {
            /* ignore */
        }
        router.push(`/${locale}`);
    };


    const tips = [
        "Keep your password secure and don't share it with anyone",
        "Use a unique password for your Dubai Opera account",
        "Update your password regularly for enhanced security",
    ];

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

            <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 pb-20 sm:px-6 md:px-12">
                <div className="w-full max-w-[520px] space-y-5">
                    <div className="lg:rounded-[20px] lg:border border-[#2b2b2b] lg:bg-surface px-6 py-10 text-center lg:shadow-[0_18px_46px_rgba(0,0,0,0.35)] sm:px-10 sm:py-12">
                        <div className="mx-auto mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-emerald-500/15 sm:mb-8 sm:h-[80px] sm:w-[80px]">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/25 sm:h-14 sm:w-14">
                                <CircleCheckBig
                                    className="text-[#4ade80]"
                                    size={32}
                                    strokeWidth={3}
                                    aria-hidden
                                />
                            </div>
                        </div>

                        <h1 className="mb-4 font-optima text-[40px] leading-[100%] font-normal  text-white sm:text-[30px] md:text-[34px]">
                            Password Reset Successfully
                        </h1>

                        <p className="mb-8 font-montserrat text-[14px] leading-relaxed text-[#b0b0b0] sm:mb-10 sm:text-[15px]">
                            Your password has been successfully reset. You can now log in with your new password.
                        </p>

                        <button
                            type="button"
                            onClick={goToLogin}
                            className="h-12 w-full rounded-[10px] bg-[#792327] font-montserrat text-[15px] font-semibold text-white transition-colors hover:bg-[#702d2d]/90 sm:h-[52px] sm:text-[16px]"
                        >
                            Back to Login
                        </button>
                    </div>

                    <div className="rounded-[16px] border border-[#792327]/40 bg-[#00000033] px-5 py-5 backdrop-blur-sm sm:px-6 sm:py-6">
                        <p className="mb-4 font-montserrat text-[14px] font-bold text-white sm:text-[15px]">
                            Security Tips:
                        </p>
                        <ul className="space-y-3 text-left">
                            {tips.map((tip) => (
                                <li
                                    key={tip}
                                    className="flex gap-3 font-montserrat text-[12px] leading-relaxed text-white/85 sm:text-[13px]"
                                >
                                    <span
                                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[#4ade80]"
                                        aria-hidden
                                    >
                                        <CircleCheckBig size={12} strokeWidth={3} />
                                    </span>
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </main>
    );
}
