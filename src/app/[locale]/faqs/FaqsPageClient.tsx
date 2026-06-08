"use client";

import React, { useState } from "react";
import Banner from "@/components/programs/Banner";
import { Plus, Minus } from "lucide-react";
import { FaqGroup } from "./data";
import Partners from "@/components/Partners";
import { PartnerCategory } from "@/types/website";
import { useTranslations } from "next-intl";

export default function FaqsPageClient({ partnerCategories }: { partnerCategories: PartnerCategory[] }) {
  const t = useTranslations("faqs");
  const faqData = t.raw("groups") as FaqGroup[];
  const [activeTab, setActiveTab] = useState(faqData[0]?.category ?? "");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const activeCategoryData =
    faqData.find((g) => g.category === activeTab) || faqData[0];

  return (
    <div className="min-h-screen overflow-x-clip bg-black text-white">
      <Banner
        subtitle=""
        title={t("bannerTitle")}
        mediaType="image"
        height="60vh"
        mobileHeight="60vh"
        mediaSrc="/images/AncillaryBg.jpg"
        hideMobileGradient
        showOverlay={false}
      />

      <main className="bg-linear-to-b from-[#060102] via-[#792327] to-black pb-16 lg:pb-32">
        <div className="mx-auto w-full max-w-7xl pt-5 px-4 sm:px-6 lg:px-8">
          <h2 className="font-optima text-4xl leading-[110%] md:text-5xl text-white mb-10">
            {t("heading")}
          </h2>

          <div className="w-full relative mb-12 overflow-x-auto no-scrollbar">
            <div className="flex w-max sm:w-full items-center gap-6 sm:gap-10 border-b border-white pb-4">
              {faqData.map((tab) => {
                const isActive = activeTab === tab.category;
                return (
                  <button
                    key={tab.category}
                    onClick={() => {
                      setActiveTab(tab.category);
                      setOpenFaqIndex(null);
                    }}
                    className={`relative text-sm sm:text-base whitespace-nowrap transition-colors duration-300 cursor-pointer font-montserrat ${
                      isActive
                        ? "text-white font-bold"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    {tab.category}
                    {isActive && (
                      <span className="absolute -bottom-[17px] left-0 w-full h-[2px] bg-[#BB2626]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <h3 className="font-optima text-[32px] leading-[110%] text-white mb-8">
            {activeTab}
          </h3>

          <div className="space-y-4">
            {activeCategoryData.faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className={`rounded-lg border border-white/20 transition-colors duration-300 ${
                    isOpen ? "bg-white/5" : "bg-transparent hover:bg-white/5"
                  }`}
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full flex items-center gap-4 p-4 text-left focus:outline-none"
                  >
                    <div className="shrink-0 text-white">
                      {isOpen ? (
                        <Minus size={24} strokeWidth={1.5} />
                      ) : (
                        <Plus size={24} strokeWidth={1.5} />
                      )}
                    </div>
                    <span className="font-montserrat text-white font-medium pr-4 leading-normal sm:text-[18px] sm:leading-[100%]">
                      {faq.question}
                    </span>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${
                      isOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="pl-13 pr-6 pb-6 text-white font-montserrat font-medium text-sm sm:text-base leading-relaxed">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <Partners partnerCategories={partnerCategories} />
      </main>
    </div>
  );
}

