import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { formatPriceINR } from "@/lib/product-format";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteProduct } from "@/server/actions/admin/products";
import { requireAdminPermission } from "@/lib/require-admin-page";
import { canManageCatalog } from "@/lib/admin-permissions";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  DRAFT: "secondary",
  ACTIVE: "default",
  ARCHIVED: "outline",
};

export default async function AdminProductsPage({ searchParams }: PageProps) {
  await requireAdminPermission(canManageCatalog);
  const { q } = await searchParams;

  const products = await prisma.product.findMany({
    where: q
      ? { name: { contains: q, mode: "insensitive" } }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: { category: { select: { name: true } }, variants: { select: { stockQuantity: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Products</h1>
        <Button nativeButton={false} render={<Link href="/admin/products/new" />}>
          Add product
        </Button>
      </div>

      <form className="mt-4 max-w-sm">
        <Input name="q" placeholder="Search products…" defaultValue={q} />
      </form>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Category</th>
              <th className="p-3 font-medium">Price</th>
              <th className="p-3 font-medium">Stock</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const totalStock = product.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
              return (
                <tr key={product.id} className="border-t border-border">
                  <td className="p-3 font-medium">{product.name}</td>
                  <td className="p-3 text-muted-foreground">{product.category.name}</td>
                  <td className="p-3 text-muted-foreground">{formatPriceINR(product.basePrice)}</td>
                  <td className="p-3 text-muted-foreground">{totalStock}</td>
                  <td className="p-3">
                    <Badge variant={STATUS_VARIANT[product.status]}>{product.status}</Badge>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        nativeButton={false}
                        render={<Link href={`/admin/products/${product.id}/edit`} />}
                      >
                        Edit
                      </Button>
                      <DeleteButton
                        onDelete={() => deleteProduct(product.id)}
                        confirmMessage={`Delete "${product.name}"? This can't be undone.`}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
