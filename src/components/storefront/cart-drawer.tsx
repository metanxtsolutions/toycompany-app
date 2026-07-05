"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Minus, Plus, ShoppingCart, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPriceINR } from "@/lib/product-format";
import { calculateOrderTotals } from "@/lib/orders";
import {
  updateCartItem,
  removeCartItem,
  applyCoupon,
} from "@/server/actions/cart";
import { useStorefrontPortalContainer } from "@/components/storefront/theme-scope";

interface CartApiItem {
  id: string;
  quantity: number;
  product: { name: string; slug: string; basePrice: number; images: { url: string; altText: string | null }[] };
  variant: { id: string; priceOverride: number | null; attributes: Record<string, string> };
}

interface CartApiResponse {
  items: CartApiItem[];
  subtotal: number;
  itemCount: number;
}

interface AppliedCoupon {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrderValue: number | null;
}

async function fetchCart(): Promise<CartApiResponse> {
  const res = await fetch("/api/cart");
  if (!res.ok) throw new Error("Failed to load cart");
  return res.json();
}

export function CartDrawer() {
  const queryClient = useQueryClient();
  const portalContainer = useStorefrontPortalContainer();
  const [open, setOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["cart"],
    queryFn: fetchCart,
  });

  const items = data?.items ?? [];
  const subtotal = data?.subtotal ?? 0;
  const itemCount = data?.itemCount ?? 0;

  const { discount, shipping, total } = calculateOrderTotals(
    subtotal,
    appliedCoupon,
  );

  /**
   * Optimistic updates: the UI changes instantly and the server syncs in the
   * background — a round trip per click felt sluggish on real-world latency.
   * On failure we refetch, which rolls the cache back to server truth.
   */
  function applyLocalCartUpdate(itemId: string, quantity: number) {
    queryClient.setQueryData<CartApiResponse>(["cart"], (old) => {
      if (!old) return old;
      const items = old.items
        .map((item) => (item.id === itemId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0);
      return {
        items,
        subtotal: items.reduce(
          (sum, item) =>
            sum + (item.variant.priceOverride ?? item.product.basePrice) * item.quantity,
          0,
        ),
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      };
    });
  }

  async function handleQuantityChange(itemId: string, quantity: number) {
    if (quantity < 0 || quantity > 20) return;
    applyLocalCartUpdate(itemId, quantity);
    const result = await updateCartItem({ itemId, quantity });
    if (!result.success) {
      toast.error(result.error);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    }
  }

  async function handleRemove(itemId: string) {
    applyLocalCartUpdate(itemId, 0);
    const result = await removeCartItem(itemId);
    if (!result.success) {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    }
  }

  async function handleApplyCoupon() {
    setCouponError(null);
    const result = await applyCoupon(couponCode);
    if (!result.valid) {
      setCouponError(result.error);
      return;
    }
    if (result.minOrderValue && subtotal < result.minOrderValue) {
      setCouponError(
        `Minimum order value is ${formatPriceINR(result.minOrderValue)}.`,
      );
      return;
    }
    setAppliedCoupon(result);
    toast.success(`Coupon ${result.code} applied`);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Cart" className="relative" />
        }
      >
        <ShoppingCart className="size-5" />
        {itemCount > 0 && (
          <Badge className="absolute -top-1 -right-1 size-4 justify-center rounded-full p-0 text-[10px]">
            {itemCount}
          </Badge>
        )}
      </SheetTrigger>
      <SheetContent
        container={portalContainer}
        className="flex w-full flex-col sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle className="font-heading">Your Cart</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          {items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Your cart is empty.
            </p>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => {
                const price = item.variant.priceOverride ?? item.product.basePrice;
                const image = item.product.images[0];
                return (
                  <li key={item.id} className="flex gap-3">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted">
                      {image ? (
                        <Image
                          src={image.url}
                          alt={image.altText ?? item.product.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="flex-1">
                      <Link
                        href={`/products/${item.product.slug}`}
                        onClick={() => setOpen(false)}
                        className="text-sm font-medium hover:underline"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {Object.values(item.variant.attributes).join(" / ")}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex items-center rounded-md border border-input">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity - 1)
                            }
                          >
                            <Minus className="size-3" />
                          </Button>
                          <span className="w-6 text-center text-xs">
                            {item.quantity}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity + 1)
                            }
                          >
                            <Plus className="size-3" />
                          </Button>
                        </div>
                        <span className="text-sm font-medium">
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
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <SheetFooter className="border-t border-border">
            <div className="w-full space-y-3">
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
              {couponError && (
                <p className="text-xs text-destructive">{couponError}</p>
              )}

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
                <div className="flex justify-between font-semibold">
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
                        ? `/cart?coupon=${encodeURIComponent(appliedCoupon.code)}`
                        : "/cart"
                    }
                    onClick={() => setOpen(false)}
                  />
                }
              >
                View Cart
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
