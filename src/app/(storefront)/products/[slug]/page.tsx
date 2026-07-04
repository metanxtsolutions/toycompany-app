import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductStatus, ReviewStatus } from "@/generated/prisma/client";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { VariantSelector } from "@/components/storefront/variant-selector";
import { ReviewList } from "@/components/storefront/review-list";
import { ReviewForm } from "@/components/storefront/review-form";
import { ProductCard } from "@/components/storefront/product-card";
import { WishlistButton } from "@/components/storefront/wishlist-button";
import { getWishlistProductIds } from "@/server/actions/wishlist";
import { Star } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  return prisma.product.findUnique({
    where: { slug, status: ProductStatus.ACTIVE },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { where: { isActive: true } },
      reviews: {
        where: { status: ReviewStatus.APPROVED },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};

  return {
    title: product.metaTitle ?? product.name,
    description: product.metaDescription ?? product.description.slice(0, 160),
    openGraph: product.ogImage ? { images: [product.ogImage] } : undefined,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const relatedProducts = await prisma.product.findMany({
    where: {
      status: ProductStatus.ACTIVE,
      categoryId: product.categoryId,
      id: { not: product.id },
    },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      variants: { where: { isActive: true } },
    },
    take: 4,
  });

  const wishlistIds = await getWishlistProductIds();
  const isWishlisted = wishlistIds.includes(product.id);

  const attributeSummary = new Map<string, Set<string>>();
  for (const variant of product.variants) {
    for (const [key, value] of Object.entries(
      variant.attributes as Record<string, string>,
    )) {
      if (!attributeSummary.has(key)) attributeSummary.set(key, new Set());
      attributeSummary.get(key)!.add(value);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 pb-28 sm:px-6 sm:pb-10 lg:px-8">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/category/${product.category.slug}`}
          className="hover:text-foreground"
        >
          {product.category.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} productName={product.name} />

        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              {product.brand ? (
                <p className="text-sm font-medium text-muted-foreground">
                  {product.brand}
                </p>
              ) : null}
              <h1 className="font-heading mt-1 text-3xl font-bold tracking-tight">
                {product.name}
              </h1>
            </div>
            <WishlistButton productId={product.id} initialInWishlist={isWishlisted} />
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`size-4 ${
                    i < Math.round(product.avgRating)
                      ? "fill-primary text-primary"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <span className="text-muted-foreground">
              {product.reviewCount > 0
                ? `${product.avgRating.toFixed(1)} (${product.reviewCount} reviews)`
                : "No reviews yet"}
            </span>
          </div>

          <div className="mt-6">
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
            />
          </div>

          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          {attributeSummary.size > 0 && (
            <table className="mt-6 w-full text-sm">
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-2 font-medium capitalize">Brand</td>
                  <td className="py-2 text-muted-foreground">
                    {product.brand ?? "—"}
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 font-medium capitalize">Category</td>
                  <td className="py-2 text-muted-foreground">
                    {product.category.name}
                  </td>
                </tr>
                {[...attributeSummary.entries()].map(([key, values]) => (
                  <tr key={key} className="border-b border-border">
                    <td className="py-2 font-medium capitalize">{key}</td>
                    <td className="py-2 text-muted-foreground">
                      {[...values].join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <section className="mt-16 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <h2 className="font-heading text-xl font-bold">Customer Reviews</h2>
          <div className="mt-4">
            <ReviewList reviews={product.reviews} />
          </div>
        </div>
        <div>
          <h2 className="font-heading text-xl font-bold">Write a review</h2>
          <div className="mt-4">
            <ReviewForm productId={product.id} productSlug={product.slug} />
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="font-heading text-xl font-bold">You may also like</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((related) => (
              <ProductCard
                key={related.id}
                product={related}
                isWishlisted={wishlistIds.includes(related.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
