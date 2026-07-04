import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { JsonLd } from "@/components/json-ld";
import { buildBlogPostingJsonLd, buildBreadcrumbJsonLd } from "@/lib/structured-data";
import { PROSE_CLASSES } from "@/lib/prose-classes";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://toycompany.store";

async function getPost(slug: string) {
  const now = new Date();
  return prisma.blogPost.findFirst({
    where: { slug, publishedAt: { lte: now } },
    include: { author: { select: { name: true } } },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  const title = post.metaTitle ?? post.title;
  const description = post.metaDescription ?? post.excerpt ?? undefined;
  const url = `${SITE_URL}/blog/${post.slug}`;
  const image = post.ogImage ?? post.coverImage ?? undefined;

  return {
    title,
    description,
    keywords: post.metaKeywords ?? undefined,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      images: image ? [image] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: post.title, url: `/blog/${post.slug}` },
  ]);

  const blogPostingJsonLd = buildBlogPostingJsonLd({
    title: post.title,
    excerpt: post.excerpt,
    slug: post.slug,
    coverImage: post.coverImage,
    publishedAt: post.publishedAt!,
    updatedAt: post.updatedAt,
    authorName: post.author?.name ?? null,
  });

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={blogPostingJsonLd} />

      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/blog" className="hover:text-foreground">
          Blog
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{post.title}</span>
      </nav>

      {post.categoryTag && (
        <Link
          href={`/blog?category=${encodeURIComponent(post.categoryTag)}`}
          className="text-xs font-medium text-primary"
        >
          {post.categoryTag}
        </Link>
      )}
      <h1 className="font-heading mt-1 text-3xl font-bold tracking-tight">{post.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {post.author?.name ?? "Toy Company"} ·{" "}
        {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(post.publishedAt!)}
      </p>

      {post.coverImage && (
        <div className="relative mt-6 aspect-video overflow-hidden rounded-lg bg-muted">
          <Image src={post.coverImage} alt={post.title} fill sizes="768px" className="object-cover" />
        </div>
      )}

      <div
        className={`mt-8 ${PROSE_CLASSES}`}
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />
    </article>
  );
}
