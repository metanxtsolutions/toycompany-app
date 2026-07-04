import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatPriceINR } from "@/lib/product-format";

export const metadata: Metadata = {
  title: "Order Details",
};

interface PageProps {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ email?: string }>;
}

const TIMELINE_STEPS = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

async function getOrder(orderNumber: string) {
  return prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      address: true,
      coupon: { select: { code: true } },
    },
  });
}

export default async function OrderDetailPage({ params, searchParams }: PageProps) {
  const { orderNumber } = await params;
  const { email } = await searchParams;

  const order = await getOrder(orderNumber);
  if (!order) notFound();

  const session = await auth();
  const shippingAddress = order.shippingAddress as Record<string, string>;

  const isOwner = session?.user?.id && order.userId === session.user.id;
  const emailMatches =
    email && shippingAddress.email?.toLowerCase() === email.toLowerCase();

  if (!isOwner && !emailMatches) {
    notFound();
  }

  const isTerminalNegative = order.status === "CANCELLED" || order.status === "REFUNDED";
  const currentStepIndex = TIMELINE_STEPS.indexOf(
    order.status as (typeof TIMELINE_STEPS)[number],
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Order {order.orderNumber}
        </h1>
        <span className="text-sm text-muted-foreground">
          Placed{" "}
          {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(order.createdAt)}
        </span>
      </div>

      {isTerminalNegative ? (
        <Card className="mt-6 border-destructive/40">
          <CardContent className="p-5">
            <p className="font-medium text-destructive">
              This order was {order.status === "CANCELLED" ? "cancelled" : "refunded"}.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 flex items-center justify-between">
          {TIMELINE_STEPS.map((step, index) => (
            <div key={step} className="flex flex-1 flex-col items-center last:flex-none">
              <div className="flex w-full items-center">
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                    index <= currentStepIndex
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index < currentStepIndex ? <Check className="size-4" /> : index + 1}
                </div>
                {index < TIMELINE_STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 ${
                      index < currentStepIndex ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
              <span className="mt-2 text-center text-xs capitalize text-muted-foreground">
                {step.toLowerCase()}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardContent className="space-y-4 p-5">
            <h2 className="font-heading font-semibold">Items</h2>
            <ul className="space-y-3">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.productName}{" "}
                    <span className="text-muted-foreground">× {item.quantity}</span>
                  </span>
                  <span className="font-medium">{formatPriceINR(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-1 p-5 text-sm">
              <h2 className="font-heading mb-2 font-semibold">Summary</h2>
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
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-1 p-5 text-sm">
              <h2 className="font-heading mb-2 font-semibold">Shipping to</h2>
              <p className="font-medium">{shippingAddress.fullName}</p>
              <p className="text-muted-foreground">
                {shippingAddress.line1}
                {shippingAddress.line2 ? `, ${shippingAddress.line2}` : ""}, {shippingAddress.city},{" "}
                {shippingAddress.state} {shippingAddress.postalCode}
              </p>
              <p className="text-muted-foreground">{shippingAddress.phone}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        <Link href="/" className="font-medium text-primary">
          Continue shopping
        </Link>
      </p>
    </div>
  );
}
