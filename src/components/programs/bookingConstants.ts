import type { AddonItem } from "@/components/programs/AddonsList";
import type { SeatCategory } from "@/components/programs/BookingTicketPanel";

// export const DEFAULT_SEAT_CATEGORIES: SeatCategory[] = [
//   { id: "sold-out", label: "Sold Out", seatsAvailable: 0, price: "", color: "#FFFFFF", soldOut: true },
//   { id: "gold", label: "Gold", seatsAvailable: 28, price: "AED 550", color: "#FBFF00" },
//   { id: "silver", label: "Silver", seatsAvailable: 45, price: "AED 350", color: "#F6E27A" },
//   { id: "platinum", label: "Platinum", seatsAvailable: 45, price: "AED 450", color: "#F5A623" },
//   { id: "vip", label: "VIP", seatsAvailable: 45, price: "AED 650", color: "#00FFB2" },
//   { id: "general", label: "General", seatsAvailable: 45, price: "AED 0", color: "#9013FE" },
// ];

export const BOOKING_ADDON_ITEMS: AddonItem[] = [
  {
    id: "premium-preshow",
    title: "DO Premium Package (Pre-show Package)",
    description: "Selection of canapes with one premium beverage from our menu.",
    price: 135,
    image: "/images/shop/addons.webp",
  },
  {
    id: "house-beverage",
    title: "DO House Beverage (Pre-show Package)",
    description: "One house beverage from our selected menu (alcoholic or non-alcoholic).",
    price: 45,
    image: "/images/shop/addons.webp",
  },
  {
    id: "belcanto-dinein",
    title: "DO Belcanto Dine-in (Single Admit)",
    description: "Redeemable voucher for food and beverage at Belcanto restaurant.",
    price: 299,
    image: "/images/shop/addons.webp",
  },
  {
    id: "classic-preshow",
    title: "DO Classic Package (Pre-show Package)",
    description: "Selection of canapes with one house beverage from our selected menu.",
    price: 75,
    image: "/images/shop/addons.webp",
  },
];
