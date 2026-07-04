"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { canManageBanners } from "@/lib/admin-permissions";
import { getSessionIfAllowed } from "@/server/actions/admin/guard";

const bannerSchema = z.object({
  title: z.string().min(2).max(160),
  imageUrl: z.string().url(),
  linkUrl: z.string().max(300).optional(),
  placement: z.enum(["HOME_HERO", "HOME_STRIP", "CATEGORY"]),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  isActive: z.boolean(),
  sortOrder: z.number().int().default(0),
});

export async function upsertBanner(id: string | null, input: unknown) {
  const session = await getSessionIfAllowed(canManageBanners);
  if (!session) return { success: false as const, error: "Not authorized." };

  const parsed = bannerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Please check the banner fields." };
  }
  const data = parsed.data;

  const payload = {
    title: data.title,
    imageUrl: data.imageUrl,
    linkUrl: data.linkUrl || null,
    placement: data.placement,
    startsAt: data.startsAt ? new Date(data.startsAt) : null,
    endsAt: data.endsAt ? new Date(data.endsAt) : null,
    isActive: data.isActive,
    sortOrder: data.sortOrder,
  };

  if (id) {
    await prisma.banner.update({ where: { id }, data: payload });
  } else {
    await prisma.banner.create({ data: payload });
  }

  revalidatePath("/admin/banners");
  return { success: true as const };
}

export async function deleteBanner(id: string) {
  const session = await getSessionIfAllowed(canManageBanners);
  if (!session) return { success: false as const, error: "Not authorized." };

  await prisma.banner.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/banners");
  return { success: true as const };
}
