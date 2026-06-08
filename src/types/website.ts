import { ExternalEvent } from "@/services/eventServer";
import { EmaarPassUserProfile } from "@/services/oauthService";

export type WebsiteMenuItem = {
  id: string;
  label: string;
  url: string;
  sortOrder?: number;
  openInNewTab?: boolean;
  isVisible?: boolean;
  children: WebsiteMenuItem[];
};

export type SubscribeResult =
  | { ok: true; status: "subscribed" | "already_subscribed" }
  | { ok: false; error: string };

export type WebsiteMenu = {
  id: string;
  name: string;
  location: { id: string; key: string; name: string };
  items: WebsiteMenuItem[];
};

export type WebsiteBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  mediaType: "IMAGE" | "VIDEO";
  placement: string;
  device: "BOTH" | "DESKTOP" | "MOBILE";
  isActive: boolean;
  sortOrder: number;
  startDate: string | null;
  endDate: string | null;
  isExternal: boolean;
  clicks: number;
  impressions: number;
  imagePath: string;
  mobileImagePath: string;
  videoPath: string;
  image: string;
  mobileImage: string;
  videoUrl: string;
  youtubeUrl: string;
  ctaText: string;
  ctaUrl: string;
  backgroundColor?: string;
  /** Per-banner linked ticketing product id(s) when CMS sends them on each banner. */
  productId?: string | number | null;
  productIds?: (string | number)[] | null;
  product_id?: string | number | null;
};

export type PartnerLogo = {
  name: string;
  image: string;
};

export type PartnerCategory = {
  category: string;
  logos: PartnerLogo[];
};

export type WebsitePostCategory = { id: string; name: string; slug: string };

export type WebsitePostItem = {
  id: string;
  title: string;
  slug: string;
  subtitle?: string;
  excerpt: string;
  locale: string;
  isFeatured?: boolean;
  featuredImagePath?: string;
  mobileFeaturedImagePath?: string;
  featuredImage?: string;
  mobileFeaturedImage?: string;
  categories?: WebsitePostCategory[];
};

export type WebsitePostDetail = WebsitePostItem & {
  content?: string;
  body?: string;
  html?: string;
};

export type CreateCustomerBody = {
  emmarId?: string;
  firstName: string;
  lastName: string;
  email: string;
  dob?: string; // YYYY-MM-DD
  mobileNumber?: string; // E.164
  countryCode?: string;
  nationality?: string;
  gender?: string;
  address?: string;
  country?: string;
  city?: string;
  zipCode?: string;
};

export type CreateCustomerResult =
  | { ok: true; data?: EmaarPassUserProfile | null; status: "created" | "already_exists" | "found" | "updated" }
  | { ok: false; error: string; statusCode?: number };

export type CustomerDto = {
  id: number;
  emmarId: string | null;
  title: string;
  firstName: string;
  lastName: string;
  isNewsLetterSubscribed: boolean;
  isOnboardingCompleted: boolean;
  email: string;
  dob: string | null; // ISO date (YYYY-MM-DD) or null
  mobileNumber: string | null;
  countryCode: string | null;
  nationality: string | null;
  gender: string | null;
  address: string | null;
  country: string | null;
  city: string | null;
  zipCode: string | null;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
};

export type GetCustomerByEmaarIdSuccess = { data: CustomerDto };
export type GetCustomerByEmaarIdError = { error: { message: string } };
export type GetCustomerByEmaarIdResponse =
  | GetCustomerByEmaarIdSuccess
  | GetCustomerByEmaarIdError;

export type GetEventsBySearchResponse = {
  success: boolean;
  message?: string;
  data?:
    | ExternalEvent[]
    | {
        data?: ExternalEvent[];
        total?: number;
        page?: number;
        limit?: number;
        [key: string]: unknown;
      };
  timestamp?: string;
  [key: string]: unknown;
};

export type generateBookingTicketPDFResponse = {
  success?: boolean;
  message?: string;
  data?: string[] | null;
  [key: string]: unknown;
};

export type BookingHistoryRecord = {
    id: number;
    event_title?: string;
    reservation_id?: string;
    order_number?: string | null;
    transaction_id?: number;
    organization_id?: number;
    organization_name?: string;
    business_unit_id?: number;
    business_unit_name?: string;
    location_id?: number | null;
    location_name?: string | null;
    sub_location_id?: number | null;
    sub_location_name?: string | null;
    customer_id?: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    user_id?: number;
    user_name?: string;
    user_email?: string;
    user_username?: string;
    terminal_id?: number;
    terminal_name?: string;
    terminal_code?: string;
    terminal_type?: string;
    sub_total?: string;
    total_price?: number;
    tax_amount?: string;
    discount_amount?: string;
    addon_amount?: string;
    addon_ids?: number[];
    addon_names?: string[];
    addon_quantities?: number[];
    addon_unit_prices?: number[];
    addon_unit_taxes?: number[];
    addon_total_prices?: number[];
    tax_type_ids?: number[];
    tax_type_names?: string[];
    tax_natures: string[];
    tax_values?: string[];
    tax_amounts?: string[];
    payment_mode_id?: number;
    payment_mode_name?: string;
    payment_mode_code?: string;
    payment_status?: string;
    booking_status?: string;
    payment_date?: string;
    payment_reference_numbers?: string[];
    payment_amounts?: string[];
    payment_gateway_names?: string[];
    payment_gateway_transaction_ids?: number[];
    currency_id?: number;
    currency_name?: string;
    currency_code?: string;
    currency_symbol?: string;
    voucher_id?: number | null;
    voucher_code?: string | null;
    voucher_name?: string | null;
    voucher_type?: string | null;
    offer_applied?: boolean;
    offer_discount_amount?: number | null;
    source?: string;
    seats?: string;
    seat_numbers?: string[];
    ticket_count?: number;
    venue?: string;
    date_time?: string;
    external_distributor_id?: number | null;
    external_distributor_name?: string | null;
    sale_channel_id?: number | null;
    sale_channel_name?: string | null;
    sale_channel_code?: string | null;
    price_card_id?: number | null;
    price_card_name?: string | null;
    booking_date?: string;
    booking_created_at?: string;
    booking_updated_at?: string;
    reservation_expires_at?: string;
    reservation_hold_count?: number;
    is_tax_exclusive?: boolean;
    meta?: unknown | null;
    is_active?: boolean;
    is_deleted?: boolean;
    payment_notes?: string;
    ref_transaction_number?: number | null;
    product_business_unit_id?: number;
    product_business_unit_name?: string;
    product_category?: string;
    product_id?: number;
    product_location_id?: number | null;
    product_location_name?: string | null;
    product_name?: string;
    product_sku?: string;
    product_sub_location_id?: number | null;
    product_sub_location_name?: string | null;
    product_type?: string;
    quantity?: number;
    reservation_item_id?: number;
    schedule_date?: string;
    schedule_day: string;
    schedule_end?: string;
    schedule_id?: number;
    schedule_start?: string;
    seat_id?: string;
    seat_name?: string;
    seat_number?: string;
    is_redeemed?: boolean;
    redeemed_at?: string | null;
    zone_name?: string | null;
    gate_name?: string | null;
    partner_id?: number | null;
    partner_name?: string | null;
    amount_collectable_from_bank?: string | null;
    bank_id?: number | null;
    bank_name?: string | null;
    bin_range_end?: string | null;
    bin_range_id?: number | null;
    bin_range_name?: string | null;
    bin_range_start?: string | null;
    card_network_id?: number | null;
    card_network_name?: string | null;
    det_status?: string;
    det_order_id?: number | null;
    det_barcode?: string | null;
    det_section_code?: string;
    seller_code?: string;
    event_organiser_id?: number[];
    event_organiser_name?: string[];
    event_thumbnail_url?: string;
    event_season_name?: string | null;
    event_series_name?: string | null;
    screen_name?: string;
    zone_type?: string;
    seat_chart_id?: string;
    screen_layout_id?: number | null;
    gift_card_applied?: boolean;
    gift_card_applied_amounts?: number | null;
    gift_card_ids?: number | null;
    gift_card_numbers?: string | null;
    gift_card_amounts?: number | null;
    gift_card_balances?: number | null;
};

export type ProfileGiftCardItem = {
  id: number;
  card_number: string;
  card_type: string;
  business_unit_id: number;
  location_id: number | null;
  sub_location_id: number | null;
  holder_name: string;
  holder_email: string;
  holder_phone: string;
  holder_age: number | null;
  balance: string;
  total_recharged: string;
  total_spent: string;
  status: string;
  issued_at: string;
  issued_by: number;
  expires_at: string | null;
  last_used_at: string | null;
  last_recharged_at: string | null;
  card_serial: string | null;
  rfid_tag: string | null;
  barcode: string | null;
  auto_recharge: boolean;
  auto_recharge_amount: string | null;
  auto_recharge_threshold: string | null;
  notes: string | null;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

export type GetUserGiftCardsResponse = {
  success: boolean;
  message: string;
  data: ProfileGiftCardItem[];
  timestamp: string;
};

export type GetBookingHistoryResponse = {
  data?: {
    type: string;
    bookings: BookingHistoryRecord[];
  };
  message?: string;
  success?: boolean;
  timestamp?: string;  
};


export type EventRegisteredBody = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  eventName: string;
};

export type EventRegisteredResult = {
  message: string;
  id: string;
};