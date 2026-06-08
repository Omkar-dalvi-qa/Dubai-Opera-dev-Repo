export type ExternalEventReservationResponse = {
  reservation_id?: number;
  expiry_time?: string;
  summary?: unknown;
  [key: string]: unknown;
};

export type ExternalEventReservationTransactionResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
  [key: string]: unknown;
};

export type ExternalEventUpgPaymentResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
  [key: string]: unknown;
};

export type ExternalEventPayLaterPaymentResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
  [key: string]: unknown;
};

export type ExternalBookDetailsResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
  [key: string]: unknown;
};

/**
 * Creates/updates an event reservation via the **Next.js API route** (same origin → no browser CORS).
 * The route handler uses `eventService` (server) with `X-Access-Key-Secret`, same pattern as `getExternalEventDetails` in `eventServer.ts`.
 */
export async function postExternalEventReservation(
  body: unknown,
): Promise<ExternalEventReservationResponse> {
  const url = "/api/external/events/reservation";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  console.log("[postExternalEventReservation] res:", res);
  console.log("[postExternalEventReservation] body:", body);
  console.log("[postExternalEventReservation] url:", url);
  const json = (await res.json()) as {
    success?: boolean;
    message?: string;
    data?: ExternalEventReservationResponse;
  };
  if (!res.ok || json.success === false) {
    throw new Error(json?.message || `Reservation request failed (${res.status})`);
  }
  const data = json.data ?? (json as unknown as ExternalEventReservationResponse);
  return data as ExternalEventReservationResponse;
}


export async function getSeatLayout(
  schedule_id: string,
): Promise<any> {
  const url = `/api/external/seat-layout/${schedule_id}`;
  const res = await fetch(url);
  
  return res.json();
}

/**
 * Creates a transaction for an existing reservation via same-origin proxy.
 * Proxies to `POST /events/reservation/transaction`.
 */
export async function postExternalEventReservationTransaction(
  body: unknown,
): Promise<ExternalEventReservationTransactionResponse> {
  const url = "/api/external/events/reservation/transaction";
  console.log("[postExternalEventReservationTransaction] payload:", body);
  console.log("[postExternalEventUpgPayment] url:", url);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as ExternalEventReservationTransactionResponse;
  if (!res.ok || json.success === false) {
    throw new Error(json?.message || `Transaction request failed (${res.status})`);
  }
  return json;
}

/**
 * Creates UPG payment for an existing reservation via same-origin proxy.
 * Proxies to `POST /external/events/upg-payment/:reservationId`.
 */
export async function postExternalEventUpgPayment(
  reservationId: string,
  body: unknown,
): Promise<ExternalEventUpgPaymentResponse> {
  const url = `/api/external/events/upg-payment/${encodeURIComponent(String(reservationId))}`;
  console.log("[postExternalEventUpgPayment] payload:", body);
  console.log("[postExternalEventUpgPayment] url:", url);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as ExternalEventUpgPaymentResponse;
  if (!res.ok || json.success === false) {
    throw new Error(json?.message || `UPG payment request failed (${res.status})`);
  }
  return json;
}

/**
 * Fetches booking details by transaction id via same-origin proxy.
 * Proxies to `GET /external/book/:transactionId`.
 */
export async function getExternalBookDetails(transactionId: string): Promise<ExternalBookDetailsResponse> {
  const url = `/api/external/book/${encodeURIComponent(transactionId)}`;
  console.log("[getExternalBookDetails] url:", url);
  console.log("[getExternalBookDetails] transactionId:", transactionId);
  const res = await fetch(url);
  const json = (await res.json()) as ExternalBookDetailsResponse;
  if (!res.ok || json.success === false) {
    throw new Error(json?.message || `Book details request failed (${res.status})`);
  }
  return json;
}


export async function getExternalEventReservationbyId(
  reservationId: string | null,
  token?: string,
): Promise<ExternalEventPayLaterPaymentResponse> {
  const encodedReservationId = encodeURIComponent(String(reservationId));
  const query = token ? `?token=${encodeURIComponent(token)}` : "";
  const url = `/api/external/events/reservation/${encodedReservationId}${query}`;
  console.log("[getExternalEventReservationbyId] url:", url);
  console.log("[getExternalEventReservationbyId] reservationId:", reservationId);
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store", // optional: avoids stale data in Next.js
  });

  let json: ExternalEventPayLaterPaymentResponse;

  try {
    json = await res.json();
  } catch {
    throw new Error(`Invalid JSON response (${res.status})`);
  }

  if (!res.ok || json.success === false) {
    throw new Error(
      json?.message || `Pay later reservation fetch failed (${res.status})`
    );
  }
  console.log("[getExternalEventReservationbyId] json:", json);
  return json;
}