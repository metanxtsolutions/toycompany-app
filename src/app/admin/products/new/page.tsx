import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdminPermission } from "@/lib/require-admin-page";
import { canManageCatalog } from "@/lib/admin-permissions";

export default async function NewProductPage() {
  await requireAdminPermission(canManageCatalog);
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Add product</h1>
      <div className="mt-6">
        <ProductForm categories={categories} />
      </div>
    </div>
  );
}
