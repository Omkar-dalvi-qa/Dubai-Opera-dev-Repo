import Link from "next/link";
import Image from "next/image";
import { WebsitePostItem } from "@/types/website";
import { useTranslations } from "next-intl";

export default function NewsCard({
  mobileFeaturedImage,
  mobileFeaturedImagePath,
  featuredImage,
  featuredImagePath,
  title,
  excerpt,
  slug,
  locale = "en",
}: WebsitePostItem & { locale?: string }) {
  const imageSrc =
    mobileFeaturedImage ||
    mobileFeaturedImagePath ||
    featuredImage ||
    featuredImagePath ||
    "/images/fallback.png";
  const t = useTranslations("common");

  return (
    <Link
      href={`/${locale}/news/${slug}`}
      aria-label={`${title} — ${t('readMore')}`}
      className="bg-[#1E1E1E] rounded-xl overflow-hidden flex flex-row gap-3 sm:gap-0 sm:flex-col items-center sm:items-start p-3 sm:p-0 group transition-all duration-300 shadow-xl h-full hover:bg-[#252525]"
    >
      {/* Image Container — fixed size on mobile; aspect ratio layout from sm+ */}
      <div className="relative h-[152px] md:h-[300px] w-[125px] shrink-0 overflow-hidden rounded-md sm:h-auto sm:w-full sm:shrink sm:rounded-none sm:aspect-4/3">
        <Image
          src={imageSrc}
          alt=""
          fill
          sizes="(max-width: 639px) 125px, (max-width: 1023px) 50vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          quality={80}
        />
      </div>

      {/* Content Container */}
      <div className="sm:p-5 flex flex-col grow text-white h-full md:h-[202px]">
        <h3 className="font-montserrat font-semibold text-[18px] leading-[100%] mb-2 sm:line-clamp-1">
          {title}
        </h3>
        <p className="text-[13px] md:text-[15px] text-white font-montserrat font-[450] lg:line-clamp-5 sm:line-clamp-4 leading-5">
          {excerpt}
        </p>
        <div className="mt-auto">
          <span className="font-montserrat text-[13px] md:text-[14px] font-bold group-hover:text-gray-300 transition-colors inline-block">
            {/* {readMoreLabel} */}
            {t('readMore')}
          </span>
        </div>
      </div>
    </Link>
  );
}
