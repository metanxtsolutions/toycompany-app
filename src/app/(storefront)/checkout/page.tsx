import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCart } from "@/lib/cart";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CheckoutForm } from "@/components/storefront/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
};

interface PageProps {
  searchParams: Promise<{ coupon?: string }>;
}

export default async function CheckoutPage({ searchParams }: PageProps) {
  const { coupon } = await searchParams;
  const cart = await getCart();

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <h1 className="font-heading text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">
          Add a few items before heading to checkout.
        </p>
        <Button className="mt-6" render={<Link href="/" />}>
          Continue shopping
        </Button>
      </div>
    );
  }

  const session = await auth();
  const savedAddresses = session?.user?.id
    ? await prisma.address.findMany({
        where: { userId: session.user.id },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      })
    : [];

  const subtotal = cart.items.reduce((sum, item) => {
    const price = item.variant.priceOverride ?? item.product.basePrice;
    return sum + price * item.quantity;
  }, 0);

  const items = cart.items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    productName: item.product.name,
    variantLabel: Object.values(item.variant.attributes as Record<string, string>).join(" / "),
    price: item.variant.priceOverride ?? item.product.basePrice,
    image: item.product.images[0] ?? null,
  }));

  const defaultAddress = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold tracking-tight">Checkout</h1>
      <div className="mt-8">
        <CheckoutForm
          items={items}
          subtotal={subtotal}
          savedAddresses={savedAddresses}
          defaultAddressId={defaultAddress?.id ?? null}
          userEmail={session?.user?.email ?? null}
          initialCouponCode={coupon}
        />
      </div>
    </div>
  );
}
