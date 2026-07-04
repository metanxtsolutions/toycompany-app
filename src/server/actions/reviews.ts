"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const submitReviewSchema = z.object({
  productId: z.string().min(1),
  productSlug: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().min(10).max(2000),
});

export async function submitReview(input: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "You must be signed in to leave a review." };
  }

  const { success: withinLimit } = checkRateLimit(`review:${session.user.id}`, 3, 10 * 60_000);
  if (!withinLimit) {
    return { success: false as const, error: "You're submitting reviews too quickly. Please try again later." };
  }

  const parsed = submitReviewSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Please check your review and try again." };
  }

  const { productId, productSlug, rating, title, body } = parsed.data;

  await prisma.review.create({
    data: {
      productId,
      userId: session.user.id,
      rating,
      title,
      body,
    },
  });

  revalidatePath(`/products/${productSlug}`);
  return { success: true as const };
}
