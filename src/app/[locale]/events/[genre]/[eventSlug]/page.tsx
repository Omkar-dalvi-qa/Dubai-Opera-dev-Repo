import ProgramEventDetailPageClient from "@/components/program-event/ProgramEventDetailPageClient";
import { getPartners } from "@/services/websiteServer";

export const revalidate = 600;

export default async function EventsEventDetailPage({
  params,
}: {
  params: Promise<{ locale: string; genre: string; eventSlug: string }>;
}) {
  const { locale, genre, eventSlug } = await params;
  const partnerCategories = await getPartners({ locale: locale as string });

  return (
    <ProgramEventDetailPageClient
      locale={locale}
      eventName={genre}
      eventId={eventSlug}
      partnerCategories={partnerCategories}
      backHref={`/${locale}/events/${genre}`}
      bookTicketsUrl={`/${locale}/events/${genre}/${eventSlug}`}
    />
  );
}

