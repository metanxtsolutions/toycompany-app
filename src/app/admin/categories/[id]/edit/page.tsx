import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "@/components/admin/category-form";
import { requireAdminPermission } from "@/lib/require-admin-page";
import { canManageCatalog } from "@/lib/admin-permissions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: PageProps) {
  await requireAdminPermission(canManageCatalog);
  const { id } = await params;

  const [category, parentOptions] = await Promise.all([
    prisma.category.findUnique({ where: { id } }),
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!category) notFound();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Edit category</h1>
      <div className="mt-6">
        <CategoryForm initialData={category} parentOptions={parentOptions} />
      </div>
    </div>
  );
}
