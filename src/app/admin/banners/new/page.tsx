import { BannerForm } from "@/components/admin/banner-form";
import { requireAdminPermission } from "@/lib/require-admin-page";
import { canManageBanners } from "@/lib/admin-permissions";

export default async function NewBannerPage() {
  await requireAdminPermission(canManageBanners);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Add banner</h1>
      <div className="mt-6">
        <BannerForm />
      </div>
    </div>
  );
}
