/**
 * SeatElement component
 * Renders an individual seat in the SVG layout
 */

import React, { useCallback } from "react";
import { isSeatDisabled, shouldApplyOpacityFilter } from "../../../utils/index";

export const SeatElement = React.memo(function SeatElement({
  seat,
  seatId,
  isSelected,
  selectedLegendType,
  getSeatColor,
  getDarkenedSeatColor,
  onSeatClick,
  onMouseEnter,
  onMouseLeave,
}: any) {
  const { position, dimensions } = seat;
  console.log(seat, "seat");
  const seatColor = getSeatColor(seat);
  const darkColor = getDarkenedSeatColor(seat);
  const isDisabled = isSeatDisabled(seat);

  // Apply opacity filter based on selected legend type
  const shouldApplyOpacity = shouldApplyOpacityFilter(
    seat,
    isSelected,
    selectedLegendType,
  );
  const seatOpacity = shouldApplyOpacity ? 0.3 : 1;

  const sizeFactor = 0.88;
  const seatWidth = (dimensions?.width || 20) * sizeFactor;
  const seatHeight = (dimensions?.height || 20) * sizeFactor;
  const seatRadius = Math.min(seatWidth / 2, seatHeight / 2);

  const handleTouchStart = useCallback(
    (e: any) => {
      if (!isDisabled) {
        e.stopPropagation();
      }
    },
    [isDisabled],
  );

  const handleTouchEnd = useCallback(
    (e: any) => {
      if (!isDisabled) {
        e.stopPropagation();
        e.preventDefault();
        onSeatClick(seatId, seat);
      }
    },
    [isDisabled, onSeatClick, seatId, seat],
  );

  const handleClick = useCallback(
    (e: any) => {
      if (!isDisabled) {
        onSeatClick(seatId, seat);
      }
    },
    [isDisabled, onSeatClick, seatId, seat],
  );

  const handleMouseEnter = useCallback(() => {
    onMouseEnter(seat);
  }, [onMouseEnter, seat]);

  const handleMouseLeave = useCallback(() => {
    onMouseLeave(null);
  }, [onMouseLeave]);

  return (
    <g
      transform={`translate(${position.x}, ${position.y}) rotate(${position.rotation})`}
      className={`cursor-pointer ${isDisabled ? "cursor-not-allowed" : ""}`}
      data-seat-element="true"
      data-seat-type={seat.sst_seat_type ?? ""}
      data-seat-status={isDisabled ? "unavailable" : isSelected(seatId) ? "selected" : "available"}
      data-seat-id={seatId}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: isDisabled ? "not-allowed" : "pointer" }}
    >
      <rect
        x={-seatWidth / 2}
        y={-seatHeight / 2}
        width={seatWidth}
        height={seatHeight}
        rx={seatRadius}
        ry={seatRadius}
        fill={seatColor}
        stroke={darkColor}
        strokeWidth="0.5"
        opacity={seatOpacity}
        className={`transition-all ${isSelected(seatId) ? "drop-shadow-lg" : ""}`}
        pointerEvents="auto"
      />
    </g>
  );
});

