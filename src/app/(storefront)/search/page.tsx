import type { Metadata } from "next";
import { searchProducts } from "@/lib/search";
import { ProductCard } from "@/components/storefront/product-card";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export const metadata: Metadata = {
  title: "Search",
};

export default async function SearchPage({ searchParams }: PageProps) {
  const { q = "" } = await searchParams;
  const products = q ? await searchProducts(q) : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-heading text-2xl font-bold tracking-tight">
        {q ? `Search results for "${q}"` : "Search"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {q ? `${products.length} ${products.length === 1 ? "result" : "results"}` : "Enter a search term to get started."}
      </p>

      {q && products.length === 0 && (
        <div className="mt-10 rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
          No products matched your search.
        </div>
      )}

      {products.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
