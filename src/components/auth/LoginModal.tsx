"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { useAuth } from "@/contexts/auth/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginModal({
  isOpen,
  onClose,
  returnTo,
  title = "Sign in to continue",
  description = "Use Single Sign-On to securely access your account.",
}: {
  isOpen: boolean;
  onClose: () => void;
  returnTo: string;
  title?: string;
  description?: string;
}) {
  console.log(returnTo, "redirectUrl");
  const { startSsoLogin, isLoading } = useAuth();
  const [isExiting, setIsExiting] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const visible = isOpen || isExiting;
  const router = useRouter();

  const safeReturnTo = useMemo(() => {
    if (!returnTo?.startsWith("/") || returnTo.startsWith("//")) return "/";
    return returnTo;
  }, [returnTo]);

  const requestClose = () => {
    setIsExiting(true);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setIsExiting(false);
      onClose();
    }, 200);
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-80 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isOpen && !isExiting ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Login"
      // onMouseDown={(e) => {
      //   if (e.target === e.currentTarget) requestClose();
      // }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div data-testid="login-modal" className="relative w-full max-w-[520px] rounded-2xl border border-white/10 bg-[#1E1E1E] shadow-2xl">
        <button
          type="button"
          onClick={requestClose}
          className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="px-6 pb-6 pt-7 sm:px-8">
          <div className="space-y-2 pr-10">
            <h2 className="font-optima text-[26px] leading-[32px] text-white">{title}</h2>
            <p className="font-montserrat text-[13px] leading-[20px] text-white/70">{description}</p>
          </div>

          <div className="mt-6 space-y-3">
            <button
              data-testid="login-modal-signin-btn"
              type="button"
              disabled={isLoading}
              onClick={() => startSsoLogin({ returnTo: safeReturnTo, mode: "login" })}
              className="w-full cursor-pointer flex h-11 items-center justify-center gap-2.5 rounded-[10px] border border-[#3a3a3a] bg-[#1B1B1B] px-4 text-white transition-colors hover:border-white/30 hover:bg-[#242424] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? <Loader2  className="w-4 h-4 animate-spin text-white" /> : "Sign In"}
            </button>

            <button
              data-testid="login-modal-not-now-btn"
              type="button"
              onClick={() => requestClose()}
              className="w-full h-11 rounded-[10px] bg-[#792327] font-montserrat text-[15px] font-medium leading-[26px] text-white transition-colors hover:bg-[#792327]/90"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

