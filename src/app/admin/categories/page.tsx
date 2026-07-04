import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteCategory } from "@/server/actions/admin/categories";
import { requireAdminPermission } from "@/lib/require-admin-page";
import { canManageCatalog } from "@/lib/admin-permissions";

export default async function AdminCategoriesPage() {
  await requireAdminPermission(canManageCatalog);
  const categories = await prisma.category.findMany({
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
    include: { parent: { select: { name: true } }, _count: { select: { products: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Categories</h1>
        <Button nativeButton={false} render={<Link href="/admin/categories/new" />}>
          Add category
        </Button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Parent</th>
              <th className="p-3 font-medium">Products</th>
              <th className="p-3 font-medium">Sort</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-t border-border">
                <td className="p-3">
                  {category.parentId ? <span className="text-muted-foreground">— </span> : null}
                  {category.name}
                </td>
                <td className="p-3 text-muted-foreground">{category.parent?.name ?? "—"}</td>
                <td className="p-3 text-muted-foreground">{category._count.products}</td>
                <td className="p-3 text-muted-foreground">{category.sortOrder}</td>
                <td className="p-3">
                  <Badge variant={category.isActive ? "default" : "secondary"}>
                    {category.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/admin/categories/${category.id}/edit`} />}
                    >
                      Edit
                    </Button>
                    <DeleteButton
                      onDelete={deleteCategory.bind(null, category.id)}
                      confirmMessage={`Delete "${category.name}"? This can't be undone.`}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
