import { ProductStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function searchSuggestions(query: string) {
  const q = query.trim();
  if (!q) return { products: [], categories: [] };

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: ProductStatus.ACTIVE,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { brand: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        basePrice: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
      take: 5,
    }),
    prisma.category.findMany({
      where: {
        isActive: true,
        name: { contains: q, mode: "insensitive" },
      },
      select: { id: true, name: true, slug: true },
      take: 3,
    }),
  ]);

  return { products, categories };
}

export async function searchProducts(query: string) {
  const q = query.trim();
  if (!q) return [];

  return prisma.product.findMany({
    where: {
      status: ProductStatus.ACTIVE,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      variants: { where: { isActive: true } },
    },
    orderBy: { reviewCount: "desc" },
  });
}
