"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { canManageCatalog } from "@/lib/admin-permissions";
import { getSessionIfAllowed } from "@/server/actions/admin/guard";

const variantSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1).max(60),
  attributes: z.record(z.string(), z.string()),
  priceOverride: z.number().positive().optional(),
  stockQuantity: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0),
  isActive: z.boolean(),
});

const imageSchema = z.object({
  url: z.string().url(),
  altText: z.string().max(200).optional(),
});

const productSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(220).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only."),
  description: z.string().min(1).max(5000),
  brand: z.string().max(120).optional(),
  categoryId: z.string().min(1),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  basePrice: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  metaTitle: z.string().max(160).optional(),
  metaDescription: z.string().max(300).optional(),
  metaKeywords: z.string().max(300).optional(),
  ogImage: z.string().url().optional().or(z.literal("")),
  images: z.array(imageSchema).min(1),
  variants: z.array(variantSchema).min(1),
});

export async function upsertProduct(id: string | null, input: unknown) {
  const session = await getSessionIfAllowed(canManageCatalog);
  if (!session) return { success: false as const, error: "Not authorized." };

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? "Please check the product fields.",
    };
  }
  const data = parsed.data;

  const existingSlug = await prisma.product.findFirst({
    where: { slug: data.slug, NOT: id ? { id } : undefined },
  });
  if (existingSlug) {
    return { success: false as const, error: "That slug is already in use." };
  }

  const skus = data.variants.map((v) => v.sku);
  const duplicateSku = await prisma.productVariant.findFirst({
    where: { sku: { in: skus }, productId: id ? { not: id } : undefined },
  });
  if (duplicateSku) {
    return { success: false as const, error: `SKU "${duplicateSku.sku}" is already in use.` };
  }

  const basePayload = {
    name: data.name,
    slug: data.slug,
    description: data.description,
    brand: data.brand || null,
    categoryId: data.categoryId,
    status: data.status,
    basePrice: Math.round(data.basePrice * 100),
    compareAtPrice: data.compareAtPrice ? Math.round(data.compareAtPrice * 100) : null,
    metaTitle: data.metaTitle || null,
    metaDescription: data.metaDescription || null,
    metaKeywords: data.metaKeywords || null,
    ogImage: data.ogImage || null,
  };

  try {
    if (id) {
      await prisma.$transaction(async (tx) => {
        await tx.product.update({ where: { id }, data: basePayload });

        await tx.productImage.deleteMany({ where: { productId: id } });
        await tx.productImage.createMany({
          data: data.images.map((img, index) => ({
            productId: id,
            url: img.url,
            altText: img.altText || null,
            sortOrder: index,
          })),
        });

        const existingVariants = await tx.productVariant.findMany({ where: { productId: id } });
        const submittedIds = new Set(data.variants.filter((v) => v.id).map((v) => v.id));
        const toDelete = existingVariants.filter((v) => !submittedIds.has(v.id));
        if (toDelete.length > 0) {
          await tx.productVariant.deleteMany({ where: { id: { in: toDelete.map((v) => v.id) } } });
        }

        for (const variant of data.variants) {
          const variantData = {
            sku: variant.sku,
            attributes: variant.attributes,
            priceOverride: variant.priceOverride ? Math.round(variant.priceOverride * 100) : null,
            stockQuantity: variant.stockQuantity,
            lowStockThreshold: variant.lowStockThreshold,
            isActive: variant.isActive,
          };
          if (variant.id) {
            await tx.productVariant.update({ where: { id: variant.id }, data: variantData });
          } else {
            await tx.productVariant.create({ data: { ...variantData, productId: id } });
          }
        }
      });
    } else {
      await prisma.product.create({
        data: {
          ...basePayload,
          images: {
            create: data.images.map((img, index) => ({
              url: img.url,
              altText: img.altText || null,
              sortOrder: index,
            })),
          },
          variants: {
            create: data.variants.map((variant) => ({
              sku: variant.sku,
              attributes: variant.attributes,
              priceOverride: variant.priceOverride ? Math.round(variant.priceOverride * 100) : null,
              stockQuantity: variant.stockQuantity,
              lowStockThreshold: variant.lowStockThreshold,
              isActive: variant.isActive,
            })),
          },
        },
      });
    }
  } catch {
    return { success: false as const, error: "Something went wrong saving the product." };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/products/${data.slug}`);
  return { success: true as const };
}

export async function deleteProduct(id: string) {
  const session = await getSessionIfAllowed(canManageCatalog);
  if (!session) return { success: false as const, error: "Not authorized." };

  let deleted;
  try {
    deleted = await prisma.product.delete({ where: { id } });
  } catch {
    return {
      success: false as const,
      error: "This product has existing orders and can't be deleted. Try archiving it instead.",
    };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/products/${deleted.slug}`);
  return { success: true as const };
}

export async function updateVariantStock(variantId: string, quantity: number) {
  const session = await getSessionIfAllowed(canManageCatalog);
  if (!session) return { success: false as const, error: "Not authorized." };

  if (!Number.isInteger(quantity) || quantity < 0) {
    return { success: false as const, error: "Enter a valid stock quantity." };
  }

  await prisma.productVariant.update({ where: { id: variantId }, data: { stockQuantity: quantity } });
  revalidatePath("/admin/inventory");
  return { success: true as const };
}
