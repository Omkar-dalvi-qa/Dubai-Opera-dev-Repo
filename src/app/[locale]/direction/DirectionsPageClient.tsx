"use client";

import { useState } from "react";
import Banner from "@/components/programs/Banner";
import Partners from "@/components/Partners";
import { PartnerCategory } from "@/types/website";
import { useTranslations } from "next-intl";

function Section({ title, text }: { title: string; text: string }) {
  return (
    <div className="text-center max-w-3xl mx-auto mb-10">
      <h3 className="text-2xl lg:text-3xl font-optima mb-4">{title}</h3>
      <p className="text-white/80 leading-relaxed">{text}</p>
    </div>
  );
}

export default function DirectionsPageClient({ partnerCategories }: { partnerCategories: PartnerCategory[] }) {
  const t = useTranslations("direction");
  const tabs = t.raw("tabs") as {
    car: {
      label: string;
      sections: { title: string; text: string }[];
    };
    public: {
      label: string;
      sections: { title: string; text: string }[];
    };
  };
  const [activeTab, setActiveTab] = useState<keyof typeof tabs>("car");

  return (
    <main>
      <div className="min-h-screen overflow-x-clip bg-[#0B0B0B] text-white relative">
        <Banner
          subtitle=""
          title={t("bannerTitle")}
          mediaType="image"
          height="60vh"
          mobileHeight="60vh"
          mediaSrc="/images/DirectionBg.jpg"
          hideMobileGradient
          showOverlay={false}
        />

        <div className="bg-linear-to-b from-[#060102] via-[#792327] to-black pb-16 lg:pb-32">
          <div className="max-w-6xl mx-auto space-y-5 lg:space-y-10 px-5 ">
            <h2 className="text-3xl lg:text-[40px] font-optima text-center mt-5">
              {t("heading")}
            </h2>

            <h3 className="text-[#FFFFFFCC] max-w-3xl text-[16px] leading-[24px] mx-auto">
              {t("description")}
            </h3>

            <Banner
              subtitle=""
              title=""
              mediaType="video"
              showOverlay={false}
              height="58vh"
              mediaSrc="/about/DubaiOperaLUXURY.mp4"
              className="rounded-3xl w-[90%] mx-auto"
            />

            <div>
              <div className="flex justify-center mb-10">
                <div className="flex rounded-md bg-white/10 overflow-hidden">
                  {Object.entries(tabs).map(([key, tab]) => {
                    const isActive = activeTab === key;

                    return (
                      <button
                        key={key}
                        onClick={() => setActiveTab(key as keyof typeof tabs)}
                        className={`px-6 text-[19px] leading-[28px] font-semibold font-montserrat py-3 text-sm lg:text-base transition-all duration-300 cursor-pointer shadow-2xl ${
                          isActive
                            ? "bg-[#802529] text-white"
                            : "text-white hover:text-white"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="px-4 transition-all duration-500">
                {tabs[activeTab].sections.map((section) => (
                  <Section key={section.title} title={section.title} text={section.text} />
                ))}
              </div>
            </div>

          </div>
          <Partners partnerCategories={partnerCategories} />
        </div>
      </div>
    </main>
  );
}

