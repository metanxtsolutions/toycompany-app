"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function toggleWishlist(productId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Sign in to save items to your wishlist." };
  }
  const userId = session.user.id;

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    revalidatePath("/account/wishlist");
    return { success: true as const, inWishlist: false };
  }

  await prisma.wishlistItem.create({ data: { userId, productId } });
  revalidatePath("/account/wishlist");
  return { success: true as const, inWishlist: true };
}

export async function getWishlistProductIds() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    select: { productId: true },
  });
  return items.map((i) => i.productId);
}
