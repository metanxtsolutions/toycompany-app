"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { registerSchema } from "@/lib/validation/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export type RegisterResult =
  | { success: true }
  | { success: false; error: string };

export async function registerUser(
  input: unknown,
): Promise<RegisterResult> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { success: withinLimit } = checkRateLimit(`register:${ip}`, 5, 60_000);
  if (!withinLimit) {
    return { success: false, error: "Too many attempts. Please try again in a minute." };
  }

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Please check your details and try again." };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: { name, email, passwordHash },
  });

  return { success: true };
}

const updateProfileSchema = z.object({
  name: z.string().min(2).max(80),
});

export async function updateProfile(input: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Not authenticated." };
  }

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Please enter a valid name." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name },
  });

  revalidatePath("/account/profile");
  return { success: true as const };
}
