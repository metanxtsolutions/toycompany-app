"use client";

import { useEffect, useState } from "react";
import { ProductCard, type ProductCardData } from "@/components/storefront/product-card";
import { fetchProductsByIds } from "@/server/actions/products";
import { RECENTLY_VIEWED_KEY } from "@/components/storefront/recently-viewed-tracker";

/**
 * Client-only section: reads the visitor's recently-viewed product ids from
 * localStorage after mount and fetches fresh product data. Renders nothing
 * when there's no history, so the statically-cached homepage stays valid.
 */
export function RecentlyViewedSection() {
  const [products, setProducts] = useState<ProductCardData[]>([]);

  useEffect(() => {
    let cancelled = false;
    try {
      const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
      const ids: string[] = raw ? JSON.parse(raw) : [];
      if (!ids.length) return;
      fetchProductsByIds(ids).then((data) => {
        if (!cancelled) setProducts(data);
      });
    } catch {
      // localStorage unavailable — skip silently
    }
    return () => {
      cancelled = true;
    };
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-xs font-bold tracking-widest text-primary uppercase">
        Pick up where you left off
      </p>
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Recently Viewed
      </h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
