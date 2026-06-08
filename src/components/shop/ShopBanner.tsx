import Image from "next/image";

interface ShopBannerProps {
  title?: string;
  subtitle?: string;
  imageSrc?: string;
}

export default function ShopBanner({
  title = "OPERA Collection",
  subtitle = "THE",
  imageSrc = "/images/banners/studiobanner.webp",
}: ShopBannerProps) {
  return (
    <section className="relative w-full h-[30vh] lg:h-[75vh] lg:min-h-[500px] overflow-hidden">
      <Image src={imageSrc} alt="Shop banner" fill className="object-cover" priority />
      {/* <div className="absolute inset-0 bg-black/40" /> */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black" />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center px-4">
        <p className="font-optima font-normal text-[24px] md:text-[30px] leading-[100%] mb-2">{subtitle}</p>
        <h1 className="font-optima font-normal text-[34px] lg:text-[70px] tracking-[0.1em] leading-[100%] whitespace-nowrap lg:uppercase">
          {title}
        </h1>
      </div>
    </section>
  );
}
