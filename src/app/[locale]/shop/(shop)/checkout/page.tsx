import { ShopCheckoutStatic } from "@/components/shop/ShopStaticScreens";

export default async function ShopCheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <ShopCheckoutStatic locale={locale} />;
}
