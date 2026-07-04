"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { VariantSelector } from "@/components/storefront/variant-selector";
import { fetchProductQuickView } from "@/server/actions/products";
import { useStorefrontPortalContainer } from "@/components/storefront/theme-scope";

type QuickViewProduct = NonNullable<
  Awaited<ReturnType<typeof fetchProductQuickView>>
>;

export function QuickViewDialog({
  productId,
  open,
  onOpenChange,
}: {
  productId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const portalContainer = useStorefrontPortalContainer();
  const [product, setProduct] = useState<QuickViewProduct | null>(null);

  // Loading whenever the dialog is open and data hasn't arrived yet.
  const isLoading = open && !product;

  useEffect(() => {
    if (!open || product) return;
    let cancelled = false;
    fetchProductQuickView(productId).then((data) => {
      if (!cancelled) setProduct(data);
    });
    return () => {
      cancelled = true;
    };
  }, [open, product, productId]);

  const image = product?.images[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        container={portalContainer}
        className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"
      >
        {isLoading || !product ? (
          <div className="grid gap-6 sm:grid-cols-2">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <div className="space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
              {image ? (
                <Image
                  src={image.url}
                  alt={image.altText ?? product.name}
                  fill
                  sizes="(min-width: 640px) 320px, 100vw"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div>
              <DialogHeader>
                {product.brand ? (
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {product.brand}
                  </p>
                ) : null}
                <DialogTitle className="font-heading text-xl font-bold">
                  {product.name}
                </DialogTitle>
              </DialogHeader>
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="size-3.5 fill-primary text-primary" />
                {product.avgRating > 0
                  ? `${product.avgRating.toFixed(1)} (${product.reviewCount})`
                  : "New"}
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                {product.description}
              </p>
              <div className="mt-4">
                <VariantSelector
                  basePrice={product.basePrice}
                  compareAtPrice={product.compareAtPrice}
                  variants={product.variants.map((v) => ({
                    id: v.id,
                    attributes: v.attributes as Record<string, string>,
                    priceOverride: v.priceOverride,
                    stockQuantity: v.stockQuantity,
                    isActive: v.isActive,
                  }))}
                  compact
                />
              </div>
              <Link
                href={`/products/${product.slug}`}
                className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
                onClick={() => onOpenChange(false)}
              >
                View full details →
              </Link>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
