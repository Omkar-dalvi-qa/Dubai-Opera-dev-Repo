import { NextRequest, NextResponse } from "next/server";
import { eventService } from "@/services/eventService";

/**
 * Same-origin proxy for `POST /external/events/reservation`.
 * Browser calls this route (no CORS); the server forwards with `X-Access-Key-Secret` like `eventServer.getExternalEventDetails`.
 */

interface Payload {
  reservation_id?: number;
  customer_name?: string;
  email?: string;
  phone?: string;
  voucher?: {
    voucher_code: string;
    card_number?: string;
  };
  items: {
    product_id: number;
    schedule_id: number;
    is_deleted?: boolean;
    addons?: {
      id: number;
      quantity: number;
    }[];
    //for product
    ticket_class_id?: number;
    ticket_type_id?: number;
    quantity?: number;
    //for event seat_id
    seat_id?: string;
  }[];
  
}
export async function POST(req: NextRequest) {
  let body:any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const finalItems: Payload['items'] = [];
  if(body?.selected_seats){
    for (const item of body?.selected_seats) {

      finalItems.push({
        seat_id: item.layout_seat_id ?? "",
        // quantity: item.quantity ?? 0,
        product_id: item.product_id ?? 0,
        schedule_id: item.schedule_id ?? 0,
        // ticket_class_id: item.ticket_class_id ?? 0,
        // ticket_type_id: item.ticket_type_id ?? 0,
        addons: item.addons ?? [],
        is_deleted: item.is_deleted ?? false,
      });
    }}

  const FinalPayload: Payload = {
    reservation_id: body.reservation_id,
    customer_name: body.customer_name ?? "",
    email: body.email ?? "",
    phone: body.phone ?? "",
    ...(body.voucher ? { voucher: body.voucher } : {}),
    items: finalItems,
  };

  const result = await eventService.post<{
    success?: boolean;
    message?: string;
    data?: unknown;
  }>("/external/booking/reserve", {
    body: body?.selected_seats ? FinalPayload : body,
  });

  if (result.error) {
    const status =
      result.status && result.status >= 400 && result.status < 600
        ? result.status
        : 502;
    return NextResponse.json(
      { success: false, message: result.error.message },
      { status },
    );
  }

  const status = result.status && result.status >= 200 ? result.status : 200;
  return NextResponse.json(result.data ?? { success: true }, { status });
}
