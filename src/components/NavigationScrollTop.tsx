"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Automatically scrolls the window to the top whenever the pathname changes.
 * This ensures a consistent "scroll to top on navigation" behavior across the site
 * without needing a manual UI button.
 */
export default function NavigationScrollTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
