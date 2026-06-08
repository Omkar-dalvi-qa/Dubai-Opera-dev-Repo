import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { ExternalEventDetailsProvider } from "@/contexts/program-event/ExternalEventDetailsContext";
import { getExternalEventDetailsCached } from "@/services/eventServer";

/** Async server wrapper so `layout.tsx` can stay a sync component (avoids Next layout default-export issues). */
export default async function ExternalEventDetailsProviderWrapper({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string; eventName: string; eventId: string }>;
}) {
  const { eventId, locale } = await params;
  const externalEventDetails = await getExternalEventDetailsCached(eventId, { locale: locale as string });

  if (!externalEventDetails) {
    notFound();
  }

  return (
    <ExternalEventDetailsProvider value={externalEventDetails}>{children}</ExternalEventDetailsProvider>
  );
}
