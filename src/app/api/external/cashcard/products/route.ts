import { NextRequest, NextResponse } from "next/server";
import { eventService } from "@/services/eventService";

type TicketType = {
  type_id: number;
  type_name: string;
  price: number;
};

type TicketClass = {
  class_id: number;
  class_name: string;
  types: TicketType[];
};

type CashCardProduct = {
  id: number;
  name: string;
  sku: string;
  product_type: string;
  status: string;
  description: string | null;
  short_description: string | null;
  base_price_card_id: number;
  business_unit_id: number;
  created_at: string;
  updated_at: string;
  schedule_id: number | null;
  validity: string | null;
  tnc: string | null;
  tickets: TicketClass[];
  price: number;
};

type CashCardProductsResponse = {
  success: boolean;
  message: string;
  data: CashCardProduct[];
  timestamp?: string;
};

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());

    const result = await eventService.get<CashCardProductsResponse>(
      "/external/cashcard/products",
      {
        params: Object.keys(params).length ? params : undefined,
        cache: "no-store",
      }
    );

    // Handle API error
    if (result.error) {
      return NextResponse.json(
        {
          success: false,
          message: result.error.message || "Something went wrong",
          data: [],
        },
        { status: result.status || 502 }
      );
    }

    // Ensure safe response
    return NextResponse.json(
      result.data ?? {
        success: true,
        message: "No products found",
        data: [],
      },
      { status: result.status ?? 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        data: [],
      },
      { status: 500 }
    );
  }
}