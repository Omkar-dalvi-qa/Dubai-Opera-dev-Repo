"use client";

import { useEffect, useMemo, useState } from "react";
import OverviewTab from "./OverviewTab";
import TimelineTab from "./TimelineTab";
import DressCodeTab from "./DressCodeTab";
import CastCrewTab from "./CastCrewTab";
import TermsConditionsTab from "./TermsConditionsTab";
import Gallery from "./Gallery";
import { ExternalEventDetails } from "@/services/eventServer";
import { motion } from "framer-motion";

const TAB_IDS = ["overview", "timeline", "dress-code", "cast-crew", "terms"] as const;
type TabId = (typeof TAB_IDS)[number];

const TAB_LABELS: Record<TabId, string> = {
  overview: "Overview",
  timeline: "Timeline",
  "dress-code": "Dress Code",
  "cast-crew": "Cast & Crew",
  terms: "Terms & Conditions",
};

export interface EventTabsProps {
  venueName?: string;
  data?: ExternalEventDetails;
  /** Optional slot (e.g. EventTicketCard) shown beside tab content; tab bar spans full width above both */
  children?: React.ReactNode;
}


/** Common component: full-width tab bar (Overview | Timeline | …) with white underline on active tab; content (and optional children) below */
export default function EventTabs({ venueName, data, children }: EventTabsProps) {
  console.log("datadetails>>>>>>>>", data);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [displayTab, setDisplayTab] = useState<TabId>("overview");
  const [isContentVisible, setIsContentVisible] = useState(true);

  useEffect(() => {
    if (activeTab === displayTab) return;
    setIsContentVisible(false);
    const timer = window.setTimeout(() => {
      setDisplayTab(activeTab);
      setIsContentVisible(true);
    }, 140);
    return () => window.clearTimeout(timer);
  }, [activeTab, displayTab]);

  const scheduleScreenNames = useMemo(() => {
    const schedules = Array.isArray(data?.schedules) ? data.schedules : [];
    return schedules
      .map((schedule: any) => String(schedule?.screen?.name ?? "").trim())
      .filter(Boolean);
  }, [data?.schedules]);

  const visibleTabs = useMemo(() => {
    return TAB_IDS.filter((id) => {
      if (id === "overview") return !!data?.description;
      if (id === "timeline") return !!data?.timeline?.timeline_data?.length;
      if (id === "dress-code") return !!data?.dress_code?.description || !!data?.dress_code?.image_url;
      if (id === "cast-crew") return !!data?.cast_and_crew?.cast_and_crew_data?.length;
      if (id === "terms") return !!data?.terms_and_conditions;
  
      return false;
    });
  }, [data]);

  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0] || "overview");
    }
  }, [visibleTabs, activeTab]);


  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-[minmax(0,50%),auto] lg:gap-10 items-start">
      {/* Full-width tab bar so white underline is visible above both content and ticket card */}
      <div className="lg:col-span-2 w-full min-w-0 mb-2 relative">
        <span className="pointer-events-none absolute left-0 right-0 bottom-0 h-px bg-white" aria-hidden />
        <nav
          className="relative z-10 flex flex-nowrap lg:flex-wrap gap-x-1 sm:gap-x-2 overflow-x-auto hideScrollbar md:overflow-x-auto lg:overflow-visible whitespace-nowrap lg:whitespace-normal"
          role="tablist"
          aria-label="Event details tabs"
        >
          {visibleTabs.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              aria-controls={`tabpanel-${id}`}
              id={`tab-${id}`}
              onClick={() => setActiveTab(id)}
              className={`relative px-4 pt-3 pb-4 font-montserrat text-[16px] leading-[100%] tracking-normal text-center transition-colors ${activeTab === id
                ? "font-medium md:font-medium text-white bg-transparent cursor-pointer"
                : "font-normal md:font-normal text-white cursor-pointer"
                }`}
            >
              {TAB_LABELS[id]}
              {activeTab === id && (
                <span className="absolute left-0 right-0 bottom-0 h-[4px] bg-primary-light z-1 rounded-full" aria-hidden />
              )}
            </button>
          ))}
        </nav>
      </div>
      <div
        role="tabpanel"
        id={`tabpanel-${displayTab}`}
        aria-labelledby={`tab-${displayTab}`}
        className={`min-w-0 transition-all duration-200 ease-out ${isContentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
          }`}
      >
        {displayTab === "overview" && (
          <OverviewTab
            venueName={venueName}
            categoryName={data?.category?.name}
            stringDescription={data?.description}
            scheduleScreenNames={scheduleScreenNames}
          />
        )}
        {displayTab === "timeline" && (<TimelineTab steps={data?.timeline?.timeline_data} heading={data?.timeline?.heading} latecomerPolicy={data?.timeline?.late_comer_policy} />)}
        {displayTab === "dress-code" && (<DressCodeTab dressCodeImage={data?.dress_code?.image_url || ""} dressCodeDescription={data?.dress_code?.description || ""} />)}
        {displayTab === "cast-crew" && (<CastCrewTab description={data?.cast_and_crew?.description || ""} castMembers={data?.cast_and_crew?.cast_and_crew_data.filter((member: any) => member.type === "CAST" || member.type === "CREW") || []} creativeTeam={data?.cast_and_crew?.cast_and_crew_data.filter((member: any) => member.type !== "CAST" && member.type !== "CREW") || []} />)}
        {displayTab === "terms" && (<TermsConditionsTab termsAndConditions={data?.terms_and_conditions || ""} />)}
      </div>

      {/* Optional right column (e.g. EventTicketCard) so tab bar line sits above it */}
      {children != null ? (
        <div className="lg:min-w-[380px] lg:max-w-md shrink-0">{children}</div>
      ) : null}

      {displayTab === "overview" ? (
        <div className="lg:col-span-2 w-full">
          <Gallery data={data?.gallery?.gallery_data || []} />
        </div>
      ) : null}
    </div>
  );
}
