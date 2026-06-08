"use client";

import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 767;

/**
 * Returns `true` when the viewport width is ≤ 767 px (i.e. mobile).
 * Uses `matchMedia` for efficiency and listens for viewport changes.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    setIsMobile(mql.matches);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isMobile;
}
