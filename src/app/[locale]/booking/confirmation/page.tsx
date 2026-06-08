import BookingConfirmationClient from "@/components/programs/BookingConfirmationClient";
import { getExternalBookDetailsServer } from "@/services/eventServer";

type BookingDetailsData = {
  reservation_items?: Array<{ product_name?: unknown }>;
};

export default async function BookingConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    event?: string;
    date?: string;
    time?: string;
    transactionId?: string;
    transaction_id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    mobile?: string;
  }>;
}) {
  const { locale } = await params;
  const query = await searchParams;

  const transactionId = query.transactionId || query.transaction_id || "";
  const bookingDetails = transactionId ? await getExternalBookDetailsServer(transactionId, locale) : null;
  const bookingData = (bookingDetails && typeof bookingDetails === "object"
    ? (bookingDetails as { data?: unknown }).data
    : undefined) as BookingDetailsData | undefined;
  const summaryDateTime = [query.date, query.time].filter(Boolean).join(", ");
  console.log(bookingData, "bookingData");
  return (
    <BookingConfirmationClient
      eventTitle={
        typeof bookingData?.reservation_items?.[0]?.product_name === "string"
          ? bookingData.reservation_items[0].product_name
          : ""
      }
      doneHref={`/${locale}/season`}
      myBookingsHref={`/${locale}/profile`}
      summaryDateTime={summaryDateTime}
      selectedSeatLabels=""
      seatSubtotal={0}
      selectedAddons={[]}
      customerName={[query.firstName, query.lastName].filter(Boolean).join(" ").trim()}
      customerEmail={query.email}
      customerMobile={query.mobile}
      initialApiBooking={bookingDetails?.success ? (bookingDetails.data as any) : null}
      initialApiError={
        bookingDetails && bookingDetails.success === false
          ? bookingDetails.message || "Could not load booking details"
          : null
      }
    />
  );
}

