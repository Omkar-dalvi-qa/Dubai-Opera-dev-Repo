"use client";

import { useState } from "react";
import { Seat, type SeatStatus } from "./Seat";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Info, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
const COLS = 12;

export function SeatLayout() {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  
  // Mock data for reserved and premium seats
  const reservedSeats = ["A5", "A6", "B1", "B2", "E5", "E6", "E7", "E8"];
  const premiumSeats = ["D5", "D6", "D7", "D8", "C5", "C6", "C7", "C8"];

  const toggleSeat = (id: string) => {
    setSelectedSeats((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const totalPrice = selectedSeats.length * 120; // Mock price

  return (
    <div className="flex flex-col lg:flex-row gap-12 p-8 max-w-7xl mx-auto w-full">
      {/* Seat Grid Area */}
      <div className="flex-1 space-y-12">
        <div className="relative overflow-hidden glass rounded-3xl p-12 shadow-2xl">
          {/* Screen / Stage */}
          <div className="mb-16">
            <div className="w-3/4 h-2 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto rounded-full shadow-[0_0_20px_rgba(var(--primary),0.8)]" />
            <p className="text-center text-xs uppercase tracking-[0.5em] text-muted-foreground mt-4">Screen / Stage</p>
          </div>

          {/* Grid */}
          <div className="flex flex-col gap-4 items-center">
            {ROWS.map((row) => (
              <div key={row} className="flex gap-3 items-center">
                <span className="w-6 text-right text-xs font-bold text-muted-foreground mr-2">{row}</span>
                <div className="flex gap-2">
                  {Array.from({ length: COLS }).map((_, i) => {
                    const id = `${row}${i + 1}`;
                    const isReserved = reservedSeats.includes(id);
                    const isPremium = premiumSeats.includes(id);
                    const isSelected = selectedSeats.includes(id);
                    
                    let status: SeatStatus = "available";
                    if (isReserved) status = "reserved";
                    else if (isSelected) status = "selected";
                    else if (isPremium) status = "premium";

                    return (
                      <Seat 
                        key={id} 
                        id={id} 
                        status={status} 
                        onClick={toggleSeat}
                      />
                    );
                  })}
                </div>
                <span className="w-6 text-left text-xs font-bold text-muted-foreground ml-2">{row}</span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 text-xs font-medium">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-muted rounded-t-sm" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary rounded-t-sm" />
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-300 rounded-t-sm" />
              <span>Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-accent rounded-t-sm" />
              <span>Premium</span>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Panel */}
      <div className="w-full lg:w-80 space-y-6">
        <div className="glass rounded-3xl p-6 shadow-xl sticky top-8 border-primary/10">
          <h2 className="text-xl font-heading font-bold mb-6 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Booking Summary
          </h2>

          <div className="space-y-4">
            <div className="min-h-[100px] flex flex-col gap-2">
              {selectedSeats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground border-2 border-dashed border-gray-200 rounded-2xl">
                  <Info className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-sm">No seats selected</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence>
                    {selectedSeats.map((seat) => (
                      <motion.span
                        key={seat}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold flex items-center gap-1"
                      >
                        {seat}
                        <button 
                          onClick={() => toggleSeat(seat)}
                          className="hover:text-foreground transition-colors ml-1"
                        >
                          ×
                        </button>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <div className="h-px bg-gray-200 my-4" />

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Price</span>
              <span className="text-2xl font-bold text-accent">${totalPrice}</span>
            </div>

            <button
              disabled={selectedSeats.length === 0}
              className={cn(
                "w-full py-4 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2",
                selectedSeats.length > 0 
                  ? "bg-primary text-primary-foreground hover:shadow-[0_0_20px_rgba(var(--primary),0.4)] hover:-translate-y-1"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              Confirm Booking
              <CheckCircle2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 text-[10px] text-muted-foreground leading-relaxed italic">
          * Premium seats include complimentary refreshments and extra legroom. Prices are inclusive of all taxes.
        </div>
      </div>
    </div>
  );
}
