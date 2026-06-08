import Link from "next/link";
import type { ReactNode } from "react";
import { CreditCard, Package, ShoppingCart } from "lucide-react";

function FlowShell({ children }: { children: ReactNode }) {
  return (
    <section className="w-full px-4 md:px-6 lg:px-12 xl:px-20 py-10 md:py-14 mt-26">
      <div className="max-w-[1400px] mx-auto">{children}</div>
    </section>
  );
}

export function ShopCartStatic({ locale }: { locale: string }) {
  const shopHref = `/${locale}/shop`;
  return (
    <FlowShell>
      <div className="flex max-w-[720px] mx-auto flex-col items-center justify-center rounded-[24px] border border-white/15 bg-surface p-12 py-20 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/5">
          <ShoppingCart size={42} className="text-white/20" />
        </div>
        <h2 className="font-montserrat text-[28px] font-semibold text-white tracking-tight">Your cart is empty</h2>
        <p className="mt-3 max-w-[320px] font-montserrat text-[16px] leading-[24px] text-white/50">
          Explore our collection and find something special to add to your cart.
        </p>
        <Link
          href={shopHref}
          className="mt-10 inline-flex h-12 items-center rounded-full bg-primary-light px-10 font-montserrat text-[15px] font-semibold text-white transition-all hover:bg-[#8e2b30] hover:scale-105 active:scale-95 shadow-[0_8px_20px_rgba(121,35,39,0.3)]"
        >
          Continue Shopping
        </Link>
      </div>
    </FlowShell>
  );
}

export function ShopCheckoutStatic({ locale }: { locale: string }) {
  const base = `/${locale}/shop`;
  return (
    <FlowShell>
      <div className="max-w-[720px] mx-auto space-y-8">
        <div className="rounded-[20px] bg-surface border border-white/15 p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6">
            <Package size={18} className="text-primary-light" />
            <h1 className="font-montserrat text-[18px] font-semibold text-white">Checkout</h1>
          </div>
          <p className="font-montserrat text-[15px] text-white/55 mb-8">
            Static preview — shipping and payment steps are not connected to a backend.
          </p>
          <div className="pointer-events-none space-y-4 opacity-50 select-none">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="h-11 rounded-[10px] border border-[#FFFFFF1A] bg-[#151515]" />
              <div className="h-11 rounded-[10px] border border-[#FFFFFF1A] bg-[#151515]" />
            </div>
            <div className="h-11 rounded-[10px] border border-[#FFFFFF1A] bg-[#151515]" />
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link
            href={`${base}/cart`}
            className="inline-flex h-12 items-center rounded-full border border-white/25 px-8 font-montserrat text-[15px] font-semibold text-white hover:bg-white/5 transition-colors"
          >
            Back to cart
          </Link>
          <Link
            href={`${base}/payment`}
            className="inline-flex h-12 items-center rounded-full bg-primary-light px-8 font-montserrat text-[15px] font-semibold text-white hover:bg-[#8e2b30] transition-colors"
          >
            Continue to payment
          </Link>
        </div>
      </div>
    </FlowShell>
  );
}

export function ShopPaymentStatic({ locale }: { locale: string }) {
  const base = `/${locale}/shop`;
  return (
    <FlowShell>
      <div className="max-w-[720px] mx-auto space-y-8">
        <div className="rounded-[20px] bg-surface border border-white/15 p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6">
            <CreditCard size={18} className="text-primary-light" />
            <h1 className="font-montserrat text-[18px] font-semibold text-white">Payment</h1>
          </div>
          <p className="font-montserrat text-[15px] text-white/55 mb-8">
            Static preview — card fields are intentionally omitted.
          </p>
          <div className="pointer-events-none space-y-4 opacity-50 select-none">
            <div className="h-11 rounded-[10px] border border-[#FFFFFF1A] bg-[#151515]" />
            <div className="h-11 rounded-[10px] border border-[#FFFFFF1A] bg-[#151515]" />
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link
            href={`${base}/checkout`}
            className="inline-flex h-12 items-center rounded-full border border-white/25 px-8 font-montserrat text-[15px] font-semibold text-white hover:bg-white/5 transition-colors"
          >
            Back to checkout
          </Link>
          <Link
            href={`${base}/confirmation`}
            className="inline-flex h-12 items-center rounded-full bg-primary-light px-8 font-montserrat text-[15px] font-semibold text-white hover:bg-[#8e2b30] transition-colors"
          >
            Complete order (preview)
          </Link>
        </div>
      </div>
    </FlowShell>
  );
}

export function ShopConfirmationStatic({ locale }: { locale: string }) {
  const shopHref = `/${locale}/shop`;
  return (
    <FlowShell>
      <div className="max-w-[560px] mx-auto rounded-[24px] border border-white/15 bg-surface px-8 py-14 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#1f5f3a]/35 border border-emerald-400/40">
          <span className="text-3xl leading-none text-emerald-200" aria-hidden>
            ✓
          </span>
        </div>
        <h1 className="font-optima text-[28px] md:text-[34px] text-white mb-3">Thank you</h1>
        <p className="font-montserrat text-[15px] leading-[24px] text-white/55 mb-10">
          This is a static confirmation screen for the shop flow.
        </p>
        <Link
          href={shopHref}
          className="inline-flex h-12 items-center rounded-full bg-primary-light px-10 font-montserrat text-[15px] font-semibold text-white hover:bg-[#8e2b30] transition-colors"
        >
          Back to Shop
        </Link>
      </div>
    </FlowShell>
  );
}
