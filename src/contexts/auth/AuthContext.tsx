"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { EmaarPassUserProfile } from "@/types/emaarpass";
import { getCustomerByEmaarId } from "@/services/websiteServer";

export type AuthContextValue = {
  user: EmaarPassUserProfile | null;
  setUser: (user: EmaarPassUserProfile | null) => void;
  isLoading: boolean;
  error: string | null;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  refreshUser: () => Promise<void>;
  logout: (opts?: { redirectTo?: string }) => Promise<void>;
  startSsoLogin: (opts?: { returnTo?: string; mode?: "login" | "register" }) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function safePath(p: string | null | undefined, fallback: string): string {
  if (!p) return fallback;
  if (!p.startsWith("/") || p.startsWith("//")) return fallback;
  return p;
}

async function hasEmaarPassSession(): Promise<boolean> {
  const res = await fetch("/api/auth/emaarpass/session", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  }).catch(() => null);
  if (!res?.ok) return false;
  const json = (await res.json().catch(() => null)) as { hasSession?: boolean } | null;
  return Boolean(json?.hasSession);
}

export function AuthProvider({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: Locale;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<EmaarPassUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const refreshUser = useCallback(async () => {
    // If we already have a user in memory, don't refetch.
    if (user) return;

    const session = hasSession ?? (await hasEmaarPassSession());
    if (!session) {
      setUser(null);
      return;
    }
    setError(null);
    try {
      async function fetchMe() {
        return fetch("/api/auth/emaarpass/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
      }

      let res = await fetchMe();
      if (res.status === 401) {
        setUser(null);
        return;
      }
      // If EmaarPASS rejects the access token, try one refresh and retry /me once.
      if (res.status === 403) {
        const refreshed = await fetch("/api/auth/emaarpass/refresh", {
          method: "POST",
          credentials: "include",
        }).catch(() => null);
        if (refreshed && refreshed.ok) {
          res = await fetchMe();
        }
      }
      if (!res.ok) {
        const msg = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(msg?.error || `Auth error (${res.status})`);
      }
      const profile = (await res.json()) as EmaarPassUserProfile;
      if (profile && profile?.id) {
        const user = await getCustomerByEmaarId(profile?.id as string);
        if ("data" in user && user?.data) {
          setUser(user?.data as EmaarPassUserProfile);
        } else {
          setUser(profile);
        }
      }
    } catch (e) {
      setUser(null);
      setError(e instanceof Error ? e.message : "Auth error");
    }
  }, [hasSession, user]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      // If user is already known, no need to call any auth APIs.
      if (user) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      const session = await hasEmaarPassSession();
      if (!cancelled) setHasSession(session);

      if (!session) {
        setUser(null);
        setError(null);
        if (!cancelled) setIsLoading(false);
        return;
      }
      await refreshUser().catch(() => null);
      if (!cancelled) setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshUser, user]);

  // Prevent authenticated users from opening auth-only pages.
  useEffect(() => {
    if (isLoading) return;
    if (!pathname) return;
    const authOnlyPages = new Set([
      `/${locale}/login`,
      `/${locale}/signup`,
      `/${locale}/reset-password`,
      `/${locale}/verify-otp`,
      `/${locale}/create-new-password`,
    ]);

    const protectedPages = new Set([
      `/${locale}/my-account`,
    ]);

    // If logged in, don't allow auth-only pages.
    if (user && authOnlyPages.has(pathname)) {
      router.replace(`/${locale}/my-account`);
      return;
    }

    // If not logged in, don't allow protected pages.
    if (!user && protectedPages.has(pathname)) {
      // const loginUrl = `/${locale}/login?returnTo=${encodeURIComponent(pathname)}`;
      const loginUrl = `/${locale}`;
      router.replace(loginUrl);
    }
  }, [isLoading, user, pathname, locale, router]);

  const logout = useCallback(
    async (opts?: { redirectTo?: string }) => {
      setError(null);
      try {
        await fetch("/api/auth/emaarpass/logout", {
          method: "POST",
          credentials: "include",
        });
      } finally {
        setUser(null);
        if (opts?.redirectTo) {
          window.location.href = opts.redirectTo;
        }
      }
    },
    [],
  );

  const startSsoLogin = useCallback(
    (opts?: { returnTo?: string; mode?: "login" | "register" }) => {
      const returnTo = safePath(opts?.returnTo ?? pathname, `/${locale}`);
      const mode = opts?.mode ?? "login";
      const url = `/api/auth/emaarpass/authorize?mode=${encodeURIComponent(
        mode,
      )}&locale=${encodeURIComponent(locale)}&returnTo=${encodeURIComponent(returnTo)}`;
      window.location.href = url;
    },
    [locale, pathname],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      setUser,
      isLoading,
      error,
      showLoginModal,
      setShowLoginModal,
      refreshUser,
      logout,
      startSsoLogin,
    }),
    [user, isLoading, error, refreshUser, logout,setUser, startSsoLogin, showLoginModal, setShowLoginModal],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

