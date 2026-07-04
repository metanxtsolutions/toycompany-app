"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

const RATING_OPTIONS = [4, 3, 2, 1];

export function ProductFilters({ brands }: { brands: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentBrands = new Set(
    (searchParams.get("brand") ?? "").split(",").filter(Boolean),
  );
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");

  function updateParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function toggleBrand(brand: string) {
    updateParams((params) => {
      const next = new Set(currentBrands);
      if (next.has(brand)) {
        next.delete(brand);
      } else {
        next.add(brand);
      }
      if (next.size > 0) {
        params.set("brand", [...next].join(","));
      } else {
        params.delete("brand");
      }
    });
  }

  function applyPriceRange() {
    updateParams((params) => {
      if (minPrice) params.set("minPrice", minPrice);
      else params.delete("minPrice");
      if (maxPrice) params.set("maxPrice", maxPrice);
      else params.delete("maxPrice");
    });
  }

  function setRating(rating: number | null) {
    updateParams((params) => {
      if (rating) params.set("rating", String(rating));
      else params.delete("rating");
    });
  }

  function toggleInStock(checked: boolean) {
    updateParams((params) => {
      if (checked) params.set("inStock", "1");
      else params.delete("inStock");
    });
  }

  function clearAll() {
    router.push(pathname, { scroll: false });
    setMinPrice("");
    setMaxPrice("");
  }

  const currentRating = searchParams.get("rating");
  const inStockOnly = searchParams.get("inStock") === "1";
  const hasActiveFilters =
    currentBrands.size > 0 ||
    !!searchParams.get("minPrice") ||
    !!searchParams.get("maxPrice") ||
    !!currentRating ||
    inStockOnly;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-semibold">Filters</h2>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Clear all
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <Label>Price range (₹)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onBlur={applyPriceRange}
            className="w-24"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onBlur={applyPriceRange}
            className="w-24"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <Label>Minimum rating</Label>
        <div className="space-y-2">
          {RATING_OPTIONS.map((rating) => (
            <label
              key={rating}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <Checkbox
                checked={currentRating === String(rating)}
                onCheckedChange={(checked) =>
                  setRating(checked ? rating : null)
                }
              />
              {rating}+ stars
            </label>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox
            checked={inStockOnly}
            onCheckedChange={(checked) => toggleInStock(checked === true)}
          />
          In stock only
        </label>
      </div>

      {brands.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <Label>Brand</Label>
            <div className="space-y-2">
              {brands.map((brand) => (
                <label
                  key={brand}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <Checkbox
                    checked={currentBrands.has(brand)}
                    onCheckedChange={() => toggleBrand(brand)}
                  />
                  {brand}
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
