"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Funnel, X } from "lucide-react";
import ProductCard from "./ProductCard";
import CategoriesFilters from "./CategoriesFilters";
import { SHOP_PRODUCTS } from "@/lib/shop-products";
import { CashCardApiProduct } from "@/types";

export default function ShopCollectionSection({ products = [] as CashCardApiProduct[] }: { products?: CashCardApiProduct[] }) {
  const [sortBy, setSortBy] = useState<"relevance" | "price-low-high" | "price-high-low">("relevance");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (!sortRef.current?.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const sortedProducts = useMemo(() => {
    if (sortBy === "relevance") return products;
    const items = [...products];
    items.sort((a, b) =>
      sortBy === "price-low-high" ? a.price - b.price : b.price - a.price
    );
    return items;
  }, [sortBy]);

  return (
    <div className="relative pb-20">
      <div className="pointer-events-none absolute inset-0 z-0 bg-linear-to-b from-black via-black to-transparent h-40" />
      <section className="relative z-10 w-full">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-12 xl:px-20 py-5">
          <div className="flex flex-col lg:flex-row gap-5 md:gap-10 lg:gap-20 items-end lg:items-start mb-6 md:mb-8">
            <div className="w-full lg:w-[30%]">
              <h2 className="text-white text-[32px] md:text-[40px]">
                <span className="font-optima">Shop the </span>
                <span className="font-optima lg:font-petit-formal">Collection</span>
              </h2>
            </div>

            <div className="w-full lg:w-[60%] flex gap-3 justify-between lg:justify-end mt-4 lg:mt-0">
              {/* Mobile Filter Toggle */}
              <button
                type="button"
                onClick={() => {
                  setIsFilterOpen((prev) => !prev);
                  setIsSortOpen(false);
                }}
                className="lg:hidden flex-1 md:flex-none h-11 px-5 text-[15px] rounded-[12px] bg-[#1A1B1F] border border-white/10 transition-all duration-300 font-montserrat flex items-center justify-start gap-3 cursor-pointer text-white"
              >
                <Funnel size={18} />
                <span className="font-semibold">Filters</span>
              </button>

              {/* Sort By Toggle */}
              <div className="flex-1 md:flex-none lg:relative" ref={sortRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsSortOpen((prev) => !prev);
                    setIsFilterOpen(false);
                  }}
                  className="w-full md:w-auto h-11 px-5 text-[15px] rounded-[12px] bg-[#1A1B1F] border border-white/10 transition-all duration-300 font-montserrat flex items-center justify-start lg:justify-center gap-3 cursor-pointer text-white"
                >
                  <ChevronDown size={18} className={`transition-transform duration-300 ${isSortOpen ? "rotate-180" : "rotate-0"}`} />
                  <span className="font-semibold whitespace-nowrap">
                    {sortBy === "relevance" ? "Sort By" : sortBy === "price-low-high" ? "Price Low" : "Price High"}
                  </span>
                </button>


                {/* Desktop Absolute Dropdown */}
                {isSortOpen && (
                  <div className="hidden lg:block absolute right-0 mt-2 w-[220px] rounded-[12px] border border-white/10 bg-[#1A1B1F] p-1 z-30 shadow-2xl animate-fade-in-up">
                    {[
                      { id: "relevance", label: "Relevance" },
                      { id: "price-low-high", label: "Price low to high" },
                      { id: "price-high-low", label: "Price high to low" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSortBy(opt.id as any);
                          setIsSortOpen(false);
                        }}
                        className={`w-full text-left rounded-[8px] px-4 py-3 font-montserrat text-[15px] transition-colors ${sortBy === opt.id ? "text-white bg-white/10" : "text-white/70 hover:bg-white/5"
                          } cursor-pointer`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Relative Controls Section (Mobile only) */}
          <div className="lg:hidden">
            {/* Filters Content */}
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isFilterOpen ? 'max-h-[2000px] mb-8 opacity-100' : 'max-h-0 mb-0 opacity-0'}`}>
              <CategoriesFilters
                isMobileOpen={true}
                onClose={() => setIsFilterOpen(false)}
              />
            </div>

            {/* Sort Options Content */}
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isSortOpen ? 'max-h-[500px] mb-8 opacity-100' : 'max-h-0 mb-0 opacity-0'}`}>
              <div className="bg-[#1A1B1F]/95 border border-white/10 rounded-[24px] p-2 space-y-1">
                <div className="flex items-center justify-between px-4 pt-3 pb-1">
                  <h3 className="font-optima font-normal text-[24px] leading-[32px] text-white">
                    Sort By
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsSortOpen(false)}
                    className="text-white/60 hover:text-white transition-colors cursor-pointer"
                    aria-label="Close sort options"
                  >
                    <X size={24} />
                  </button>
                </div>
                {[
                  { id: "relevance", label: "Relevance" },
                  { id: "price-low-high", label: "Price low to high" },
                  { id: "price-high-low", label: "Price high to low" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSortBy(opt.id as any);
                      setIsSortOpen(false);
                    }}
                    className={`w-full text-left rounded-[16px] px-6 py-4 font-montserrat text-[16px] transition-all ${sortBy === opt.id ? "text-white bg-[#7B2223]" : "text-white/70 hover:bg-white/5"
                      } cursor-pointer`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-5 md:gap-10 xl:gap-20 items-start relative">
            <div className="hidden lg:block w-full lg:w-[30%] lg:sticky lg:top-24">
              <CategoriesFilters />
            </div>

            <div className="w-full lg:w-[60%]">
              <div className="grid md:grid-cols-2 gap-3 md:gap-4">
                {sortedProducts.length > 0 && sortedProducts?.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>  
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
