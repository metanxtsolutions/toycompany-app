import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProductCard } from "@/components/storefront/product-card";
import { prisma } from "@/lib/prisma";
import { ProductStatus, ReviewStatus } from "@/generated/prisma/client";
import { JsonLd } from "@/components/json-ld";
import { buildOrganizationJsonLd } from "@/lib/structured-data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://toycompany.store";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Toy Company — RC Cars, Drones & Collectibles",
  description:
    "Toy Company brings the hottest RC cars, drones, model kits, and collectibles straight to hobbyists across India.",
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "Toy Company — RC Cars, Drones & Collectibles",
    description:
      "Toy Company brings the hottest RC cars, drones, model kits, and collectibles straight to hobbyists across India.",
    url: SITE_URL,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Toy Company — RC Cars, Drones & Collectibles",
    description:
      "Toy Company brings the hottest RC cars, drones, model kits, and collectibles straight to hobbyists across India.",
  },
};

async function getHomepageData() {
  const now = new Date();

  const [categories, banner, trendingProducts, testimonials, latestPosts] = await Promise.all([
    prisma.category.findMany({
      where: { parentId: null, isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 4,
    }),
    prisma.banner.findFirst({
      where: {
        placement: "HOME_HERO",
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.product.findMany({
      where: { status: ProductStatus.ACTIVE },
      orderBy: [{ reviewCount: "desc" }, { avgRating: "desc" }],
      take: 8,
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        variants: { where: { isActive: true } },
      },
    }),
    prisma.review.findMany({
      where: { status: ReviewStatus.APPROVED, rating: { gte: 4 } },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        user: { select: { name: true } },
        product: { select: { name: true } },
      },
    }),
    prisma.blogPost.findMany({
      where: { publishedAt: { lte: now } },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
  ]);

  return { categories, banner, trendingProducts, testimonials, latestPosts };
}

export default async function HomePage() {
  const { categories, banner, trendingProducts, testimonials, latestPosts } =
    await getHomepageData();

  return (
    <div>
      <JsonLd data={buildOrganizationJsonLd()} />
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-background to-secondary/15">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-24 sm:px-6 lg:px-8">
          <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
            Now trending across India
          </span>
          <h1 className="font-heading max-w-2xl text-4xl font-bold tracking-tight sm:text-6xl">
            {banner?.title ?? "Build. Race. Collect."}
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Toy Company brings the hottest RC cars, drones, model kits, and
            collectibles straight to hobbyists who want more than a toy —
            they want the next obsession.
          </p>
          <div className="flex gap-3">
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href={banner?.linkUrl ?? "/category/rc-cars"} />}
            >
              Shop RC Cars
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="/category/drones" />}
            >
              Explore Drones
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="font-heading text-2xl font-bold tracking-tight">
          Shop by category
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link key={category.slug} href={`/category/${category.slug}`}>
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardContent className="flex h-40 flex-col justify-end">
                  <h3 className="font-heading text-lg font-semibold">
                    {category.name}
                  </h3>
                  {category.description ? (
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {trendingProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold tracking-tight">
            Trending now
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {trendingProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {testimonials.length > 0 && (
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              What hobbyists are saying
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {testimonials.map((review) => (
                <Card key={review.id}>
                  <CardContent className="space-y-2 p-5">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`size-4 ${
                            i < review.rating
                              ? "fill-primary text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm">
                      {review.title ? (
                        <span className="font-semibold">{review.title} — </span>
                      ) : null}
                      {review.body}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {review.user.name ?? "Verified buyer"} · {review.product.name}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {latestPosts.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-bold tracking-tight">
                From the blog
              </h2>
              <Link
                href="/blog"
                className="text-sm font-medium text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {latestPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
                    {post.coverImage && (
                      <div className="relative aspect-video bg-muted">
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          fill
                          sizes="(min-width: 640px) 33vw, 100vw"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="space-y-2 p-5">
                      {post.categoryTag && (
                        <span className="text-xs font-medium text-primary">
                          {post.categoryTag}
                        </span>
                      )}
                      <h3 className="font-heading text-lg font-semibold">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-sm text-muted-foreground">
                          {post.excerpt}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold tracking-tight">
            Ready to start your next build?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            Create an account to track orders, save your wishlist, and get
            early access to new drops.
          </p>
          <Button
            className="mt-6"
            nativeButton={false}
            render={<Link href="/register" />}
          >
            Create an account
          </Button>
        </div>
      </section>
    </div>
  );
}
