const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://toycompany.store";
const SITE_NAME = "Toy Company";

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.ico`,
  };
}

export function buildBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

interface ProductJsonLdInput {
  name: string;
  description: string;
  slug: string;
  brand: string | null;
  images: { url: string }[];
  basePrice: number;
  avgRating: number;
  reviewCount: number;
  inStock: boolean;
  reviews: { rating: number; title: string | null; body: string; user: { name: string | null } }[];
}

export function buildProductJsonLd(product: ProductJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((img) => img.url),
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${product.slug}`,
      priceCurrency: "INR",
      price: (product.basePrice / 100).toFixed(2),
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    aggregateRating:
      product.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.avgRating.toFixed(1),
            reviewCount: product.reviewCount,
          }
        : undefined,
    review: product.reviews.map((review) => ({
      "@type": "Review",
      reviewRating: { "@type": "Rating", ratingValue: review.rating },
      name: review.title ?? undefined,
      reviewBody: review.body,
      author: { "@type": "Person", name: review.user.name ?? "Verified buyer" },
    })),
  };
}

interface BlogPostingJsonLdInput {
  title: string;
  excerpt: string | null;
  slug: string;
  coverImage: string | null;
  publishedAt: Date;
  updatedAt: Date;
  authorName: string | null;
}

export function buildBlogPostingJsonLd(post: BlogPostingJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.coverImage ? [post.coverImage] : undefined,
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Person", name: post.authorName ?? SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };
}
