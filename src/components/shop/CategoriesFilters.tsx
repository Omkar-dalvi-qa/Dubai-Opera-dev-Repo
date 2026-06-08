"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

interface FilterOption {
  id: string;
  label: string;
  count: number;
}

interface FilterGroup {
  id: string;
  title: string;
  options: FilterOption[];
}

const FILTER_GROUPS: FilterGroup[] = [
  {
    id: "wallet",
    title: "Wallets",
    options: [
      { id: "cash-card", label: "Gift Cards", count: 3 },
    ],
  },
];

const INITIAL_SELECTED: Record<string, Record<string, boolean>> = {
  wallet: { "cash-card": true },
};

interface CategoriesFiltersProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export default function CategoriesFilters({ isMobileOpen, onClose }: CategoriesFiltersProps) {
  const [selected, setSelected] = useState<Record<string, Record<string, boolean>>>(INITIAL_SELECTED);

  const onToggle = (groupId: string, optionId: string) => {
    setSelected((prev) => {
      const groupSelection = prev[groupId] ?? {};
      const nextGroup = { ...groupSelection };

      if (optionId === "all-items") {
        const nextValue = !groupSelection["all-items"];
        Object.keys(nextGroup).forEach((id) => {
          nextGroup[id] = nextValue;
        });
        return { ...prev, [groupId]: nextGroup };
      }

      nextGroup[optionId] = !groupSelection[optionId];

      if ("all-items" in nextGroup) {
        const childIds = Object.keys(nextGroup).filter((id) => id !== "all-items");
        nextGroup["all-items"] = childIds.length > 0 && childIds.every((id) => nextGroup[id]);
      }

      return { ...prev, [groupId]: nextGroup };
    });
  };

  return (
    <aside className="bg-[#1A1B1F]/95 border border-white/10 rounded-[24px] p-5 md:p-6 text-white lg:h-screen">
      <div className="flex items-center justify-between mb-3 lg:mb-5">
        <h3 className="font-optima font-normal text-[24px] leading-[32px] lg:text-[34px] md:text-[40px]">Categories</h3>

        {isMobileOpen && (
          <button 
            onClick={onClose}
            className="lg:hidden text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            <X size={24} />
          </button>
        )}

      </div>
      
      <div className="h-px bg-white/20 mb-4 lg:mb-5 hidden lg:block w-full"></div>

      <div className="space-y-5">
        {FILTER_GROUPS.map((group) => (
          <div key={group.id}>
            <h4 className="font-montserrat font-semibold text-[18px] leading-[24px] md:text-[23px] md:leading-[23px] mb-4">{group.title}</h4>
            <div className="h-px bg-white/20 mb-4 lg:mb-5  lg:hidden" />

            <ul className="space-y-4">
              {group.options.map((option) => {
                const checked = selected[group.id]?.[option.id] ?? false;
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      onClick={() => onToggle(group.id, option.id)}
                      className="w-full flex items-center justify-between gap-3 text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span
                          className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors ${
                            checked ? "bg-[#7B2223] border-[#7B2223]" : "border-white/80 group-hover:border-white"
                          }`}
                        >
                          {checked ? <Check size={16} className="text-white" strokeWidth={2.5} /> : null}
                        </span>
                        <span className="font-montserrat font-normal text-[18px] md:text-[14px] tracking-normal leading-[100%] text-white/90">
                          {option.label}
                        </span>
                      </div>
                      <span className="font-montserrat font-normal text-[18px] md:text-[14px] tracking-normal leading-[100%] text-white/60">
                        {option.count}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {isMobileOpen && (
        <div className="mt-10 lg:hidden">
          <button
            onClick={onClose}
            className="w-full py-4 bg-[#7B2223] hover:bg-[#8B262C] text-white font-montserrat font-semibold rounded-[12px] transition-colors cursor-pointer shadow-lg"
          >
            Apply Filters
          </button>
        </div>
      )}
    </aside>
  );
}
