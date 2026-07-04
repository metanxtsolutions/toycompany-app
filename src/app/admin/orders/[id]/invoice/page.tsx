import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPriceINR } from "@/lib/product-format";
import { PrintButton } from "@/components/admin/print-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderInvoicePage({ params }: PageProps) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, coupon: { select: { code: true } } },
  });
  if (!order) notFound();

  const shippingAddress = order.shippingAddress as Record<string, string>;

  return (
    <div className="mx-auto max-w-2xl p-8">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <h1 className="font-heading text-xl font-bold">Invoice preview</h1>
        <PrintButton />
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-primary">Toy Company</h2>
          <p className="text-sm text-muted-foreground">toycompany.store</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold">Invoice</p>
          <p className="text-muted-foreground">{order.orderNumber}</p>
          <p className="text-muted-foreground">
            {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(order.createdAt)}
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-semibold">Bill to</p>
          <p>{shippingAddress.fullName}</p>
          <p className="text-muted-foreground">
            {shippingAddress.line1}
            {shippingAddress.line2 ? `, ${shippingAddress.line2}` : ""}
          </p>
          <p className="text-muted-foreground">
            {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
          </p>
          <p className="text-muted-foreground">{shippingAddress.email}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold">Status</p>
          <p className="text-muted-foreground">{order.status}</p>
        </div>
      </div>

      <table className="mt-8 w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-2 font-medium">Item</th>
            <th className="py-2 font-medium">SKU</th>
            <th className="py-2 text-right font-medium">Qty</th>
            <th className="py-2 text-right font-medium">Price</th>
            <th className="py-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="border-b border-border">
              <td className="py-2">{item.productName}</td>
              <td className="py-2 text-muted-foreground">{item.sku}</td>
              <td className="py-2 text-right">{item.quantity}</td>
              <td className="py-2 text-right">{formatPriceINR(item.price)}</td>
              <td className="py-2 text-right">{formatPriceINR(item.price * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatPriceINR(order.subtotal)}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Discount{order.coupon ? ` (${order.coupon.code})` : ""}</span>
            <span>-{formatPriceINR(order.discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span>{order.shipping === 0 ? "Free" : formatPriceINR(order.shipping)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-1 font-semibold">
          <span>Total</span>
          <span>{formatPriceINR(order.total)}</span>
        </div>
      </div>
    </div>
  );
}
