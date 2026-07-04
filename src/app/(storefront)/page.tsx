import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Star, ShieldCheck, Truck, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { ReviewStatus } from "@/generated/prisma/client";
import {
  getBestSellerProducts,
  getNewArrivals,
  getFlashDeals,
  getFeaturedBrands,
} from "@/lib/products";
import { JsonLd } from "@/components/json-ld";
import { buildOrganizationJsonLd } from "@/lib/structured-data";
import { HeroSection } from "@/components/storefront/home/hero-section";
import { ProductRail } from "@/components/storefront/home/product-rail";
import { FlashDealCountdown } from "@/components/storefront/home/flash-deal-countdown";
import { CategoryShowcase } from "@/components/storefront/home/category-showcase";
import { FeaturedBrands } from "@/components/storefront/home/featured-brands";
import { RecentlyViewedSection } from "@/components/storefront/recently-viewed-section";

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

  const [
    categories,
    banner,
    bestSellers,
    newArrivals,
    flashDeals,
    featuredBrands,
    testimonials,
    latestPosts,
  ] = await Promise.all([
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
    getBestSellerProducts(8),
    getNewArrivals(4),
    getFlashDeals(4),
    getFeaturedBrands(6),
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

  return {
    categories,
    banner,
    bestSellers,
    newArrivals,
    flashDeals,
    featuredBrands,
    testimonials,
    latestPosts,
  };
}

const TRUST_POINTS = [
  { icon: Truck, title: "Fast Shipping", text: "Free over ₹1,999, nationwide" },
  { icon: ShieldCheck, title: "Secure Checkout", text: "UPI, cards & netbanking" },
  { icon: RefreshCcw, title: "Easy Returns", text: "7-day hassle-free returns" },
];

export default async function HomePage() {
  const {
    categories,
    banner,
    bestSellers,
    newArrivals,
    flashDeals,
    featuredBrands,
    testimonials,
    latestPosts,
  } = await getHomepageData();

  return (
    <div>
      <JsonLd data={buildOrganizationJsonLd()} />

      <HeroSection banner={banner} />

      <ProductRail
        title="Flash Deals"
        eyebrow="Limited time"
        accent="text-brand-lime"
        viewAllHref="/search?q="
        products={flashDeals}
      >
        <FlashDealCountdown />
      </ProductRail>

      <ProductRail
        title="Best Sellers"
        eyebrow="Most wanted"
        viewAllHref="/category/rc-cars"
        products={bestSellers}
      />

      <ProductRail
        title="New Arrivals"
        eyebrow="Just dropped"
        accent="text-secondary"
        viewAllHref="/search?q="
        products={newArrivals}
      />

      <CategoryShowcase categories={categories} />

      <FeaturedBrands brands={featuredBrands} />

      {testimonials.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-xs font-bold tracking-widest text-primary uppercase">
            Real reviews
          </p>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            What Hobbyists Are Saying
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {testimonials.map((review) => (
              <Card key={review.id} className="ring-foreground/10">
                <CardContent className="space-y-3 p-5">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`size-4 ${
                          i < review.rating
                            ? "fill-primary text-primary"
                            : "text-muted-foreground/40"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed">
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
        </section>
      )}

      <RecentlyViewedSection />

      {latestPosts.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-bold tracking-widest text-secondary uppercase">
                  Guides & news
                </p>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  From the Blog
                </h2>
              </div>
              <Link
                href="/blog"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                View all
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {latestPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                  <Card className="h-full overflow-hidden ring-foreground/10 transition-all duration-300 group-hover:-translate-y-1 group-hover:ring-primary/40">
                    {post.coverImage && (
                      <div className="relative aspect-video bg-muted">
                        <Image
                          src={post.coverImage}
                          alt={`Cover for article: ${post.title}`}
                          fill
                          sizes="(min-width: 640px) 33vw, 100vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <CardContent className="space-y-2 p-5">
                      {post.categoryTag && (
                        <span className="text-xs font-bold tracking-wide text-primary uppercase">
                          {post.categoryTag}
                        </span>
                      )}
                      <h3 className="font-heading text-lg font-semibold">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="line-clamp-2 text-sm text-muted-foreground">
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
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6 lg:px-8">
          {TRUST_POINTS.map((point) => (
            <div key={point.title} className="flex items-center gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <point.icon className="size-5" />
              </div>
              <div>
                <p className="font-heading text-sm font-semibold">{point.title}</p>
                <p className="text-xs text-muted-foreground">{point.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-secondary/15" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to start your next build?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Create an account to track orders, save your wishlist, and get
            early access to new drops.
          </p>
          <Button
            size="lg"
            className="mt-6 h-12 px-8 text-base"
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
