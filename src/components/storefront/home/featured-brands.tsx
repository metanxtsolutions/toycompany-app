import Link from "next/link";
import Image from "next/image";
import type { FeaturedBrand } from "@/lib/products";

export function FeaturedBrands({ brands }: { brands: FeaturedBrand[] }) {
  if (brands.length === 0) return null;

  return (
    <section className="border-y border-border bg-card/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-xs font-bold tracking-widest text-secondary uppercase">
          Trusted by collectors
        </p>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Featured Brands
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {brands.map((brand) => (
            <Link
              key={brand.name}
              href={`/search?q=${encodeURIComponent(brand.name)}`}
              className="group flex flex-col items-center gap-3 rounded-xl p-4 text-center ring-1 ring-foreground/10 transition-all hover:-translate-y-0.5 hover:ring-primary/40"
            >
              <div className="relative size-16 overflow-hidden rounded-full ring-2 ring-foreground/10">
                {brand.image ? (
                  <Image
                    src={brand.image.url}
                    alt={`${brand.name} products`}
                    fill
                    sizes="64px"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted font-heading text-lg font-bold">
                    {brand.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <p className="font-heading text-sm font-semibold">{brand.name}</p>
                <p className="text-xs text-muted-foreground">
                  {brand.productCount} {brand.productCount === 1 ? "product" : "products"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
