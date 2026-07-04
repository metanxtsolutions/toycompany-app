"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const addressSchema = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().min(6).max(20),
  line1: z.string().min(3).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  postalCode: z.string().min(3).max(20),
  country: z.string().min(2).max(2).default("IN"),
  isDefault: z.boolean().optional(),
});

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function createAddress(input: unknown) {
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Please check the address fields." };
  }
  const userId = await requireUserId();

  if (parsed.data.isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }

  const existingCount = await prisma.address.count({ where: { userId } });

  await prisma.address.create({
    data: { ...parsed.data, userId, isDefault: parsed.data.isDefault ?? existingCount === 0 },
  });

  revalidatePath("/account/addresses");
  return { success: true as const };
}

export async function updateAddress(id: string, input: unknown) {
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Please check the address fields." };
  }
  const userId = await requireUserId();

  const existing = await prisma.address.findFirst({ where: { id, userId } });
  if (!existing) {
    return { success: false as const, error: "Address not found." };
  }

  if (parsed.data.isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }

  await prisma.address.update({ where: { id }, data: parsed.data });

  revalidatePath("/account/addresses");
  return { success: true as const };
}

export async function deleteAddress(id: string) {
  const userId = await requireUserId();
  await prisma.address.deleteMany({ where: { id, userId } });
  revalidatePath("/account/addresses");
  return { success: true as const };
}

export async function setDefaultAddress(id: string) {
  const userId = await requireUserId();
  const existing = await prisma.address.findFirst({ where: { id, userId } });
  if (!existing) {
    return { success: false as const, error: "Address not found." };
  }

  await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  await prisma.address.update({ where: { id }, data: { isDefault: true } });

  revalidatePath("/account/addresses");
  return { success: true as const };
}
