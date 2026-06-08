"use client";

import PhoneInputField from "@/components/PhoneInputField";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";

const fieldClassName =
    "h-11 w-full rounded-[10px] border border-[#3a3a3a] bg-[#1B1B1B] px-4 font-montserrat text-[13px] text-white placeholder:text-white/35 transition-colors focus:border-white/25 focus:outline-none";

const labelClassName =
    "mb-2 block font-montserrat text-[12px] font-normal leading-[100%] tracking-[0] text-white";

const errorClassName = "mt-1 text-[12px] text-red-400";

export default function SignupPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = use(params);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [mobile, setMobile] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        const newErrors: Record<string, string> = {};

        if (!firstName.trim()) {
            newErrors.firstName = "First name is required";
        }

        if (!lastName.trim()) {
            newErrors.lastName = "Last name is required";
        }

        if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Email is required";
        }

        if (!mobile) {
            newErrors.mobile = "Mobile number is required";
        }

        if (!password.trim()) {
            newErrors.password = "Password is required";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const submitData = { firstName, lastName, email, mobile, password };
        console.log("SIGNUP DATA:", submitData);
        router.push(`/${locale}/onboarding`);
    };

    return (
        <main
            className="relative flex min-h-screen flex-col overflow-hidden font-montserrat text-white selection:bg-white/20"
            style={{
                background:
                    "linear-gradient(180deg, #000000 0%, #040102 20%, #130405 47%, #371011 76%, #7A2427 100%)",
            }}
        >
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                <div
                    className="absolute inset-x-0 top-0 h-[42%]"
                    style={{
                        background:
                            "radial-gradient(circle at 50% 5%, rgba(122, 36, 39, 0.12), transparent 62%)",
                    }}
                />
                <div
                    className="absolute inset-x-0 bottom-0 h-[65%]"
                    style={{
                        background:
                            "radial-gradient(circle at 50% 82%, rgba(143, 42, 46, 0.28), transparent 58%)",
                    }}
                />
            </div>

            <header className="relative px-6 pb-2 pt-6 sm:px-8 md:px-12 md:pt-7">
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

            <div className="relative flex-1 px-5 pb-16 pt-8 sm:px-6 sm:pt-10 md:px-12 md:pt-14">
                <div className="mx-auto w-full">
                    <div className="grid w-full items-start gap-5 sm:gap-6 md:grid-cols-[1fr_minmax(0,582px)_1fr] md:gap-10">
                        <div className="md:justify-self-start md:pt-2">
                            <Link
                                href={`/${locale}`}
                                className="inline-flex items-center gap-2 text-[14px] font-medium text-white/80 transition-colors hover:text-white"
                            >
                                <ChevronLeft size={16} strokeWidth={2} />
                                Back
                            </Link>
                        </div>

                        <div className="mx-auto w-full max-w-[582px] md:mx-0 md:max-w-none">
                            <h1 className="mb-6 w-full max-w-[560px] font-optima text-[32px] leading-[34px] font-normal tracking-[0] text-white sm:mb-7 sm:text-[36px] sm:leading-[38px] md:text-[40px] md:leading-[40px]">
                                <span className="block sm:whitespace-nowrap">Access all Emaar brands with a</span>
                                <span className="block sm:whitespace-nowrap">single login.</span>
                            </h1>

                            <div className="w-full rounded-[20px] border border-[#2b2b2b] bg-[#1E1E1E] p-5 shadow-[0_18px_46px_rgba(0,0,0,0.35)] sm:p-6 md:p-[30px]">
                                <form className="space-y-4" onSubmit={handleSubmit}>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
                                        <div>
                                            <label className={labelClassName}>First Name</label>
                                            <input
                                                type="text"
                                                placeholder="First Name"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                className={fieldClassName}
                                            />
                                            {errors.firstName && <p className={errorClassName}>{errors.firstName}</p>}
                                        </div>

                                        <div>
                                            <label className={labelClassName}>Last Name</label>
                                            <input
                                                type="text"
                                                placeholder="Last Name"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                className={fieldClassName}
                                            />
                                            {errors.lastName && <p className={errorClassName}>{errors.lastName}</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClassName}>Email Address</label>
                                        <input
                                            type="email"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className={fieldClassName}
                                        />
                                        {errors.email && <p className={errorClassName}>{errors.email}</p>}
                                    </div>

                                    <PhoneInputField
                                        value={mobile}
                                        onChange={setMobile}
                                        error={errors.mobile}
                                        placeholder="Mobile number"
                                        variant="login"
                                    />

                                    <div>
                                        <label className={labelClassName}>Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Enter your Password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className={`${fieldClassName} pr-10`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 transition-colors hover:text-white"
                                                aria-label="Toggle password visibility"
                                            >
                                                {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                                            </button>
                                        </div>
                                        {errors.password && <p className={errorClassName}>{errors.password}</p>}
                                    </div>

                                    <div className="pt-1">
                                        <button
                                            type="submit"
                                            className="h-10 w-full cursor-pointer rounded-[10px] bg-[#8F2A2E] font-montserrat text-[15px] font-semibold leading-none text-white transition-colors hover:bg-[#7C2428]"
                                        >
                                            Create Account
                                        </button>
                                    </div>

                                    <div className="pt-1 text-center">
                                        <span className="text-[11px] text-white/75">
                                            Already have an account?{" "}
                                            <Link
                                                href={`/${locale}`}
                                                className="font-semibold text-white transition-colors hover:text-white/90"
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
