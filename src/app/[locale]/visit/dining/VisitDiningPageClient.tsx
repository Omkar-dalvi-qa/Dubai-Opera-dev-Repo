"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Mail, MapPin, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import Partners from "@/components/Partners";
import { PartnerCategory } from "@/types/website";

type HeroImage = {
  id: number;
  src: string;
  alt: string;
};

type DiningPackage = {
  subtitle: string;
  subDescription: string;
};

type DiningButton = {
  label: string;
  href: string;
  external: boolean;
  variant?: "primary" | "secondary";
};

type DiningExperience = {
  title: string;
  image: string;
  description: string;
  packages?: DiningPackage[];
  note?: string;
  location?: string;
  phone?: string;
  email?: string;
  hours?: string;
  buttons: DiningButton[];
};

export default function VisitDiningPageClient({
  partnerCategories,
}: {
  partnerCategories: PartnerCategory[];
}) {
  const t = useTranslations("visitDining");
  const heroImages = t.raw("heroImages") as HeroImage[];
  const diningExperiences = t.raw("experiences") as DiningExperience[];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  const nextImage = () =>
    setCurrentImageIndex((p) => (p + 1) % heroImages.length);
  const prevImage = () =>
    setCurrentImageIndex((p) => (p === 0 ? heroImages.length - 1 : p - 1));

  return (
    <main className="min-h-screen flex flex-col w-full relative bg-linear-to-b from-[#060102] from-[10%] via-[#792327] via-[80%] to-black">
      <section className="relative w-full h-[75vh] min-h-[500px] flex items-end md:items-center justify-center overflow-hidden group">
        {heroImages.map((img, idx) => (
          <div
            key={img.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              idx === currentImageIndex ? "opacity-100 z-0" : "opacity-0 -z-10"
            }`}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover"
              priority={idx === 0}
            />
          </div>
        ))}

        <div className="absolute inset-0 bg-black/40 pointer-events-none z-1" />
        <div className="absolute top-0 left-0 w-full h-40 bg-linear-to-b from-black/80 to-transparent pointer-events-none z-1" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-linear-to-t from-[#000000] via-[#000000]/80 to-transparent pointer-events-none z-5" />

        <h1 className="text-white text-[40px] md:text-5xl lg:text-6xl font-optima tracking-[0.15em] z-10  text-center font-light uppercase mb-40 md:mb-0 md:mt-12 drop-shadow-md">
          {t("heroTitle")}
        </h1>

        <div className="absolute bottom-0 left-0 right-0 z-20 px-6 sm:px-8 lg:px-12 py-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="hidden sm:block w-12 h-12 shrink-0" aria-hidden />

            <div
              className="flex items-center justify-center gap-3 sm:flex-1"
              role="tablist"
              aria-label={t("slideNavigationAria")}
            >
              {heroImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  role="tab"
                  aria-selected={idx === currentImageIndex}
                  aria-label={t("goToSlideAria", { index: idx + 1 })}
                  className={`lg:h-[10px] lg:w-[140px] h-[5px] w-[60px] rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentImageIndex
                      ? "bg-white"
                      : "bg-white/40 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={prevImage}
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 hover:border-white/30 transition-all duration-300"
                aria-label={t("previousSlideAria")}
              >
                <ChevronLeft size={22} className="text-white" strokeWidth={1.5} />
              </button>
              <button
                onClick={nextImage}
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 hover:border-white/30 transition-all duration-300"
                aria-label={t("nextSlideAria")}
              >
                <ChevronRight size={22} className="text-white" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-10 lg:px-12 py-16 text-white pb-24">
          <div className="text-center max-w-4xl mx-auto mb-10 space-y-6">
            <h2 className="text-3xl md:text-[40px] leading-tight font-optima tracking-wide">
              {t("sectionTitle")}
            </h2>
            <p className="text-[16px] leading-relaxed text-white font-montserrat font-light max-w-3xl mx-auto">
              {t("sectionDescription")}
            </p>
          </div>

          <div className="space-y-5">
            {diningExperiences.map((dining, index) => (
              <div
                key={index}
                className="flex flex-col gap-6 border-b border-white pb-8 last:border-b-0 last:pb-0"
              >
                <h3 className="text-[28px] md:text-[40px] font-optima tracking-wide">
                  {dining.title}
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-5 rounded-3xl overflow-hidden relative shadow-xl aspect-16/10 lg:aspect-auto">
                    <Image
                      src={dining.image}
                      alt={dining.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 45vw"
                    />
                  </div>

                  <div className="lg:col-span-7 flex flex-col font-montserrat">
                    <div className="text-[16px] leading-normal text-white font-light whitespace-pre-line mb-8">
                      {dining.description}
                    </div>

                    {dining.packages?.map((pkg, pIdx) => (
                      <div key={pIdx} className="mb-6">
                        <h4 className="text-[24px] font-medium text-white mb-2">
                          {pkg.subtitle}
                        </h4>
                        <p className="text-[16px] leading-normal text-white font-light whitespace-pre-line">
                          {pkg.subDescription}
                        </p>
                      </div>
                    ))}

                    {dining.note ? (
                      <p className="text-[16px] text-white mb-6 italic">{dining.note}</p>
                    ) : null}

                    {dining.email ? (
                      <div className="flex items-start gap-4 mb-3">
                        <Mail className="w-4 h-4 text-white mt-1 shrink-0" />
                        <div>
                          <span className="text-[16px] text-white">{t("emailLabel")} </span>
                          <a
                            href={`mailto:${dining.email}`}
                            className="text-[14.5px] text-white hover:underline underline-offset-4 font-medium transition-colors"
                          >
                            {dining.email}
                          </a>
                        </div>
                      </div>
                    ) : null}

                    <div className="flex flex-col gap-3 mb-8 text-[14.5px] font-light text-white/90 mt-auto">
                      {dining.location ? (
                        <div className="flex items-center gap-3">
                          <div className="w-4 flex justify-center">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <span>{dining.location}</span>
                        </div>
                      ) : null}
                      {dining.phone ? (
                        <div className="flex items-center gap-3">
                          <div className="w-4 flex justify-center">
                            <Phone className="w-4 h-4" />
                          </div>
                          <span>{dining.phone}</span>
                        </div>
                      ) : null}
                      {dining.hours ? (
                        <p className="font-medium text-white pt-2">{dining.hours}</p>
                      ) : null}
                    </div>

                    <div className="flex gap-4 mt-auto">
                      {dining.buttons.map((btn, bIdx) => {
                        const Tag = btn.external ? "a" : Link;
                        const props = btn.external
                          ? {
                              href: btn.href,
                              target: "_blank",
                              rel: "noopener noreferrer",
                            }
                          : { href: btn.href };
                        return (
                          <Tag
                            key={bIdx}
                            {...props}
                            className={`px-8 py-3 w-full inline-flex items-center justify-center md:w-auto rounded-lg hover:bg-[#8b2b32] text-white text-[14px] font-medium tracking-wide transition-colors ${
                              btn.variant === "primary"
                                ? "bg-[#792327]"
                                : "bg-transparent border border-white"
                            }`}
                          >
                            {btn.label}
                          </Tag>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Partners partnerCategories={partnerCategories} />
    </main>
  );
}

