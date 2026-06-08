"use client"
import Link from "next/link";
import { useParams } from "next/navigation";

export default function VenueTour() {
  const { locale } = useParams()
  return (
    <section className="relative w-full h-[500px] flex items-center">
      {/* Background Image Container */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: "url('/images/tours/tourbg.avif')" }}
      >

      </div>
      <div
  className="absolute inset-0"
  style={{background: `linear-gradient(180deg,rgba(0, 0, 0, 0) 0%,rgba(42, 60, 68, 0.01) 50%,rgba(0, 0, 0, 0.9) 100%)`}}
/>

      {/* Content */}
      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 text-white">
        <div className="max-w-xl">
          <h2 className="text-[32px] md:text-[36px] font-optima  mb-1 tracking-normal font-normal text-white">
           <span className="uppercase md:capitalize"> {locale === 'ar' ? 'المكان' : 'Venue'}</span> <span className="font-optima"> {locale === 'ar' ? 'جولة' : 'Tour'}</span>
          </h2>
          <p className="text-white text-[15px] md:text-[16px] font-montserrat mb-8 leading-relaxed max-w-[400px]">
            {locale === 'ar' ? 'اكتشف واستكشف واحد من أشهر الوجهات الثقافية في دبي ، ويجمع المباني الرائعة مع اللحظات السحرية.' : 'Discover and explore one of Dubai\'s most iconic cultural destinations, blending visionary architecture with moments of magic.'}
          </p>
        <Link data-testid="venue-tour-book-btn" href={`/${locale}/visit/tours`} className="font-montserrat w-full block text-center md:w-fit font-semibold text-[15px] text-white bg-[#792327] hover:bg-[#5E1B1E] px-8 py-2.5 cursor-pointer rounded-[6px] transition-colors shadow-lg shadow-black/20">
            {locale === 'ar' ? 'احجز جولة' : 'Book A Tour'}
          </Link>
        </div>
      </div>
    </section>
  );
}
