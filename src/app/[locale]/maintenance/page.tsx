import Partners from "@/components/Partners";
import { getHomePageData } from "@/services/homePageServer";
import { RefreshCcw, Clock, Phone, Mail } from "lucide-react";
import { Locale } from "@/i18n/config";


export default async function MaintenancePage({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const { partnerCategories } = await getHomePageData(locale as Locale);
    return (
        <main className="pt-30">
            <div className="relative flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-black text-white px-4">
                <div className="pointer-events-none absolute inset-0  bg-gradient-to-b from-[#060102] via-[#792327] to-black" />

                <section className="relative z-10 mx-auto flex w-full max-w-[800px] flex-col items-center text-center">
                    {/* Top Icon */}
                    <div className="mb-8 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#FFFFFF33] border border-white/15">
                        <RefreshCcw size={32} strokeWidth={1.5} className="text-white" />
                    </div>

                    {/* Headings */}
                    <h1 className="font-optima text-[36px] leading-[1.1] md:text-[52px]">Site Under Maintenance</h1>
                    <p className="mt-6 font-montserrat text-[15px] font-medium text-white/90 md:text-[17px]">
                        We&apos;re currently enhancing your digital experience to serve you better.
                    </p>
                    <p className="mt-3 max-w-[600px] font-montserrat text-[13px] leading-[1.6] text-white/60 md:text-[14px]">
                        Our website is temporarily unavailable while we perform scheduled<br className="hidden md:block" />
                        maintenance. We&apos;ll be back shortly.
                    </p>

                    {/* Expected Return Card */}
                    <div className="mt-10 w-full rounded-[16px] bg-[#1E1E1E] p-6 shadow-lg border border-white/5">
                        <div className="flex items-center justify-center gap-2">
                            <Clock size={16} className="text-[#BB2B32]" />
                            <span className="font-optima text-[18px]">Expected Return</span>
                        </div>
                        <p className="mt-4 font-montserrat text-[15px] font-medium text-white md:text-[16px]">
                            Tuesday, March 31, 2026 at 6:00 PM GST
                        </p>
                        <p className="mt-2 font-montserrat text-[12px] text-white/50">
                            Maintenance window: 2:00 PM - 6:00 PM GST
                        </p>
                    </div>

                    {/* Need Immediate Assistance Card */}
                    <div className="mt-6 w-full rounded-[16px] bg-surface p-6 md:p-10 shadow-lg border border-white/5">
                        <h2 className="font-optima text-[28px] md:text-[32px]">Need Immediate Assistance?</h2>
                        <p className="mt-2 font-montserrat text-[13px] text-white/60 md:text-[14px]">
                            Our reservations team is still available to help you
                        </p>

                        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                            {/* Call Us */}
                            <div className="flex flex-col items-center justify-center rounded-[12px] bg-[#323232] p-6 text-center transition-colors hover:bg-[#3c3c3c]">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/20">
                                    <Phone size={22} className="text-white" />
                                </div>
                                <h3 className="mb-1 font-montserrat text-[16px] leading-[24px] font-semibold text-white">Call Us</h3>
                                <p className="mb-2 font-montserrat text-[16px] leading-[23px] text-white">04 440 8888</p>
                                <p className="font-montserrat text-[13px] leading-[20px] text-[#FFFFFF99]">Daily 10:00 AM - 8:00 PM</p>
                            </div>

                            {/* Email Us */}
                            <div className="flex flex-col items-center justify-center rounded-[12px] bg-[#323232] p-6 text-center transition-colors hover:bg-[#3c3c3c]">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/20">
                                    <Mail size={22} className="text-white" />
                                </div>
                                <h3 className="mb-1 font-montserrat text-[16px] leading-[24px] font-semibold text-white">Email Us</h3>
                                <a
                                    href="mailto:boxoffice@dubaiopera.com"
                                    className="mb-2 block font-montserrat text-[16px] leading-[23px] text-white transition-opacity hover:opacity-80 md:text-[18px]"
                                >
                                    boxoffice@dubaiopera.com
                                </a>
                                <p className="font-montserrat text-[13px] leading-[20px] text-[#FFFFFF99]">Response within 24 hours</p>
                            </div>
                        </div>

                        <div className="my-8 h-[1px] w-full bg-white/10" />

                        <h4 className="mb-2 font-montserrat text-[13px] font-semibold text-white md:text-[14px]">
                            Existing Reservations
                        </h4>
                        <p className="mx-auto max-w-[650px] font-montserrat text-[12px] leading-[1.6] text-white/60 md:text-[13px]">
                            All confirmed reservations remain valid. If you have an upcoming booking and need to make changes, please
                            contact our team directly via phone or email.
                        </p>
                    </div>

                    {/* Bottom text */}
                    <p className="mt-10 font-montserrat text-[11px] text-white/40 md:text-[12px]">
                        Thank you for your patience as we improve our services
                    </p>
                </section>
            </div>



            <Partners partnerCategories={partnerCategories} />
        </main>
    );
}
