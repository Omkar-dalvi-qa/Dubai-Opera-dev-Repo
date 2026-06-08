"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";

export default function GlobalNotFoundPage() {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale ?? "en";

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-black text-white">
      {/* Background radial gradient */}
      <div
        className="pointer-events-none absolute inset-0 opacity-80 bg-gradient-to-b from-[#060102] via-[#792327] to-black"
      />

      <section className="relative z-10 mx-auto max-w-2xl px-4 text-center md:px-8">
        <h1 className="font-optima text-[100px] leading-none md:text-[130px]">404</h1>
        <h2 className="font-optima text-[32px] md:text-[48px] md:leading-[72px]">Page Not Found</h2>

        <p className="mx-auto mt-6 max-w-[500px] font-montserrat text-[14px] text-[#E0E0E0] md:text-[15px] leading-[1.6]">
          We&apos;re sorry, but the page you&apos;re looking for seems to have taken an
          intermission. Let&apos;s get you back to the show.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href={`/`}
            className="inline-flex h-[44px] items-center justify-center gap-2 rounded-[8px] border border-white/20 bg-white/20 px-6 font-montserrat text-[15px] font-medium text-white transition-colors hover:bg-[#351A1D]/80 cursor-pointer"
          >
            <ArrowLeft size={16} />
            Go Back
          </Link>

          <Link
            href={`/`}
            className="inline-flex h-[44px] items-center justify-center gap-2 rounded-[8px] bg-[#75262A] px-6 font-montserrat text-[15px] font-medium text-white transition-colors hover:bg-[#8B3035]"
          >
            <Home size={16} />
            Return Home
          </Link>
        </div>
      </section>
    </main>
  );
}
