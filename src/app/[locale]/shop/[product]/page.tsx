import { notFound } from "next/navigation";
import Newsletter from "@/components/Newsletter";
import ProductDetailsSection from "@/components/shop/ProductDetailsSection";
import { getCashCardProduct } from "@/services/eventServer";
import { CashCardApiProduct } from "@/types";

export default async function ShopProductPage({
  params,
}: {
  params: Promise<{ product: string }>;
}) {
  const { product } = await params;
  const selectedProduct = await getCashCardProduct(product);
  if (!selectedProduct || selectedProduct?.length === 0) {
    notFound();
  }

  return (
    <>
      <ProductDetailsSection product={selectedProduct?.[0] as CashCardApiProduct} />
      {/* <RecentlyViewedProducts products={recentlyViewed} /> */}
      <Newsletter />
    </>
  );
}
