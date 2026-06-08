"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";

export type ShopCartItem = {
  productId: number;
  quantity: number;
};

type ShopCartContextValue = {
  items: ShopCartItem[];
  cartCount: number;
  addItem: (productId: number, quantity?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
};

const ShopCartContext = createContext<ShopCartContextValue | null>(null);

export function ShopCartProvider({ children }: { children: React.ReactNode }) {

  const [items, setItems] = useState<ShopCartItem[]>([]);

  // Cleanup old localStorage keys once on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("shop-cart-items");
      localStorage.removeItem("shop-cart-items-v2");
    }
  }, []);

  const cartCount = useMemo(() => items.length, [items]);

  const addItem = (productId: number, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { productId, quantity }];
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    setItems((prev) => {
      const nextQuantity = Math.max(0, Math.floor(quantity));
      if (nextQuantity === 0) {
        return prev.filter((i) => i.productId !== productId);
      }
      return prev.map((i) =>
        i.productId === productId ? { ...i, quantity: nextQuantity } : i
      );
    });
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const value = useMemo(
    () => ({
      items,
      cartCount,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [items, cartCount]
  );

  return <ShopCartContext.Provider value={value}>{children}</ShopCartContext.Provider>;
}

export function useShopCart() {
  const context = useContext(ShopCartContext);
  if (!context) {
    throw new Error("useShopCart must be used within ShopCartProvider");
  }
  return context;
}
