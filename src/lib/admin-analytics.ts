import { prisma } from "@/lib/prisma";

const REVENUE_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

export async function getDashboardStats() {
  const [revenueAgg, orderCount, customerCount, variants] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { in: [...REVENUE_STATUSES] } },
      _sum: { total: true },
    }),
    prisma.order.count({ where: { status: { in: [...REVENUE_STATUSES] } } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.productVariant.findMany({ select: { stockQuantity: true, lowStockThreshold: true } }),
  ]);

  const lowStockCount = variants.filter((v) => v.stockQuantity <= v.lowStockThreshold).length;

  return {
    revenue: revenueAgg._sum.total ?? 0,
    orderCount,
    customerCount,
    lowStockCount,
  };
}

export async function getTopProducts(limit = 5) {
  const items = await prisma.orderItem.findMany({
    where: { order: { status: { in: [...REVENUE_STATUSES] } } },
    select: { productName: true, quantity: true, price: true },
  });

  const byProduct = new Map<string, { quantitySold: number; revenue: number }>();
  for (const item of items) {
    const existing = byProduct.get(item.productName) ?? { quantitySold: 0, revenue: 0 };
    existing.quantitySold += item.quantity;
    existing.revenue += item.price * item.quantity;
    byProduct.set(item.productName, existing);
  }

  return [...byProduct.entries()]
    .map(([productName, stats]) => ({ productName, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export async function getRecentOrders(limit = 8) {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { items: true },
  });
}
