"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatPriceINR } from "@/lib/product-format";
import { calculateOrderTotals } from "@/lib/orders";
import {
  updateCartItem,
  removeCartItem,
  applyCoupon,
} from "@/server/actions/cart";

interface CartPageItem {
  id: string;
  quantity: number;
  product: {
    name: string;
    slug: string;
    basePrice: number;
    images: { url: string; altText: string | null }[];
  };
  variant: { priceOverride: number | null; attributes: Record<string, string> };
}

export function CartPageView({
  items,
  initialCouponCode,
}: {
  items: CartPageItem[];
  initialCouponCode?: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [couponCode, setCouponCode] = useState(initialCouponCode ?? "");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    type: "PERCENTAGE" | "FIXED";
    value: number;
    minOrderValue: number | null;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const subtotal = items.reduce((sum, item) => {
    const price = item.variant.priceOverride ?? item.product.basePrice;
    return sum + price * item.quantity;
  }, 0);

  const { discount, shipping, total } = calculateOrderTotals(
    subtotal,
    appliedCoupon,
  );

  useEffect(() => {
    if (initialCouponCode) {
      applyCoupon(initialCouponCode).then((result) => {
        if (result.valid) setAppliedCoupon(result);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function refresh() {
    router.refresh();
    queryClient.invalidateQueries({ queryKey: ["cart"] });
  }

  async function handleQuantityChange(itemId: string, quantity: number) {
    await updateCartItem({ itemId, quantity });
    refresh();
  }

  async function handleRemove(itemId: string) {
    await removeCartItem(itemId);
    refresh();
  }

  async function handleApplyCoupon() {
    setCouponError(null);
    const result = await applyCoupon(couponCode);
    if (!result.valid) {
      setCouponError(result.error);
      return;
    }
    if (result.minOrderValue && subtotal < result.minOrderValue) {
      setCouponError(`Minimum order value is ${formatPriceINR(result.minOrderValue)}.`);
      return;
    }
    setAppliedCoupon(result);
    toast.success(`Coupon ${result.code} applied`);
  }

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Button className="mt-4" render={<Link href="/" />}>
          Continue shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <ul className="space-y-4">
        {items.map((item) => {
          const price = item.variant.priceOverride ?? item.product.basePrice;
          const image = item.product.images[0];
          return (
            <li key={item.id}>
              <Card>
                <CardContent className="flex gap-4 p-4">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-muted">
                    {image ? (
                      <Image
                        src={image.url}
                        alt={image.altText ?? item.product.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1">
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="font-medium hover:underline"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {Object.values(item.variant.attributes).join(" / ")}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center rounded-md border border-input">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        >
                          <Minus className="size-4" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        >
                          <Plus className="size-4" />
                        </Button>
                      </div>
                      <span className="font-semibold">
                        {formatPriceINR(price * item.quantity)}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove"
                    onClick={() => handleRemove(item.id)}
                  >
                    <X className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>

      <Card className="h-fit">
        <CardContent className="space-y-4 p-5">
          <h2 className="font-heading font-semibold">Order Summary</h2>

          {!appliedCoupon ? (
            <div className="flex gap-2">
              <Input
                placeholder="Coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
              <Button type="button" variant="outline" onClick={handleApplyCoupon}>
                Apply
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-sm">
              <span>
                Coupon <strong>{appliedCoupon.code}</strong> applied
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setAppliedCoupon(null)}
              >
                Remove
              </Button>
            </div>
          )}
          {couponError && <p className="text-xs text-destructive">{couponError}</p>}

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPriceINR(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Discount</span>
                <span>-{formatPriceINR(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{shipping === 0 ? "Free" : formatPriceINR(shipping)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatPriceINR(total)}</span>
            </div>
          </div>

          <Button
            className="w-full"
            nativeButton={false}
            render={
              <Link
                href={
                  appliedCoupon
                    ? `/checkout?coupon=${encodeURIComponent(appliedCoupon.code)}`
                    : "/checkout"
                }
              />
            }
          >
            Checkout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
