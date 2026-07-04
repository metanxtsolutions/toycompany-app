import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const CART_COOKIE = "cart_token";

const CART_ITEM_INCLUDE = {
  items: {
    include: {
      product: {
        select: {
          name: true,
          slug: true,
          basePrice: true,
          images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
        },
      },
      variant: true,
    },
  },
} as const;

/** Read-only cart lookup. Safe to call from Server Components. */
export async function getCart() {
  const session = await auth();
  const cookieStore = await cookies();

  if (session?.user?.id) {
    return prisma.cart.findFirst({
      where: { userId: session.user.id },
      include: CART_ITEM_INCLUDE,
    });
  }

  const guestToken = cookieStore.get(CART_COOKIE)?.value;
  if (!guestToken) return null;

  return prisma.cart.findUnique({
    where: { guestToken },
    include: CART_ITEM_INCLUDE,
  });
}

/** Creates a cart (and sets the guest cookie) if none exists. Only call from Server Actions / Route Handlers. */
export async function getOrCreateCart() {
  const session = await auth();
  const cookieStore = await cookies();

  if (session?.user?.id) {
    const existing = await prisma.cart.findFirst({
      where: { userId: session.user.id },
      include: CART_ITEM_INCLUDE,
    });
    if (existing) return existing;
    return prisma.cart.create({
      data: { userId: session.user.id },
      include: CART_ITEM_INCLUDE,
    });
  }

  const guestToken = cookieStore.get(CART_COOKIE)?.value;
  if (guestToken) {
    const existing = await prisma.cart.findUnique({
      where: { guestToken },
      include: CART_ITEM_INCLUDE,
    });
    if (existing) return existing;
  }

  const newToken = crypto.randomUUID();
  cookieStore.set(CART_COOKIE, newToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return prisma.cart.create({
    data: { guestToken: newToken },
    include: CART_ITEM_INCLUDE,
  });
}

export type CartWithItems = NonNullable<Awaited<ReturnType<typeof getCart>>>;

export function cartTotals(cart: CartWithItems | null) {
  if (!cart) return { subtotal: 0, itemCount: 0 };

  let subtotal = 0;
  let itemCount = 0;
  for (const item of cart.items) {
    const price = item.variant.priceOverride ?? item.product.basePrice;
    subtotal += price * item.quantity;
    itemCount += item.quantity;
  }
  return { subtotal, itemCount };
}
