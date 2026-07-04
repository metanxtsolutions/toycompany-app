import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { listProducts, getAvailableBrands, ProductSort } from "@/lib/products";
import { ProductCard } from "@/components/storefront/product-card";
import { ProductFilters } from "@/components/storefront/product-filters";
import { ProductSort as ProductSortSelect } from "@/components/storefront/product-sort";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/json-ld";
import { buildBreadcrumbJsonLd } from "@/lib/structured-data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://toycompany.store";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function getCategory(slug: string) {
  return prisma.category.findUnique({
    where: { slug, isActive: true },
    include: { children: { where: { isActive: true } }, parent: true },
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return {};

  const title = category.metaTitle ?? category.name;
  const description = category.metaDescription ?? category.description ?? undefined;
  const url = `${SITE_URL}/category/${category.slug}`;

  return {
    title,
    description,
    keywords: category.metaKeywords ?? undefined,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

function toNumber(value: string | string[] | undefined) {
  if (typeof value !== "string") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function toStringParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const category = await getCategory(slug);
  if (!category) notFound();

  const categoryIds = [category.id, ...category.children.map((c) => c.id)];

  const filters = {
    categoryIds,
    minPrice: toNumber(sp.minPrice) !== undefined ? toNumber(sp.minPrice)! * 100 : undefined,
    maxPrice: toNumber(sp.maxPrice) !== undefined ? toNumber(sp.maxPrice)! * 100 : undefined,
    brands: toStringParam(sp.brand)?.split(",").filter(Boolean),
    minRating: toNumber(sp.rating),
    inStockOnly: sp.inStock === "1",
    sort: (toStringParam(sp.sort) as ProductSort) ?? "newest",
    page: toNumber(sp.page) ?? 1,
  };

  const [{ items, total, page, pageCount }, brands] = await Promise.all([
    listProducts(filters),
    getAvailableBrands(categoryIds),
  ]);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", url: "/" },
    ...(category.parent
      ? [{ name: category.parent.name, url: `/category/${category.parent.slug}` }]
      : []),
    { name: category.name, url: `/category/${category.slug}` },
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <JsonLd data={breadcrumbJsonLd} />

      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        {category.parent ? (
          <>
            <span className="mx-2">/</span>
            <Link
              href={`/category/${category.parent.slug}`}
              className="hover:text-foreground"
            >
              {category.parent.name}
            </Link>
          </>
        ) : null}
        <span className="mx-2">/</span>
        <span className="text-foreground">{category.name}</span>
      </nav>

      <h1 className="font-heading text-3xl font-bold tracking-tight">
        {category.name}
      </h1>
      {category.description ? (
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {category.description}
        </p>
      ) : null}

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <ProductFilters brands={brands} />
        </aside>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {total} {total === 1 ? "product" : "products"}
            </p>
            <ProductSortSelect />
          </div>

          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
              No products match your filters.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {pageCount > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {page > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={buildPageHref(sp, page - 1)} />}
                >
                  Previous
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                Page {page} of {pageCount}
              </span>
              {page < pageCount && (
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={buildPageHref(sp, page + 1)} />}
                >
                  Next
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function buildPageHref(
  sp: Record<string, string | string[] | undefined>,
  page: number,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === "string") params.set(key, value);
  }
  params.set("page", String(page));
  return `?${params.toString()}`;
}
