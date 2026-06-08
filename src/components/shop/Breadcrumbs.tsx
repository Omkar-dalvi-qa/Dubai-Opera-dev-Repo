import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface BreadcrumbsProps {
  category: string;
  productName: string;
}

export default function Breadcrumbs({ category, productName }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="font-montserrat text-[14px] leading-[31px] mb-4 flex items-center flex-wrap gap-2">
      <Link href="/en/shop" className="text-white transition-colors flex items-center gap-2">
        <ChevronLeft className="w-4 h-4 text-white" />
        Back
      </Link>
      <span>|</span>
      <Link href="/en/shop" className=" transition-colors">
        All Items
      </Link>
      <span>|</span>
      <span>{category}</span>
      <span>|</span>
      <span className="text-white">{productName}</span>
    </nav>
  );
}
