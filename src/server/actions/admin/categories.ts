"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { canManageCatalog } from "@/lib/admin-permissions";
import { getSessionIfAllowed } from "@/server/actions/admin/guard";

const categorySchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(160).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only."),
  description: z.string().max(2000).optional(),
  image: z.string().url().optional().or(z.literal("")),
  parentId: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  metaTitle: z.string().max(160).optional(),
  metaDescription: z.string().max(300).optional(),
  metaKeywords: z.string().max(300).optional(),
  ogImage: z.string().url().optional().or(z.literal("")),
});

export async function upsertCategory(id: string | null, input: unknown) {
  const session = await getSessionIfAllowed(canManageCatalog);
  if (!session) return { success: false as const, error: "Not authorized." };

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Please check the category fields." };
  }
  const data = {
    ...parsed.data,
    image: parsed.data.image || null,
    ogImage: parsed.data.ogImage || null,
    parentId: parsed.data.parentId || null,
  };

  const existingSlug = await prisma.category.findFirst({
    where: { slug: data.slug, NOT: id ? { id } : undefined },
  });
  if (existingSlug) {
    return { success: false as const, error: "That slug is already in use." };
  }

  if (id) {
    await prisma.category.update({ where: { id }, data });
  } else {
    await prisma.category.create({ data });
  }

  revalidatePath("/admin/categories");
  return { success: true as const };
}

export async function deleteCategory(id: string) {
  const session = await getSessionIfAllowed(canManageCatalog);
  if (!session) return { success: false as const, error: "Not authorized." };

  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    return {
      success: false as const,
      error: `This category still has ${productCount} product(s). Move or delete them first.`,
    };
  }

  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  return { success: true as const };
}
