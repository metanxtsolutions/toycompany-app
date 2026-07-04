import { Prisma, ProductStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const PAGE_SIZE = 12;

/** Shared include shape for every query that feeds a ProductCard. */
export const PRODUCT_CARD_INCLUDE = {
  images: { orderBy: { sortOrder: "asc" }, take: 1 },
  variants: { where: { isActive: true } },
} satisfies Prisma.ProductInclude;

export type ProductSort =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "rating"
  | "popularity";

export interface ProductListFilters {
  categoryIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  brands?: string[];
  minRating?: number;
  inStockOnly?: boolean;
  sort?: ProductSort;
  page?: number;
  search?: string;
}

const SORT_ORDER: Record<ProductSort, Prisma.ProductOrderByWithRelationInput[]> = {
  newest: [{ createdAt: "desc" }],
  price_asc: [{ basePrice: "asc" }],
  price_desc: [{ basePrice: "desc" }],
  rating: [{ avgRating: "desc" }, { reviewCount: "desc" }],
  popularity: [{ reviewCount: "desc" }, { avgRating: "desc" }],
};

export function buildProductWhere(
  filters: ProductListFilters,
): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {
    status: ProductStatus.ACTIVE,
  };

  if (filters.categoryIds?.length) {
    where.categoryId = { in: filters.categoryIds };
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.basePrice = {
      ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
      ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
    };
  }

  if (filters.brands?.length) {
    where.brand = { in: filters.brands };
  }

  if (filters.minRating !== undefined) {
    where.avgRating = { gte: filters.minRating };
  }

  if (filters.inStockOnly) {
    where.variants = { some: { isActive: true, stockQuantity: { gt: 0 } } };
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { brand: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function listProducts(filters: ProductListFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const where = buildProductWhere(filters);
  const orderBy = SORT_ORDER[filters.sort ?? "newest"];

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: PRODUCT_CARD_INCLUDE,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

/**
 * Best sellers ranked by real order volume (sum of OrderItem quantities),
 * padded with the review-based popularity sort when order history is thin.
 */
export async function getBestSellerProducts(limit: number) {
  const grouped = await prisma.orderItem.groupBy({
    by: ["variantId"],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit * 3,
  });

  let rankedProductIds: string[] = [];
  if (grouped.length > 0) {
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: grouped.map((g) => g.variantId) } },
      select: { id: true, productId: true },
    });
    const productIdByVariant = new Map(variants.map((v) => [v.id, v.productId]));
    const seen = new Set<string>();
    for (const g of grouped) {
      const productId = productIdByVariant.get(g.variantId);
      if (productId && !seen.has(productId)) {
        seen.add(productId);
        rankedProductIds.push(productId);
      }
    }
    rankedProductIds = rankedProductIds.slice(0, limit);
  }

  const bestSellers = rankedProductIds.length
    ? await getProductsByIds(rankedProductIds)
    : [];

  if (bestSellers.length < limit) {
    const padding = await prisma.product.findMany({
      where: {
        status: ProductStatus.ACTIVE,
        id: { notIn: rankedProductIds },
      },
      orderBy: [{ reviewCount: "desc" }, { avgRating: "desc" }],
      take: limit - bestSellers.length,
      include: PRODUCT_CARD_INCLUDE,
    });
    bestSellers.push(...padding);
  }

  return bestSellers;
}

export async function getNewArrivals(limit: number) {
  return prisma.product.findMany({
    where: { status: ProductStatus.ACTIVE },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: PRODUCT_CARD_INCLUDE,
  });
}

/** Products with an active markdown (compareAtPrice > basePrice). */
export async function getFlashDeals(limit: number) {
  const candidates = await prisma.product.findMany({
    where: { status: ProductStatus.ACTIVE, compareAtPrice: { not: null } },
    orderBy: [{ reviewCount: "desc" }, { avgRating: "desc" }],
    take: limit * 3,
    include: PRODUCT_CARD_INCLUDE,
  });
  return candidates
    .filter((p) => p.compareAtPrice !== null && p.compareAtPrice > p.basePrice)
    .slice(0, limit);
}

export interface FeaturedBrand {
  name: string;
  productCount: number;
  image: { url: string; altText: string | null } | null;
}

export async function getFeaturedBrands(limit: number): Promise<FeaturedBrand[]> {
  const grouped = await prisma.product.groupBy({
    by: ["brand"],
    where: { status: ProductStatus.ACTIVE, brand: { not: null } },
    _count: { brand: true },
    orderBy: { _count: { brand: "desc" } },
    take: limit,
  });

  return Promise.all(
    grouped.map(async (g) => {
      const representative = await prisma.product.findFirst({
        where: { status: ProductStatus.ACTIVE, brand: g.brand },
        orderBy: [{ reviewCount: "desc" }, { avgRating: "desc" }],
        select: {
          images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, altText: true } },
        },
      });
      return {
        name: g.brand!,
        productCount: g._count.brand,
        image: representative?.images[0] ?? null,
      };
    }),
  );
}

/** Fetch active products by id, preserving the caller's order. */
export async function getProductsByIds(ids: string[]) {
  if (!ids.length) return [];
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, status: ProductStatus.ACTIVE },
    include: PRODUCT_CARD_INCLUDE,
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}

export async function getProductForQuickView(id: string) {
  return prisma.product.findUnique({
    where: { id, status: ProductStatus.ACTIVE },
    include: {
      category: { select: { name: true, slug: true } },
      images: { orderBy: { sortOrder: "asc" } },
      variants: { where: { isActive: true } },
    },
  });
}

export async function getAvailableBrands(categoryIds?: string[]) {
  const rows = await prisma.product.findMany({
    where: {
      status: ProductStatus.ACTIVE,
      brand: { not: null },
      ...(categoryIds?.length ? { categoryId: { in: categoryIds } } : {}),
    },
    select: { brand: true },
    distinct: ["brand"],
  });
  return rows.map((r) => r.brand!).sort();
}

export { formatPriceINR, productMinPrice, productInStock } from "@/lib/product-format";
