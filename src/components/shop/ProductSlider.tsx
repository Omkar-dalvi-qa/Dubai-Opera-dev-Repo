"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductSliderProps {
  productName: string;
  images: string[];
  activeImage: string;
  onActiveImageChange: (image: string) => void;
}

export default function ProductSlider({ productName, images, activeImage, onActiveImageChange }: ProductSliderProps) {
  const altBase =
    typeof productName === "string" && productName.trim().length > 0 ? productName.trim() : "Shop product";

  const activeIndex = Math.max(images.indexOf(activeImage), 0);
  const primarySrc = images[activeIndex] ?? images[0];

  if (!primarySrc) {
    return null;
  }

  const goPrev = () => {
    const prevIndex = activeIndex === 0 ? images.length - 1 : activeIndex - 1;
    onActiveImageChange(images[prevIndex]);
  };

  const goNext = () => {
    const nextIndex = activeIndex === images.length - 1 ? 0 : activeIndex + 1;
    onActiveImageChange(images[nextIndex]);
  };

  return (
    <div className="w-full md:w-[40%]">
      <div className="relative w-full min-h-[438px] md:h-[430px] lg:h-[500px] rounded-[10px] overflow-hidden border border-white/10">
        <Image src={primarySrc} alt={altBase} fill className="object-cover" />
        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors flex items-center justify-center cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          </>
        ) : null}
      </div>

      <div className="mt-4 flex items-center gap-3">
        {images.slice(0, 3).map((item, index) => (
          <button
            key={`${item}-${index}`}
            type="button"
            onClick={() => onActiveImageChange(item)}
            aria-label={`View ${altBase} image ${index + 1}`}
            className={`relative w-[108px] h-[108px] lg:w-[74px] lg:h-[74px] rounded-[8px] overflow-hidden cursor-pointer active:bg-white/20 ${index === activeIndex ? "border-2 border-white" : "border border-white/20"
              }`}
          >
            <Image src={item} alt={`${altBase} — thumbnail ${index + 1}`} fill className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
