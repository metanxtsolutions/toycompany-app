import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatPriceINR,
  productDiscountPercent,
  productInStock,
  productLowStock,
  productMinPrice,
} from "@/lib/product-format";
import { WishlistButton } from "@/components/storefront/wishlist-button";
import { ProductCardActions } from "@/components/storefront/product-card-actions";

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  basePrice: number;
  compareAtPrice: number | null;
  avgRating: number;
  reviewCount: number;
  images: { url: string; altText: string | null }[];
  variants: {
    id: string;
    priceOverride: number | null;
    stockQuantity: number;
    lowStockThreshold: number;
    isActive: boolean;
  }[];
}

export function ProductCard({
  product,
  isWishlisted = false,
}: {
  product: ProductCardData;
  isWishlisted?: boolean;
}) {
  const price = productMinPrice(product);
  const inStock = productInStock(product);
  const lowStockQty = productLowStock(product);
  const discountPercent = productDiscountPercent(price, product.compareAtPrice);
  const image = product.images[0];
  const defaultVariant =
    product.variants.find((v) => v.isActive && v.stockQuantity > 0) ??
    product.variants[0];

  return (
    <Link href={`/products/${product.slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden ring-foreground/10 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-primary/10 group-hover:ring-primary/40">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {image ? (
            <Image
              src={image.url}
              alt={image.altText ?? product.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : null}
          {!inStock && (
            <Badge variant="destructive" className="absolute top-2 left-2">
              Out of stock
            </Badge>
          )}
          {discountPercent ? (
            <Badge className="absolute bottom-2 left-2 bg-brand-lime font-bold text-black">
              -{discountPercent}%
            </Badge>
          ) : null}
          <WishlistButton
            productId={product.id}
            initialInWishlist={isWishlisted}
            className="absolute top-2 right-2 opacity-80 transition-opacity group-hover:opacity-100"
          />
        </div>
        <CardContent className="space-y-1 p-4">
          {product.brand ? (
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {product.brand}
            </p>
          ) : null}
          <h3 className="font-heading truncate font-semibold">{product.name}</h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="size-3.5 fill-primary text-primary" />
            <span>
              {product.avgRating > 0 ? product.avgRating.toFixed(1) : "New"}
            </span>
            {product.reviewCount > 0 ? (
              <span>({product.reviewCount})</span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 pt-1">
            <span className="font-heading text-lg font-bold">
              {formatPriceINR(price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > price ? (
              <>
                <span className="text-sm text-muted-foreground line-through">
                  {formatPriceINR(product.compareAtPrice)}
                </span>
                <span className="text-xs font-medium text-brand-lime">
                  Save {formatPriceINR(product.compareAtPrice - price)}
                </span>
              </>
            ) : null}
          </div>
          {lowStockQty !== null && inStock ? (
            <p className="text-xs font-medium text-destructive">
              Only {lowStockQty} left — order soon
            </p>
          ) : null}
          <ProductCardActions
            productId={product.id}
            defaultVariantId={defaultVariant?.id ?? null}
            inStock={inStock}
          />
        </CardContent>
      </Card>
    </Link>
  );
}
