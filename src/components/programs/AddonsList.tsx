"use client";

import Image from "next/image";
import { Check, Plus } from "lucide-react";
import { imageUrl } from "@/utils/imageUrl";

export interface AddonItem {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  maxQuantity?: number;
}

interface AddonsListProps {
  items: AddonItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export default function AddonsList({ items, selectedIds, onToggle }: AddonsListProps) {
  return (
    <div className="w-full space-y-3 rounded-[20px] bg-surface p-3 lg:space-y-5 lg:p-4">
      {items.map((item) => {
        const selected = selectedIds.includes(item.id);

        return (
          <article
            key={item.id}
            onClick={() => onToggle(item.id)}
            className={`cursor-pointer p-3 transition-colors md:p-4 ${
              selected ? "border-white/30" : "border-white/10 hover:border-white/20"
            }`}
          >
            <div className="flex gap-3">
              <div className="relative h-[58px] w-[70px] shrink-0 overflow-hidden rounded-[8px] md:h-[128px] md:w-[128px]">
                <Image
                  src={imageUrl(item.image) || "/images/fallback.png"}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex min-w-0 flex-1 flex-col">
                <h3 className="font-montserrat text-[12px] font-semibold leading-[16px] text-white line-clamp-2 md:text-[20px] md:leading-[24px]">
                  {item.title}
                </h3>

                {item.description ? (
                  <div
                    className="addon-description mt-1 font-montserrat text-[10px] leading-[14px] text-white line-clamp-2 md:text-[15px] md:leading-[20px] [&_p]:m-0"
                    dangerouslySetInnerHTML={{ __html: item.description }}
                  />
                ) : null}

                <div className="mt-2 flex items-center justify-between gap-2 md:mt-auto md:pt-3">
                  <p className="font-montserrat text-[14px] font-bold text-white md:text-[24px]">
                    AED {item.price.toLocaleString()}
                  </p>
                  <span
                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border md:h-10 md:w-10 ${
                      selected
                        ? "border-white bg-white text-black"
                        : "border-white bg-transparent text-white"
                    }`}
                  >
                    {selected ? (
                      <Check size={16} className="md:h-5 md:w-5" />
                    ) : (
                      <Plus size={16} className="md:h-5 md:w-5" />
                    )}
                  </span>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
