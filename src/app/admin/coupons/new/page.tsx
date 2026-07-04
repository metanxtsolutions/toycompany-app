import { CouponForm } from "@/components/admin/coupon-form";
import { requireAdminPermission } from "@/lib/require-admin-page";
import { canManageCoupons } from "@/lib/admin-permissions";

export default async function NewCouponPage() {
  await requireAdminPermission(canManageCoupons);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Add coupon</h1>
      <div className="mt-6">
        <CouponForm />
      </div>
    </div>
  );
}
