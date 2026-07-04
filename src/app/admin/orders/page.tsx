import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { formatPriceINR } from "@/lib/product-format";
import { Prisma } from "@/generated/prisma/client";

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string }>;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  PAID: "default",
  PROCESSING: "default",
  SHIPPED: "default",
  DELIVERED: "default",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
};

const STATUSES = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const { q, status } = await searchParams;

  const where: Prisma.OrderWhereInput = {};
  if (q) where.orderNumber = { contains: q, mode: "insensitive" };
  if (status) where.status = status as Prisma.OrderWhereInput["status"];

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { items: true, user: { select: { email: true } } },
  });

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Orders</h1>

      <form className="mt-4 flex flex-wrap gap-2">
        <Input name="q" placeholder="Search order number…" defaultValue={q} className="max-w-xs" />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md border border-input px-3 py-2 text-sm hover:bg-accent"
        >
          Filter
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Order</th>
              <th className="p-3 font-medium">Customer</th>
              <th className="p-3 font-medium">Items</th>
              <th className="p-3 font-medium">Total</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const shippingAddress = order.shippingAddress as Record<string, string>;
              return (
                <tr key={order.id} className="border-t border-border">
                  <td className="p-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-medium text-primary hover:underline">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {order.user?.email ?? shippingAddress.email ?? "Guest"}
                  </td>
                  <td className="p-3 text-muted-foreground">{order.items.length}</td>
                  <td className="p-3 font-medium">{formatPriceINR(order.total)}</td>
                  <td className="p-3">
                    <Badge variant={STATUS_VARIANT[order.status] ?? "secondary"}>{order.status}</Badge>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(order.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
