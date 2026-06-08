"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { imageUrl as gumletImageUrl } from "@/utils/imageUrl";
import Image from "next/image";
import { useAuth } from "@/contexts/auth/AuthContext";
import { setUserFavourate } from "@/services/websiteServer";
import { useTranslations } from "next-intl";
import gumletLoader from "@/utils/imageloader";
import { ExternalEvent } from "@/services/eventServer";
import { formatCardDate } from "@/helpers/programs-booking/formHelpers";
interface SeasonCardProps {
  event: ExternalEvent;
  isFav?: boolean;
  bookNow?: () => void;
}

export default function SeasonCard({
  event,
  isFav = false,
  bookNow
}: SeasonCardProps) {
  const { user, setShowLoginModal } = useAuth();
  const t = useTranslations("common");
  console.log(event, "event");
  const buttonCtcLabel = (event?.end_date && new Date(event?.end_date) < new Date() ? t("learnMore") : t("bookNow"));

  const [isFavorite, setIsFavorite] = useState(false);
  const [userFav, setUserFav] = useState<string[]>([]);

  useEffect(() => {
    const lUserFav = localStorage.getItem("userFav");
    if (lUserFav) {
      const favs = lUserFav.split(",").filter(Boolean);
      setUserFav(favs);
      setIsFavorite(favs.includes(String(event.id)));
    }
  }, [event.id]);

  useEffect(() => {
    setIsFavorite(isFav);
  }, [isFav]);

  const addToFavourite = (value: number | string) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    const strValue = String(value);
    console.log(strValue, "value", userFav);
 
    let newFavs: string[];
    if (isFavorite) {
      // If it's already a favorite, remove it
      newFavs = userFav.filter((fav) => fav !== strValue);
      setIsFavorite(false);
      if (user && user.emmarId) {
        setUserFavourate(String(user.emmarId), strValue, false);
        // setUserFavourate("10", strValue, false);
      }
    } else {
      // If it's not a favorite, add it
      newFavs = [...userFav, strValue];
      setIsFavorite(true);
      if (user && user.emmarId) {
        setUserFavourate(String(user.emmarId), strValue, true);
        // setUserFavourate("10", strValue, true);
      }
    }

    setUserFav(newFavs);
    localStorage.setItem("userFav", newFavs.join(","));

  };

  const imageSrc = event?.images?.find((img) => img.name === "Event Poster")?.imageUrl || event?.images?.[1]?.imageUrl;
  

  return (
    <div data-testid="event-card" className={`bg-surface rounded-2xl w-[300px] md:w-[327px] lg:w-auto overflow-hidden flex flex-col group transition-all duration-300 post-${event.id}`}>
      <div
        className="relative w-[300px] md:w-[327px] lg:w-auto h-[366px]"
      >
        <Image
          src={gumletImageUrl(String(imageSrc ?? "").trim()) || "/images/fallback.png"}
          alt={event.name ?? event.title ?? "Event"}
          width={500}
          height={566}
          loader={gumletLoader}
          quality={80}
          sizes="(max-width: 640px) 327px, (max-width: 1024px) 50vw, 25vw"
          className={`h-full w-full object-cover hover:scale-105 transition-transform duration-500`}
        />
        <button
          data-testid="event-card-fav-btn"
          type="button"
          onClick={() => {
            addToFavourite(Number(event.id))
          }}
          className="absolute top-2 right-2 z-5 flex h-11 w-11 items-center justify-center cursor-pointer rounded-full bg-[#191919] text-white transition-colors hover:bg-[#191919]"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart size={19} stroke="white" fill={isFavorite ? "#792327" : "none"} />
        </button>
        {event.tag && (
          <span className="shrink-0 absolute top-8 left-5 capitalize font-notosans text-base text-white bg-[#792327B2] px-3 py-1 rounded">
            {event.tag}
          </span>
        )}
      </div>

      {/* Content - ~30-35% of card, dark charcoal background */}
      <div className="p-5 flex flex-col lg:h-[230px] grow bg-[#1A1A1A] text-white border-t border-white/5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-notosans font-light text-xs text-white truncate bg-[#79232766] px-2 py-1 rounded-sm">
              {event.category?.name}
            </span>
          </div>
        </div>
        <h3 data-testid="event-card-title" className="min-w-0 w-full font-montserrat text-[18px] leading-snug font-medium mb-1 line-clamp-1 md:line-clamp-2">
          {event.name ?? event.title}
        </h3>
        <div className="flex flex-col mt-auto w-full">
          <p className="font-montserrat text-base text-white mt-1">{event.location}</p>
          <p className="font-notosans text-sm text-white mt-1 mb-6">{formatCardDate(event)}</p>
          <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between w-full">
            {event.min_price && (
              <span className="font-montserrat text-left text-[14px] font-bold tracking-wide">{t('from')} {event.min_price} AED</span>
            )}
            {event.slug && (
              <Link
                data-testid="event-card-cta-link"
                href={`/events/${event.category?.slug}/${event.slug}`}
                onClick={bookNow}
                className="font-montserrat text-center text-[12px] font-semibold bg-primary-light hover:bg-[#5E1B1E] text-white px-8 lg:px-6 py-2 rounded transition-colors inline-block"
              >
                {buttonCtcLabel}
              </Link>
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
}
