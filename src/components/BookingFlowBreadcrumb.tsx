"use client";

import { ChevronLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmExitModal from "@/components/ConfirmExitModal";
import { useExternalEventBookingState } from "@/contexts/program-event/ExternalEventDetailsContext";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

interface BookingFlowBreadcrumbProps {
  backHref: string;
  items: BreadcrumbItem[];
  eventName?: string;
  requireExitConfirm?: boolean;
}

function truncateLabel(value: string, maxChars = 20): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, maxChars)}...`;
}

export default function BookingFlowBreadcrumb({
  backHref,
  items,
  eventName,
  requireExitConfirm = false,
}: BookingFlowBreadcrumbProps) {
  const pathname = usePathname();
  const router = useRouter();
  const bookingState = useExternalEventBookingState({ optional: true });
  const shortEventName = eventName?.trim() ? truncateLabel(eventName) : null;
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const requestNavigate = (href: string, sourceLabel?: string) => {
    const isSeatsPage = pathname.includes("/booking/seats");
    const shouldRequireConfirm =
      requireExitConfirm &&
      (typeof sourceLabel === "string" && sourceLabel.toLowerCase().includes("back")
        ? isSeatsPage
        : true);

    const shouldSkipConfirmForStepCrumb = (() => {
      if (typeof sourceLabel !== "string") return false;
      const labelLower = sourceLabel.toLowerCase();
      return (
        labelLower.includes("select your seat") ||
        labelLower.includes("add ons") ||
        labelLower.includes("checkout") ||
        labelLower.includes("payment")
      );
    })();

    if (!shouldRequireConfirm || shouldSkipConfirmForStepCrumb) {
      router.push(href);
      return;
    }
    setPendingHref(href);
    setIsConfirmOpen(true);
  };

  return (
    <div className="inline-flex items-center font-montserrat text-[13px]">
      <button
        type="button"
        onClick={() => requestNavigate(backHref, "Back")}
        className="mr-2 inline-flex items-center text-white/90 hover:text-white"
        aria-label="Go back"
      >
        <ChevronLeft size={18} />
        <span className="block lg:hidden">Back</span>
      </button>

      <div className="hidden lg:block">
        {items.map((item, index) => {
          const itemPath = item.href?.split("?")[0];
          const isActive = itemPath != null && itemPath === pathname;
          const shouldReplaceWithEventName =
            shortEventName != null &&
            (item.label === "Event Page");
          const displayLabel = shouldReplaceWithEventName ? shortEventName : item.label;

          return (
            <span key={`${item.label}-${index}`} className="inline-flex items-center">
              {index > 0 && <span className="px-2 text-white/40">/</span>}

              {/* {isActive
                    ? "text-white cursor-default"
                    : "text-white/60 cursor-default"} */}
              {item.href ? (
                <button
                  type="button"
                  onClick={() => requestNavigate(item.href!, item.label)}
                  className={
                    isActive
                      ? "text-white cursor-default pointer-events-none"
                      : "text-white/60 hover:text-primary transition-colors"
                  }
                >
                  {displayLabel}
                </button>
              ) : (
                <span className="text-white">{displayLabel}</span>
              )}
            </span>
          );
        })}
      </div>
      <ConfirmExitModal
        isOpen={isConfirmOpen}
        reservationId={bookingState?.reservationId ?? null}
        title="Are you sure you want to exit?"
        confirmLabel="Yes"
        cancelLabel="Cancel"
        onCancel={() => {
          setPendingHref(null);
          setIsConfirmOpen(false);
        }}
        onConfirm={() => {
          const href = pendingHref;
          setPendingHref(null);
          setIsConfirmOpen(false);
          if (href) router.push(href);
        }}
      />
    </div>
  );
}
