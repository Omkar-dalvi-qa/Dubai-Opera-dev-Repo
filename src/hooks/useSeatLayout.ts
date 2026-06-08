/**
 * Custom hook for seat layout data fetching and processing
 * Handles:
 * - API data fetching
 * - Parsing canvas scene data
 * - Building seat maps and status maps
 * - Content bounds calculation
 * - Seat types management
 */

import { useState, useEffect, useMemo } from "react";
import ApiService from "@/services/api";
import { calculateOpenSeats, getSeatAvailabilityBreakdown } from "../utils";
import {
  buildSeatMap,
  buildSeatStatusMap,
  calculateContentBounds,
} from "../utils/index";

import data from "./test1.json";

type SeatLayoutData = any;

/**
 * Custom hook for managing seat layout data
 * @param {string} screenId - Screen ID from route params
 * @param {string} ssId - Show session ID from query params
 * @param {string} mdId - Movie details ID from query params
 * @param {string} chartId - Layout chart id (public API)
 * @param {string|number} eventId - Event config id (public API)
 * @param {string} apiBaseUrl - Optional API base url override (should include /endpoint/v1)
 * @returns {Object} Layout data and derived state
 */
export function useSeatLayout(
  screenId?: string,
  ssId?: string,
  mdId?: string,
  chartId?: string,
  eventId?: string | number,
  scheduleId?: string,
  apiBaseUrl?: string,
) {
  const [layoutData, setLayoutData] = useState<SeatLayoutData | null>(null);
  const [seatTypes, setSeatTypes] = useState<any[]>([]);
  const [seatTypesMap, setSeatTypesMap] = useState<Map<any, any>>(new Map());
  const [openSeatsCount, setOpenSeatsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch layout data from API
  useEffect(() => {
    const fetchSeatLayout = async () => {
      const chart = String(chartId ?? "").trim();
      const eventConfigId = Number(eventId);
      const hasPublicInputs =
        chart.length > 0 && Number.isFinite(eventConfigId) && eventConfigId > 0;
      const hasPosInputs =
        screenId != null &&
        ssId != null &&
        mdId != null &&
        `${screenId}` &&
        `${ssId}` &&
        `${mdId}`;
      if (!hasPublicInputs && !hasPosInputs) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);

        let seatLayout: any = null;
        if (hasPublicInputs) {
          const base = (
            process.env.NEXT_PUBLIC_EVENT_SERVICE_API_URL || ""
          )
            .toString()
            .replace(/\/+$/, "");
          const url = `${base}/external/seat-layout/get-seat-layout/${encodeURIComponent(
            chart,
          )}/${encodeURIComponent(String(eventConfigId))}`;
          const res = await fetch(url, { method: "GET" });
          seatLayout = await res.json();
          if (!res.ok) {
            throw new Error(
              seatLayout?.message || `HTTP error! status: ${res.status}`,
            );
          }
        } else {
          // seatLayout = await ApiService.getSeatLayout(screenId, ssId, mdId);
        }

        if (!seatLayout) {
          setError("Invalid seat layout data received");
          return;
        }
        // void ApiService; // preserve import; logic currently uses local test data

        // let seatLayout: any = data;

        // Some APIs wrap the payload as { success, data }.
        const unwrapped =
          seatLayout && typeof seatLayout === "object" && "data" in seatLayout
            ? (seatLayout as any).data
            : seatLayout;
        seatLayout = unwrapped;

        const screenDetailsArr = Array.isArray(seatLayout?.screenDetails)
          ? seatLayout.screenDetails
          : [];
        const screenLayoutArr = Array.isArray(seatLayout?.screen_layout)
          ? seatLayout.screen_layout
          : Array.isArray(seatLayout?.Records)
            ? seatLayout.Records
            : [];

        // Normalize legacy naming so downstream hooks can use `Records`.
        seatLayout.screen_layout = screenLayoutArr;
        seatLayout.Records = screenLayoutArr;
        seatLayout.screenDetails = screenDetailsArr;

        for (let i = 0; i < screenDetailsArr.length; i++) {
          const md = screenDetailsArr[i]?.screen_meta_data;
          if (md instanceof Object) continue;
          if (typeof md === "string" && md.trim()) {
            try {
              screenDetailsArr[i].screen_meta_data = JSON.parse(md);
            } catch {
              // ignore bad json
            }
          }
        }

        for (let i = 0; i < screenLayoutArr.length; i++) {
          const meta = screenLayoutArr[i]?.sl_meta_data;
          if (meta instanceof Object) continue;
          if (typeof meta === "string" && meta.trim()) {
            try {
              screenLayoutArr[i].sl_meta_data = JSON.parse(meta);
            } catch {
              // ignore bad json
            }
          }
        }

        if (Array.isArray(seatLayout?.screen_layout)) {
          setLayoutData(seatLayout);
        } else {
          setError("Invalid seat layout data received");
        }
      } catch (err: any) {
        console.error("Error fetching seat layout:", err);
        setError(err?.message || "Failed to fetch seat layout");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSeatLayout();
  }, [screenId, ssId, mdId, chartId, eventId, apiBaseUrl]);

  // Extract seat types from layout data for legend
  useEffect(() => {
    if (layoutData?.screen_seat_type) {
      const seatTypesData = layoutData.screen_seat_type;
      setSeatTypes(seatTypesData);

      // Create a map for faster lookups
      const typesMap = new Map();
      seatTypesData.forEach((type: any) => {
        if (type.sst_seat_type && type.sst_seat_color_code) {
          typesMap.set(type.sst_seat_type, type.sst_seat_color_code);
        }
      });
      setSeatTypesMap(typesMap);
    } else {
      // Fallback: create empty arrays/maps if seat type data is not available
      setSeatTypes([]);
      setSeatTypesMap(new Map());
    }
  }, [layoutData]);

  // Calculate open seats count based on user's criteria
  useEffect(() => {
    if (layoutData?.screen_layout && Array.isArray(layoutData.screen_layout)) {
      const result = calculateOpenSeats(layoutData.screen_layout);
      setOpenSeatsCount(result.totalOpenSeats);

      // Log detailed breakdown for debugging (optional)
      if (result.missingFields > 0) {
        console.log(
          `⚠️ Seats with missing fields: ${result.missingFields} (treated as regular seats)`,
        );
      }

      // Log breakdown by category for more detailed analysis
      const breakdown = getSeatAvailabilityBreakdown(layoutData.screen_layout);
      if (breakdown.missingFields > 0) {
        console.log(`⚠️ Seats with missing fields: ${breakdown.missingFields}`);
      }
    }
  }, [layoutData]);

  // Memoize seatStatusMap to avoid recalculating on every render
  const seatStatusMap = useMemo(() => {
    if (!layoutData) return {};
    const seats = layoutData.screen_layout || [];
    return buildSeatStatusMap(seats);
  }, [layoutData]);

  // Memoize canvasSceneData and rows
  const { canvasSceneData, rows, showSectionBoundaryInRenderer } =
    useMemo(() => {
      if (!layoutData)
        return {
          canvasSceneData: null,
          rows: {},
          showSectionBoundaryInRenderer: false,
        };

      const screenDetails = layoutData.screenDetails?.[0];
      let parsedCanvasSceneData: any = null;
      let parsedRows: any = {};
      let showSectionBoundary = false;

      try {
        if (screenDetails?.screen_meta_data) {
          parsedCanvasSceneData = screenDetails.screen_meta_data;
          parsedRows = parsedCanvasSceneData.rows || {};
          showSectionBoundary =
            parsedCanvasSceneData.showSectionBoundaryInRenderer || false;
        }
      } catch (error) {
        console.error("Error parsing canvas scene data:", error);
      }

      console.log(parsedCanvasSceneData, "parsedCanvasSceneData");

      return {
        canvasSceneData: parsedCanvasSceneData,
        rows: parsedRows,
        showSectionBoundaryInRenderer: showSectionBoundary,
      };
    }, [layoutData]);

  // Memoize seatMap to avoid recalculating on every render
  const seatMap = useMemo(() => {
    if (!canvasSceneData || !canvasSceneData.seats) return {};
    return buildSeatMap(canvasSceneData, seatStatusMap as any);
  }, [canvasSceneData, seatStatusMap]);

  // Calculate bounding box of all seats and elements to prevent zooming out too far
  const contentBounds = useMemo(() => {
    return calculateContentBounds(canvasSceneData);
  }, [canvasSceneData]);

  // Get screen details for display
  const screenDetails = useMemo(() => {
    return layoutData?.screenDetails?.[0] || null;
  }, [layoutData]);

  // Get all seat screen_layout
  const seats = useMemo(() => {
    return layoutData?.screen_layout || [];
  }, [layoutData]);

  return {
    // Raw data
    layoutData,
    seats,
    screenDetails,

    // Processed data
    canvasSceneData,
    rows,
    seatMap,
    seatStatusMap,
    contentBounds,
    showSectionBoundaryInRenderer,

    // Seat types
    seatTypes,
    seatTypesMap,

    // Counts
    openSeatsCount,

    // Loading state
    isLoading,
    error,
  };
}
