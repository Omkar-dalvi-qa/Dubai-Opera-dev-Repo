/**
 * Types for the seat layout API payload (see `seatlayout.json`).
 */

/** Seat availability in layout seat records (matches sbseat-layout editor). */
export type SeatLayoutSeatStatusCode = 0 | 1 | 2 | 3 | 4;

/** Optimized seat row in `data.seats`. */
export interface SeatLayoutSeatRecord {
  id: number;
  screen_layout_id?: number;
  row?: number;
  name: string;
  col?: number;
  /** May be null for standing or unclassified rows in some payloads. */
  ticket_class_id: number | null;
  status: SeatLayoutSeatStatusCode;
  group_id?: string | null;
  reserve_type_id?: number;
  seat_id: string;
  Xposition: number;
  Yposition: number;
  rotation?: number;
  is_table_seat?: boolean;
  is_round?: boolean;
  zone_id?: string | null;
  zone_name?: string | null;
  gate_id?: string | null;
  gate_name?: string | null;
  seat_type?: string | null;
  is_standing_section?: boolean;
  standing_id?: string | null;
  standing_name?: string | null;
  is_active?: boolean;
  is_deleted?: boolean;
}

/** Cubic-bezier control points for one polygon/path segment (index → next vertex). */
export interface SeatLayoutCurveHandle {
  cp1?: { x: number; y: number };
  cp2?: { x: number; y: number };
}

/** Shape payload nested under each `data.geometry` item. */
export interface SeatLayoutGeometryShape {
  id: string;
  type?: string;
  name?: string;
  label?: string;
  /** Center for `rectangle`, `standing-section`, `image`, `entry-gate`, `circle`, `text`; not top-left. */
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  points?: Array<{ x: number; y: number }>;
  /** `area` / `path`: segment index (string keys) → cubic-bezier handles between vertices. */
  curveHandles?: Record<string, SeatLayoutCurveHandle>;
  opacity?: number;
  /** Rotation: integer 0–360 = degrees; float with |r| ≤ 2π often radians — normalized to degrees when parsing. */
  rotation?: number;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  labelColor?: string;
  labelFontSize?: number;
  /** Area label anchor (world coordinates). */
  labelX?: number;
  labelY?: number;
  /** Extra label tilt; same degree/radian rules as `rotation` after parse. */
  labelRotation?: number;
  src?: string;
  standingCapacity?: number;
  /** Legacy export alias for `standingCapacity`. */
  capacity?: number;
  /** Polyline / path decoration: when true, close with Z (polygon). */
  isClosed?: boolean;
  /** `entry-gate`: corner radius. **`circle`**: radius at (`x`,`y`). */
  radius?: number;
  gateName?: string;
  /** Rounded corners for `rectangle` decorations (maps JSON `borderRadius`). */
  borderRadius?: number;
  zoneId?: string;
  linkedSeatIds?: string[];
  /** `text` decoration: body copy. */
  text?: string;
  /** `text` decoration: font size (separate from `labelFontSize`). */
  fontSize?: number;
  textAlign?: string;
  fontFamily?: string;
  fontWeight?: string | number;
}

export interface SeatLayoutGeometryItem {
  type: string;
  geometry: SeatLayoutGeometryShape;
}

/** Legacy seat row in `data.screen_layout`. */
export interface SeatLayoutScreenSeat {
  id: string;
  zone_id?: string | null;
  is_round?: boolean;
  rotation?: number;
  Xposition: number;
  Yposition: number;
  seat_type?: string | null;
  is_wheelchair?: boolean;
  sl_seat_name?: string | null;
  sl_seat_status?: string | number;
  screen_seat_type_id?: number;
  seat_reserve_type_id?: number;
  seat_class?: string | null;
  seat_price?: number;
  zone_name?: string | null;
  gate_name?: string | null;
  gate_id?: string | null;
  seat_status?: SeatLayoutSeatStatusCode;
  seat_chart_id?: string;
}

export type SeatLayoutRenderableSeat = SeatLayoutSeatRecord | SeatLayoutScreenSeat;

export interface SeatLayoutBlockedSeat {
  seat_id?: string;
  layout_seat_id?: string;
  blocked_at?: string;
  blocked_by?: string;
  blocked_reason?: string;
  blocked_type_code?: string | null;
}

export interface SeatLayoutSeatPriceOption {
  name?: string | null;
  price?: number | string | null;
}

/** Ticket class / pricing row in `data.seat_classes`. */
export interface SeatLayoutSeatClass {
  class_id: number;
  class_name: string;
  class_color?: string | null;
  price?: number | string | null;
  price_variants?: SeatLayoutSeatPriceOption[];
}

/** @deprecated Use `SeatLayoutSeatClass` / `seat_classes` instead. */
export interface SeatLayoutScreenSeatType {
  ticket_class_id?: number;
  ticket_class_name?: string;
  ticket_class_color_code?: string;
  sst_id?: number;
  seat_class?: string;
  sstg_id?: number;
  sst_seat_color_code?: string;
  sst_order?: number;
  sst_is_active?: string;
  seat_price?: number;
  all_seat_prices?: SeatLayoutSeatPriceOption[];
}

/** Raw SVG/decoration object from legacy `screen_meta_data.elements`. */
export interface SeatLayoutSvgElementJson {
  x?: number;
  y?: number;
  id?: string;
  type?: string;
  name?: string;
  label?: string;
  width?: number;
  height?: number;
  radius?: number;
  zoneId?: string;
  opacity?: number;
  rotation?: number;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  labelColor?: string;
  labelFontSize?: number;
  labelRotation?: number;
  labelX?: number;
  labelY?: number;
  src?: string;
  points?: Array<{ x: number; y: number }>;
  curveHandles?: Record<string, SeatLayoutCurveHandle>;
  gateName?: string;
  borderRadius?: number;
  linkedSeatIds?: string[];
  text?: string;
  fontSize?: number;
  textAlign?: string;
  fontFamily?: string;
  fontWeight?: string | number;
}

export interface SeatLayoutScreenMetaData {
  elements?: Record<string, SeatLayoutSvgElementJson>;
  [key: string]: unknown;
}

export interface SeatLayoutScreenDetail {
  screen_id?: number;
  screen_name?: string;
  screen_layout_id?: number;
  screen_meta_data?: SeatLayoutScreenMetaData;
}

/** `response.data` — the object the renderer reads. */
export interface SeatLayoutPayload {
  layout_id?: number;
  chart_id?: string;
  schedule_id?: number;
  event_config_id?: number;
  seats?: SeatLayoutSeatRecord[];
  geometry?: SeatLayoutGeometryItem[];
  screen_layout?: SeatLayoutScreenSeat[];
  screenDetails?: SeatLayoutScreenDetail[];
  seat_classes?: SeatLayoutSeatClass[];
  /** @deprecated Use `seat_classes` instead. */
  screen_seat_type?: SeatLayoutScreenSeatType[];
  blocked_seats?: SeatLayoutBlockedSeat[];
  currency_code?: string;
  screen_id?: string;
}

/** Top-level API / JSON file shape. */
export interface SeatLayoutResponse {
  success: boolean;
  message?: string;
  data: SeatLayoutPayload;
  timestamp?: string;
}
