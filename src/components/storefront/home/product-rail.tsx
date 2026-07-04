import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard, type ProductCardData } from "@/components/storefront/product-card";

export function ProductRail({
  title,
  eyebrow,
  viewAllHref,
  products,
  accent,
  children,
}: {
  title: string;
  eyebrow?: string;
  viewAllHref?: string;
  products: ProductCardData[];
  /** Optional accent class for the eyebrow text (e.g. "text-brand-lime"). */
  accent?: string;
  /** Optional extra header content (e.g. a countdown). */
  children?: React.ReactNode;
}) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          {eyebrow ? (
            <p className={`text-xs font-bold tracking-widest uppercase ${accent ?? "text-primary"}`}>
              {eyebrow}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
            {children}
          </div>
        </div>
        {viewAllHref ? (
          <Link
            href={viewAllHref}
            className="group flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            View all
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : null}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
