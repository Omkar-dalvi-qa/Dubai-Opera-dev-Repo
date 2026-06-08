"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Loader2, Plus } from "lucide-react";
import type { ExternalEvent } from "@/services/eventServer";
import SeasonCard from "@/components/SeasonCard";
import { getUserFavourate } from "@/services/websiteServer";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth/AuthContext";

export type FavoriteTabKey = "shows" | "items";

export type FavoriteShow = {
  id: number;
  image: string;
  category: string;
  title: string;
  venue: string;
  date: string;
  price: string;
  href: string;
  tag?: string;
};

export type FavoriteItem = {
  id: string | number;
  name: string;
  price: string;
  brand: string;
  image: string;
  href: string;
};

export default function ProfileFavoritesTab({
  locale,
  favoriteTab,
  setFavoriteTab,
  favoriteShows,
  isLoadingFavorites,
  favoriteItems,
  favoriteEvents,
}: {
  locale: string;
  favoriteTab: FavoriteTabKey;
  setFavoriteTab: (tab: FavoriteTabKey) => void;
  favoriteShows: FavoriteShow[];
  isLoadingFavorites: boolean;
  favoriteItems?: FavoriteItem[];
  favoriteEvents?: ExternalEvent[];
}) {
  const { user } = useAuth();
  const [favouriteEventIds, setFavouriteEventIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    getUserFavourate(String(user.emmarId)).then((res) => {
      setFavouriteEventIds(res?.event_ids ?? []);
    }).catch((err) => {
      console.log(err, 'err')
    })
  }, [user])

  if (isLoadingFavorites) {
    return (
      <div className="max-w-[1048px] space-y-7">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <div className="col-span-full text-center font-montserrat text-white/80 py-8 h-96 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-white" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1048px] space-y-7">
      <div className="flex items-end gap-10 border-b border-white/35 px-1 pb-5">
        <button
          type="button"
          onClick={() => setFavoriteTab("shows")}
          className={`relative pb-px text-[18px] tracking-[-0.02em] transition-colors ${
            favoriteTab === "shows" ? "font-semibold text-white" : "font-medium text-white/55"
          }`}
        >
          Shows ({ favoriteEvents?.length ?? 0})
          {favoriteTab === "shows" && (
            <span className="absolute inset-x-0 -bottom-[21px] h-0.5 rounded-full bg-[#b8343c]" />
          )}
        </button>
        {/* <button
          type="button"
          onClick={() => setFavoriteTab("items")}
          className={`relative pb-px text-[18px] tracking-[-0.02em] transition-colors ${
            favoriteTab === "items" ? "font-semibold text-white" : "font-medium text-white/55"
          }`}
        >
          Items ({favoriteItems?.length ?? 0})
          {favoriteTab === "items" && (
            <span className="absolute inset-x-0 -bottom-[21px] h-0.5 rounded-full bg-[#b8343c]" />
          )}
        </button> */}
      </div>

      {favoriteTab === "shows" ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
           {!isLoadingFavorites && favoriteEvents?.length === 0 ? (
            <p className="col-span-full text-center font-montserrat text-white/80 py-8 h-96 flex items-center justify-center">
              No Shows Marked as Favorites
            </p>
          ) : (
            favoriteEvents?.map((event, index) => (
              <div key={String(event.id ?? index)} className="w-auto snap-center shrink-0">
                <SeasonCard
                  event={event}
                  isFav={Boolean(favouriteEventIds.find((id) => id === event?.id?.toString()))}
                />
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {favoriteItems?.map((item: FavoriteItem) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-[18px] border border-white/7 bg-[#1b1b1de8] shadow-[0_20px_50px_rgba(0,0,0,0.28)]"
            >
              <div className="relative h-[290px] overflow-hidden bg-black/30">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-[1.04]"
                />
                <button
                  type="button"
                  className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm"
                >
                  <Heart size={16} className="fill-current text-[#d1464f]" />
                </button>
              </div>
              <div className="space-y-2 px-4 py-4">
                <p className="text-[13px] text-white/55">{item.brand}</p>
                <h2 className="text-[17px] font-medium leading-[1.35] tracking-[-0.02em] text-white">
                  {item.name}
                </h2>
                <div className="flex items-center justify-between gap-3 pt-2">
                  <p className="text-[16px] font-semibold text-white">{item.price}</p>
                  <Link
                    href={`/${locale}${item.href}`}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/22 text-white transition-colors hover:border-white hover:bg-white/6"
                    aria-label={`Open ${item.name}`}
                  >
                    <Plus size={18} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

