"use client";

import Banner from "@/components/programs/Banner";
import Partners from "@/components/Partners";
import type { PartnerCategory } from "@/types/website";
import { useTranslations } from "next-intl";

export default function TermsOfServiceClient({ partnerCategories }: { partnerCategories: PartnerCategory[] }) {
  const t = useTranslations("terms");
  const ticketTerms = t.raw("ticketTerms") as string[];

  return (
    <main>
      <div className="min-h-screen overflow-x-clip bg-[#0B0B0B] text-white relative">
        <Banner
          subtitle=""
          title={t("bannerTitle")}
          mediaType="image"
          height="60vh"
          mobileHeight="30vh"
          mediaSrc="/images/AncillaryBg.jpg"
          hideMobileGradient
          showOverlay={false}
        />
        <div className="bg-linear-to-b from-[#060102] via-[#792327] to-black">

           <div className="container mx-auto px-5 py-16 lg:py-20 relative z-10">
        <div className="space-y-6 text-left font-montserrat text-[16px] leading-[100%]text-white">
          <p>
            {t("intro")}
          </p>

          <ul className="list-disc pl-5 space-y-2 marker:text-white/90">
            {ticketTerms.map((term) => (
              <li key={term}>{term}</li>
            ))}
          </ul>
        </div>

          </div>
          <Partners partnerCategories={partnerCategories} />
        </div>
      </div>

    </main>
  );
}

