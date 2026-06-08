export default function AbouExcellingtAtTheArt({ t }: { t: (key: string) => string }) {
  return (
    <section className="mt-12">
      <h2
        className="text-center text-[40px] text-white/95"
        style={{
          fontFamily: "Optima, Candara, 'Noto Sans', sans-serif",
          fontWeight: 400,
          fontStyle: "normal",
          lineHeight: "100%",
          letterSpacing: "0",
          verticalAlign: "middle",
        }}
      >
        {t("excellingAtTheArt")}
      </h2>
      <div className="mx-auto mt-6 grid w-full max-w-[1100px] grid-cols-2 divide-y divide-white/35 gap-y-6 py-6 text-left sm:grid-cols-4 sm:gap-y-0 sm:divide-y-0 sm:divide-x">
        <Stat label={t("stats.size.label")} value={t("stats.size.value")} />
        <Stat label={t("stats.seatingCapacity.label")} value={t("stats.seatingCapacity.value")} />
        <Stat label={t("stats.opened.label")} value={t("stats.opened.value")} />
        <Stat label={t("stats.developer.label")} value={t("stats.developer.value")} compact />
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-[220px] px-4 sm:px-6">
      <p
        className="font-montserrat text-[13px] font-normal text-white/75 sm:text-[14px]"
        style={{ lineHeight: "100%", letterSpacing: "0" }}
      >
        {label}
      </p>
      <p
        className={
          compact
            ? "mt-1 whitespace-nowrap font-sans-ui text-[16px] font-semibold leading-none text-white sm:text-[18px]"
            : "mt-1 font-sans-ui text-[16px] font-semibold leading-none text-white sm:text-[18px]"
        }
        style={{ lineHeight: "100%", letterSpacing: "0" }}
      >
        {value}
      </p>
    </div>
  );
}
