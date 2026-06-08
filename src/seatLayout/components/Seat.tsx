"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type SeatStatus = "available" | "selected" | "reserved" | "premium";

interface SeatProps {
  id: string;
  status: SeatStatus;
  price?: number;
  onClick: (id: string) => void;
}

export function Seat({ id, status, price, onClick }: SeatProps) {
  const isSelected = status === "selected";
  const isReserved = status === "reserved";
  const isPremium = status === "premium";

  return (
    <motion.button
      whileHover={!isReserved ? { scale: 1.2, y: -2 } : {}}
      whileTap={!isReserved ? { scale: 0.9 } : {}}
      onClick={() => !isReserved && onClick(id)}
      disabled={isReserved}
      className={cn(
        "relative w-8 h-8 rounded-t-lg transition-colors duration-300",
        "flex items-center justify-center text-[10px] font-bold",
        "before:content-[''] before:absolute before:-bottom-1 before:left-0 before:right-0 before:h-1 before:bg-inherit before:opacity-50 before:rounded-b-sm",
        status === "available" && "bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary",
        status === "selected" && "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.5)]",
        status === "reserved" && "bg-gray-300 text-gray-500 cursor-not-allowed",
        status === "premium" && "bg-accent text-accent-foreground shadow-[0_0_10px_rgba(var(--accent),0.3)]",
        isSelected && "z-10"
      )}
      initial={false}
      animate={{
        rotateX: isReserved ? 0 : 10,
      }}
    >
      <span className="relative z-10">{id}</span>
      {isPremium && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-pulse" />
      )}
    </motion.button>
  );
}
