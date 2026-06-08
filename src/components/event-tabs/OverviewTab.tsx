"use client";

import { MapPin } from "lucide-react";

export interface OverviewTabProps {
  venueName?: string;
  stringDescription?: string;
  scheduleScreenNames?: string[];
  categoryName?: string;
}

export default function OverviewTab({
  venueName = "Dubai Opera House",
  stringDescription = "",
  scheduleScreenNames = [],
  categoryName = "",
}: OverviewTabProps) {
  // Many CMS descriptions include &nbsp;/NBSP which prevents line-wrapping and can cause overflow.
  // Normalize them to regular spaces before injecting HTML.
  const descriptionHtml = (stringDescription ?? "")
    .replaceAll("&nbsp;", " ")
    .replaceAll("\u00A0", " ");
  const screenNames = Array.from(
    new Set((scheduleScreenNames ?? []).map((name) => String(name ?? "").trim()).filter(Boolean)),
  );
  const screen = screenNames.length > 0 ? screenNames.join(", ") : venueName;

  return (
    <div className="text-white">
      {categoryName ? (
        <p className="mb-5 font-noto-sans text-sm lg:text-xl font-medium text-white bg-[#79232766] px-4 py-2 rounded-[6px] w-fit">{categoryName}</p>
      ) : null}
      <h2 className="font-optima font-normal text-[24px] leading-[32px] md:text-[32px] md:leading-[100%] tracking-normal text-white mb-2 md:mb-6">About Performance</h2>
      <div className="md:flex items-center gap-2 mb-4 hidden">
        <MapPin size={20} className="text-white shrink-0" aria-hidden />
        <span className="font-montserrat font-normal text-[18px] leading-[31px] tracking-normal text-white">{screen}</span>
      </div>
      <div
        dangerouslySetInnerHTML={{ __html: descriptionHtml }}
        className="w-full max-w-full min-w-0 whitespace-normal wrap-anywhere font-montserrat font-normal text-[14px] leading-[23px] md:text-[16px] md:leading-6 tracking-normal text-white/95 mb-5 lg:mb-10 space-y-3"
      >
       
      </div>

    </div>
  );
}
