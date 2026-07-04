"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { canManageContent } from "@/lib/admin-permissions";
import { getSessionIfAllowed } from "@/server/actions/admin/guard";
import { markdownToSafeHtml } from "@/lib/markdown";

const blogPostSchema = z.object({
  title: z.string().min(2).max(200),
  slug: z.string().min(2).max(220).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only."),
  excerpt: z.string().max(300).optional(),
  contentMarkdown: z.string().min(1).max(20000),
  coverImage: z.string().url().optional().or(z.literal("")),
  categoryTag: z.string().max(60).optional(),
  isPublished: z.boolean(),
  metaTitle: z.string().max(160).optional(),
  metaDescription: z.string().max(300).optional(),
  metaKeywords: z.string().max(300).optional(),
  ogImage: z.string().url().optional().or(z.literal("")),
});

export async function upsertBlogPost(id: string | null, input: unknown) {
  const session = await getSessionIfAllowed(canManageContent);
  if (!session) return { success: false as const, error: "Not authorized." };

  const parsed = blogPostSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? "Please check the post fields.",
    };
  }
  const data = parsed.data;

  const existingSlug = await prisma.blogPost.findFirst({
    where: { slug: data.slug, NOT: id ? { id } : undefined },
  });
  if (existingSlug) {
    return { success: false as const, error: "That slug is already in use." };
  }

  const existing = id ? await prisma.blogPost.findUnique({ where: { id } }) : null;
  const publishedAt = data.isPublished ? (existing?.publishedAt ?? new Date()) : null;

  const payload = {
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt || null,
    contentMarkdown: data.contentMarkdown,
    contentHtml: markdownToSafeHtml(data.contentMarkdown),
    coverImage: data.coverImage || null,
    categoryTag: data.categoryTag || null,
    publishedAt,
    metaTitle: data.metaTitle || null,
    metaDescription: data.metaDescription || null,
    metaKeywords: data.metaKeywords || null,
    ogImage: data.ogImage || null,
  };

  if (id) {
    await prisma.blogPost.update({ where: { id }, data: payload });
  } else {
    await prisma.blogPost.create({ data: { ...payload, authorId: session.user.id } });
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  return { success: true as const };
}

export async function deleteBlogPost(id: string) {
  const session = await getSessionIfAllowed(canManageContent);
  if (!session) return { success: false as const, error: "Not authorized." };

  await prisma.blogPost.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  return { success: true as const };
}
