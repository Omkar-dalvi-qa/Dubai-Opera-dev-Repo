"use client";

import { useState } from "react";
import { subscribeWebsiteApi } from "@/services/websiteServer";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export type SubscribeStatus = "idle" | "loading" | "subscribed" | "already_subscribed" | "error";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<SubscribeStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("newsletter");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmedEmail = email.trim();

    if (!emailRegex.test(trimmedEmail)) {
      setStatus("error");
      setError(t("enterAValidEmail"));
      toast.error(t("enterAValidEmail"));
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      const result = await subscribeWebsiteApi(trimmedEmail);

      if (!result.ok) {
        setStatus("error");
        const message = result.error ?? t("somethingWentWrong");
        setError(message);
        toast.error(message);
        return;
      }

      if (result.status === "already_subscribed") {
        setStatus("already_subscribed");
        toast.info(t("youAreAlreadySubscribed"));
        return;
      }

      setStatus("subscribed");
      toast.success(`${t("thanks")} — ${t("youAreSubscribed")}`);
      setEmail("");
    } catch (err) {
      setStatus("error");
      const message = (err as Error).message ?? t("somethingWentWrong");
      setError(message);
      toast.error(message);
    }
  }

  return (
    <section
      className="w-full py-16 px-4 text-white"
      // style={{ background: "linear-gradient(0deg, #2E0D0F 0%, #300E10 100%)" }}
      >
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-2xl md:text-[36px] font-optima mb-8 tracking-normal font-normal">
          <span className="uppercase md:capitalize"> {t("subscribeToGet")} </span> <br className="md:hidden" />  {t("ourNewsletter")}
        </h2>

        <form
          onSubmit={onSubmit}
          noValidate
          className="flex w-full max-w-md flex-col md:flex-row mx-auto items-stretch gap-5"
        >
          <input
            type="email"
            placeholder="Enter a valid email"
            className={`flex-1 px-5 py-4 h-12 bg-surface md:bg-white/10 placeholder:text-[#FFFFFF66] rounded-sm focus:outline-none focus:border-white/50 text-white font-montserrat text-[14px] leading-[100%] tracking-normal transition-colors hover:ring-1 ${status === "error" ? "ring-1 ring-primary" : "hover:ring-primary"
              }`}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === "error") {
                setStatus("idle");
                setError(null);
              }
            }}
            disabled={status === "loading"}
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="bg-primary hover:bg-primary-light cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed px-8 py-2.5 rounded-lg font-medium font-montserrat tracking-wider text-sm transition-colors shadow-2xl"
          >
            {status === "loading" ? t("submitting") : t("submit")}
          </button>
        </form>

        {status === "subscribed" ? (
          <p className="mt-4 font-montserrat text-sm text-white/85">
            {t("thanks")} — {t("youAreSubscribed")}
          </p>
        ) : null}
        {status === "already_subscribed" ? (
          <p className="mt-4 font-montserrat text-sm text-white/85">
            {t("youAreAlreadySubscribed")}
          </p>
        ) : null}
        {status === "error" ? (
          <p className="mt-4 font-montserrat text-sm text-red-500">
            {error ?? "Something went wrong"}
          </p>
        ) : null}
      </div>
    </section>
  );
}
