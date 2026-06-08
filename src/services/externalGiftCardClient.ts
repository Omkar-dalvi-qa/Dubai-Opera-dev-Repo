export type ExternalGiftCardItem = {
  id: number;
  card_number: string;
  balance: string | number;
  expires_at?: string | null;
  holder_phone?: string;
  pin_code?: string;
  [key: string]: unknown;
};

export type ExternalGiftCardListResponse = {
  success?: boolean;
  message?: string;
  data?: ExternalGiftCardItem[];
  [key: string]: unknown;
};

export type ExternalGiftCardsByUserParams = {
  mobile: string;
  card_number: string;
  email: string;
};

export type ExternalGiftCardVerifyPinPayload = {
  card_id: number;
  pin_code: string;
  reservation_id: number;
};

export type ExternalGiftCardVerifyPinResponse = {
  success?: boolean;
  message?: string;
  data?: {
    id?: number;
    card_number?: string;
    holder_name?: string;
    holder_phone?: string;
    balance?: string | number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type ExternalRemoveGiftCardPayload = {
  reservation_id: number;
  card_id: number;
};

export type ExternalRemoveGiftCardResponse = {
  success?: boolean;
  message?: string;
  data?: {
    reservation_adjustment?: {
      reservation_id?: number;
      summary?: Record<string, unknown>;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
};


export async function getExternalGiftCardsByUser(
  params: ExternalGiftCardsByUserParams,
): Promise<ExternalGiftCardListResponse> {
  const qs = new URLSearchParams({
    mobile: params.mobile.trim(),
    card_number: params.card_number.trim(),
    email: params.email.trim(),
  }).toString();

  const res = await fetch(`/api/external/cashcard/cards/by-user?${qs}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const json = (await res.json()) as ExternalGiftCardListResponse;
  if (!res.ok || json.success === false) {
    throw new Error(json?.message || `Cashcard/cards/by-user request failed (${res.status})`);
  }
  return json;
}

export async function postExternalGiftCardVerifyPin(
  payload: ExternalGiftCardVerifyPinPayload,
): Promise<ExternalGiftCardVerifyPinResponse> {
  const res = await fetch("/api/external/cashcard/verify-pin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = (await res.json()) as ExternalGiftCardVerifyPinResponse;
  if (!res.ok || json.success === false) {
    throw new Error(json?.message || `Gift card verify-pin request failed (${res.status})`);
  }
  return json;
}

export async function getExternalRemoveGiftCard(
  payload: ExternalRemoveGiftCardPayload,
): Promise<ExternalRemoveGiftCardResponse> {
  const res = await fetch("/api/external/cashcard/remove-gift-card", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = (await res.json()) as ExternalRemoveGiftCardResponse;
  if (!res.ok || json.success === false) {
    throw new Error(json?.message || `Remove gift card request failed (${res.status})`);
  }
  return json;
}

