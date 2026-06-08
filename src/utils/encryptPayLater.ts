export type PayLaterTokenPayload = {
  reservation_id: number;
  exp: number;
};

function base64UrlToBytes(input: string): Uint8Array {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const b64 = `${normalized}${padding}`;

  if (typeof atob === "function") {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  // Node.js fallback (SSR/runtime on server)
  return Uint8Array.from(Buffer.from(b64, "base64"));
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const out = new Uint8Array(bytes.length);
  out.set(bytes);
  return out.buffer;
}

async function decryptPayLaterToken(
  token: string,
  sharedKey: string,
): Promise<PayLaterTokenPayload> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid token format");
  }

  const [ivPart, dataPart, tagPart] = parts;
  const iv = base64UrlToBytes(ivPart);
  const data = base64UrlToBytes(dataPart);
  const tag = base64UrlToBytes(tagPart);
  const ciphertext = new Uint8Array(data.length + tag.length);
  ciphertext.set(data, 0);
  ciphertext.set(tag, data.length);

  const keyMaterial = await crypto.subtle.digest(
    "SHA-256",
    toArrayBuffer(new TextEncoder().encode(sharedKey)),
  );

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );

  const plainBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    cryptoKey,
    toArrayBuffer(ciphertext),
  );

  const parsed = JSON.parse(
    new TextDecoder().decode(plainBuffer),
  ) as Partial<PayLaterTokenPayload>;

  if (
    typeof parsed.reservation_id !== "number" ||
    !Number.isFinite(parsed.reservation_id) ||
    typeof parsed.exp !== "number" ||
    !Number.isFinite(parsed.exp)
  ) {
    throw new Error("Invalid token payload");
  }

  return {
    reservation_id: parsed.reservation_id,
    exp: parsed.exp,
  };
}

export async function validatePayLaterToken(params: {
  token: string;
  reservationId: string | null;
  sharedKey: string;
}): Promise<{ valid: true; payload: PayLaterTokenPayload } | { valid: false; reason: string }> {
  try {
    const payload = await decryptPayLaterToken(params.token, params.sharedKey);

    if (String(payload.reservation_id).trim() !== String(params.reservationId).trim()) {
      return { valid: false, reason: "Reservation mismatch" };
    }

    // Accept both ms and seconds based expirations.
    const expMs = payload.exp > 1e12 ? payload.exp : payload.exp * 1000;
    if (expMs < Date.now()) {
      return { valid: false, reason: "Token expired" };
    }

    return { valid: true, payload };
  } catch (e) {
    return {
      valid: false,
      reason: e instanceof Error ? e.message : "Token validation failed",
    };
  }
}