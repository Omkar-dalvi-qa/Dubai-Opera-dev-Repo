import PayLaterPageClient from "@/components/paylater/PayLaterPageClient";
import { validatePayLaterToken } from "@/utils/encryptPayLater";

type PayLaterPageProps = {
  params: Promise<{ locale: string; reservationId: string }>;
  searchParams: Promise<{ token?: string }>;
};

function parseReservationId(value: string): string | null {
  return String(value).trim().length > 0 ? String(value).trim() : null;
}

export default async function PayLaterPage({
  params,
  searchParams,
}: PayLaterPageProps) {
  const { locale, reservationId: reservationIdParam } = await params;
  const { token = "" } = await searchParams;

  const reservationId = parseReservationId(reservationIdParam);
  const sharedKey = process.env.PAY_LATER_SHARED_KEY || "";

  if (!token || !reservationId || !sharedKey) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-[720px] items-center justify-center px-6 text-center text-white">
        Invalid or missing payment link.
      </div>
    );
  }

  const validation = await validatePayLaterToken({
    token,
    reservationId,
    sharedKey,
  });

  if (!validation.valid) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-[720px] items-center justify-center px-6 text-center text-white">
        This payment link is invalid or expired.
      </div>
    );
  }

  return (
    <PayLaterPageClient
      locale={locale || "en"}
      reservationId={reservationId}
      token={token}
    />
  );
}