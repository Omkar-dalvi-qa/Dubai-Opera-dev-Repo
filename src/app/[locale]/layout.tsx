import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import LayoutWrapper from "@/components/LayoutWrapper";
import { isValidLocale, type Locale } from "@/i18n/config";
import { notFound } from "next/navigation";
import BfcacheHandler from "@/components/BfcacheHandler";
import BookingSessionStorageSync from "@/components/programs/BookingSessionStorageSync";
import NavigationScrollTop from "@/components/NavigationScrollTop";
import { getMenu } from "@/services/websiteServer";
import StructuredData from "@/components/StructuredData";
import { getOrganizationSchema, getWebsiteSchema } from "@/lib/seo/schema";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

const playfair = Playfair_Display({
    variable: "--font-playfair",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Dubai Opera | House of Cultures",
    description: "Discover Dubai Opera - House of Cultures",
    icons: {
        icon: "https://dubaiopera.com/media/favicon.ico",
        shortcut: "https://dubaiopera.com/media/favicon.ico",
        apple: "https://dubaiopera.com/media/favicon.ico",
    },
};

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    if (!isValidLocale(locale)) {
        notFound();
    }

    const validLocale = locale as Locale;
    const dir = validLocale === "ar" ? "rtl" : "ltr";
    const [organizationSchema, websiteSchema] = await Promise.all([
        getOrganizationSchema(validLocale),
        getWebsiteSchema(validLocale),
    ]);
    const messages = await getMessages({ locale: validLocale });

    const [headerMenu, footerMenu, socialMenu] = await Promise.all([
        getMenu("header",validLocale),
        getMenu("footer",validLocale),
        getMenu("social",validLocale),
    ]);

    return (
        <div
            dir={dir}
            className={`${inter.variable} ${playfair.variable} antialiased`}
        >
            <StructuredData
                schemas={[
                    organizationSchema,
                    websiteSchema,
                ]}
            />
            <NextIntlClientProvider locale={validLocale} messages={messages}>
                <BfcacheHandler />
                <BookingSessionStorageSync />
                <NavigationScrollTop />
                <LayoutWrapper
                    locale={validLocale}
                    headerMenuItems={headerMenu?.items ?? []}
                    footerMenuItems={footerMenu?.items ?? []}
                    socialMenuItems={socialMenu?.items ?? []}
                >
                    {children}
                </LayoutWrapper>
            </NextIntlClientProvider>
        </div>
    );
}
