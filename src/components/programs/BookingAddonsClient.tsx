"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import AddonsList, { type AddonItem } from "@/components/programs/AddonsList";

import { useExternalEventBookingState } from "@/contexts/program-event/ExternalEventDetailsContext";
import {
  getExternalEventReservationAddons,
  type ExternalReservationAddonRow,
} from "@/services/externalEventReservationAddonsClient";
import { getExternalEventReservationbyId } from "@/services/externalEventReservationClient";
import { resolveReservationSummary } from "@/components/programs/bookingSeatReservationUtils";
import { useAuth } from "@/contexts/auth/AuthContext";
import LoginModal from "../auth/LoginModal";

function reservationAddonRowsToCatalog(rows: ExternalReservationAddonRow[]): AddonItem[] {
  const byId = new Map<string, AddonItem>();
  for (const row of rows) {
    for (const a of row.addons ?? []) {
      const id = String(a.id);
      if (!id || byId.has(id)) continue;
      const price =
        typeof a.price === "number" ? a.price : Number.parseFloat(String(a.price ?? 0));
      const max = Number(a.available_quantity);
      byId.set(id, {
        id,
        title: (a.name && String(a.name).trim()) || `Add-on #${id}`,
        description: String(a.description ?? "").trim(),
        price: Number.isFinite(price) ? price : 0,
        image:
          a.image_url && String(a.image_url).trim()
            ? String(a.image_url)
            : "/images/fallback.png",
        maxQuantity: max > 0 ? max : undefined,
      });
    }
  }
  return [...byId.values()];
}

type BookingAddonsClientProps = {
  eventName: string;
  eventId: string;
  eventTitle: string;
  eventImageSrc?: string;
  selectedDateLabel: string | null;
  selectedTime: string | null;
  minDateISO?: string | null;
  maxDateISO?: string | null;
  timeSlots?: string[];
  backToSeatsHref: string;
  eventDetailHref?: string;
  isStudioFlow?: boolean;
};

function signatureFromAddonRows(rows: Array<{ id: string; quantity: number }>): string {
  return rows
    .slice()
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))
    .map((r) => `${r.id}:${r.quantity}`)
    .join("|");
}

function signatureFromQuantities(q: Record<string, number>): string {
  return Object.entries(q)
    .filter(([, qty]) => qty > 0)
    .sort(([a], [b]) => String(a).localeCompare(String(b)))
    .map(([id, qty]) => `${id}:${qty}`)
    .join("|");
}

export default function BookingAddonsClient({
  selectedDateLabel,
  selectedTime,
}: BookingAddonsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "en";
  const returnTo = useMemo(() => {
    const path = pathname.includes("/addons") ? `/${locale}/booking/checkout` : pathname;
    const queryString = searchParams.toString();
    return queryString ? `${path}?${queryString}` : path;
  }, [pathname, locale, searchParams]);
  const {
    reservationId,
    setSelectedAddons,
    selectedAddons: contextSelectedAddons,
    setSelectedDate,
    setSelectedTime,
    setReservationSummary,
  } = useExternalEventBookingState();
  const { user, showLoginModal, setShowLoginModal } = useAuth();
  const [catalogItems, setCatalogItems] = useState<AddonItem[]>([]);
  const [addonsLoading, setAddonsLoading] = useState(false);
  const [addonsError, setAddonsError] = useState<string | null>(null);
  const [redirectingToCheckout, setRedirectingToCheckout] = useState(false);
  const [addonsAvailable, setAddonsAvailable] = useState(false);

  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    return Object.fromEntries(contextSelectedAddons.map((addon) => [addon.id, addon.quantity]));
  });
  const lastPushedSelectionSigRef = useRef<string>("");
  const hasHydratedReservationRef = useRef(false);

  const localSig = useMemo(() => signatureFromQuantities(quantities), [quantities]);
  const contextSig = useMemo(
    () =>
      signatureFromAddonRows(
        contextSelectedAddons.map((a) => ({ id: String(a.id), quantity: a.quantity })),
      ),
    [contextSelectedAddons],
  );

  // After SSO redirect, hydrate reservation details from API so add-ons/summary are correct.
  useEffect(() => {
    if (!user?.emmarId) return;
    if (reservationId == null || String(reservationId).trim().length === 0) return;
    if (hasHydratedReservationRef.current) return;

    hasHydratedReservationRef.current = true;
    void (async () => {
      try {
        const res = await getExternalEventReservationbyId(reservationId);
        const data = (res as any)?.data;
        if (!data || typeof data !== "object") return;
        const mergedSummary = resolveReservationSummary(data);
        if (mergedSummary) {
          setReservationSummary(mergedSummary as any);
        }

        const inferred: Array<{ id: string; quantity: number; label?: string; price?: string }> = [];
        const items = Array.isArray((data as any)?.items) ? (data as any).items : [];
        for (const item of items) {
          const addons = Array.isArray((item as any)?.addons) ? (item as any).addons : [];
          for (const a of addons) {
            const id = String((a as any)?.id ?? "").trim();
            const quantity = Number((a as any)?.quantity ?? 0);
            if (!id || !Number.isFinite(quantity) || quantity <= 0) continue;
            inferred.push({
              id,
              quantity,
              label: typeof (a as any)?.name === "string" ? (a as any).name : undefined,
              price: (a as any)?.price != null ? String((a as any).price) : undefined,
            });
          }
        }
        const flatAddons = Array.isArray((data as any)?.addons) ? (data as any).addons : [];
        for (const a of flatAddons) {
          const id = String((a as any)?.id ?? "").trim();
          const quantity = Number((a as any)?.quantity ?? 0);
          if (!id || !Number.isFinite(quantity) || quantity <= 0) continue;
          inferred.push({
            id,
            quantity,
            label: typeof (a as any)?.name === "string" ? (a as any).name : undefined,
            price: (a as any)?.price != null ? String((a as any).price) : undefined,
          });
        }
        if (inferred.length === 0) return;

        const byId = new Map<string, { id: string; quantity: number; label?: string; price?: string }>();
        for (const row of inferred) {
          const prev = byId.get(row.id);
          if (!prev || row.quantity > prev.quantity) byId.set(row.id, row);
        }
        const hydrated = [...byId.values()];
        const nextQuantities: Record<string, number> = {};
        for (const a of hydrated) nextQuantities[a.id] = a.quantity;
        setQuantities(nextQuantities);

        lastPushedSelectionSigRef.current = signatureFromAddonRows(
          hydrated.map((a) => ({ id: a.id, quantity: a.quantity })),
        );
        setSelectedAddons(
          hydrated.map((a) => ({
            id: a.id,
            quantity: a.quantity,
            label: a.label || "",
            price: a.price || "0",
          })),
        );
      } catch {
        // If this fails, the page will still show catalog and allow re-selection.
      }
    })();
  }, [user?.emmarId, reservationId, setReservationSummary, setSelectedAddons]);

  // Keep local UI (ticks) in sync when add-ons are changed from the summary panel (or elsewhere).
  useEffect(() => {
    // Same signature we last pushed — context already matches local `quantities`; avoid ping-pong.
    if (contextSig === lastPushedSelectionSigRef.current) return;
    if (contextSig === localSig) return;

    const next = Object.fromEntries(
      contextSelectedAddons
        .filter((a) => (a?.quantity ?? 0) > 0)
        .map((a) => [a.id, a.quantity]),
    ) as Record<string, number>;
    setQuantities(next);
    lastPushedSelectionSigRef.current = contextSig;
  }, [contextSelectedAddons, contextSig, localSig]);

  const contextSelectedAddonsRef = useRef(contextSelectedAddons);
  useEffect(() => {
    contextSelectedAddonsRef.current = contextSelectedAddons;
  }, [contextSelectedAddons]);
  useEffect(() => {
    if (selectedDateLabel) setSelectedDate(selectedDateLabel);
    if (selectedTime) setSelectedTime(selectedTime);
  }, [selectedDateLabel, selectedTime, setSelectedDate, setSelectedTime]);

  useEffect(() => {
    if (reservationId == null || String(reservationId).trim().length === 0) {
      setCatalogItems([]);
      setAddonsError(null);
      setAddonsLoading(false);
      setAddonsAvailable(false);
      return;
    }

    const ac = new AbortController();
    setAddonsLoading(true);
    setAddonsError(null);

    void getExternalEventReservationAddons(reservationId, { signal: ac.signal })
      .then((rows) => {
        setCatalogItems(reservationAddonRowsToCatalog(rows));
        setAddonsAvailable(true);
      })
      .catch((e: unknown) => {
        if (ac.signal.aborted) return;
        setAddonsError(e instanceof Error ? e.message : "Could not load add-ons");
        setCatalogItems([]);
        setAddonsAvailable(true);
      })
      .finally(() => {
        if (!ac.signal.aborted) setAddonsLoading(false);
      });

    return () => ac.abort();
  }, [reservationId]);

  useEffect(() => {
    if (!addonsAvailable || addonsLoading || addonsError) return;
    if (catalogItems.length <= 0) return;
    const hasSkipAddons = searchParams.get("skipAddons") === "1";
    if (!hasSkipAddons) return;

    // Add-ons are available; remove stale skip flag so breadcrumb remains correct.
    const nextQuery = new URLSearchParams(searchParams.toString());
    nextQuery.delete("skipAddons");
    router.replace(`${pathname}?${nextQuery.toString()}`);
  }, [addonsAvailable, addonsLoading, addonsError, catalogItems, searchParams, router, pathname]);

  useEffect(() => {
    if (!reservationId || String(reservationId).trim().length === 0) return;
    // Wait until add-ons API has resolved at least once for this reservation.
    if (!addonsAvailable) return;
    if (addonsLoading) return;
    if (redirectingToCheckout) return;

    // only redirect when API finished AND no addons
    if (!addonsError && catalogItems.length === 0) {
      setSelectedAddons([]);

      const nextQuery = new URLSearchParams(searchParams.toString());
      nextQuery.set("skipAddons", "1");

      setRedirectingToCheckout(true);

      const checkoutPath = pathname.replace(/\/addons$/, "/checkout");

      router.replace(`${checkoutPath}?${nextQuery.toString()}`);
    }
  }, [
    reservationId,
    addonsAvailable,
    addonsLoading,
    addonsError,
    catalogItems,
    redirectingToCheckout,
    pathname,
    router,
    searchParams,
    setSelectedAddons,
  ]);

  const selectedAddons = useMemo(
    () =>
      Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([id, quantity]) => {
          const matched = catalogItems.find((item) => item.id === id);
          const fromContext = contextSelectedAddonsRef.current.find((a) => a.id === id);
          return {
            id,
            quantity,
            // Prevent thrash on first mount: if catalog isn't ready yet, keep prior selection's label/price.
            label: matched?.title || fromContext?.label || "",
            price:
              matched?.price != null
                ? String(matched.price)
                : fromContext?.price != null
                  ? String(fromContext.price)
                  : "0",
            maxQuantity: matched?.maxQuantity ?? fromContext?.maxQuantity,
          };
        }),
    [quantities, catalogItems],
  );
  const selectedAddonIds = useMemo(
    () => Object.entries(quantities).filter(([, qty]) => qty > 0).map(([id]) => id),
    [quantities],
  );

  const handleToggleAddon = (id: string) => {
    setQuantities((prev) => ({ ...prev, [id]: (prev[id] ?? 0) > 0 ? 0 : 1 }));
  };

  useEffect(() => {
    const current = contextSelectedAddonsRef.current;
    const next = selectedAddons;
    if (current.length === next.length) {
      const byId = new Map(current.map((a) => [a.id, a]));
      let same = true;
      for (const n of next) {
        const c = byId.get(n.id);
        if (!c) { same = false; break; }
        if (c.quantity !== n.quantity) { same = false; break; }
        if (String(c.price ?? "") !== String(n.price ?? "")) { same = false; break; }
        if (String(c.label ?? "") !== String(n.label ?? "")) { same = false; break; }
      }
      if (same) return;
    }
    lastPushedSelectionSigRef.current = signatureFromAddonRows(
      next.map((a) => ({ id: String(a.id), quantity: a.quantity })),
    );
    setSelectedAddons(next);
  }, [selectedAddons, setSelectedAddons]);

  return (
    <div>
      <div className="mt-6 flex items-center justify-between gap-4 mb-4">
        <h1 className="font-optima text-[30px] leading-[36px] lg:text-[46px]">Add Ons</h1>
      </div>

      {redirectingToCheckout ? (
        <p className="font-montserrat text-[14px] text-white/60 mb-4">No add-ons available. Redirecting to checkout…</p>
      ) : null}
      {addonsError && reservationId != null && String(reservationId).trim().length > 0 ? (
        <p className="font-montserrat text-[14px] text-amber-200/90 mb-4">{addonsError}</p>
      ) : null}
      <div className="">
        <div className="relative w-full rounded-[20px] bg-surface">
          {addonsLoading ? (
            <p className="font-montserrat text-[14px] text-white/60  flex items-center justify-center py-10">Loading add-ons…</p>
          ) :
            <AddonsList items={catalogItems} selectedIds={selectedAddonIds} onToggle={handleToggleAddon} />
          }
        </div>
      </div>
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        returnTo={returnTo}
        title="Sign in to continue"
        description="Please sign in with Emaar PASS to proceed to add these add-ons to your booking."
      />
    </div>
  );
}
