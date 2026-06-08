import Image from "next/image";

export default function AboutOurStory({ t }: { t: (key: string) => string }) {
  return (
    <section className="grid gap-6 sm:gap-8 md:grid-cols-[3fr_2fr] md:items-start">
      <div className="w-full max-w-none">
        <h2
          className="text-[40px] text-white/95"
          style={{
            fontFamily: "Optima, Candara, 'Noto Sans', sans-serif",
            fontWeight: 400,
            fontStyle: "normal",
            lineHeight: "100%",
            letterSpacing: "0",
            verticalAlign: "middle",
          }}
        >
          {t("ourStory")}
        </h2>
        <h3
          className="mt-4 font-montserrat text-[24px] font-semibold text-white sm:mt-5"
          style={{ lineHeight: "100%", letterSpacing: "0" }}
        >
          {t("theHouseOfCultures")}
        </h3>
        <p
          className="mt-5 font-montserrat text-[16px] font-normal text-white/88 sm:text-[17px]"
          style={{ lineHeight: "1.35", letterSpacing: "0" }}
        >
          {t("houseOfCulturesDescription")}
        </p>
        <p
          className="mt-4 font-montserrat text-[16px] font-normal text-white/88 sm:text-[17px]"
          style={{ lineHeight: "1.35", letterSpacing: "0" }}
        >
          {t("ourStoryParagraph2")}
        </p>
        <p
          className="mt-4 font-montserrat text-[16px] font-normal text-white/88 sm:text-[17px]"
          style={{ lineHeight: "1.35", letterSpacing: "0" }}
        >
          {t("ourStoryParagraph3")}
        </p>
        <h3
          className="mt-6 font-montserrat text-[24px] font-semibold text-white/95"
          style={{ lineHeight: "100%", letterSpacing: "0" }}
        >
          {t("growingLegacy")}
        </h3>
        <p
          className="mt-4 font-montserrat text-[16px] font-normal text-white/88 sm:text-[17px]"
          style={{ lineHeight: "1.35", letterSpacing: "0" }}
        >
          {t("growingLegacyDescription")}
        </p>
      </div>
      <div className="h-70 sm:h-105 md:h-155 w-full overflow-hidden rounded-2xl border border-white/20 shadow-[0_28px_60px_rgba(0,0,0,0.55)]">
        <Image
          src="/about/TheHouseofCultures.avif"
          alt={t("theHouseOfCultures")}
          width={900}
          height={1200}
          className="h-full w-full object-cover"
        />
      </div>
    </section>
  );
}
