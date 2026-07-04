import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canRefund } from "@/lib/admin-permissions";
import { formatPriceINR } from "@/lib/product-format";
import { OrderStatusPanel } from "@/components/admin/order-status-panel";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, user: { select: { name: true, email: true } }, coupon: { select: { code: true } } },
  });
  if (!order) notFound();

  const shippingAddress = order.shippingAddress as Record<string, string>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Order {order.orderNumber}</h1>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={`/admin/orders/${order.id}/invoice`} target="_blank" />}
        >
          View invoice
        </Button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-3 p-5">
              <h2 className="font-heading font-semibold">Items</h2>
              <ul className="space-y-2 text-sm">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span>
                      {item.productName} ({item.sku}) × {item.quantity}
                    </span>
                    <span className="font-medium">{formatPriceINR(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-1 border-t border-border pt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPriceINR(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount{order.coupon ? ` (${order.coupon.code})` : ""}</span>
                    <span>-{formatPriceINR(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{order.shipping === 0 ? "Free" : formatPriceINR(order.shipping)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatPriceINR(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-1 p-5 text-sm">
              <h2 className="font-heading mb-2 font-semibold">Customer</h2>
              <p>{order.user?.name ?? shippingAddress.fullName}</p>
              <p className="text-muted-foreground">{order.user?.email ?? shippingAddress.email}</p>
              {order.userId ? (
                <Link href={`/admin/customers/${order.userId}`} className="text-primary hover:underline">
                  View customer
                </Link>
              ) : (
                <p className="text-xs text-muted-foreground">Guest checkout</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-1 p-5 text-sm">
              <h2 className="font-heading mb-2 font-semibold">Shipping address</h2>
              <p>{shippingAddress.fullName}</p>
              <p className="text-muted-foreground">
                {shippingAddress.line1}
                {shippingAddress.line2 ? `, ${shippingAddress.line2}` : ""}, {shippingAddress.city},{" "}
                {shippingAddress.state} {shippingAddress.postalCode}
              </p>
              <p className="text-muted-foreground">{shippingAddress.phone}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardContent className="p-5">
            <h2 className="font-heading mb-3 font-semibold">Status</h2>
            <OrderStatusPanel
              orderId={order.id}
              currentStatus={order.status}
              canRefundOrder={canRefund(session?.user?.role)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
