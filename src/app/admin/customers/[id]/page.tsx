import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canBlockCustomers } from "@/lib/admin-permissions";
import { formatPriceINR } from "@/lib/product-format";
import { BlockCustomerButton } from "@/components/admin/block-customer-button";

interface PageProps {
  params: Promise<{ id: string }>;
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

export default async function AdminCustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      orders: { orderBy: { createdAt: "desc" } },
      addresses: true,
    },
  });
  if (!customer) notFound();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">{customer.name ?? "Customer"}</h1>
          <p className="text-sm text-muted-foreground">{customer.email}</p>
        </div>
        {canBlockCustomers(session?.user?.role) && (
          <BlockCustomerButton userId={customer.id} isBlocked={customer.isBlocked} />
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardContent className="p-5">
            <h2 className="font-heading mb-3 font-semibold">Order history</h2>
            {customer.orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {customer.orders.map((order) => (
                  <li key={order.id} className="flex items-center justify-between border-b border-border pb-2">
                    <Link href={`/admin/orders/${order.id}`} className="text-primary hover:underline">
                      {order.orderNumber}
                    </Link>
                    <span className="text-muted-foreground">
                      {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(order.createdAt)}
                    </span>
                    <span className="font-medium">{formatPriceINR(order.total)}</span>
                    <Badge variant={STATUS_VARIANT[order.status] ?? "secondary"}>{order.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardContent className="space-y-3 p-5">
            <h2 className="font-heading font-semibold">Addresses</h2>
            {customer.addresses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No saved addresses.</p>
            ) : (
              customer.addresses.map((address) => (
                <div key={address.id} className="text-sm">
                  <p className="font-medium">{address.fullName}</p>
                  <p className="text-muted-foreground">
                    {address.line1}, {address.city}, {address.state} {address.postalCode}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
