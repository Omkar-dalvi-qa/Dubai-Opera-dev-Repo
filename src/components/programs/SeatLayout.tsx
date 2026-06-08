import Image from 'next/image'
import React from 'react'
// import  SeatMapStep  from '../seat-map'

export default function SeatLayout(chartId: string, eventConfigId: number, isModalOpen: boolean, eventModalStep: string) {
  return (
    <div>
      {/* <SeatMapStep
        chartId={chartId}
        eventConfigId={Number(eventConfigId ?? 0)}
        active={isModalOpen && eventModalStep === "seats"}
        // onSelectionChange={async (seats) => {
        //   // Enrich seats with price based on seat.category (ticket class id OR name).
        //   const priceCardId = selectedEventPriceCardId;
        //   if (!priceCardId) {
        //     console.warn(
        //       "[EventSeatPricing] missing priceCardId/ticketTypeId",
        //       {
        //         priceCardId,
        //       },
        //     );
        //     setSelectedEventSeats(seats);
        //     return;
        //   }

        //   const categories = (seats || [])
        //     .map((s: any) => s?.category)
        //     .filter((c: any) => c != null);

        //   // First try numeric ticket_class_id directly.
        //   const numericClassIds = Array.from(
        //     new Set(
        //       categories
        //         .map((c: any) => Number(c))
        //         .filter(
        //           (n: any) => Number.isFinite(n) && n > 0,
        //         ),
        //     ),
        //   ) as number[];

        //   // If categories are names (e.g. "VIP"), resolve via price card.
        //   let resolvedClassIds = numericClassIds;
        //   let classNameToId: Record<string, number> = {};
        //   if (
        //     resolvedClassIds.length === 0 &&
        //     categories.length > 0
        //   ) {
        //     try {
        //       const res: any =
        //         await POSServices.getPriceCardClasses(
        //           priceCardId,
        //         );
        //       const classes: Array<{
        //         id: number;
        //         name: string;
        //       }> =
        //         res?.success && res?.data?.classes
        //           ? res.data.classes
        //           : [];
        //       classNameToId = Object.fromEntries(
        //         classes
        //           .filter((x) => x?.id && x?.name)
        //           .map((x) => [
        //             String(x.name).trim().toLowerCase(),
        //             Number(x.id),
        //           ]),
        //       );
        //       resolvedClassIds = Array.from(
        //         new Set(
        //           categories
        //             .map((c: any) =>
        //               String(c).trim().toLowerCase(),
        //             )
        //             .map((k: string) => classNameToId[k])
        //             .filter(
        //               (n: any) =>
        //                 Number.isFinite(n) && n > 0,
        //             ),
        //         ),
        //       ) as number[];
        //     } catch {
        //       // ignore; fallback keeps seats without price
        //     }
        //   }

        //   if (resolvedClassIds.length === 0) {
        //     console.warn(
        //       "[EventSeatPricing] no ticket_class_ids resolved",
        //       {
        //         categories,
        //         priceCardId,
        //       },
        //     );
        //     setSelectedEventSeats(seats);
        //     return;
        //   }

        //   try {
        //     console.log(
        //       "[EventSeatPricing] fetching prices",
        //       {
        //         priceCardId,
        //         ticketClassIds: resolvedClassIds,
        //       },
        //     );
        //     // API expects single ticket_class_id; fetch per class and merge.
        //     const prices: Record<string, number> = {};
        //     for (const classId of resolvedClassIds) {
        //       const res: any =
        //         await POSServices.getSeatPrices({
        //           price_card_id: priceCardId,
        //           ticket_class_id: classId,
        //         });
        //       const row = res?.row ?? null;
        //       if (row?.price != null) {
        //         prices[String(classId)] = Number(row.price);
        //         if (row?.seat_class?.name) {
        //           prices[
        //             String(row.seat_class.name)
        //               .trim()
        //               .toLowerCase()
        //           ] = Number(row.price);
        //         }
        //       }
        //     }
        //     console.log(
        //       "[EventSeatPricing] prices result",
        //       prices,
        //     );

        //     const enriched = (seats || []).map((s: any) => {
        //       const rawCat = s?.category;
        //       const key = String(rawCat ?? "").trim();
        //       const keyLower = key.toLowerCase();
        //       const classId =
        //         Number.isFinite(Number(rawCat)) &&
        //         Number(rawCat) > 0
        //           ? Number(rawCat)
        //           : classNameToId[
        //               String(rawCat ?? "")
        //                 .trim()
        //                 .toLowerCase()
        //             ];
        //       const priceFromKey =
        //         prices[key] != null
        //           ? Number(prices[key])
        //           : undefined;
        //       const priceFromKeyLower =
        //         prices[keyLower] != null
        //           ? Number(prices[keyLower])
        //           : undefined;
        //       const priceFromClass =
        //         Number.isFinite(classId) &&
        //         prices[String(classId)] != null
        //           ? Number(prices[String(classId)])
        //           : undefined;
        //       const price =
        //         priceFromKey ??
        //         priceFromKeyLower ??
        //         priceFromClass ??
        //         undefined;
        //       return price != null ? { ...s, price } : s;
        //     });

        //     setSelectedEventSeats(enriched);
        //   } catch {
        //     console.warn(
        //       "[EventSeatPricing] price fetch failed",
        //     );
        //     setSelectedEventSeats(seats);
        //   }
        // }}
        className="h-full"
      /> */}
      </div>
  )
}