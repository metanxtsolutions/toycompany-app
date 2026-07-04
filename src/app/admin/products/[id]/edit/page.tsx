import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdminPermission } from "@/lib/require-admin-page";
import { canManageCatalog } from "@/lib/admin-permissions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  await requireAdminPermission(canManageCatalog);
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
      },
    }),
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Edit product</h1>
      <div className="mt-6">
        <ProductForm initialData={product} categories={categories} />
      </div>
    </div>
  );
}
