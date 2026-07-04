"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { canBlockCustomers } from "@/lib/admin-permissions";
import { getSessionIfAllowed } from "@/server/actions/admin/guard";

export async function toggleBlockCustomer(userId: string) {
  const session = await getSessionIfAllowed(canBlockCustomers);
  if (!session) return { success: false as const, error: "Not authorized." };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { success: false as const, error: "Customer not found." };

  await prisma.user.update({ where: { id: userId }, data: { isBlocked: !user.isBlocked } });

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${userId}`);
  return { success: true as const, isBlocked: !user.isBlocked };
}
