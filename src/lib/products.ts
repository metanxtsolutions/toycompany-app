import { Prisma, ProductStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const PAGE_SIZE = 12;

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
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        variants: { where: { isActive: true } },
      },
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
