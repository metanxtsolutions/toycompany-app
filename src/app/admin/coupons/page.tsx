import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { formatPriceINR } from "@/lib/product-format";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteCoupon } from "@/server/actions/admin/coupons";
import { requireAdminPermission } from "@/lib/require-admin-page";
import { canManageCoupons } from "@/lib/admin-permissions";

export default async function AdminCouponsPage() {
  await requireAdminPermission(canManageCoupons);
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Coupons</h1>
        <Button nativeButton={false} render={<Link href="/admin/coupons/new" />}>
          Add coupon
        </Button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Code</th>
              <th className="p-3 font-medium">Discount</th>
              <th className="p-3 font-medium">Min order</th>
              <th className="p-3 font-medium">Usage</th>
              <th className="p-3 font-medium">Expires</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon.id} className="border-t border-border">
                <td className="p-3 font-medium">{coupon.code}</td>
                <td className="p-3 text-muted-foreground">
                  {coupon.type === "PERCENTAGE" ? `${coupon.value}%` : formatPriceINR(coupon.value)}
                </td>
                <td className="p-3 text-muted-foreground">
                  {coupon.minOrderValue ? formatPriceINR(coupon.minOrderValue) : "—"}
                </td>
                <td className="p-3 text-muted-foreground">
                  {coupon.usedCount}
                  {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                </td>
                <td className="p-3 text-muted-foreground">
                  {coupon.expiresAt
                    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(coupon.expiresAt)
                    : "—"}
                </td>
                <td className="p-3">
                  <Badge variant={coupon.isActive ? "default" : "secondary"}>
                    {coupon.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/admin/coupons/${coupon.id}/edit`} />}
                    >
                      Edit
                    </Button>
                    <DeleteButton
                      onDelete={deleteCoupon.bind(null, coupon.id)}
                      confirmMessage={`Delete coupon "${coupon.code}"?`}
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
