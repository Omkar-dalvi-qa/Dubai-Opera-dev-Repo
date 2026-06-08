import { ShopConfirmationStatic } from "@/components/shop/ShopStaticScreens";

export default async function ShopConfirmationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <ShopConfirmationStatic locale={locale} />;
}
