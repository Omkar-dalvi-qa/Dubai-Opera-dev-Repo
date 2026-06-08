"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

export default function AboutCorporates() {
  const [isRtl, setIsRtl] = useState(false);
  const t = useTranslations("about.corporates");

  useEffect(() => {
    setIsRtl(document.documentElement.dir === "rtl");
  }, []);

  const sectionBgClass = useMemo(
    () =>
      isRtl
        ? "bg-[radial-gradient(circle_at_20%_10%,rgba(129,68,31,0.25)_0%,rgba(19,7,7,0.95)_48%,rgba(4,3,4,1)_100%)]"
        : "bg-[radial-gradient(circle_at_80%_10%,rgba(129,68,31,0.25)_0%,rgba(19,7,7,0.95)_48%,rgba(4,3,4,1)_100%)]",
    [isRtl],
  );

  return (
    <section
      className={`relative mt-8 overflow-hidden ${sectionBgClass} bg-cover py-24 w-full`}
      style={{
        backgroundImage: "url('/about/Corporates.avif')",
        backgroundPosition: "center 14%",
      }}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.2)_0%,rgba(0,0,0,0.55)_100%)]" />
      <div className={`relative mx-auto w-full max-w-7xl px-6 sm:px-8 ${isRtl ? "text-right" : ""}`}>
        <h2
          className="text-center text-[40px] text-white"
          style={{
            fontFamily: "Optima, Candara, 'Noto Sans', sans-serif",
            fontWeight: 400,
            fontStyle: "normal",
            lineHeight: "100%",
            letterSpacing: "0",
          }}
        >
          {t("title")}
        </h2>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-[rgba(90,13,22,0.68)] p-6 backdrop-blur-[1px] sm:p-8">
            <h3
              className="font-montserrat text-[24px] font-semibold text-white"
              style={{ lineHeight: "100%", letterSpacing: "0" }}
            >
              {t("sponsorsAndPartners.title")}
            </h3>
            <p
              className="mt-4 font-montserrat text-[16px] font-normal text-white/90"
              style={{ lineHeight: "100%", letterSpacing: "0" }}
            >
              {t("sponsorsAndPartners.paragraph1")}
            </p>
            <p
              className="mt-3 font-montserrat text-[16px] font-normal text-white/90"
              style={{ lineHeight: "100%", letterSpacing: "0" }}
            >
              {t("sponsorsAndPartners.enquiries")}
            </p>
            <p
              className="mt-5 font-montserrat text-[16px] font-normal text-white"
              style={{ lineHeight: "100%", letterSpacing: "0" }}
            >
              {t("sponsorsAndPartners.contact")}
              <br />
              communications@dubaiopera.com
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-[rgba(90,13,22,0.68)] p-6 backdrop-blur-[1px] sm:p-8">
            <h3
              className="font-montserrat text-[24px] font-semibold text-white"
              style={{ lineHeight: "100%", letterSpacing: "0" }}
            >
              {t("corporateSupport.title")}
            </h3>
            <p
              className="mt-4 font-montserrat text-[16px] font-normal text-white/90"
              style={{ lineHeight: "100%", letterSpacing: "0" }}
            >
              {t("corporateSupport.paragraph1")}
            </p>
            <p
              className="mt-5 font-montserrat text-[16px] font-normal text-white/90"
              style={{ lineHeight: "100%", letterSpacing: "0" }}
            >
              {t("corporateSupport.paragraph2")}
              <br />
              communications@dubaiopera.com
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
