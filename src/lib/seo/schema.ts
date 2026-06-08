import type { Locale } from "@/i18n/config";
import { headers } from "next/headers";

function schemaBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function isLocalhostBaseUrl(value: string) {
  return (
    value.includes("://localhost") ||
    value.includes("://127.0.0.1") ||
    value.includes("://0.0.0.0")
  );
}

export async function getBaseUrl(): Promise<string> {
  const envBaseUrlRaw =
    process.env.NEXT_PUBLIC_BASE_URL ??
    "";

  const envBaseUrl = envBaseUrlRaw ? schemaBaseUrl(envBaseUrlRaw) : "";

  // If explicitly set (prod OR dev), trust env.
  if (envBaseUrl) return envBaseUrl;

  // Otherwise, try the current request origin (works for localhost + any host).
  const h = (await headers()) as unknown as Headers;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const requestBaseUrl = host ? schemaBaseUrl(`${proto}://${host}`) : "";

  if (requestBaseUrl) return requestBaseUrl;

  // Final fallback based on environment.
  if (process.env.NODE_ENV === "development") return "http://localhost:3000";
  return "https://www.dubaiopera.com";
}

export function getLocalePath(locale: Locale) {
  return locale;
}

export async function getOrganizationSchema(locale: Locale) {
  const baseUrl = await getBaseUrl();
  const localeCode = getLocalePath(locale);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: locale === "ar" ? "دبي اوبرا" : "Dubai Opera",
    url: `${baseUrl}/${localeCode}/home`,
    logo: `${baseUrl}/media/logo-light.svg`,
    sameAs: [
      "https://www.facebook.com/dubaiopera",
      "https://twitter.com/dubaiopera",
      "https://www.instagram.com/dubaiopera/",
    ],
  };
}

export async function getWebsiteSchema(locale: Locale) {
  const baseUrl = await getBaseUrl();
  void locale;
  return {
    "@context": "https://schema.org/",
    "@type": "WebSite",
    name: "Dubai Opera",
    url: `${baseUrl}/`,
    potentialAction: {
      "@type": "SearchAction",
      target: "{search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };
}

export function getFaqPageSchema(args: {
  questions: { question: string; answer: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: args.questions.map((qa) => ({
      "@type": "Question",
      name: qa.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: qa.answer,
      },
    })),
  };
}

export type BreadcrumbItem = {
  name: string;
  item: string;
};

export function getBreadcrumbSchema(
  locale: Locale,
  items: BreadcrumbItem[],
) {
  void locale;
  return {
    "@context": "https://schema.org/",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: it.name,
      item: it.item,
    })),
  };
}

