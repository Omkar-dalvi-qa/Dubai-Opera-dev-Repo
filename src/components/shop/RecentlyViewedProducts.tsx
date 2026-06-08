import ProductCard from "./ProductCard";
import { ShopProduct } from "@/lib/shop-products";

interface RecentlyViewedProductsProps {
  products: ShopProduct[];
}

export default function RecentlyViewedProducts({ products }: RecentlyViewedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className="w-full px-4 md:px-6 lg:px-12 xl:px-20 py-8 md:py-10">
      <div className="max-w-[1400px] mx-auto">
        <h2 className="font-optima text-white text-[34px] text-center mb-6">Recently Viewed Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
