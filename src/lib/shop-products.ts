export interface ShopProductInfoRow {
  label: string;
  value: string;
}

export interface ShopProductColorOption {
  name: string;
  swatch: string;
  image: string;
}

export interface ShopProduct {
  id: number;
  slug: string;
  name: string;
  category: string;
  brand: string;
  price: string;
  image: string;
  gallery: string[];
  description: string;
  color: string;
  colorOptions?: ShopProductColorOption[];
  infoRows?: ShopProductInfoRow[];
  isSoldOut?: boolean;
}

export const SHOP_PRODUCTS: ShopProduct[] = [
  {
    id: 1,
    slug: "dubai-opera-cup",
    name: "Gift Card",
    category: "Gift Card Wallet",
    brand: "Gift Card Wallet",
    price: "AED 200",
    image: "/images/shop/GiftCard.png",
    gallery: ["/images/shop/GiftCard.png"],
    description:
      "A premium takeaway cup featuring the iconic Dubai Opera pattern in a durable and stylish finish.\n\nSleek and lightweight, it is designed for comfortable everyday use on the go.\n\nThe secure lid helps prevent spills, while the smooth exterior keeps its refined look.\n\nPerfect for coffee, tea, or any beverage you enjoy throughout the day.",
    color: "",
    // colorOptions: [
    //   { name: "Sage Green", swatch: "#A6C7AE", image: "/images/shop/GiftCard.png" },
    // ],
    // infoRows: [
    //   { label: "Material", value: "Premium BPA Free" },
    //   { label: "Capacity", value: "350 ml / 12 oz" },
    //   { label: "Dimensions", value: "20cm x 10cm x 20.1" },
    //   { label: "Care Instructions", value: "Dishwasher safe" },
    //   { label: "Made in", value: "UAE" },
    //   { label: "SKU", value: "DOC-2471-001" },
    // ],
  },
  {
    id: 2,
    slug: "water-bottle-tumbler",
    name: "Water Bottle (Tumbler)",
    category: "Drinkware",
    brand: "Spring Collection",
    price: "AED 150",
    image: "/images/shop/CupBlue.webp",
    gallery: ["/images/shop/Cup.webp", "/images/shop/CupBlue.webp", "/images/shop/CupBlack.webp"],
    description:
      "An insulated tumbler built for everyday performance with a sleek, modern silhouette.\n\nDouble-wall construction helps maintain temperature for longer, whether hot or cold.\n\nA comfortable grip and balanced weight make it easy to carry from desk to commute.\n\nA refined finish keeps it looking polished through daily use.",
    color: "Matte Black",
    colorOptions: [
      { name: "Sage Green", swatch: "#A6C7AE", image: "/images/shop/Cup.webp" },
      { name: "Opera Blue", swatch: "#173B6D", image: "/images/shop/CupBlue.webp" },
      { name: "Matte Black", swatch: "#1A1A1A", image: "/images/shop/CupBlack.webp" },
    ],
    infoRows: [
      { label: "Material", value: "Stainless Steel" },
      { label: "Capacity", value: "500 ml" },
      { label: "Made in", value: "UAE" },
      { label: "SKU", value: "WTB-1050-002" },
    ],
  },
  {
    id: 3,
    slug: "amouage-perfume-pink",
    name: "Amouage Perfume",
    category: "Fragrance",
    brand: "Fine Fragrance",
    price: "AED 500",
    image: "/images/shop/CupBlack.webp",
    gallery: ["/images/shop/CupBlack.webp", "/images/shop/Cup.webp", "/images/shop/CupBlue.webp"],
    description:
      "A sophisticated signature fragrance crafted for timeless elegance.\n\nDelicate floral notes open with a soft, luminous sparkle before settling into a warm, velvety heart.\n\nA refined blend of woods and amber lingers on the skin, creating a graceful, long‑lasting trail.\n\nIdeal for evening wear or special occasions, it delivers a poised, luxurious finish.",
    color: "Black",
    colorOptions: [
      { name: "Matte Black", swatch: "#1A1A1A", image: "/images/shop/CupBlack.webp" },
      { name: "Sage Green", swatch: "#A6C7AE", image: "/images/shop/Cup.webp" },
      { name: "Opera Blue", swatch: "#173B6D", image: "/images/shop/CupBlue.webp" },
    ],
    infoRows: [
      { label: "Material", value: "Glass Bottle" },
      { label: "Capacity", value: "100 ml" },
      { label: "Made in", value: "UAE" },
      { label: "SKU", value: "AMO-5520-003" },
    ],
    isSoldOut: true,
  },

  {
    id: 4,
    slug: "amouage-perfume-gold",
    name: "Amouage Perfume",
    category: "Fragrance",
    brand: "Fine Fragrance",
    price: "AED 500",
    image: "/images/shop/CupBlue.webp",
    gallery: ["/images/shop/CupBlue.webp", "/images/shop/CupBlack.webp", "/images/shop/Cup.webp"],
    description:
      "A luxury fragrance with warm notes and a rich, long‑lasting profile.\n\nGolden spices and resinous woods unfold into a smooth, enveloping heart.\n\nBalanced sweetness adds depth without overpowering, creating an elegant finish.\n\nDesigned for statement moments, it leaves a refined trail that endures.",
    color: "Gold",
    colorOptions: [
      { name: "Opera Blue", swatch: "#173B6D", image: "/images/shop/CupBlue.webp" },
      { name: "Matte Black", swatch: "#1A1A1A", image: "/images/shop/CupBlack.webp" },
      { name: "Sage Green", swatch: "#A6C7AE", image: "/images/shop/Cup.webp" },
    ],
    infoRows: [
      { label: "Material", value: "Glass Bottle" },
      { label: "Capacity", value: "100 ml" },
      { label: "Made in", value: "UAE" },
      { label: "SKU", value: "AMO-5520-004" },
    ],
  },
  {
    id: 5,
    slug: "wallace-company-fine-fragrance",
    name: "Wallace and Company Fine Fragrance",
    category: "Fragrance",
    brand: "Common Burgundy",
    price: "AED 70",
    image: "/images/shop/CupBlack.webp",
    gallery: ["/images/shop/CupBlack.webp", "/images/shop/Cup.webp", "/images/shop/CupBlue.webp"],
    description:
      "An everyday fragrance blend with soft, balanced aromatic notes.\n\nBright top notes give way to a gentle floral heart that feels clean and airy.\n\nA subtle woody base keeps the scent grounded and easy to wear all day.\n\nPerfect for daily routines, it offers a fresh, understated finish.",
    color: "Burgundy",
    colorOptions: [
      { name: "Matte Black", swatch: "#1A1A1A", image: "/images/shop/CupBlack.webp" },
      { name: "Sage Green", swatch: "#A6C7AE", image: "/images/shop/Cup.webp" },
      { name: "Opera Blue", swatch: "#173B6D", image: "/images/shop/CupBlue.webp" },
    ],
    infoRows: [
      { label: "Material", value: "Glass Bottle" },
      { label: "Capacity", value: "50 ml" },
      { label: "Made in", value: "UAE" },
      { label: "SKU", value: "WCF-4100-005" },
    ],
  },
];
