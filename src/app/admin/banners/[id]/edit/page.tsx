import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BannerForm } from "@/components/admin/banner-form";
import { requireAdminPermission } from "@/lib/require-admin-page";
import { canManageBanners } from "@/lib/admin-permissions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBannerPage({ params }: PageProps) {
  await requireAdminPermission(canManageBanners);
  const { id } = await params;
  const banner = await prisma.banner.findUnique({ where: { id } });
  if (!banner) notFound();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Edit banner</h1>
      <div className="mt-6">
        <BannerForm initialData={banner} />
      </div>
    </div>
  );
}
