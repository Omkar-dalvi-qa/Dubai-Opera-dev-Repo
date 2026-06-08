"use client";

import Image from "next/image";
import { Heart, Plus, Share2 } from "lucide-react";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ShopProduct } from "@/lib/shop-products";
import type { CashCardApiProduct } from "@/types";

export type ProductCardProduct = CashCardApiProduct | ShopProduct;

function formatCardPrice(price: string | number): string {
  if (typeof price === "number") {
    return `AED ${price.toLocaleString("en-AE")}`;
  }
  return price;
}

function isProductUnavailable(product: ProductCardProduct): boolean {
  if ("isSoldOut" in product && product.isSoldOut) {
    return true;
  }
  if ("tickets" in product && product.tickets != null) {
    if (!product.tickets.length) return true;
    return product.tickets.every((t) => !t.types?.length);
  }
  return false;
}

function productCardImage(product: ProductCardProduct): string {
  if ("image" in product && typeof product.image === "string" && product.image.length > 0) {
    return product.image;
  }
  return "/images/shop/GiftCard.png";
}

interface ProductCardProps {
  product: ProductCardProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.split("/")[1] || "en";
  const productHref = `/${locale}/shop/${product.id}`;
  const priceLabel = formatCardPrice(product.price);
  const unavailable = isProductUnavailable(product);
  const imageSrc = productCardImage(product);
  const altText = typeof product.name === "string" && product.name.trim().length > 0 ? product.name.trim() : "Shop product";


  return (
    <article
      onClick={() => router.push(productHref)}
      className="rounded-[24px] overflow-hidden bg-[#1a1b1f] border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.35)] cursor-pointer"
    >
      <div className="relative h-[320px] sm:h-[380px]">
        <Image src={imageSrc} alt={altText} fill className="object-cover" />
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsFavorite((prev) => !prev);
            }}
            className="w-8 h-8 rounded-full bg-[#1a1b1f] flex items-center justify-center cursor-pointer text-white"
            aria-label={isFavorite ? `Remove ${product.name} from favorites` : `Add ${product.name} to favorites`}
          >
            <Heart size={19} strokeWidth={2} stroke="white" fill={isFavorite ? "#792327" : "none"} />
          </button>
        </div>
      </div>
      <div className="px-6 py-5 text-white bg-[#1a1b1f]">
        <p className="font-montserrat font-medium md:text-[20px] leading-[100%]">{product.name}</p>
        <div className="mt-5 flex items-center justify-between">
          <p className="font-montserrat font-bold lg:text-[24px] leading-[100%]">{priceLabel}</p>
          {unavailable ? (
            <div className="bg-[#5A5A5A] text-white px-4 py-2 rounded-[10px] font-montserrat font-medium text-[14px]">
              Sold Out
            </div>
          ) : (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                router.push(productHref);
              }}
              className="w-10 h-10 rounded-full border border-white/80 text-white flex items-center justify-center cursor-pointer transition-all duration-300 active:bg-white/20"
              aria-label={`View ${product.name}`}
            >
              <Plus size={20} strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
