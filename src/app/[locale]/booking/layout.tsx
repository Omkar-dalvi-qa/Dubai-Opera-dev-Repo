import Partners from "@/components/Partners";
import LayoutBookingPanel from "@/components/programs/LayoutBookingPanel";
import LayoutBookingBreadcrumb from "@/components/programs/LayoutBookingBreadcrumb";
import { getPartners } from "@/services/websiteServer";
import BookingFlowProvider from "./BookingFlowProvider";
import { headers } from "next/headers";

export default async function BookingLayout({ children }: { children: React.ReactNode }) {
  const partnerCategories = await getPartners();

  return (
    <main
      className="pt-2"
      style={{
        background: "linear-gradient(to bottom, #0F0505 0%, #702024 25%, #772226 40%, #000000 60%)",
      }}
    >
      <section className="mx-auto w-full max-w-[1400px]">
        <BookingFlowProvider>
          <div className={`mx-auto w-full pb-5 px-4`}>
            <div className="px-4">
              <LayoutBookingBreadcrumb />
            </div>
            <div className="flex flex-col lg:flex-row items-start lg:gap-6">
              <div className="w-full lg:min-w-0 flex-1 px-4">{children}</div>
              <LayoutBookingPanel />
            </div>
          </div>
        </BookingFlowProvider>

        <div className="hidden">
          <Partners partnerCategories={partnerCategories} />
        </div>
      </section>
    </main>
  );
}

