import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/storefront/product-card";

export const metadata: Metadata = {
  title: "Your Wishlist",
};

export default async function AccountWishlistPage() {
  const session = await auth();
  const wishlistItems = await prisma.wishlistItem.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: {
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          variants: { where: { isActive: true } },
        },
      },
    },
  });

  if (wishlistItems.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Your wishlist is empty. Tap the heart on any product to save it here.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {wishlistItems.map((item) => (
        <ProductCard key={item.id} product={item.product} isWishlisted />
      ))}
    </div>
  );
}
