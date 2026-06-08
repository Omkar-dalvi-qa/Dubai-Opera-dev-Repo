/**
 * Custom hook for seat selection state management
 * Handles:
 * - Selected seats state
 * - Standing tickets state
 * - Seat click handlers with zoom
 * - PostMessage communication for iframe
 */

import { useState, useEffect, useCallback } from "react";
import {
  SEAT_ZOOM_THRESHOLD,
  SEAT_ZOOM_WIDTH,
  SEAT_ZOOM_HEIGHT,
  isSeatDisabled,
} from "../utils/index";

/**
 * Custom hook for managing seat selection
 * @param {Object} layoutData - Layout data from API
 * @param {Object} seatMap - Map of seat IDs to seat data
 * @param {Object} viewBox - Current viewport box
 * @param {Function} setViewBox - Function to update viewport
 * @returns {Object} Selection state and handlers
 */
export function useSeatSelection(
  layoutData: any,
  seatMap: any,
  viewBoxRef: any,
  setViewBox: (vb: any) => void,
  seatTypesMap?: Map<string, string>,
) {
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());
  const [standingTickets, setStandingTickets] = useState<any[]>([]);
  const [selectedSeatsData, setSelectedSeatsData] = useState<any>(null);

  // Dispatch selection change events for iframe communication
  useEffect(() => {
    if (!layoutData) return;

    const seats = layoutData.Records || [];

    const selectedSeatsArray = Array.from(selectedSeats)
      .map((seatId) => {
        // Check if this is a standing section ticket
        if (seatId.startsWith("standing-")) {
          // Find the standing ticket data
          const standingTicket = standingTickets.find(
            (ticket) => ticket.id === seatId,
          );
          return standingTicket || null;
        }

        // Find the original API seat data (including standing sections)
        const apiSeat = seats.find((seat: any) => {
          try {
            const apiMeta = seat.sl_meta_data;
            return apiMeta && apiMeta.id === seatId;
          } catch (e) {
            // Fallback: check if seatId matches sl_id
            return seat.sl_id && seat.sl_id.toString() === seatId;
          }
        });

        if (apiSeat) {
          const seat = seatMap[seatId];
          const typeColor = seatTypesMap?.get(apiSeat.sst_seat_type) || seatTypesMap?.get(seat?.sst_seat_type);

          return {
            ...apiSeat, // Include all original API data
            ...seat,
            sst_seat_color_code: apiSeat.sst_seat_color_code || typeColor || seat?.color
          };
        }
        return null;
      })
      .filter((seat) => seat !== null);

    const eventData = {
      selectedSeats: selectedSeatsArray,
    };
    setSelectedSeatsData(selectedSeatsArray);
    // Dispatch custom event for same-origin listeners
    const event = new CustomEvent("seatSelectionChange", {
      detail: eventData,
    });
    window.dispatchEvent(event);

    // Send postMessage for iframe parent (cross-origin support)
    if (window.parent !== window) {
      window.parent.postMessage(
        {
          type: "seatSelectionChange",
          detail: eventData,
        },
        "*",
      );
    }
  }, [selectedSeats, layoutData, seatMap, standingTickets, seatTypesMap]);

  // Listen for seat removal from sidebar
  useEffect(() => {
    const handleRemove = (ev: any) => {
      const seatId = ev?.detail?.seatId;
      if (!seatId) return;

      setSelectedSeats((prev) => {
        const next = new Set(prev);
        if (next.has(seatId)) {
          next.delete(seatId);
          // Also handle standing ticket cleanup if needed
          setStandingTickets((prevTickets) => {
            return prevTickets.filter((t) => (t.sl_meta_data?.id || t.id) !== seatId);
          });

          // Note: seatData.selectStatus update is not possible here as we don't have seatData object,
          // but the map rendering logic usually relies on selectedSeats Set.
        }
        return next;
      });
    };

    window.addEventListener("seatSelectionRemoved", handleRemove);
    return () => window.removeEventListener("seatSelectionRemoved", handleRemove);
  }, []);

  /**
   * Handle seat click with optional zoom
   */
  const handleSeatClick = useCallback(
    (seatId: string, seatData: any) => {
      // Prevent interaction with disabled seats (including blocked reserve types)
      if (isSeatDisabled(seatData)) {
        return;
      }

      // Zoom to the clicked seat only if we're zoomed out enough to see the full layout
      const seatPos = seatData.position;
      if (seatPos) {
        // Check if current view is zoomed out (showing most of the layout)
        // If viewBox width is large (> threshold), we're zoomed out and should zoom to seat
        // If viewBox width is small (< threshold), we're already zoomed in and shouldn't zoom further
        const currentViewBox = viewBoxRef.current;
        const shouldZoomToSeat = currentViewBox.width > SEAT_ZOOM_THRESHOLD;

        if (shouldZoomToSeat) {
          // Calculate zoom level to focus on the seat (make it take up ~1/4 of the view)
          const zoomWidth = SEAT_ZOOM_WIDTH;
          const zoomHeight = SEAT_ZOOM_HEIGHT;

          // Center the view on the seat position
          const newX = seatPos.x - zoomWidth / 2;
          const newY = seatPos.y - zoomHeight / 2;

          setViewBox({
            x: newX,
            y: newY,
            width: zoomWidth,
            height: zoomHeight,
          });
        }
      }

      // Handle seat selection
      setSelectedSeats((prev) => {
        const newSelected = new Set(prev);
        if (newSelected.has(seatId)) {
          newSelected.delete(seatId);
          seatData.selectStatus = false;

          // If this is a standing section seat, also remove it from standingTickets
          setStandingTickets((prevTickets) => {
            try {
              const apiMeta = seatData.sl_meta_data;
              return prevTickets.filter((ticket) => {
                const ticketMeta = ticket.sl_meta_data;
                return (
                  ticketMeta?.id !== apiMeta?.id && ticket.sl_id !== seatData.sl_id
                );
              });
            } catch (e) {
              return prevTickets.filter((ticket) => ticket.sl_id !== seatData.sl_id);
            }
          });
        } else {
          newSelected.add(seatId);
          seatData.selectStatus = true;
        }
        return newSelected;
      });
    },
    [viewBoxRef, setViewBox],
  );

  /**
   * Add standing tickets to selection
   */
  const addStandingTickets = useCallback((tickets: any[]) => {
    setStandingTickets((prev) => [...prev, ...tickets]);

    // Add ticket IDs to selected seats
    setSelectedSeats((prev) => {
      const newSet = new Set(prev);
      tickets.forEach((ticket) => {
        try {
          const apiMeta = ticket.sl_meta_data;
          if (apiMeta && apiMeta.id) {
            newSet.add(apiMeta.id);
          }
        } catch (e) {
          // Fallback to sl_id if meta parsing fails
          newSet.add(ticket.sl_id.toString());
        }
      });
      return newSet;
    });
  }, []);

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    setSelectedSeats(new Set());
    setStandingTickets([]);
  }, []);

  /**
   * Check if a seat is selected
   */
  const isSeatSelected = useCallback(
    (seatId: string) => {
      return selectedSeats.has(seatId);
    },
    [selectedSeats],
  );

  return {
    selectedSeats,
    selectedSeatsData,
    standingTickets,
    handleSeatClick,
    addStandingTickets,
    clearSelection,
    isSeatSelected,
    setSelectedSeats,
    setStandingTickets,
  };
}

