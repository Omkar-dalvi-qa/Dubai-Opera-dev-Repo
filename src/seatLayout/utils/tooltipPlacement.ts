export type TooltipAnchorMode = 'pointer-above' | 'seat-below';

export interface TooltipPoint {
  x: number;
  y: number;
}

export interface TooltipSizeSpec {
  width: number;
  height: number;
}

export interface TooltipPlacement {
  left: number;
  top: number;
  transform: string;
  arrowPosition: 'bottom' | 'top';
}

export interface TooltipContentSizeInput {
  kind: 'standing' | 'seat';
  hasPrice?: boolean;
  isBooked?: boolean;
  priceOptionCount?: number;
}

const STANDING_TOOLTIP_WIDTH = 248;
const SEAT_TOOLTIP_WIDTH = 248;
const PRICE_PICKER_TOOLTIP_WIDTH = 260;

export function getTooltipContentSize(input: TooltipContentSizeInput): TooltipSizeSpec {
  if (input.kind === 'standing') {
    return {
      width: STANDING_TOOLTIP_WIDTH,
      height: input.hasPrice ? 128 : 76,
    };
  }

  if (input.isBooked) {
    return {
      width: SEAT_TOOLTIP_WIDTH,
      height: 120,
    };
  }

  const priceOptionCount = input.priceOptionCount ?? 0;
  if (priceOptionCount > 1) {
    const rows = Math.ceil(priceOptionCount / 2);
    return {
      width: PRICE_PICKER_TOOLTIP_WIDTH,
      height: 108 + rows * 68,
    };
  }

  return {
    width: SEAT_TOOLTIP_WIDTH,
    height: 128,
  };
}

export function getContainerPointerPoint(
  container: HTMLElement,
  clientX: number,
  clientY: number,
): TooltipPoint {
  const rect = container.getBoundingClientRect();
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}

export function projectSeatToContainer(
  container: HTMLElement,
  svg: SVGSVGElement,
  zoomGroup: SVGGElement,
  contentBounds: { minX: number; minY: number },
  seatX: number,
  seatY: number,
): TooltipPoint | null {
  const point = svg.createSVGPoint();
  point.x = seatX - contentBounds.minX;
  point.y = seatY - contentBounds.minY;

  const ctm = zoomGroup.getScreenCTM();
  if (!ctm) return null;

  const screenPoint = point.matrixTransform(ctm);
  const containerRect = container.getBoundingClientRect();

  return {
    x: screenPoint.x - containerRect.left,
    y: screenPoint.y - containerRect.top,
  };
}

export function getTooltipPlacement({
  anchorMode,
  pointer,
  seat,
  containerSize,
  tooltipSize,
  seatBelowGap,
  allowOverflow = false,
}: {
  anchorMode: TooltipAnchorMode;
  pointer: TooltipPoint;
  seat: TooltipPoint;
  containerSize: { width: number; height: number };
  tooltipSize: TooltipSizeSpec;
  seatBelowGap: number;
  allowOverflow?: boolean;
}): TooltipPlacement {
  const margin = 12;
  const pointerGap = 14;
  const halfWidth = tooltipSize.width / 2;

  const clampX = (x: number) => {
    if (allowOverflow || containerSize.width <= margin * 2) return x;
    return Math.min(
      Math.max(x, margin + halfWidth),
      containerSize.width - margin - halfWidth,
    );
  };

  if (anchorMode === 'seat-below') {
    const belowTop = seat.y + seatBelowGap;
    const fitsBelow = allowOverflow || belowTop + tooltipSize.height <= containerSize.height - margin;

    if (fitsBelow) {
      return {
        left: clampX(seat.x),
        top: belowTop,
        transform: 'translate(-50%, 0)',
        arrowPosition: 'top',
      };
    }

    return {
      left: clampX(seat.x),
      top: allowOverflow
        ? seat.y - seatBelowGap
        : Math.max(margin + tooltipSize.height, seat.y - seatBelowGap),
      transform: 'translate(-50%, -100%)',
      arrowPosition: 'bottom',
    };
  }

  return {
    left: clampX(pointer.x),
    top: allowOverflow
      ? pointer.y - pointerGap
      : Math.max(margin + tooltipSize.height, pointer.y - pointerGap),
    transform: 'translate(-50%, -100%)',
    arrowPosition: 'bottom',
  };
}
