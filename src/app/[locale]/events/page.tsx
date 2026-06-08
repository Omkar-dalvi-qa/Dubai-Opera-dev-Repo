
import SeasonSection from "@/components/SeasonSection";
import Partners from "@/components/Partners";
import { LONG_REVALIDATE_SECONDS } from "@/app/[locale]/RevalidateConstants";
import Banner from "@/components/programs/Banner";
import {
  getExternalEvents,
} from "@/services/eventServer";
import { getPartners } from "@/services/websiteServer";
import { getTranslations } from "next-intl/server";

export const revalidate = 600;



/* ────────────────────────────────────────────────────────────────────────────
 * Page (SSR)
 * ──────────────────────────────────────────────────────────────────────────── */

export default async function EventsPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({locale, namespace: "common"});

    const fetchOpts = { revalidate: LONG_REVALIDATE_SECONDS };
    const [externalEvents, partnerCategories] = await Promise.all([
      getExternalEvents({ page: 1, limit: 100, locale }, fetchOpts),
      getPartners({ locale }, fetchOpts),
    ]);

    return (
    <main className="min-h-screen flex flex-col w-full relative bg-linear-to-b from-[#060102] from-[10%] via-[#792327] via-[80%] to-black">
            <Banner
              subtitle=""
              title={t("events")}
              mediaType="image"
              height="60vh"
              mobileHeight="40vh"
              mediaSrc="/blog/NEWSUPDATESbackground.avif"
              // hideMobileGradient
            />
            <SeasonSection
                events={externalEvents}
                locale={locale}
            />
            <Partners partnerCategories={partnerCategories} />
        </main>
    );
}
