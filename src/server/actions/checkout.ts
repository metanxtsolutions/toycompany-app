"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { calculateOrderTotals, generateOrderNumber } from "@/lib/orders";
import { paymentProvider } from "@/lib/payments/razorpay";
import { applyCoupon } from "@/server/actions/cart";

const addressFieldsSchema = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().min(6).max(20),
  line1: z.string().min(3).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  postalCode: z.string().min(3).max(20),
  country: z.string().min(2).max(2).default("IN"),
});

const checkoutInputSchema = z.object({
  email: z.email(),
  addressId: z.string().optional(),
  address: addressFieldsSchema.optional(),
  saveAddress: z.boolean().optional(),
  couponCode: z.string().optional(),
});

export async function createOrder(input: unknown) {
  const parsed = checkoutInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Please check your details and try again." };
  }
  const { email, addressId, address, saveAddress, couponCode } = parsed.data;

  const session = await auth();
  const cart = await getCart();

  if (!cart || cart.items.length === 0) {
    return { success: false as const, error: "Your cart is empty." };
  }

  for (const item of cart.items) {
    if (!item.variant.isActive || item.variant.stockQuantity < item.quantity) {
      return {
        success: false as const,
        error: `${item.product.name} doesn't have enough stock. Please update your cart.`,
      };
    }
  }

  const subtotal = cart.items.reduce((sum, item) => {
    const price = item.variant.priceOverride ?? item.product.basePrice;
    return sum + price * item.quantity;
  }, 0);

  let coupon: Awaited<ReturnType<typeof applyCoupon>> | null = null;
  if (couponCode) {
    const result = await applyCoupon(couponCode);
    if (!result.valid) {
      return { success: false as const, error: result.error };
    }
    if (result.minOrderValue && subtotal < result.minOrderValue) {
      return { success: false as const, error: "Cart no longer meets the coupon's minimum order value." };
    }
    coupon = result;
  }

  const { discount, shipping, total } = calculateOrderTotals(
    subtotal,
    coupon?.valid ? coupon : null,
  );

  let shippingAddressSnapshot: Record<string, string | null>;
  let resolvedAddressId: string | null = null;

  if (addressId) {
    if (!session?.user?.id) {
      return { success: false as const, error: "Sign in to use a saved address." };
    }
    const savedAddress = await prisma.address.findFirst({
      where: { id: addressId, userId: session.user.id },
    });
    if (!savedAddress) {
      return { success: false as const, error: "Address not found." };
    }
    resolvedAddressId = savedAddress.id;
    shippingAddressSnapshot = {
      fullName: savedAddress.fullName,
      phone: savedAddress.phone,
      line1: savedAddress.line1,
      line2: savedAddress.line2,
      city: savedAddress.city,
      state: savedAddress.state,
      postalCode: savedAddress.postalCode,
      country: savedAddress.country,
      email,
    };
  } else if (address) {
    shippingAddressSnapshot = { ...address, email };
    if (saveAddress && session?.user?.id) {
      const created = await prisma.address.create({
        data: { ...address, userId: session.user.id },
      });
      resolvedAddressId = created.id;
    }
  } else {
    return { success: false as const, error: "Please provide a shipping address." };
  }

  const orderNumber = generateOrderNumber();

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: session?.user?.id ?? null,
      status: "PENDING",
      subtotal,
      discount,
      shipping,
      total,
      currency: "INR",
      couponId: coupon?.valid ? coupon.id : null,
      addressId: resolvedAddressId,
      shippingAddress: shippingAddressSnapshot,
      items: {
        create: cart.items.map((item) => ({
          variantId: item.variantId,
          productName: item.product.name,
          sku: item.variant.sku,
          price: item.variant.priceOverride ?? item.product.basePrice,
          quantity: item.quantity,
        })),
      },
    },
  });

  let providerOrder;
  try {
    providerOrder = await paymentProvider.createOrder({
      amount: total,
      currency: "INR",
      receipt: order.orderNumber,
    });
  } catch (err) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });
    const message = err instanceof Error ? err.message : "Payment gateway error.";
    return { success: false as const, error: message };
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentProvider: "razorpay",
      paymentRef: providerOrder.providerOrderId,
    },
  });

  return {
    success: true as const,
    orderNumber: order.orderNumber,
    providerOrderId: providerOrder.providerOrderId,
    amount: providerOrder.amount,
    currency: providerOrder.currency,
    keyId: providerOrder.keyId,
    customerName: address?.fullName ?? session?.user?.name ?? "",
    customerEmail: email,
    customerPhone: address?.phone ?? "",
  };
}

const verifyInputSchema = z.object({
  orderNumber: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export async function verifyPayment(input: unknown) {
  const parsed = verifyInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Invalid payment response." };
  }
  const { orderNumber, razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;

  const order = await prisma.order.findUnique({ where: { orderNumber } });
  if (!order || order.paymentRef !== razorpayOrderId) {
    return { success: false as const, error: "Order not found." };
  }
  if (order.status === "PAID") {
    return { success: true as const, orderNumber: order.orderNumber };
  }

  const isValid = paymentProvider.verifySignature({
    providerOrderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });

  if (!isValid) {
    return { success: false as const, error: "Payment verification failed." };
  }

  const items = await prisma.orderItem.findMany({ where: { orderId: order.id } });

  for (const item of items) {
    await prisma.productVariant.updateMany({
      where: { id: item.variantId, stockQuantity: { gte: item.quantity } },
      data: { stockQuantity: { decrement: item.quantity } },
    });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { status: "PAID", paymentRef: razorpayPaymentId },
  });

  if (order.couponId) {
    await prisma.coupon.update({
      where: { id: order.couponId },
      data: { usedCount: { increment: 1 } },
    });
  }

  const cart = await getCart();
  if (cart) {
    await prisma.cart.delete({ where: { id: cart.id } });
  }

  return { success: true as const, orderNumber: order.orderNumber };
}

export async function markOrderFailed(orderNumber: string) {
  await prisma.order.updateMany({
    where: { orderNumber, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
  return { success: true as const };
}
