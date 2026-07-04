"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { canManageCoupons } from "@/lib/admin-permissions";
import { getSessionIfAllowed } from "@/server/actions/admin/guard";

const couponSchema = z.object({
  code: z.string().min(3).max(30).regex(/^[A-Za-z0-9-]+$/, "Letters, numbers, and hyphens only."),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().positive(),
  minOrderValue: z.number().min(0).optional(),
  usageLimit: z.number().int().positive().optional(),
  expiresAt: z.string().optional(),
  isActive: z.boolean(),
});

export async function upsertCoupon(id: string | null, input: unknown) {
  const session = await getSessionIfAllowed(canManageCoupons);
  if (!session) return { success: false as const, error: "Not authorized." };

  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Please check the coupon fields." };
  }
  const data = parsed.data;
  const code = data.code.toUpperCase();

  const existing = await prisma.coupon.findFirst({ where: { code, NOT: id ? { id } : undefined } });
  if (existing) {
    return { success: false as const, error: "That coupon code is already in use." };
  }

  const payload = {
    code,
    type: data.type,
    value: data.type === "PERCENTAGE" ? Math.round(data.value) : Math.round(data.value * 100),
    minOrderValue: data.minOrderValue ? Math.round(data.minOrderValue * 100) : null,
    usageLimit: data.usageLimit ?? null,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    isActive: data.isActive,
  };

  if (id) {
    await prisma.coupon.update({ where: { id }, data: payload });
  } else {
    await prisma.coupon.create({ data: payload });
  }

  revalidatePath("/admin/coupons");
  return { success: true as const };
}

export async function deleteCoupon(id: string) {
  const session = await getSessionIfAllowed(canManageCoupons);
  if (!session) return { success: false as const, error: "Not authorized." };

  await prisma.coupon.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/coupons");
  return { success: true as const };
}
