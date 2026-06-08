"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import {
  ExternalEventDetailsProvider,
} from "@/contexts/program-event/ExternalEventDetailsContext";
import type { ExternalEventDetails } from "@/services/eventServer";
import BookingFlowUrlSync from "./BookingFlowUrlSync";

type ApiOk = { success: true; data: ExternalEventDetails };
type ApiErr = { success: false; message?: string };
type ApiResponse = ApiOk | ApiErr;

type VisitOperaSchedulesApiResponse = {
  success?: boolean;
  message?: string;
  data?: {
    product_id?: number;
    name?: string;
    description?: string | null;
    short_description?: string | null;
    status?: string;
    images?: Array<{ imageUrl?: string; name?: string; width?: number; height?: number }>;
    schedules?: unknown[];
  };
};

const VISIT_OPERA_STATIC_IDS = {
  slug: "visit-opera",
};

export default function BookingFlowProvider({ children }: { children: React.ReactNode }) {
  const params = useParams<{ locale: string }>();
  const searchParams = useSearchParams();
  const eventSlug = (searchParams.get("event") || "").trim();
  const normalizedEventSlug = eventSlug.split(/[?&]/)[0]?.trim().toLowerCase() || "";
  const isVisitOperaFlow = normalizedEventSlug === "visit-opera";
  const locale = params?.locale || "en";

  const [details, setDetails] = useState<ExternalEventDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const transactionId =
    (searchParams.get("transactionId") || searchParams.get("transaction_id") || "").trim();
  const isConfirmationPage = pathname.includes("/confirmation");
  const isBookingFailedPage = pathname.includes("/booking-failed");
  const allowMissingEvent = isBookingFailedPage || (isConfirmationPage && Boolean(transactionId));
  const apiUrl = eventSlug
    ? `/api/external/products/${encodeURIComponent(eventSlug)}?locale=${encodeURIComponent(locale)}`
    : null;

  useEffect(() => {
    if (isVisitOperaFlow) {
      let cancelled = false;
      setLoading(true);
      setError(null);
      const loadVisitOperaDetails = async () => {
        try {
          const query = `?locale=${encodeURIComponent(locale)}`;
          const response = await fetch(`/api/external/products/visit-opera/schedules${query}`, {
            cache: "no-store",
          });
          const json = (await response.json()) as VisitOperaSchedulesApiResponse;
          if (!response.ok || json?.success !== true) {
            throw new Error(json?.message || "Could not load visit details.");
          }

          if (cancelled) return;
          const payload = json?.data ?? {};
          const dynamicId = Number(payload?.product_id ?? "");
          const dynamicName = String(payload?.name ?? "").trim();
          const dynamicStatus = String(payload?.status ?? "").trim();
          const dynamicImages = Array.isArray(payload?.images) ? payload.images : [];
          const dynamicSchedules = Array.isArray(payload?.schedules) ? payload.schedules : [];
          const detailsPayload = {
            id: dynamicId,
            slug: VISIT_OPERA_STATIC_IDS.slug,
            name: dynamicName || "Visit Opera",
            description: String(payload?.description ?? ""),
            short_description: String(payload?.short_description ?? ""),
            status: dynamicStatus || "PUBLISHED",
            thumbnail_url: "",
            images: dynamicImages,
            schedules: dynamicSchedules,
          } as ExternalEventDetails;
          setDetails(detailsPayload);
          setError(null);
        } catch (e: unknown) {
          if (cancelled) return;
          setDetails(null);
          setError(e instanceof Error ? e.message : "Could not load visit details.");
        } finally {
          if (!cancelled) setLoading(false);
        }
      };
      void loadVisitOperaDetails();
      return () => {
        cancelled = true;
      };
    }

    if (!apiUrl) {
      if (allowMissingEvent) {
        setDetails(null);
        setError(null);
        setLoading(false);
        return;
      }
      setDetails(null);
      setError("Missing event.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const loadEvent = async () => {
      try {
        const response = await fetch(apiUrl, { cache: "no-store" });
        const json = (await response.json()) as ApiResponse;

        if (cancelled) return;

        if (!json || typeof json !== "object" || json.success !== true) {
          setError((json as ApiErr | null)?.message || "Could not load event.");
          setDetails(null);
          return;
        }

        setDetails((json as ApiOk).data ?? null);
      } catch (e: unknown) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Could not load event.");
        setDetails(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadEvent();
    return () => {
      cancelled = true;
    };
  }, [allowMissingEvent, apiUrl, isVisitOperaFlow, locale]);

  if (!eventSlug && !allowMissingEvent) {
    return (
      <div className="px-4 py-8 text-white/80">
        Missing event. Open booking from an event page so the URL includes `?event=...`.
      </div>
    );
  }

  if (allowMissingEvent) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-12 w-12 rounded-full border-2 border-white/25 border-t-white/80 animate-spin"
            aria-label="Loading"
          />
          <p className="text-white/70 font-montserrat text-[14px]">Loading booking…</p>
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="px-4 py-8 text-white/80">
        {error}
      </div>
    );
  }

  return (
    <ExternalEventDetailsProvider value={details}>
      <BookingFlowUrlSync />
      {children}
    </ExternalEventDetailsProvider>
  );
}

