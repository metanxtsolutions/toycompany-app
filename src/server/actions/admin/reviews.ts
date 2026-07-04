"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { canModerateReviews, canReplyToReviews } from "@/lib/admin-permissions";
import { getSessionIfAllowed } from "@/server/actions/admin/guard";

async function recomputeProductRating(productId: string) {
  const aggregate = await prisma.review.aggregate({
    where: { productId, status: "APPROVED" },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.product.update({
    where: { id: productId },
    data: { avgRating: aggregate._avg.rating ?? 0, reviewCount: aggregate._count },
  });
}

export async function moderateReview(reviewId: string, status: "APPROVED" | "REJECTED") {
  const session = await getSessionIfAllowed(canModerateReviews);
  if (!session) return { success: false as const, error: "Not authorized." };

  const parsed = z.enum(["APPROVED", "REJECTED"]).safeParse(status);
  if (!parsed.success) return { success: false as const, error: "Invalid status." };

  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { status: parsed.data },
  });

  await recomputeProductRating(review.productId);

  revalidatePath("/admin/reviews");
  return { success: true as const };
}

export async function replyToReview(reviewId: string, reply: string) {
  const session = await getSessionIfAllowed(canReplyToReviews);
  if (!session) return { success: false as const, error: "Not authorized." };

  const trimmed = reply.trim();
  if (trimmed.length < 1 || trimmed.length > 1000) {
    return { success: false as const, error: "Reply must be between 1 and 1000 characters." };
  }

  await prisma.review.update({ where: { id: reviewId }, data: { adminReply: trimmed } });
  revalidatePath("/admin/reviews");
  return { success: true as const };
}
