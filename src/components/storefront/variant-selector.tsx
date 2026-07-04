"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { addToCart } from "@/server/actions/cart";
import { formatPriceINR } from "@/lib/product-format";

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
}: {
  basePrice: number;
  compareAtPrice: number | null;
  variants: VariantData[];
}) {
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
  const [isAdding, setIsAdding] = useState(false);

  const selectedVariant = useMemo(() => {
    return variants.find((v) =>
      attributeKeys.every((key) => v.attributes[key] === selected[key]),
    );
  }, [variants, attributeKeys, selected]);

  const price = selectedVariant?.priceOverride ?? basePrice;
  const inStock = !!selectedVariant && selectedVariant.isActive && selectedVariant.stockQuantity > 0;
  const maxQuantity = Math.min(20, selectedVariant?.stockQuantity ?? 1);

  function optionsFor(key: string) {
    return [...new Set(variants.map((v) => v.attributes[key]))].filter(Boolean);
  }

  async function handleAddToCart() {
    if (!selectedVariant) return;
    setIsAdding(true);
    const result = await addToCart({ variantId: selectedVariant.id, quantity });
    setIsAdding(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Added to cart");
    queryClient.invalidateQueries({ queryKey: ["cart"] });
  }

  return (
    <div className="space-y-5" data-slot="variant-selector">
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-bold">{formatPriceINR(price)}</span>
        {compareAtPrice && compareAtPrice > price ? (
          <span className="text-muted-foreground line-through">
            {formatPriceINR(compareAtPrice)}
          </span>
        ) : null}
      </div>

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
            disabled={quantity >= maxQuantity}
            onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
          >
            <Plus className="size-4" />
          </Button>
        </div>

        <Button
          className="hidden flex-1 sm:flex"
          disabled={!inStock || isAdding}
          onClick={handleAddToCart}
        >
          {isAdding ? "Adding…" : inStock ? "Add to Cart" : "Out of stock"}
        </Button>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background p-4 sm:hidden">
        <Button
          className="w-full"
          disabled={!inStock || isAdding}
          onClick={handleAddToCart}
        >
          {isAdding
            ? "Adding…"
            : inStock
              ? `Add to Cart — ${formatPriceINR(price)}`
              : "Out of stock"}
        </Button>
      </div>
    </div>
  );
}
