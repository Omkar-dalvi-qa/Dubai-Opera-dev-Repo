export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiError = {
  message: string;
  status: number;
  code?: string;
};

export type ApiResponse<T> = {
  data: T | null;
  error: ApiError | null;
  status: number;
};

export type RequestConfig = {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  cache?: RequestCache;
  revalidate?: number;
  tags?: string[];
  timeout?: number;
};

export type CashCardProductsResponse = {
  success: boolean;
  message: string;
  data: CashCardApiProduct[];
  timestamp?: string;
};

export type CashCardApiProduct = {
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
  tickets: Array<{
    class_id: number;
    class_name: string;
    types: Array<{
      type_id: number;
      type_name: string;
      price: number;
    }>;
  }>;
  price: number;
};

