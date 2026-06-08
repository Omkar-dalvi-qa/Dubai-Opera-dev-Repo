import type { Metadata } from "next";
import type { ReactNode } from "react";
import ExternalEventDetailsProviderWrapperBySlug from "@/contexts/program-event/ExternalEventDetailsProviderWrapperBySlug";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { getBaseUrl } from "@/lib/seo/schema";
import { getExternalEventDetails } from "@/services/eventServer";
import { imageUrl } from "@/utils/imageUrl";
import type { Locale } from "@/i18n/config";

const SITE = "Dubai Opera Events";

/** Plain text, max length for meta description. */
function metaText(html: string, max = 160) {
  const t = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).trim()}…`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; genre: string; eventSlug: string }>;
}): Promise<Metadata> {
  const { locale, genre, eventSlug } = await params;
  const slug = String(eventSlug ?? "").trim();

  const baseUrl = await getBaseUrl();
  const path = `/events/${genre}/${slug}`;
  const canonical = await getCanonicalUrl({ locale: locale as Locale, path });

  const event = slug ? await getExternalEventDetails({ slug, locale: locale as Locale }) : null;
  console.log(event, "event>>>>.");
  if (!event) {
    return {
      title: `Event | ${SITE}`,
      description: `Shows and tickets at ${SITE}.`,
      metadataBase: new URL(baseUrl),
      alternates: { canonical },
    };
  }

  const description = metaText(
    event.short_description?.trim() || event.description?.trim() || `Book ${event.name} at ${SITE}.`,
  );
  const image = event.thumbnail_url ? imageUrl(event.thumbnail_url) : undefined;

  return {
    title: `${event.name} | ${SITE}`,
    description,
    metadataBase: new URL(baseUrl),
    alternates: { canonical },
    openGraph: {
      title: event.name,
      description,
      url: canonical,
      type: "website",
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default function EventsEventSegmentLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string; genre: string; eventSlug: string }>;
}) {
  return (
    <ExternalEventDetailsProviderWrapperBySlug params={params}>
      {children}
    </ExternalEventDetailsProviderWrapperBySlug>
  );
}
