import { prisma } from "@/lib/prisma";
import { CategoryForm } from "@/components/admin/category-form";
import { requireAdminPermission } from "@/lib/require-admin-page";
import { canManageCatalog } from "@/lib/admin-permissions";

export default async function NewCategoryPage() {
  await requireAdminPermission(canManageCatalog);
  const parentOptions = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Add category</h1>
      <div className="mt-6">
        <CategoryForm parentOptions={parentOptions} />
      </div>
    </div>
  );
}
