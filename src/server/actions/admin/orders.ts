"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { canUpdateOrderStatus, canRefund } from "@/lib/admin-permissions";
import { getSessionIfAllowed } from "@/server/actions/admin/guard";
import { paymentProvider } from "@/lib/payments/razorpay";

const statusSchema = z.enum([
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
]);

export async function updateOrderStatus(orderId: string, status: unknown) {
  const session = await getSessionIfAllowed(canUpdateOrderStatus);
  if (!session) return { success: false as const, error: "Not authorized." };

  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) {
    return { success: false as const, error: "Invalid status." };
  }

  await prisma.order.update({ where: { id: orderId }, data: { status: parsed.data } });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true as const };
}

export async function refundOrder(orderId: string) {
  const session = await getSessionIfAllowed(canRefund);
  if (!session) return { success: false as const, error: "Not authorized." };

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { success: false as const, error: "Order not found." };
  if (order.status === "REFUNDED") {
    return { success: false as const, error: "This order has already been refunded." };
  }
  if (!order.paymentRef || order.paymentProvider !== "razorpay") {
    return { success: false as const, error: "This order has no payment to refund." };
  }

  try {
    await paymentProvider.refund(order.paymentRef, order.total);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Refund failed.";
    return { success: false as const, error: message };
  }

  await prisma.order.update({ where: { id: orderId }, data: { status: "REFUNDED" } });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true as const };
}
