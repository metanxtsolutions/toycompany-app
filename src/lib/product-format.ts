export function formatPriceINR(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export function productMinPrice(product: {
  basePrice: number;
  variants: { priceOverride: number | null }[];
}) {
  const prices = product.variants
    .map((v) => v.priceOverride ?? product.basePrice)
    .filter((p): p is number => p !== null);
  return prices.length ? Math.min(...prices) : product.basePrice;
}

export function productInStock(product: {
  variants: { stockQuantity: number; isActive: boolean }[];
}) {
  return product.variants.some((v) => v.isActive && v.stockQuantity > 0);
}

export function productDiscountPercent(
  basePrice: number,
  compareAtPrice: number | null,
) {
  if (!compareAtPrice || compareAtPrice <= basePrice) return null;
  return Math.round(((compareAtPrice - basePrice) / compareAtPrice) * 100);
}

export function productLowStock(product: {
  variants: { stockQuantity: number; isActive: boolean; lowStockThreshold: number }[];
}) {
  const activeVariants = product.variants.filter((v) => v.isActive && v.stockQuantity > 0);
  if (!activeVariants.length) return null;
  const lowest = activeVariants.reduce((min, v) => (v.stockQuantity < min.stockQuantity ? v : min));
  return lowest.stockQuantity <= lowest.lowStockThreshold ? lowest.stockQuantity : null;
}
