import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { StockEditor } from "@/components/admin/stock-editor";
import { requireAdminPermission } from "@/lib/require-admin-page";
import { canManageCatalog } from "@/lib/admin-permissions";

export default async function AdminInventoryPage() {
  await requireAdminPermission(canManageCatalog);
  const variants = await prisma.productVariant.findMany({
    orderBy: [{ stockQuantity: "asc" }],
    include: { product: { select: { name: true } } },
  });

  const lowStockCount = variants.filter((v) => v.stockQuantity <= v.lowStockThreshold).length;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Inventory</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {lowStockCount} variant{lowStockCount === 1 ? "" : "s"} at or below its low-stock threshold.
      </p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Product</th>
              <th className="p-3 font-medium">SKU</th>
              <th className="p-3 font-medium">Attributes</th>
              <th className="p-3 font-medium">Threshold</th>
              <th className="p-3 font-medium">Stock</th>
              <th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((variant) => {
              const isLow = variant.stockQuantity <= variant.lowStockThreshold;
              return (
                <tr key={variant.id} className={`border-t border-border ${isLow ? "bg-destructive/5" : ""}`}>
                  <td className="p-3 font-medium">{variant.product.name}</td>
                  <td className="p-3 text-muted-foreground">{variant.sku}</td>
                  <td className="p-3 text-muted-foreground">
                    {Object.entries(variant.attributes as Record<string, string>)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(", ")}
                  </td>
                  <td className="p-3 text-muted-foreground">{variant.lowStockThreshold}</td>
                  <td className="p-3">
                    <StockEditor variantId={variant.id} initialQuantity={variant.stockQuantity} />
                  </td>
                  <td className="p-3">
                    {isLow ? (
                      <Badge variant="destructive">Low stock</Badge>
                    ) : (
                      <Badge variant="default">OK</Badge>
                    )}
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
