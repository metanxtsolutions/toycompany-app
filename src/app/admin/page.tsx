import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPriceINR } from "@/lib/product-format";
import { getDashboardStats, getTopProducts, getRecentOrders } from "@/lib/admin-analytics";
import { auth } from "@/lib/auth";
import { canViewAnalytics } from "@/lib/admin-permissions";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  PAID: "default",
  PROCESSING: "default",
  SHIPPED: "default",
  DELIVERED: "default",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
};

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!canViewAnalytics(session?.user?.role)) {
    redirect("/admin/orders");
  }

  const [stats, topProducts, recentOrders] = await Promise.all([
    getDashboardStats(),
    getTopProducts(),
    getRecentOrders(),
  ]);

  const statCards = [
    { label: "Revenue", value: formatPriceINR(stats.revenue) },
    { label: "Orders", value: stats.orderCount },
    { label: "Customers", value: stats.customerCount },
    { label: "Low stock variants", value: stats.lowStockCount },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Revenue and order counts include paid, processing, shipped, and delivered orders.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <h2 className="font-heading mb-3 font-semibold">Top products</h2>
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {topProducts.map((product) => (
                  <li key={product.productName} className="flex items-center justify-between">
                    <span>{product.productName}</span>
                    <span className="text-muted-foreground">{product.quantitySold} sold</span>
                    <span className="font-medium">{formatPriceINR(product.revenue)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="font-heading mb-3 font-semibold">Recent orders</h2>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {recentOrders.map((order) => (
                  <li key={order.id} className="flex items-center justify-between">
                    <Link href={`/admin/orders/${order.id}`} className="text-primary hover:underline">
                      {order.orderNumber}
                    </Link>
                    <span className="text-muted-foreground">{order.items.length} items</span>
                    <span className="font-medium">{formatPriceINR(order.total)}</span>
                    <Badge variant={STATUS_VARIANT[order.status] ?? "secondary"}>{order.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
