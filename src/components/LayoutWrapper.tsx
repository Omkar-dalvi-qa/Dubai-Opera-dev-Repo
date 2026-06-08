"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import type { Locale } from "@/i18n/config";
import { ShopCartProvider } from "@/contexts/shop-flow/ShopCartContext";
import { AuthProvider } from "@/contexts/auth/AuthContext";
import type { WebsiteMenuItem } from "@/types/website";
import { Toaster } from "sonner";
import WebChannelApi from "@/components/WebChannelApi";

export default function LayoutWrapper({
    children,
    locale,
    headerMenuItems,
    footerMenuItems,
    socialMenuItems,
}: {
    children: React.ReactNode;
    locale: Locale;
    headerMenuItems?: WebsiteMenuItem[];
    footerMenuItems?: WebsiteMenuItem[];
    socialMenuItems?: WebsiteMenuItem[];
}) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isPayLaterPage =
        pathname === `/${locale}/paylater` || pathname.startsWith(`/${locale}/paylater/`);

    const hideNavbar = pathname === `/${locale}/login` || pathname === `/${locale}/signup` || pathname === `/${locale}/reset-password` || pathname === `/${locale}/verify-otp` || pathname === `/${locale}/create-new-password` || isPayLaterPage;
    const isBookingSeatsPage = pathname.includes("/booking/seats");
    const hideFooter =
        pathname === `/${locale}/login` ||
        pathname === `/${locale}/signup` ||
        pathname === `/${locale}/onboarding` ||
        pathname === `/${locale}/profile` ||
        pathname === `/${locale}/booking/booking-failed` ||
        isPayLaterPage ||
        isBookingSeatsPage;

    const isSeatLayoutEmbed =
        pathname.startsWith(`/${locale}/seat-layout/`) &&
        searchParams?.get("embed") === "1";

    return (
        <ShopCartProvider>
            <AuthProvider locale={locale}>
                <WebChannelApi />
                <Toaster richColors position="top-right" />
                {!hideNavbar && !isSeatLayoutEmbed && (
                    <Navbar locale={locale} menuItems={headerMenuItems} />
                )}
                {children}
                {!hideFooter && !isSeatLayoutEmbed && (
                    <Footer
                        locale={locale}
                        menuItems={footerMenuItems}
                        socialMenuItems={socialMenuItems}
                    />
                )}
            </AuthProvider>
        </ShopCartProvider>
    );
}
