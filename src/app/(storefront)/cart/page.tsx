import type { Metadata } from "next";
import { getCart } from "@/lib/cart";
import { CartPageView } from "@/components/storefront/cart-page-view";

export const metadata: Metadata = {
  title: "Your Cart",
};

interface PageProps {
  searchParams: Promise<{ coupon?: string }>;
}

export default async function CartPage({ searchParams }: PageProps) {
  const { coupon } = await searchParams;
  const cart = await getCart();

  const items = (cart?.items ?? []).map((item) => ({
    id: item.id,
    quantity: item.quantity,
    product: {
      name: item.product.name,
      slug: item.product.slug,
      basePrice: item.product.basePrice,
      images: item.product.images,
    },
    variant: {
      priceOverride: item.variant.priceOverride,
      attributes: item.variant.attributes as Record<string, string>,
    },
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold tracking-tight">
        Your Cart
      </h1>
      <div className="mt-8">
        <CartPageView items={items} initialCouponCode={coupon} />
      </div>
    </div>
  );
}
