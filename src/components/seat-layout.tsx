"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function SeatLayoutStep(props: {
  chartId: string;
  eventConfigId: number;
  /** When false, destroys iframe and pauses loading (useful for dialogs). */
  active?: boolean;
  className?: string;
  height?: number | string;
  /** When false, don't render border/rounded frame around the iframe. */
  framed?: boolean;
  onSelectionChange?: (seats: any[]) => void;
  /** Overrides `localStorage.selectedBusinessUnitId` when set (seat socket policy). */
  businessUnitId?: string | number | null;
  /** When set with business unit, backend decides if Socket.IO is enabled for this channel. */
  saleChannelId?: string | number | null;
  /** Force socket on/off regardless of policy (`"1"` / `"0"`). */
  seatSocket?: "0" | "1" | null;
  /**
   * Caps how many seats the layout allows (embed `maxSeats` query).
   * Use for seat swap: pass the number of seats being replaced.
   */
  maxSelectableSeats?: number | null;
  /**
   * Embed seat swap: map disables seats priced below this unit price (upgrade-only UX).
   */
  minSwapUnitPrice?: number | null;
}) {
  const {
    chartId,
    eventConfigId,
    active = true,
    framed = true,
    className,
    height = "min(72vh,760px)",
    onSelectionChange,
    businessUnitId: businessUnitIdProp,
    saleChannelId: saleChannelIdProp,
    seatSocket: seatSocketProp,
    maxSelectableSeats: maxSelectableSeatsProp,
    minSwapUnitPrice: minSwapUnitPriceProp,
  } = props;
  const onSelectionChangeRef =
    useRef<typeof onSelectionChange>(onSelectionChange);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localePrefix, setLocalePrefix] = useState<string>("");

  useEffect(() => {
    // Keep initial render consistent (SSR/CSR) then update after mount.
    const seg = window.location.pathname.split("/")[1] || "";
    setLocalePrefix(seg === "en" || seg === "ar" ? `/${seg}` : "");
  }, []);

  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  const src = useMemo(() => {
    if (!chartId) return "";
    if (!Number.isFinite(eventConfigId) || eventConfigId <= 0) return "";
    const apiBaseUrl =
      (typeof window !== "undefined" &&
        (window as any)?.GALAXY_SEAT_LAYOUT_API_BASE_URL) ||
      process.env.NEXT_PUBLIC_EVENT_SERVICE_API_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "https://api-nuvio-events.nuviotech.co/endpoint/v1";
    const qp = new URLSearchParams();
    qp.set("embed", "1");
    qp.set("chartId", chartId);
    qp.set("eventId", String(eventConfigId));
    qp.set("apiBaseUrl", String(apiBaseUrl));
    const buRaw =
      businessUnitIdProp != null && String(businessUnitIdProp).trim() !== ""
        ? String(businessUnitIdProp).trim()
        : typeof window !== "undefined"
          ? (localStorage.getItem("selectedBusinessUnitId") || "").trim()
          : "";
    if (buRaw) {
      qp.set("businessUnitId", buRaw);
    }
    if (
      saleChannelIdProp != null &&
      String(saleChannelIdProp).trim() !== "" &&
      Number.isFinite(Number(saleChannelIdProp)) &&
      Number(saleChannelIdProp) > 0
    ) {
      qp.set("saleChannelId", String(saleChannelIdProp));
    }
    if (seatSocketProp === "0" || seatSocketProp === "1") {
      qp.set("seatSocket", seatSocketProp);
    }
    if (
      maxSelectableSeatsProp != null &&
      Number.isFinite(Number(maxSelectableSeatsProp)) &&
      Number(maxSelectableSeatsProp) > 0
    ) {
      qp.set("maxSeats", String(Math.floor(Number(maxSelectableSeatsProp))));
    }
    if (
      minSwapUnitPriceProp != null &&
      Number.isFinite(Number(minSwapUnitPriceProp)) &&
      Number(minSwapUnitPriceProp) > 0
    ) {
      qp.set("minSwapUnitPrice", String(Number(minSwapUnitPriceProp)));
    }
    return `${localePrefix}/seat-layout/seat-layout/${encodeURIComponent(
      chartId,
    )}?${qp.toString()}`;
  }, [
    chartId,
    eventConfigId,
    businessUnitIdProp,
    saleChannelIdProp,
    seatSocketProp,
    maxSelectableSeatsProp,
    minSwapUnitPriceProp,
    localePrefix,
  ]);

  useEffect(() => {
    if (!src) {
      console.log("[SeatLayoutStep]", {
        flow: "iframe-not-ready",
        chartId: chartId || null,
        eventConfigId: Number.isFinite(eventConfigId) ? eventConfigId : null,
      });
      return;
    }
    try {
      const u = new URL(src, window.location.origin);
      const query = Object.fromEntries(u.searchParams.entries());
      const flow =
        query.seatSocket === "0"
          ? "forced-socket-off-query"
          : query.seatSocket === "1"
            ? "forced-socket-on-query"
            : query.businessUnitId
              ? "embed-will-use-bu-policy-api"
              : "embed-no-bu-http-only-seat-layout";
      console.log("[SeatLayoutStep] seat layout embed params", {
        flow,
        path: u.pathname,
        query,
        businessUnitSource:
          businessUnitIdProp != null && String(businessUnitIdProp).trim() !== ""
            ? "prop"
            : typeof window !== "undefined" &&
              (localStorage.getItem("selectedBusinessUnitId") || "").trim()
              ? "localStorage.selectedBusinessUnitId"
              : "none",
      });
    } catch {
      console.log("[SeatLayoutStep] seat layout embed", {
        flow: "url-parse-error",
        src,
      });
    }
  }, [src, chartId, eventConfigId, businessUnitIdProp]);

  useEffect(() => {
    setError(null);
    const handler = (ev: MessageEvent) => {
      const data: any = ev?.data;
      if (!data || data.source !== "galaxy-seat-layout-webview") return;
      if (data.type === "selectionChange") {
        const seats = Array.isArray(data?.seats) ? data.seats : [];
        onSelectionChangeRef.current?.(seats);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    const seatRemovalToIframe = (event: Event) => {
      const customEvent = event as CustomEvent<{ seatId?: string }>;
      const removedSeatId = String(customEvent?.detail?.seatId ?? "").trim();
      if (!removedSeatId) return;
      try {
        iframeRef.current?.contentWindow?.postMessage(
          {
            source: "seat-layout-parent",
            type: "seatSelectionRemoved",
            seatId: removedSeatId,
          },
          "*",
        );
      } catch {
        // Ignore cross-origin/frame timing errors.
      }
    };

    window.addEventListener("seatSelectionRemoved", seatRemovalToIframe as EventListener);
    return () => {
      window.removeEventListener("seatSelectionRemoved", seatRemovalToIframe as EventListener);
    };
  }, []);

  const fillParent = height === "100%" || height === "100vh";

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      // The seat layout handles zoom internally; don't scroll/zoom the POS page.
      e.preventDefault();
      e.stopPropagation();
    };

    const onTouchMove = (e: TouchEvent) => {
      // On touch devices, prevent page scroll while panning/zooming inside the layout.
      if (e.touches.length > 1) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    container.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  return (
    <div
      className={cn(
        "w-full",
        fillParent && "flex h-full min-h-0 flex-col",
        className,
      )}
    >
      {error ? (
        <div className="mb-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {active ? (
        <div
          ref={containerRef}
          className={cn(
            "w-full overflow-hidden bg-background",
            framed && "rounded-2xl border border-border",
            fillParent && "min-h-[520px] flex-1",
          )}
          style={{
            height: fillParent ? "100%" : height,
            // Prevent scroll chaining to the parent page while interacting with the layout
            overscrollBehavior: "contain",
          }}
        >
          <iframe
            ref={iframeRef}
            title="Seat layout"
            src={src || undefined}
            className={cn("h-full w-full")}
            style={{
              border: 0,
              display: "block",
            }}
            allow="fullscreen"
            onLoad={() => setError(null)}
            onError={() => setError("Failed to load seat layout")}
          />
        </div>
      ) : (
        <div
          className={cn(
            "w-full overflow-hidden bg-background",
            framed && "rounded-2xl border border-border",
            fillParent && "min-h-[520px] flex-1",
          )}
          style={{
            height: fillParent ? "100%" : height,
            overscrollBehavior: "contain",
          }}
        />
      )}
    </div>
  );
}
