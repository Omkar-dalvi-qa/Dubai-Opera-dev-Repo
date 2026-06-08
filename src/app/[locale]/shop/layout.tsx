import Partners from "@/components/Partners";
import { getPartners } from "@/services/websiteServer";
import type { ReactNode } from "react";

export default async function ShopLayout({ children }: { children: ReactNode }) {
  const partnerCategories = await getPartners();
  return (
    <main
      className="min-h-screen bg-linear-to-b from-[#060102] from-[10%] via-[#792327] via-[80%] to-black"
    >
      {children}
      <Partners partnerCategories={partnerCategories} />
    </main>
  );
}
