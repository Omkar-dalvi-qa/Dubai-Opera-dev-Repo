"use client";

import Breadcrumbs from "@/components/shop/Breadcrumbs";
import ProductSlider from "@/components/shop/ProductSlider";
import ProductInfo from "@/components/shop/ProductInfo";
import { cashCardCategoryLabel } from "@/lib/cash-card-display";
import { useEffect, useMemo, useState } from "react";
import type { CashCardApiProduct } from "@/types";

/** Replace when the cash-card API exposes image URLs per product. */
const FALLBACK_PRODUCT_IMAGE = "/images/shop/GiftCard.png";

interface ProductDetailsSectionProps {
  product: CashCardApiProduct;
}

export default function ProductDetailsSection({ product }: ProductDetailsSectionProps) {
  const categoryLabel = useMemo(() => cashCardCategoryLabel(product.product_type), [product.product_type]);

  const images = useMemo(() => [FALLBACK_PRODUCT_IMAGE], []);

  const [activeImage, setActiveImage] = useState(images[0] ?? FALLBACK_PRODUCT_IMAGE);

  useEffect(() => {
    setActiveImage(images[0] ?? FALLBACK_PRODUCT_IMAGE);
  }, [product.id, images]);

  return (
    <section className="w-full px-4 md:px-6 lg:px-12 xl:px-20 py-6 md:py-10 mt-26">
      <div className="max-w-[1400px] mx-auto text-white">
        <Breadcrumbs category={categoryLabel} productName={product.name} />

        <div className="flex flex-col md:flex-row gap-8 md:gap-10 lg:gap-16 items-center md:items-start">
          <ProductSlider
            productName={product.name}
            images={images}
            activeImage={activeImage}
            onActiveImageChange={setActiveImage}
          />

          <ProductInfo
            categoryLabel={categoryLabel}
            product={product}
            colorOptions={[]}
            activeColorName={product.name}
            onColorSelect={() => {}}
          />
        </div>
      </div>
    </section>
  );
}
