import { ShopCartStatic } from "@/components/shop/ShopStaticScreens";

export default async function ShopCartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <ShopCartStatic locale={locale} />;
}
