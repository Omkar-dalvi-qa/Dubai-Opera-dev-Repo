import { ShopPaymentStatic } from "@/components/shop/ShopStaticScreens";

export default async function ShopPaymentPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <ShopPaymentStatic locale={locale} />;
}
