import type { ElementData, SeatPriceOption, SeedData, StandingSectionData } from '../components/SeedLayoutSvg';
import type {
  SeatLayoutBlockedSeat,
  SeatLayoutCurveHandle,
  SeatLayoutGeometryItem,
  SeatLayoutPayload,
  SeatLayoutScreenSeat,
  SeatLayoutScreenSeatType,
  SeatLayoutSeatClass,
  SeatLayoutSeatRecord,
  SeatLayoutSvgElementJson,
} from '../types/seatLayoutApi';
import { normalizeSeatStatusCode, isSeatStatusUnavailable } from '@/lib/seat-layout/status-code';
import {
  buildBlockedSeatInfoById,
  mergeBlockedInfoIntoSeed,
  type BlockedSeatInfo,
} from './blocked-seat-info';
import { resolveSeatMark } from './seatMark';
import { isUnknownSeatClassLabel } from './seatClassLabel';
import {
  DEFAULT_SEAT_RADIUS,
  resolveGeometryFillFromShape,
} from './geometryRender';

export interface ParsedLayoutData {
  seeds: SeedData[];
  elements: ElementData[];
  standingSections: StandingSectionData[];
  classes: string[];
  typeColors: Record<string, string>;
}

function normalizeLegacySeatClass(seatType: SeatLayoutScreenSeatType): SeatLayoutSeatClass | null {
  const classId = seatType.ticket_class_id ?? seatType.sst_id;
  if (typeof classId !== 'number') return null;

  return {
    class_id: classId,
    class_name: seatType.ticket_class_name ?? seatType.seat_class ?? 'Unknown',
    class_color: seatType.ticket_class_color_code ?? seatType.sst_seat_color_code ?? null,
    price: seatType.seat_price,
    price_variants: seatType.all_seat_prices,
  };
}

function resolveSeatClasses(data: SeatLayoutPayload): SeatLayoutSeatClass[] {
  if (data.seat_classes?.length) return data.seat_classes;

  return (data.screen_seat_type ?? [])
    .map(normalizeLegacySeatClass)
    .filter((seatClass): seatClass is SeatLayoutSeatClass => seatClass !== null);
}

/** Label from a resolved `seat_classes` row (for palette / pricing only). */
function getSeatClassLabel(seatClass?: SeatLayoutSeatClass): string {
  if (!seatClass) return 'Unknown';
  return seatClass.class_name || 'Unknown';
}

/** Label shown on seats / class filter (never rely on ticket_class_id alone — API may send null for standing). */
function resolveSeatDisplayType(
  seat: SeatLayoutSeatRecord,
  matchedSeatClass?: SeatLayoutSeatClass,
): string {
  if (matchedSeatClass) {
    const name = matchedSeatClass.class_name?.trim();
    if (name) return name;
  }

  if (seat.is_standing_section && seat.standing_name?.trim()) {
    return seat.standing_name.trim();
  }

  const seatType = seat.seat_type?.trim();
  if (seatType) {
    const up = seatType.toUpperCase();
    if (up === 'NORMAL') return seat.is_standing_section ? 'Standing' : 'Standard';
    return seatType.replace(/_/g, ' ');
  }

  if (seat.zone_name?.trim()) return seat.zone_name.trim();

  const id = seat.ticket_class_id;
  if (typeof id === 'number' && Number.isFinite(id)) {
    return `Class ${id}`;
  }

  return 'Unknown';
}

function getSeatClassColor(seatClass?: SeatLayoutSeatClass): string | undefined {
  return seatClass?.class_color ?? undefined;
}

function buildSeatClassMap(seatClasses: SeatLayoutSeatClass[]): Map<number, SeatLayoutSeatClass> {
  const seatClassesById = new Map<number, SeatLayoutSeatClass>();

  seatClasses.forEach((seatClass) => {
    if (typeof seatClass.class_id === 'number') {
      seatClassesById.set(seatClass.class_id, seatClass);
    }
  });

  return seatClassesById;
}

function buildSeatClassColors(seatClasses: SeatLayoutSeatClass[]): Record<string, string> {
  const typeColors: Record<string, string> = {};

  seatClasses.forEach((seatClass) => {
    const classLabel = getSeatClassLabel(seatClass);
    const color = getSeatClassColor(seatClass);
    if (classLabel !== 'Unknown' && color) {
      typeColors[classLabel.toLowerCase()] = color;
    }
  });

  return typeColors;
}

function normalizeSeatPrices(seatClass?: SeatLayoutSeatClass): SeatPriceOption[] | undefined {
  if (!seatClass || !Array.isArray(seatClass.price_variants)) return undefined;

  return seatClass.price_variants
    .map((priceOption) => ({
      name: priceOption.name || 'Standard',
      price: Number(priceOption.price),
    }))
    .filter((priceOption) => Number.isFinite(priceOption.price));
}

function getSeatClassDisplayPrice(seatClass?: SeatLayoutSeatClass): number {
  const priceOptions = normalizeSeatPrices(seatClass);
  if (priceOptions?.length === 1) return priceOptions[0].price;
  const basePrice = Number(seatClass?.price);
  return Number.isFinite(basePrice) ? basePrice : 0;
}

const TWO_PI = 2 * Math.PI;

/**
 * SVG `rotate()` expects degrees. Payloads often send radians as floats (~±π) while
 * snapped angles use integers in degrees (45, 90, …).
 */
function parseCurveHandles(
  raw?: Record<string, SeatLayoutCurveHandle>,
): Record<string, SeatLayoutCurveHandle> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const parsed: Record<string, SeatLayoutCurveHandle> = {};
  Object.entries(raw).forEach(([key, handles]) => {
    if (!handles || typeof handles !== 'object') return;
    const cp1 = handles.cp1;
    const cp2 = handles.cp2;
    const entry: SeatLayoutCurveHandle = {};
    if (cp1 && typeof cp1.x === 'number' && typeof cp1.y === 'number') {
      entry.cp1 = { x: cp1.x, y: cp1.y };
    }
    if (cp2 && typeof cp2.x === 'number' && typeof cp2.y === 'number') {
      entry.cp2 = { x: cp2.x, y: cp2.y };
    }
    if (entry.cp1 || entry.cp2) parsed[key] = entry;
  });
  return Object.keys(parsed).length > 0 ? parsed : undefined;
}

function normalizeGeometryRotationDeg(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value === 0) return 0;
  const abs = Math.abs(value);
  if (Number.isInteger(value) && abs <= 360) return value;
  if (abs <= TWO_PI + 1e-6) return (value * 180) / Math.PI;
  return value;
}

function parseGeometryElements(geometry?: SeatLayoutGeometryItem[]): ElementData[] {
  if (!geometry?.length) return [];

  const parsedElements: ElementData[] = [];

  geometry.forEach((item) => {
    const shape = item.geometry;
    if (!shape?.id) return;

    const elementType = item.type || shape.type || '';
    const shapeRecord = shape as unknown as Record<string, unknown>;

    parsedElements.push({
      id: shape.id,
      type: elementType,
      name: shape.name || '',
      label: shape.label || '',
      x: shape.x ?? 0,
      y: shape.y ?? 0,
      width: shape.width ?? 0,
      height: shape.height ?? 0,
      points: shape.points || [],
      curveHandles: parseCurveHandles(shape.curveHandles),
      opacity: shape.opacity ?? 1,
      rotation: normalizeGeometryRotationDeg(shape.rotation),
      fillColor: resolveGeometryFillFromShape(elementType, shapeRecord),
      strokeColor: shape.strokeColor || 'transparent',
      strokeWidth: shape.strokeWidth || 0,
      labelColor: shape.labelColor,
      labelFontSize: shape.labelFontSize,
      labelRotation: shape.labelRotation !== undefined && shape.labelRotation !== null
        ? normalizeGeometryRotationDeg(shape.labelRotation)
        : undefined,
      labelX: typeof shape.labelX === 'number' ? shape.labelX : undefined,
      labelY: typeof shape.labelY === 'number' ? shape.labelY : undefined,
      src: shape.src,
      standingCapacity:
        typeof shape.standingCapacity === 'number'
          ? shape.standingCapacity
          : typeof shape.capacity === 'number'
            ? shape.capacity
            : undefined,
      pathClosed: shape.isClosed === true,
      radius: typeof shape.radius === 'number' ? shape.radius : undefined,
      borderRadius: typeof shape.borderRadius === 'number' ? shape.borderRadius : undefined,
      gateName: shape.gateName ?? undefined,
      textContent: typeof shape.text === 'string' ? shape.text : undefined,
      textFontSize: typeof shape.fontSize === 'number' ? shape.fontSize : undefined,
      textAlign: typeof shape.textAlign === 'string' ? shape.textAlign : undefined,
      textFontFamily: typeof shape.fontFamily === 'string' ? shape.fontFamily : undefined,
      textFontWeight: shape.fontWeight !== undefined && shape.fontWeight !== null ? shape.fontWeight : undefined,
    });
  });

  return parsedElements;
}

function parseLegacyElements(screenDetails?: SeatLayoutPayload['screenDetails']): ElementData[] {
  const rawElements = screenDetails?.[0]?.screen_meta_data?.elements;
  if (!rawElements) return [];

  return Object.entries(rawElements).map(([id, element]: [string, SeatLayoutSvgElementJson]) => ({
    id,
    type: element.type ?? '',
    name: element.name || '',
    label: element.label || '',
    x: element.x ?? 0,
    y: element.y ?? 0,
    width: element.width ?? 0,
    height: element.height ?? 0,
    points: element.points || [],
    opacity: element.opacity ?? 1,
    rotation: normalizeGeometryRotationDeg(element.rotation),
    fillColor: element.fillColor || 'transparent',
    strokeColor: element.strokeColor || 'transparent',
    strokeWidth: element.strokeWidth || 0,
    labelColor: element.labelColor,
    labelFontSize: element.labelFontSize,
    labelRotation: element.labelRotation !== undefined && element.labelRotation !== null
      ? normalizeGeometryRotationDeg(element.labelRotation)
      : undefined,
    labelX: typeof element.labelX === 'number' ? element.labelX : undefined,
    labelY: typeof element.labelY === 'number' ? element.labelY : undefined,
    src: element.src,
    borderRadius: typeof element.borderRadius === 'number' ? element.borderRadius : undefined,
    textContent: typeof element.text === 'string' ? element.text : undefined,
    textFontSize: typeof element.fontSize === 'number' ? element.fontSize : undefined,
    textAlign: typeof element.textAlign === 'string' ? element.textAlign : undefined,
    textFontFamily: typeof element.fontFamily === 'string' ? element.fontFamily : undefined,
    textFontWeight: element.fontWeight !== undefined && element.fontWeight !== null ? element.fontWeight : undefined,
  }));
}

function getStandingBlockedSeatIds(
  sectionId: string,
  seats: SeatLayoutSeatRecord[],
  blockedSeats?: SeatLayoutBlockedSeat[],
): string[] {
  const standingSeatIds = new Set(
    seats
      .filter((seat): seat is SeatLayoutSeatRecord & { seat_id: string } => (
        Boolean(seat.is_standing_section && seat.standing_id === sectionId && seat.seat_id)
      ))
      .map((seat) => seat.seat_id),
  );

  return (blockedSeats ?? []).flatMap((blockedSeat) => {
    const seatId = blockedSeat.seat_id ?? blockedSeat.layout_seat_id;
    return seatId && standingSeatIds.has(seatId) ? [seatId] : [];
  });
}

function applyStandingSectionBlocks(
  seeds: SeedData[],
  blockedSeatIds: string[],
  blockedById: Map<string, BlockedSeatInfo>,
): SeedData[] {
  const remainingBlockedSeatIds = [...blockedSeatIds];

  return seeds.map((seed) => {
    if (seed.isBooked) return seed;

    const raw = seed.rawData;
    if (!raw || !('seat_id' in raw) || !raw.seat_id) return seed;

    const blockedIndex = remainingBlockedSeatIds.indexOf(raw.seat_id);
    if (blockedIndex === -1) return seed;

    remainingBlockedSeatIds.splice(blockedIndex, 1);
    return mergeBlockedInfoIntoSeed({ ...seed, isBooked: true }, blockedById);
  });
}

function buildOptimizedSeed(
  seat: SeatLayoutSeatRecord,
  blockedIds: Set<string>,
  seatClassesById: Map<number, SeatLayoutSeatClass>,
  blockedById: Map<string, BlockedSeatInfo>,
): SeedData {
  const ticketClassId = seat.ticket_class_id;
  const matchedSeatClass =
    typeof ticketClassId === 'number' && Number.isFinite(ticketClassId)
      ? seatClassesById.get(ticketClassId)
      : undefined;
  const classLabel = resolveSeatDisplayType(seat, matchedSeatClass);
  const isUnknownClass = isUnknownSeatClassLabel(classLabel);
  const priceOptions = normalizeSeatPrices(matchedSeatClass);
  const hasMatchedEmptyPriceList = Boolean(matchedSeatClass && priceOptions && priceOptions.length < 1);
  const selectedPriceOption = priceOptions?.length === 1 ? priceOptions[0] : undefined;
  const displayPrice = selectedPriceOption?.price ?? getSeatClassDisplayPrice(matchedSeatClass);
  const seatStatus = normalizeSeatStatusCode(seat.status);
  const seatMark = resolveSeatMark({ seat_type: seat.seat_type });
  const isBlocked = !seat.is_standing_section && Boolean(seat.seat_id) && blockedIds.has(seat.seat_id);

  const seed: SeedData = {
    id: seat.seat_id,
    x: seat.Xposition,
    y: seat.Yposition,
    type: classLabel,
    name: seat.name,
    seatMark,
    seatShape: seat.seat_type ?? 'NORMAL',
    seatRadius: DEFAULT_SEAT_RADIUS,
    price: displayPrice,
    priceOptions,
    selectedPriceOption,
    isBooked:
      isSeatStatusUnavailable(seatStatus) ||
      isBlocked ||
      hasMatchedEmptyPriceList ||
      isUnknownClass,
    isBlocked: seatStatus === 4,
    rawData: seat,
  };

  return mergeBlockedInfoIntoSeed(seed, blockedById);
}

function parseOptimizedSeats(
  seats: SeatLayoutSeatRecord[],
  blockedIds: Set<string>,
  blockedSeats: SeatLayoutBlockedSeat[] | undefined,
  seatClassesById: Map<number, SeatLayoutSeatClass>,
): { seeds: SeedData[]; standingSections: StandingSectionData[] } {
  const blockedById = buildBlockedSeatInfoById(blockedSeats);
  const parsedSeeds: SeedData[] = [];
  const standingSeedsById = new Map<string, SeedData[]>();

  seats.forEach((seat) => {
    if (!seat.seat_id || seat.is_deleted === true || seat.is_active === false) return;

    const seed = buildOptimizedSeed(seat, blockedIds, seatClassesById, blockedById);

    if (seat.is_standing_section && seat.standing_id) {
      const sectionSeeds = standingSeedsById.get(seat.standing_id) ?? [];
      sectionSeeds.push(seed);
      standingSeedsById.set(seat.standing_id, sectionSeeds);
      return;
    }

    parsedSeeds.push(seed);
  });

  const standingSections = [...standingSeedsById.entries()].map(([id, sectionSeeds]) => {
    const sortedSeeds = [...sectionSeeds].sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true }));
    const standingName = sectionSeeds.find((seed) => {
      const raw = seed.rawData;
      return raw && 'standing_name' in raw && raw.standing_name;
    })?.rawData;
    const label = standingName && 'standing_name' in standingName
      ? standingName.standing_name ?? 'Standing'
      : 'Standing';
    const sectionBlockedSeatIds = getStandingBlockedSeatIds(id, seats, blockedSeats);
    const sectionSeedsWithBlocks = applyStandingSectionBlocks(
      sortedSeeds,
      sectionBlockedSeatIds,
      blockedById,
    );

    return {
      id,
      label,
      capacity: sortedSeeds.length,
      seeds: sectionSeedsWithBlocks,
    };
  });

  return { seeds: parsedSeeds, standingSections };
}

function parseLegacySeats(
  seats: SeatLayoutScreenSeat[],
  blockedIds: Set<string>,
  seatClassesById: Map<number, SeatLayoutSeatClass>,
  blockedById: Map<string, BlockedSeatInfo>,
): { seeds: SeedData[]; standingSections: StandingSectionData[] } {
  const parsedSeeds: SeedData[] = [];

  seats.forEach((seat) => {
    if (!seat.id) return;

    const matchedSeatClass = typeof seat.screen_seat_type_id === 'number'
      ? seatClassesById.get(seat.screen_seat_type_id)
      : undefined;
    const type = seat.seat_class || getSeatClassLabel(matchedSeatClass);
    const isUnknownClass = isUnknownSeatClassLabel(type);
    const priceOptions = normalizeSeatPrices(matchedSeatClass);
    const hasMatchedEmptyPriceList = Boolean(matchedSeatClass && priceOptions && priceOptions.length < 1);
    const selectedPriceOption = priceOptions?.length === 1 ? priceOptions[0] : undefined;
    const displayPrice = selectedPriceOption?.price
      ?? seat.seat_price
      ?? getSeatClassDisplayPrice(matchedSeatClass);
    const isBlocked = blockedIds.has(seat.id);
    const isLayoutBlocked = String(seat.sl_seat_status ?? '0') === '1';
    const seatStatus = normalizeSeatStatusCode(seat.seat_status);
    const rawSeat = hasMatchedEmptyPriceList
      ? { ...seat, sl_seat_status: 1 }
      : seat;

    parsedSeeds.push(
      mergeBlockedInfoIntoSeed(
        {
          id: seat.id,
          x: seat.Xposition,
          y: seat.Yposition,
          type,
          name: seat.sl_seat_name ?? '',
          seatMark: resolveSeatMark(seat),
          seatShape: seat.seat_type ?? (seat.is_wheelchair ? 'WHEELCHAIR' : 'NORMAL'),
          seatRadius: DEFAULT_SEAT_RADIUS,
          price: displayPrice,
          priceOptions,
          selectedPriceOption,
          isBooked:
            isSeatStatusUnavailable(seatStatus) ||
            isBlocked ||
            isLayoutBlocked ||
            hasMatchedEmptyPriceList ||
            isUnknownClass,
          isBlocked: isLayoutBlocked,
          rawData: rawSeat,
        },
        blockedById,
      ),
    );
  });

  return { seeds: parsedSeeds, standingSections: [] };
}

export function parseLayoutData(data: SeatLayoutPayload): ParsedLayoutData {
  const blockedIds = new Set<string>();
  data.blocked_seats?.forEach((blockedSeat) => {
    if (blockedSeat.seat_id) blockedIds.add(blockedSeat.seat_id);
    if (blockedSeat.layout_seat_id) blockedIds.add(blockedSeat.layout_seat_id);
  });
  const blockedById = buildBlockedSeatInfoById(data.blocked_seats);

  const seatClasses = resolveSeatClasses(data);
  const seatClassesById = buildSeatClassMap(seatClasses);
  const typeColors = buildSeatClassColors(seatClasses);
  const elements = parseGeometryElements(data.geometry);

  if (data.seats?.length) {
    const { seeds, standingSections } = parseOptimizedSeats(
      data.seats,
      blockedIds,
      data.blocked_seats,
      seatClassesById,
    );
    const standingSectionsWithCapacity = standingSections.map((section) => {
      const geometry = elements.find((element) => element.id === section.id && element.type === 'standing-section');
      return {
        ...section,
        capacity: geometry?.standingCapacity ?? section.capacity,
      };
    });

    return {
      seeds,
      elements,
      standingSections: standingSectionsWithCapacity,
      classes: [...new Set([
        ...seeds.map((seed) => seed.type),
        ...standingSectionsWithCapacity.flatMap((section) => section.seeds.map((seed) => seed.type)),
      ])].filter((cls) => cls !== 'Unknown'),
      typeColors,
    };
  }

  if (elements.length === 0) {
    elements.push(...parseLegacyElements(data.screenDetails));
  }

  const { seeds } = parseLegacySeats(
    data.screen_layout ?? [],
    blockedIds,
    seatClassesById,
    blockedById,
  );

  return {
    seeds,
    elements,
    standingSections: [],
    classes: [...new Set(seeds.map((seed) => seed.type))].filter((cls) => cls !== 'Unknown'),
    typeColors,
  };
}
