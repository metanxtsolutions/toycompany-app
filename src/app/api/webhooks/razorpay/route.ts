import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";

interface RazorpayWebhookPayload {
  event: string;
  payload: {
    payment: {
      entity: {
        id: string;
        order_id: string;
      };
    };
  };
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const isValid = Razorpay.validateWebhookSignature(
    rawBody,
    signature,
    process.env.RAZORPAY_WEBHOOK_SECRET ?? "",
  );

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const body = JSON.parse(rawBody) as RazorpayWebhookPayload;
  const { event, payload } = body;
  const razorpayOrderId = payload.payment?.entity?.order_id;
  const razorpayPaymentId = payload.payment?.entity?.id;

  if (!razorpayOrderId) {
    return NextResponse.json({ received: true });
  }

  const order = await prisma.order.findFirst({
    where: { paymentRef: { in: [razorpayOrderId, razorpayPaymentId] } },
  });

  if (!order || order.status === "PAID" || order.status === "CANCELLED") {
    return NextResponse.json({ received: true });
  }

  if (event === "payment.captured") {
    await prisma.$transaction(async (tx) => {
      const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
      for (const item of items) {
        await tx.productVariant.updateMany({
          where: { id: item.variantId, stockQuantity: { gte: item.quantity } },
          data: { stockQuantity: { decrement: item.quantity } },
        });
      }
      await tx.order.update({
        where: { id: order.id },
        data: { status: "PAID", paymentRef: razorpayPaymentId },
      });
      if (order.couponId) {
        await tx.coupon.update({
          where: { id: order.couponId },
          data: { usedCount: { increment: 1 } },
        });
      }
    });
  } else if (event === "payment.failed") {
    await prisma.order.updateMany({
      where: { id: order.id, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
  }

  return NextResponse.json({ received: true });
}
