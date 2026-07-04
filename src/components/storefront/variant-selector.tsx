"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, ShoppingCart, Zap } from "lucide-react";
import { addToCart } from "@/server/actions/cart";
import { formatPriceINR, productDiscountPercent } from "@/lib/product-format";

interface VariantData {
  id: string;
  attributes: Record<string, string>;
  priceOverride: number | null;
  stockQuantity: number;
  isActive: boolean;
}

export function VariantSelector({
  basePrice,
  compareAtPrice,
  variants,
  compact = false,
}: {
  basePrice: number;
  compareAtPrice: number | null;
  variants: VariantData[];
  /** Compact mode (e.g. inside Quick View) hides the fixed mobile bottom bar. */
  compact?: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const attributeKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const v of variants) {
      for (const key of Object.keys(v.attributes)) keys.add(key);
    }
    return [...keys];
  }, [variants]);

  const defaultVariant =
    variants.find((v) => v.isActive && v.stockQuantity > 0) ?? variants[0];

  const [selected, setSelected] = useState<Record<string, string>>(
    defaultVariant?.attributes ?? {},
  );
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState<"add" | "buy" | null>(null);

  const selectedVariant = useMemo(() => {
    return variants.find((v) =>
      attributeKeys.every((key) => v.attributes[key] === selected[key]),
    );
  }, [variants, attributeKeys, selected]);

  const price = selectedVariant?.priceOverride ?? basePrice;
  const inStock = !!selectedVariant && selectedVariant.isActive && selectedVariant.stockQuantity > 0;
  const maxQuantity = Math.min(20, selectedVariant?.stockQuantity ?? 1);
  const discountPercent = productDiscountPercent(price, compareAtPrice);

  function optionsFor(key: string) {
    return [...new Set(variants.map((v) => v.attributes[key]))].filter(Boolean);
  }

  async function handleAddToCart() {
    if (!selectedVariant) return false;
    setPending("add");
    const result = await addToCart({ variantId: selectedVariant.id, quantity });
    setPending(null);

    if (!result.success) {
      toast.error(result.error);
      return false;
    }
    toast.success("Added to cart");
    queryClient.invalidateQueries({ queryKey: ["cart"] });
    return true;
  }

  async function handleBuyNow() {
    if (!selectedVariant) return;
    setPending("buy");
    const result = await addToCart({ variantId: selectedVariant.id, quantity });

    if (!result.success) {
      setPending(null);
      toast.error(result.error);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["cart"] });
    router.push("/checkout");
  }

  const busy = pending !== null;

  return (
    <div className="space-y-5" data-slot="variant-selector">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="font-heading text-3xl font-bold">{formatPriceINR(price)}</span>
        {compareAtPrice && compareAtPrice > price ? (
          <>
            <span className="text-lg text-muted-foreground line-through">
              {formatPriceINR(compareAtPrice)}
            </span>
            {discountPercent ? (
              <Badge className="bg-brand-lime font-bold text-black">
                -{discountPercent}%
              </Badge>
            ) : null}
          </>
        ) : null}
      </div>
      {compareAtPrice && compareAtPrice > price ? (
        <p className="-mt-3 text-xs font-medium text-brand-lime">
          You save {formatPriceINR(compareAtPrice - price)}
        </p>
      ) : null}

      {attributeKeys.map((key) => (
        <div key={key} className="space-y-2">
          <p className="text-sm font-medium capitalize">{key}</p>
          <div className="flex flex-wrap gap-2">
            {optionsFor(key).map((value) => (
              <Button
                key={value}
                type="button"
                variant={selected[key] === value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelected((prev) => ({ ...prev, [key]: value }))}
              >
                {value}
              </Button>
            ))}
          </div>
        </div>
      ))}

      <p className="text-sm">
        {inStock ? (
          <span className="text-emerald-600 dark:text-emerald-400">
            In stock
            {selectedVariant && selectedVariant.stockQuantity <= 5
              ? ` — only ${selectedVariant.stockQuantity} left`
              : ""}
          </span>
        ) : (
          <span className="text-destructive">Out of stock</span>
        )}
      </p>

      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-md border border-input">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Minus className="size-4" />
          </Button>
          <span className="w-8 text-center text-sm">{quantity}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Increase quantity"
            disabled={quantity >= maxQuantity}
            onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
          >
            <Plus className="size-4" />
          </Button>
        </div>

        <div className={compact ? "flex flex-1 gap-2" : "hidden flex-1 gap-2 sm:flex"}>
          <Button
            variant="secondary"
            className="flex-1"
            disabled={!inStock || busy}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="size-4" />
            {pending === "add" ? "Adding…" : "Add to Cart"}
          </Button>
          <Button
            className="flex-1"
            disabled={!inStock || busy}
            onClick={handleBuyNow}
          >
            <Zap className="size-4" />
            {pending === "buy" ? "One sec…" : "Buy Now"}
          </Button>
        </div>
      </div>

      {!compact && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur sm:hidden">
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              disabled={!inStock || busy}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="size-4" />
              {pending === "add" ? "Adding…" : "Add to Cart"}
            </Button>
            <Button
              className="flex-1"
              disabled={!inStock || busy}
              onClick={handleBuyNow}
            >
              <Zap className="size-4" />
              {pending === "buy" ? "One sec…" : `Buy ${formatPriceINR(price)}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
