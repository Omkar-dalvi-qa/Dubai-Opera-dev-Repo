"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRightIcon } from "lucide-react";

interface SeasonSectionHeaderProps {
  sectionTitle: string | false;
  viewAllLink?: string;
}

export default function SectionHeader({
  sectionTitle,
  viewAllLink,
}: SeasonSectionHeaderProps) {
  const t = useTranslations("common");

  if (!sectionTitle) return null;

  return (
    <div className="flex w-full items-center justify-between">
      <h2 data-testid="section-title" className="font-optima font-normal lg:text-[36px] text-[24px] leading-[100%] tracking-normal text-center align-middle text-white">
        {t(sectionTitle)}
      </h2>
      {viewAllLink && (
        <Link
          data-testid="section-view-all-link"
          href={viewAllLink}
          className="flex items-center justify-center gap-1 font-montserrat font-light lg:text-[20px] text-[14px] text-white hover:underline underline-offset-4 decoration-2 transition-all duration-300"
        >
          {t("viewAll")}
          <ArrowRightIcon size={18} className="text-white inline-block" />
        </Link>
      )}
    </div>
  );
}
