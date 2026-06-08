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
import { formatCardDateRange } from "@/helpers/programs-booking/formHelpers";

interface SeasonCardMobileProps {
  event: ExternalEvent;
  isFav?: boolean;
  variant?: "scroll" | "grid";
}

export default function SeasonCardMobile({
  event,
  isFav = false,
  variant = "scroll",
}: SeasonCardMobileProps) {
  const { user, setShowLoginModal } = useAuth();
  const t = useTranslations("common");
  const [isFavorite, setIsFavorite] = useState(false);
  const [userFav, setUserFav] = useState<string[]>([]);

  const currencyCode = event.currency?.code ?? "AED";
  const eventHref =
    event.slug && event.category?.slug
      ? `/events/${event.category.slug}/${event.slug}`
      : null;
  const dateRange = formatCardDateRange(event);
  const showTicketsBadge =
    event.is_schedule_upcoming !== false &&
    (!event.end_date || new Date(event.end_date) >= new Date());

  const imageSrc =
    gumletImageUrl(String(event?.images?.[0]?.imageUrl ?? "").trim()) ||
    "/images/fallback.png";

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
    let newFavs: string[];
    if (isFavorite) {
      newFavs = userFav.filter((fav) => fav !== strValue);
      setIsFavorite(false);
      if (user?.emmarId) {
        setUserFavourate(String(user.emmarId), strValue, false);
      }
    } else {
      newFavs = [...userFav, strValue];
      setIsFavorite(true);
      if (user?.emmarId) {
        setUserFavourate(String(user.emmarId), strValue, true);
      }
    }
    setUserFav(newFavs);
    localStorage.setItem("userFav", newFavs.join(","));
  };

  if (variant === "scroll") {
    const content = (
      <div className="flex w-full min-w-[300px] max-w-[360px] gap-3 rounded-2xl bg-[#1E1E1E] p-3">
        <div className="relative h-full w-[125px] aspect-3/4 shrink-0 overflow-hidden rounded-xl">
          <Image
            src={imageSrc}
            alt={event.name ?? event.title ?? "Event"}
            width={216}
            height={216}
            loader={gumletLoader}
            quality={80}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col py-0.5">
          <div className="mb-1 flex items-start justify-between gap-2">
            <h3 className="min-w-0 flex-1 font-montserrat text-base font-semibold leading-tight text-white line-clamp-2">
              {event.name ?? event.title}
            </h3>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addToFavourite(Number(event.id));
              }}
              className="shrink-0 p-0.5"
              aria-label={
                isFavorite ? "Remove from favorites" : "Add to favorites"
              }
            >
              <Heart
                size={20}
                stroke="white"
                fill={isFavorite ? "#792327" : "none"}
              />
            </button>
          </div>

          {dateRange && (
            <p className="font-montserrat text-xs mt-2 font-normal text-[#FFFFFFCC]">
              {dateRange}
            </p>
          )}

          {event.min_price != null && event.min_price !== "" && (
            <p className="mt-1.5 font-montserrat text-[12px]">
              <span className="font-normal text-[#FFFFFF]">{t("from")} </span>
              <span className="font-semibold text-base text-white">
                {currencyCode} {event.min_price}
              </span>
            </p>
          )}

          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            {event.category?.name && (
              <span className="rounded-md bg-[#79232766] px-2.5 py-1 font-notosans text-xs capitalize text-white">
                {event.category.name}
              </span>
            )}
            {showTicketsBadge && (
              <span className="rounded-md bg-[#79232766] px-2.5 py-1 font-notosans text-xs text-white">
                {t("ticketsAvailable")}
              </span>
            )}
          </div>
        </div>
      </div>
    );

    if (eventHref) {
      return (
        <Link href={eventHref} className="block shrink-0 snap-center">
          {content}
        </Link>
      );
    }

    return <div className="shrink-0 snap-center">{content}</div>;
  }

  const content = (
    <div className="flex w-full flex-col overflow-hidden rounded-2xl bg-[#1E1E1E]">
      <div className="relative h-[162px] w-full overflow-hidden">
        <Image
          src={imageSrc}
          alt={event.name ?? event.title ?? "Event"}
          width={170}
          height={162}
          loader={gumletLoader}
          quality={80}
          className="h-[162px] w-full object-cover"
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addToFavourite(Number(event.id));
          }}
          className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center"
          aria-label={
            isFavorite ? "Remove from favorites" : "Add to favorites"
          }
        >
          <Heart
            size={18}
            stroke="white"
            fill={isFavorite ? "#792327" : "none"}
          />
        </button>
      </div>

      <div className="flex min-w-0 flex-col p-3">
        <h3 className="font-montserrat text-sm font-semibold leading-tight text-white line-clamp-2">
          {event.name ?? event.title}
        </h3>

        {dateRange && (
          <p className="mt-1.5 font-montserrat text-[11px] font-normal text-[#FFFFFFCC]">
            {dateRange}
          </p>
        )}

        {event.min_price != null && event.min_price !== "" && (
          <p className="mt-1 font-montserrat text-[11px]">
            <span className="font-normal text-[#FFFFFF]">{t("from")} </span>
            <span className="font-semibold text-sm text-white">
              {currencyCode} {event.min_price}
            </span>
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 pt-2">
          {event.category?.name && (
            <span className="rounded-md bg-[#79232766] px-2 py-0.5 font-notosans text-[10px] capitalize text-white">
              {event.category.name}
            </span>
          )}
          {showTicketsBadge && (
            <span className="rounded-md bg-[#79232766] px-2 py-0.5 font-notosans text-[10px] text-white">
              {t("ticketsAvailable")}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (eventHref) {
    return (
      <Link href={eventHref} className="block w-full">
        {content}
      </Link>
    );
  }

  return <div className="w-full">{content}</div>;
}
