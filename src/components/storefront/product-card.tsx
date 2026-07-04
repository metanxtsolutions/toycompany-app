import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatPriceINR,
  productInStock,
  productMinPrice,
} from "@/lib/product-format";
import { WishlistButton } from "@/components/storefront/wishlist-button";

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
  variants: { priceOverride: number | null; stockQuantity: number; isActive: boolean }[];
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
  const image = product.images[0];

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <Card className="h-full overflow-hidden transition-shadow group-hover:shadow-lg">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {image ? (
            <Image
              src={image.url}
              alt={image.altText ?? product.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : null}
          {!inStock && (
            <Badge variant="destructive" className="absolute top-2 left-2">
              Out of stock
            </Badge>
          )}
          {product.compareAtPrice && product.compareAtPrice > price ? (
            <Badge className="absolute bottom-2 left-2">Sale</Badge>
          ) : null}
          <WishlistButton
            productId={product.id}
            initialInWishlist={isWishlisted}
            className="absolute top-2 right-2"
          />
        </div>
        <CardContent className="space-y-1 p-4">
          {product.brand ? (
            <p className="text-xs font-medium text-muted-foreground">
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
          <div className="flex items-center gap-2 pt-1">
            <span className="font-semibold">{formatPriceINR(price)}</span>
            {product.compareAtPrice && product.compareAtPrice > price ? (
              <span className="text-sm text-muted-foreground line-through">
                {formatPriceINR(product.compareAtPrice)}
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
