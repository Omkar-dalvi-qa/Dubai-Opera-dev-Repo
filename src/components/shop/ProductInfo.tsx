"use client";

import { Heart, Share2, ShoppingCart } from "lucide-react";
import type { ShopProductColorOption } from "@/lib/shop-products";
import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { CashCardApiProduct } from "@/types";
import { cashCardCategoryLabel, cashCardStatusLabel, htmlToPlainText } from "@/lib/cash-card-display";

interface ProductInfoProps {
  categoryLabel: string;
  product: CashCardApiProduct;
  colorOptions: ShopProductColorOption[];
  activeColorName: string;
  onColorSelect: (option: ShopProductColorOption) => void;
}

export default function ProductInfo({
  categoryLabel,
  product,
  colorOptions,
  activeColorName,
  onColorSelect,
}: ProductInfoProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const cartHref = `/${locale}/shop/cart`;
  const checkoutHref = `/${locale}/shop/checkout`;
console.log(product,  "product");
  const descriptionText = useMemo(() => {
    const fromHtml = product.description ? htmlToPlainText(product.description) : "";
    const short = product.short_description?.trim() ?? "";
    return fromHtml || short || "—";
  }, [product.description, product.short_description]);

  const displayPriceValue = useMemo(() => {
    if (typeof product.price === "number" && product.price > 0) {
      return product.price;
    }
    let max = 0;
    for (const ticket of product.tickets ?? []) {
      for (const entry of ticket.types ?? []) {
        max = Math.max(max, entry.price);
      }
    }
    return max;
  }, [product.price, product.tickets]);

  const priceLabel = useMemo(() => {
    if (!displayPriceValue) return "";
    return `AED ${displayPriceValue.toLocaleString("en-AE")}`;
  }, [displayPriceValue]);

  const isSoldOut = useMemo(() => {
    if (!product.tickets?.length) return true;
    return product.tickets.every((t) => !t.types?.length);
  }, [product.tickets]);

  const infoRows = useMemo(() => {
    const rows: { label: string; value: string }[] = [];
    if (product.sku) rows.push({ label: "SKU", value: product.sku });
    if (product.product_type) {
      rows.push({ label: "Product type", value: cashCardCategoryLabel(product.product_type) });
    }
    if (product.validity) rows.push({ label: "Validity", value: product.validity });
    if (product.status) rows.push({ label: "Status", value: cashCardStatusLabel(product.status) });
    return rows;
  }, [product.sku, product.product_type, product.validity, product.status]);

  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: product.name, text: priceLabel, url: shareUrl });
        return;
      } catch {
        return;
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl);
    }
  };

  return (
    <div className="w-full md:w-[60%] pb-28 md:pb-0">
      <p className="font-montserrat text-[14px] leading-[14px] md:text-[15px] md:leading-[100%] text-white/70 mb-1 lg:mb-2">
        {categoryLabel}
      </p>

      <div className="flex items-start justify-between gap-4 mb-3">
        <h1 className="text-white text-[30px] leading-[36px] md:text-[44px] md:leading-[100%] font-optima flex-1 min-w-0">
          {product.name}
        </h1>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => void handleShare()}
            className="w-8 h-8 rounded-full bg-[#1a1b1f] flex items-center justify-center text-white cursor-pointer"
            aria-label={`Share ${product.name}`}
          >
            <Share2 size={18} />
          </button>
          <button
            type="button"
            onClick={() => setIsFavorite((prev) => !prev)}
            className="w-8 h-8 rounded-full bg-[#1a1b1f] flex items-center justify-center cursor-pointer text-white"
            aria-label={isFavorite ? `Remove ${product.name} from favorites` : `Add ${product.name} to favorites`}
          >
            <Heart size={18} stroke="white" fill={isFavorite ? "#792327" : "none"} />
          </button>
        </div>
      </div>

      <p className="font-montserrat font-semibold text-[30px] mb-3">{priceLabel || "—"}</p>

      <div className="h-px bg-white/20 mb-6" />

      <h3 className="font-montserrat font-semibold text-[18px] mb-2">Description</h3>
      <p className="font-montserrat text-[14px] leading-[23px] md:text-[15px] md:leading-[24px] text-white/85 mb-6 max-w-[760px] whitespace-pre-line">
        {descriptionText}
      </p>

      {colorOptions.length > 0 ? (
        <>
          <h3 className="font-montserrat font-semibold text-[18px] leading-[27px] tracking-normal mb-2">
            Color: {activeColorName}
          </h3>
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {colorOptions.map((option) => (
              <button
                key={option.name}
                type="button"
                onClick={() => onColorSelect(option)}
                aria-label={`Select ${option.name} color`}
                className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer ${
                  option.name === activeColorName ? "border-2 border-white" : "border border-white/30"
                }`}
              >
                <span className="w-8 h-8 rounded-full" style={{ backgroundColor: option.swatch }} />
              </button>
            ))}
          </div>
        </>
      ) : null}

      <div className="hidden md:flex flex-col sm:flex-row gap-3 mb-8">
        {isSoldOut ? (
          <div className="h-12 w-full bg-[#5A5A5A] text-white flex items-center justify-center rounded-[10px] font-montserrat font-bold uppercase tracking-wider">
            Sold Out
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => router.push(cartHref)}
              className="h-12 flex flex-1 items-center justify-center gap-2 rounded-[10px] border border-white bg-[#702024] font-montserrat text-[16px] leading-[26px] text-white cursor-pointer transition-all duration-300 hover:bg-[#8B262C]"
            >
              <ShoppingCart size={16} />
              Add To Cart
            </button>
            <button
              type="button"
              onClick={() => router.push(checkoutHref)}
              className="h-12 flex flex-1 items-center justify-center rounded-[10px] border border-white/70 bg-transparent font-montserrat text-[16px] font-semibold text-white cursor-pointer transition-all hover:bg-white/10"
            >
              Buy Now
            </button>
          </>
        )}
      </div>

      <div className="md:hidden fixed bottom-0 left-0 w-full z-30 pointer-events-auto">
        <div className="max-w-[500px] mx-auto bg-[#1a1b1f] border border-white/10 p-2.5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          {isSoldOut ? (
            <button
              type="button"
              disabled
              className="w-full h-12 bg-[#5A5A5A] text-white rounded-[12px] font-montserrat font-bold uppercase tracking-wider flex items-center justify-center"
            >
              Sold Out
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push(cartHref)}
                className="flex-1 h-13 bg-[#792327] hover:bg-[#8B262C] text-white rounded-[12px] font-montserrat font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <ShoppingCart size={18} />
                Add to Cart
              </button>
              <button
                type="button"
                onClick={() => router.push(checkoutHref)}
                className="flex-1 h-13 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-[12px] font-montserrat font-bold flex items-center justify-center active:scale-[0.98] transition-all"
              >
                Buy Now
              </button>
            </div>
          )}
        </div>
      </div>

      {infoRows.length > 0 ? (
        <>
          <div className="h-px bg-[#FFFFFF80] mb-6" />
          <div className="overflow-hidden">
            <h3 className="font-montserrat font-semibold text-[18px] leading-[27px] tracking-normal mb-2">
              Product Information
            </h3>
            {infoRows.map((row) => (
              <div key={row.label} className="flex justify-between items-center border-b last:border-b-0 border-[#FFFFFF80]">
                <p className="font-montserrat text-[14px] leading-[21px] text-white/70 py-3">{row.label}</p>
                <p className="font-montserrat text-[14px] leading-[21px] text-white py-3 text-right pl-4">{row.value}</p>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
