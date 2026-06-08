import { JSEncrypt } from "jsencrypt";

type EncryptUpgCardDataInput = {
  amount: string;
  currency: string;
  cardNumber: string;
  cardHolderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
};

export async function encryptUpgCardData(
  input: EncryptUpgCardDataInput,
): Promise<string> {
  const publicKey = process.env.NEXT_PUBLIC_UPG_RSA_PUBLIC_KEY;
  if (!publicKey?.trim()) {
    throw new Error("NEXT_PUBLIC_UPG_RSA_PUBLIC_KEY is required.");
  }

  const payload = JSON.stringify({
    Amount: input.amount,
    CardHolderName: input.cardHolderName,
    CardNumber: input.cardNumber,
    CVV: input.cvv,
    ExpiryMonth: input.expiryMonth,
    ExpiryYear: input.expiryYear,
    SaveCard: "false",
    Token: "",
    Currency: input.currency,
  });

  const encryptor = new JSEncrypt();
  encryptor.setPublicKey(publicKey.replace(/\\n/g, "\n"));
  const encrypted = encryptor.encrypt(payload);
  if (!encrypted) {
    throw new Error("Failed to encrypt card payload.");
  }
  return encrypted;
}