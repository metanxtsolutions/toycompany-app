import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CouponForm } from "@/components/admin/coupon-form";
import { requireAdminPermission } from "@/lib/require-admin-page";
import { canManageCoupons } from "@/lib/admin-permissions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCouponPage({ params }: PageProps) {
  await requireAdminPermission(canManageCoupons);
  const { id } = await params;
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) notFound();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Edit coupon</h1>
      <div className="mt-6">
        <CouponForm initialData={coupon} />
      </div>
    </div>
  );
}
