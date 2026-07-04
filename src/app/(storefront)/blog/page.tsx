import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

interface PageProps {
  searchParams: Promise<{ category?: string }>;
}

export const metadata: Metadata = {
  title: "Blog",
  description: "Guides, reviews, and news for RC, drone, and collectible hobbyists.",
};

export default async function BlogIndexPage({ searchParams }: PageProps) {
  const { category } = await searchParams;
  const now = new Date();

  const posts = await prisma.blogPost.findMany({
    where: {
      publishedAt: { lte: now },
      ...(category ? { categoryTag: category } : {}),
    },
    orderBy: { publishedAt: "desc" },
  });

  const categories = await prisma.blogPost.findMany({
    where: { publishedAt: { lte: now }, categoryTag: { not: null } },
    select: { categoryTag: true },
    distinct: ["categoryTag"],
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold tracking-tight">Blog</h1>
      <p className="mt-2 text-muted-foreground">
        Guides, reviews, and news for hobbyists who build, race, and collect.
      </p>

      {categories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <Link
            href="/blog"
            className={`rounded-full px-3 py-1 ${!category ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.categoryTag}
              href={`/blog?category=${encodeURIComponent(c.categoryTag!)}`}
              className={`rounded-full px-3 py-1 ${category === c.categoryTag ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              {c.categoryTag}
            </Link>
          ))}
        </div>
      )}

      {posts.length === 0 ? (
        <p className="mt-10 text-muted-foreground">No posts yet — check back soon.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
                {post.coverImage && (
                  <div className="relative aspect-video bg-muted">
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      sizes="(min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <CardContent className="space-y-2 p-5">
                  {post.categoryTag && (
                    <span className="text-xs font-medium text-primary">{post.categoryTag}</span>
                  )}
                  <h2 className="font-heading text-lg font-semibold">{post.title}</h2>
                  {post.excerpt && <p className="text-sm text-muted-foreground">{post.excerpt}</p>}
                  <p className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(post.publishedAt!)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
