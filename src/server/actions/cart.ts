"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getOrCreateCart, CART_COOKIE } from "@/lib/cart";

const addToCartSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
});

export async function addToCart(input: unknown) {
  const parsed = addToCartSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Invalid item." };
  }
  const { variantId, quantity } = parsed.data;

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
  });
  if (!variant || !variant.isActive) {
    return { success: false as const, error: "This item is no longer available." };
  }

  const cart = await getOrCreateCart();

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
  });

  const nextQuantity = Math.min(20, (existing?.quantity ?? 0) + quantity);

  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    update: { quantity: nextQuantity },
    create: {
      cartId: cart.id,
      productId: variant.productId,
      variantId,
      quantity: nextQuantity,
    },
  });

  revalidatePath("/cart");
  return { success: true as const };
}

const updateItemSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().min(0).max(20),
});

export async function updateCartItem(input: unknown) {
  const parsed = updateItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Invalid update." };
  }
  const { itemId, quantity } = parsed.data;

  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id: itemId } }).catch(() => null);
  } else {
    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  }

  revalidatePath("/cart");
  return { success: true as const };
}

export async function removeCartItem(itemId: string) {
  await prisma.cartItem.delete({ where: { id: itemId } }).catch(() => null);
  revalidatePath("/cart");
  return { success: true as const };
}

export async function applyCoupon(code: string) {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });

  if (!coupon || !coupon.isActive) {
    return { valid: false as const, error: "Coupon not found." };
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return { valid: false as const, error: "This coupon has expired." };
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false as const, error: "This coupon has reached its usage limit." };
  }

  return {
    valid: true as const,
    id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    minOrderValue: coupon.minOrderValue,
  };
}

export async function mergeGuestCart() {
  const session = await auth();
  if (!session?.user?.id) return;

  const cookieStore = await cookies();
  const guestToken = cookieStore.get(CART_COOKIE)?.value;
  if (!guestToken) return;

  const guestCart = await prisma.cart.findUnique({
    where: { guestToken },
    include: { items: true },
  });
  if (!guestCart) {
    cookieStore.delete(CART_COOKIE);
    return;
  }

  const userCart = await prisma.cart.findFirst({ where: { userId: session.user.id } });

  if (!userCart) {
    await prisma.cart.update({
      where: { id: guestCart.id },
      data: { userId: session.user.id, guestToken: null },
    });
    cookieStore.delete(CART_COOKIE);
    return;
  }

  for (const item of guestCart.items) {
    const existing = await prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: userCart.id, variantId: item.variantId } },
    });
    await prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId: userCart.id, variantId: item.variantId } },
      update: { quantity: Math.min(20, (existing?.quantity ?? 0) + item.quantity) },
      create: {
        cartId: userCart.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      },
    });
  }

  await prisma.cart.delete({ where: { id: guestCart.id } });
  cookieStore.delete(CART_COOKIE);
  revalidatePath("/cart");
}
