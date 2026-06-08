"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { X, Search } from "lucide-react";
import SeasonCard from "./SeasonCard";
import { ExternalEvent, getEventsBySearch } from "@/services/eventServer";
import { debounce } from "lodash";
import { useAuth } from "@/contexts/auth/AuthContext";
import { getUserFavourate } from "@/services/websiteServer";
import { useTranslations } from "next-intl";
            
interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

export default function SearchOverlay({
  isOpen,
  onClose,
  locale,
}: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [events, setEvents] = useState<ExternalEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [favouriteEventIds, setFavouriteEventIds] = useState<string[]>([]);
  const { user } = useAuth();
  const t = useTranslations("common");
  const inputRef = useRef<HTMLInputElement>(null);

  /* ─── Debounce (lodash.debounce) ───────────────────────── */
  const debouncedSetQuery = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedQuery(value);
      }, 500),
    [],
  );

  useEffect(() => {
    debouncedSetQuery(query);
    return () => {
      debouncedSetQuery.cancel();
    };
  }, [query, debouncedSetQuery]);

  /* ─── API CALL ───────────────────────── */
  useEffect(() => {
    const fetchEvents = async () => {
      if (!debouncedQuery || debouncedQuery.trim().length < 2) {
        setEvents([]);
        return;
      }
      try {
        setLoading(true);
        const response = await getEventsBySearch(debouncedQuery, locale);
        const payload = response?.data;
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];
        setEvents(list);
      } catch (error) {
        console.error("Error fetching events:", error);
        setEvents([]);
        } finally {
          setLoading(false);
        }
    };
    fetchEvents();
  }, [debouncedQuery, locale]);

  useEffect(() => {
    if (!user) return;
    getUserFavourate(String(user.emmarId)).then((res) => {
      setFavouriteEventIds(res?.event_ids ?? []);
    }).catch((err) => {
      console.log(err, 'err')
    })
  }, [user])

  /* ─── Focus input ────────────────────── */
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setDebouncedQuery("");
      setEvents([]);
    }
  }, [isOpen]);

  /* ─── ESC close ─────────────────────── */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  /* ─── Lock scroll ───────────────────── */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);


  // when click on the book now button, it will close the search overlay
  const bookNow = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed hidden md:flex inset-0 z-60 flex-col bg-black/60 backdrop-blur-md animate-fade-in">
      {/* Close Button */}
      <div className="flex justify-end px-6 lg:px-12 pt-5">
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white hover:bg-primary/80 transition-colors"
        >
          <X size={22} strokeWidth={1.5} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-12 pb-12">
        <div className="max-w-[800px] mx-auto mt-4 md:mt-8">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search")}
              className="w-full bg-transparent border border-white/30 rounded-lg py-3.5 pl-12 pr-12 text-white placeholder-white/40 focus:outline-none focus:border-primary"
            />

            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setEvents([]);
                  inputRef.current?.focus();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Loader */}
        {loading && (
          <div className="text-center text-white mt-10">
            {t("searching")}
          </div>
        )}

        {/* No Results */}
        {!loading && debouncedQuery.length >= 2 && events.length === 0 && (
          <div className="text-center text-white mt-10">
            {t("noEventsFound")}
          </div>
        )}

        {/* Results */}
        {!loading && events.length > 0 && (
          <div className="max-w-[1400px] mx-auto mt-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {events.map((event) => (
                <SeasonCard
                  key={Number(event.id)}
                  event={event as ExternalEvent}
                  isFav={favouriteEventIds.find((id) => id === event?.id?.toString()) ? true : false}

                  //while click on the book now button, it will close the search overlay
                  bookNow={bookNow}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}