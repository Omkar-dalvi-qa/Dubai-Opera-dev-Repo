import type { CSSProperties } from "react";
import { isSeatShapeTypeMark, normalizeSeatMark } from "./seatMark";

export type SeatShapeKind = "NORMAL" | "SQUARE" | "WHEELCHAIR";

/** Matches editor `seat_type` (Prisma `seat_type`). */
export function parseSeatShapeKind(seatType?: string | null): SeatShapeKind {
  const up = (seatType ?? "NORMAL").trim().toUpperCase();
  if (up === "SQUARE") return "SQUARE";
  if (up === "WHEELCHAIR") return "WHEELCHAIR";
  return "NORMAL";
}

/** Circles are symmetric; square/wheelchair seats use stored rotation on the body only. */
export function seatBodyRotateTransform(
  cx: number,
  cy: number,
  shapeKind: SeatShapeKind,
  rotationDeg: number,
): string | undefined {
  if (shapeKind === "NORMAL") return undefined;
  if (!Number.isFinite(rotationDeg) || Math.abs(rotationDeg) < 1e-6) {
    return undefined;
  }
  return `rotate(${rotationDeg}, ${cx}, ${cy})`;
}

type SeatShapeSvgProps = {
  cx: number;
  cy: number;
  /** Half-size (editor seats are 22×22 → r = 11). */
  r: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  shapeKind: SeatShapeKind;
  opacity?: number;
  seatMark?: string;
  style?: CSSProperties;
};

/** Seat body aligned with sbseat-layout editor `drawSeatShape`. */
export function SeatShapeSvg({
  cx,
  cy,
  r,
  fill,
  stroke = "transparent",
  strokeWidth = 0,
  shapeKind,
  opacity = 1,
  seatMark,
  style,
}: SeatShapeSvgProps) {
  const size = r * 2;

  if (shapeKind === "SQUARE" || shapeKind === "WHEELCHAIR") {
    const inset = size * 0.08;
    const side = size - inset * 2;
    const x = cx - side / 2;
    const y = cy - side / 2;
    const rx = shapeKind === "WHEELCHAIR" ? 3 : 2;
    return (
      <g style={style}>
        <rect
          x={x}
          y={y}
          width={side}
          height={side}
          rx={rx}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          vectorEffect="non-scaling-stroke"
          opacity={opacity}
        />
        {shapeKind === "WHEELCHAIR" ? (
          <text
            x={cx}
            y={cy + 1}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={Math.max(8, size * 0.38)}
            fontWeight="bold"
            fill={stroke !== "transparent" ? stroke : "#374151"}
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            {"\u267F"}
          </text>
        ) : null}
        {shapeKind === "SQUARE" &&
        seatMark &&
        !isSeatShapeTypeMark(seatMark) ? (
          <SeatMarkOverlay cx={cx} cy={cy} mark={seatMark} />
        ) : null}
      </g>
    );
  }

  return (
    <g style={style}>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        vectorEffect="non-scaling-stroke"
        opacity={opacity}
      />
      {seatMark ? <SeatMarkOverlay cx={cx} cy={cy} mark={seatMark} /> : null}
    </g>
  );
}

function SeatMarkOverlay({
  cx,
  cy,
  mark,
}: {
  cx: number;
  cy: number;
  mark: string;
}) {
  const normalized = normalizeSeatMark(mark);
  if (isSeatShapeTypeMark(normalized)) return null;
  return (
    <text
      x={cx}
      y={cy + 4}
      textAnchor="middle"
      fontSize={8}
      fontWeight="bold"
      fill="#ffffff"
      style={{ pointerEvents: "none", userSelect: "none" }}
    >
      {mark.slice(0, 2).toUpperCase()}
    </text>
  );
}
