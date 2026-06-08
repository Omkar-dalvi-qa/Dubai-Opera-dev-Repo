import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { ExternalEventDetailsProvider } from "@/contexts/program-event/ExternalEventDetailsContext";
import {
  getExternalEventDetailsCached,
  getExternalEventDetailsResult,
  getExternalEventSchedules,
  type ExternalEventDetails,
} from "@/services/eventServer";
import ExternalEventDraftPasswordGate from "@/components/program-event/ExternalEventDraftPasswordGate";

async function externalEventDetailsWithSchedules(
  details: ExternalEventDetails,
  locale: string,
) {
  const schedules = await getExternalEventSchedules({
    slug: details.slug,
    locale,
  });

  return {
    ...details,
    schedules,
  };
}

/**
 * Server wrapper for routes where the event slug is the segment param.
 * Keeps route param naming explicit (`eventSlug`) for readability.
 */
export default async function ExternalEventDetailsProviderWrapperBySlug({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string; genre: string; eventSlug: string }>;
}) {
  const { eventSlug, locale } = await params;
  const clean = String(eventSlug || "").trim();
  if (!clean) notFound();

  const externalEventDetails = await getExternalEventDetailsCached(clean, {
    locale: locale as string,
  });
  if (externalEventDetails) {
    const detailsWithSchedules = await externalEventDetailsWithSchedules(
      externalEventDetails,
      locale as string,
    );

    return <ExternalEventDetailsProvider value={detailsWithSchedules}>{children}</ExternalEventDetailsProvider>;
  }
  console.log(externalEventDetails, "externalEventDetails>>>>.");

  const result = await getExternalEventDetailsResult({ slug: clean, locale: locale as string });
  if (result.ok) {
    const detailsWithSchedules = await externalEventDetailsWithSchedules(result.data, locale as string);

    return <ExternalEventDetailsProvider value={detailsWithSchedules}>{children}</ExternalEventDetailsProvider>;
  }
  
  if (!result.ok && result.reason === "PASSWORD_REQUIRED") {
    return (
      <ExternalEventDraftPasswordGate slug={clean} locale={locale as string}>
        {children}
      </ExternalEventDraftPasswordGate>
    );
  }

  notFound();
}

