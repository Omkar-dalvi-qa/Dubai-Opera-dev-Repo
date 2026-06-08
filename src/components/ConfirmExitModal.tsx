"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

type ConfirmExitModalProps = {
  isOpen: boolean;
  reservationId?: string | null;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export default function ConfirmExitModal({
  isOpen,
  reservationId,
  title = "Are you sure you want to exit?",
  message = "Your selected seats will be lost if you leave this page.",
  confirmLabel = "Yes",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmExitModalProps) {
  const [isReleasing, setIsReleasing] = useState(false);

  const handleConfirm = async () => {
    if (isReleasing) return;

    const validReservationId =
      typeof reservationId === "string" && String(reservationId).trim().length > 0;

    // If no reservation exists yet, just continue with existing confirm behavior.
    if (!validReservationId) {
      await onConfirm();
      return;
    }
    {
      try {
        await onConfirm();
      } catch (error) {
        console.error("Failed to release reservation seats:", error);
      } finally {
        setIsReleasing(false);
      }
    }
    // setIsReleasing(true);
    // try {
    //   const response = await fetch(`/api/external/reservations/release/${reservationId}`, {
    //     method: "GET",
    //     headers: {
    //       Accept: "application/json",
    //     },
    //   });

    //   if (!response.ok) {
    //     let message = `Release request failed (${response.status})`;
    //     try {
    //       const json = (await response.json()) as { message?: string };
    //       if (typeof json?.message === "string" && json.message.trim()) {
    //         message = json.message;
    //       }
    //     } catch {
    //       // Ignore parse errors and use fallback message above.
    //     }
    //     throw new Error(message);
    //   }

    //   await onConfirm();
    // } catch (error) {
    //   console.error("Failed to release reservation seats:", error);
    // } finally {
    //   setIsReleasing(false);
    // }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-1200 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#1E1E1E] p-6 text-white shadow-2xl">
        <h3 className="font-montserrat text-xl font-semibold">{title}</h3>
        <p className="mt-2 font-montserrat text-sm text-white/80">{message}</p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isReleasing}
            className="rounded px-4 py-2 font-montserrat text-sm text-white/90 transition-colors hover:bg-white/10"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isReleasing}
            className="rounded bg-primary-light px-4 py-2 font-montserrat text-sm text-white transition-colors hover:bg-[#5E1B1E] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isReleasing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
