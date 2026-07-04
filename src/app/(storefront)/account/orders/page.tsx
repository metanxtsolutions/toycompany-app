import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPriceINR } from "@/lib/product-format";

export const metadata: Metadata = {
  title: "Your Orders",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  PAID: "default",
  PROCESSING: "default",
  SHIPPED: "default",
  DELIVERED: "default",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
};

export default async function AccountOrdersPage() {
  const session = await auth();
  const orders = await prisma.order.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  if (orders.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        You haven&apos;t placed any orders yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Link key={order.id} href={`/orders/${order.orderNumber}`}>
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="font-medium">{order.orderNumber}</p>
                <p className="text-sm text-muted-foreground">
                  {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
                    order.createdAt,
                  )}{" "}
                  · {order.items.length} {order.items.length === 1 ? "item" : "items"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{formatPriceINR(order.total)}</span>
                <Badge variant={STATUS_VARIANT[order.status] ?? "secondary"}>
                  {order.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
