"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Listens for the browser's `pageshow` event.
 * When a page is restored from bfcache (persisted=true), the Next.js router
 * is refreshed so stale server data is re-validated without a full reload.
 */
export default function BfcacheHandler() {
    const router = useRouter();

    useEffect(() => {
        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                // Page was restored from bfcache — refresh server components
                router.refresh();
            }
        };

        window.addEventListener("pageshow", handlePageShow);
        return () => window.removeEventListener("pageshow", handlePageShow);
    }, [router]);

    return null;
}
