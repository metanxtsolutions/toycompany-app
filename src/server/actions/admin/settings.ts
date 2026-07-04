"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { canManageContent } from "@/lib/admin-permissions";
import { getSessionIfAllowed } from "@/server/actions/admin/guard";
import { ROBOTS_TXT_KEY } from "@/lib/site-settings";

export async function updateRobotsTxt(content: unknown) {
  const session = await getSessionIfAllowed(canManageContent);
  if (!session) return { success: false as const, error: "Not authorized." };

  const parsed = z.string().max(5000).safeParse(content);
  if (!parsed.success) {
    return { success: false as const, error: "robots.txt content is too long." };
  }

  await prisma.siteSetting.upsert({
    where: { key: ROBOTS_TXT_KEY },
    update: { value: parsed.data },
    create: { key: ROBOTS_TXT_KEY, value: parsed.data },
  });

  revalidatePath("/admin/settings");
  return { success: true as const };
}
