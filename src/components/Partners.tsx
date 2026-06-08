"use client";
import Image from "next/image";
import type { PartnerCategory } from "@/types/website";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export default function Partners({
  partnerCategories,
}: {
  partnerCategories?: PartnerCategory[];
}) {
  const t = useTranslations("partners");
  const [categories, setCategories] = useState<PartnerCategory[]>(partnerCategories ?? []);
  useEffect(() => {
    setCategories(partnerCategories ?? []);
  }, [partnerCategories]);

  const logoSizeByCount: Record<number, { width: number; height: number }> = {
    1: { width: 120, height: 50 },
    2: { width: 66, height: 50 },
    3: { width: 40, height: 50 },
  };
  const getLogoSize = (count: number) =>
    logoSizeByCount[count] ?? { width: 51, height: 50 };

  return (
    <section
      className="w-full py-10 lg:py-16 px-4 text-white"
    >

      <div className="container mx-auto">
        <h2 className="text-center align-middle mb-12 lg:mb-20">
          <span className="md:hidden font-optima font-normal text-[24px] leading-[100%] tracking-[-1.15px]">
            {t("ourPartners")}
          </span>
          <span className="hidden md:inline font-optima font-normal text-[36px] leading-[100%] tracking-normal">
            {t("ourPartners")}
          </span>
        </h2>

        {/* Partners Grid - semantic list, each category can have 1, 2, or 3+ logos */}
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-10 lg:gap-x-8 lg:gap-y-14 items-start justify-items-center text-center list-none p-0 m-0">
          {categories.map((group) => (
            <li key={group.category} className="flex flex-col items-center opacity-100 transition-opacity w-full">
              {/* Category title - Optima, 16px, uppercase, center */}
              <h3 className="font-optima font-normal text-base leading-[100%] tracking-normal text-center uppercase text-white/90 mb-4 m-0">
                {group.category}
              </h3>
              {/* Logos row with separators between them */}
              <div className="flex flex-wrap items-center justify-center gap-0">
                {group.logos.map((logo, logoIndex) => {
                  const { width, height } = getLogoSize(group.logos.length);
                  return (
                    <div key={`${group.category}-${logo.name}-${logoIndex}`} className="flex items-center">
                      {logoIndex > 0 && (
                        <span
                          className="w-px bg-white mx-3 shrink-0"
                          style={{ height: `${height}px` }}
                          aria-hidden
                        />
                      )}
                      {logo.image ? (
                        <span
                          className="shrink-0 flex items-center justify-center"
                          style={{
                            width: `${width}px`,
                            height: `${height}px`,
                            minWidth: `${width}px`,
                            minHeight: `${height}px`,
                          }}
                        >
                          <Image
                            src={logo.image}
                            alt={logo.name}
                            width={width}
                            height={height}
                            className="object-contain object-center"
                            style={{
                              width: `${width}px`,
                              height: `${height}px`,
                              maxWidth: `${width}px`,
                              maxHeight: `${height}px`,
                            }}
                            sizes="50vw"
                            loading="lazy"
                          />
                        </span>
                      ) : (
                        <div
                          className="shrink-0 px-2 bg-white/10 flex items-center justify-center font-bold tracking-widest text-xs rounded"
                          style={{ width: `${width}px`, height: `${height}px` }}
                        >
                          {logo.name}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
