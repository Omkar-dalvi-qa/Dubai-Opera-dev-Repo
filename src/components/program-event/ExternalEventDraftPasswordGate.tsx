"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalEventDetailsProvider } from "@/contexts/program-event/ExternalEventDetailsContext";
import type { ExternalEventDetails } from "@/services/eventServer";

type Props = {
  slug: string;
  locale?: string;
  children: React.ReactNode;
};

export default function ExternalEventDraftPasswordGate({ slug, locale, children }: Props) {
  const [details, setDetails] = useState<ExternalEventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Call our Next.js route handler so the service secret stays server-side.
  const url = useMemo(() => `/api/external/products/${encodeURIComponent(slug)}`, [slug]);
  const envDraftPassword = (process.env.NEXT_PUBLIC_DRAFT_PASSWORD ?? "").trim();
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      // If a draft password is provided via env, try it first without prompting.
      let nextPassword: string | null = envDraftPassword || null;
      while (!cancelled) {
        if (!nextPassword) {
          const entered = window.prompt("This event is protected. Please enter the password to continue:");
          if (entered == null) {
            setError("Password entry cancelled.");
            setLoading(false);
            return;
          }
          nextPassword = entered.trim();
        }

        const trimmed = String(nextPassword).trim();
        nextPassword = null;
        if (!trimmed) continue;

        try {
          const query = new URLSearchParams({
            ...(locale ? { locale } : {}),
            password: trimmed,
            channel: "web",
          });
          const res = await fetch(`${url}?${query.toString()}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "X-Draft-Password": trimmed,
            },
            cache: "no-store",
          });

          const contentType = res.headers.get("content-type") ?? "";
          const json = contentType.includes("application/json") ? ((await res.json()) as any) : null;
          const text = json ? null : await res.text();

          if (res.ok && json?.success && json?.data) {
            setDetails(json.data as ExternalEventDetails);
            return;
          }

          const messageUpper = String(json?.message ?? "").toUpperCase();
          const codeUpper = String(json?.code ?? "").toUpperCase();

          if (
            res.status === 401 ||
            codeUpper === "DRAFT_PASSWORD_REQUIRED" ||
            messageUpper.includes("DRAFT_PASSWORD_REQUIRED")
          ) {
            // If we just tried the env password, silently fall through to prompt next.
            if (trimmed === envDraftPassword) continue;
            window.alert("Incorrect password. Please try again.");
            continue;
          }

          setError(String(json?.message ?? text ?? `Failed to load event (HTTP ${res.status}).`));
          setLoading(false);
          return;
        } catch (e) {
          setError((e as Error)?.message ?? "Network error.");
          setLoading(false);
          return;
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [envDraftPassword, locale, url]);

  if (details) {
    return <ExternalEventDetailsProvider value={details}>{children}</ExternalEventDetailsProvider>;
  }

  return (
    <main className="min-h-screen bg-linear-to-b from-black via-primary-light to-[#000000] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1b1b1de8] shadow-[0_20px_50px_rgba(0,0,0,0.28)] p-6">
        <h1 className="text-white text-xl font-semibold tracking-[-0.02em]">This event is protected</h1>
        <p className="mt-2 text-white/70 text-sm">{loading ? "Waiting for password…" : "Unable to access this event."}</p>
        {error ? <p className="mt-4 text-sm text-[#ff8a8a]">{error}</p> : null}
      </div>
    </main>
  );
}

