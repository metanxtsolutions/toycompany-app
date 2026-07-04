import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteBanner } from "@/server/actions/admin/banners";
import { requireAdminPermission } from "@/lib/require-admin-page";
import { canManageBanners } from "@/lib/admin-permissions";

export default async function AdminBannersPage() {
  await requireAdminPermission(canManageBanners);
  const banners = await prisma.banner.findMany({ orderBy: [{ placement: "asc" }, { sortOrder: "asc" }] });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Banners</h1>
        <Button nativeButton={false} render={<Link href="/admin/banners/new" />}>
          Add banner
        </Button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Title</th>
              <th className="p-3 font-medium">Placement</th>
              <th className="p-3 font-medium">Window</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {banners.map((banner) => (
              <tr key={banner.id} className="border-t border-border">
                <td className="p-3 font-medium">{banner.title}</td>
                <td className="p-3 text-muted-foreground">{banner.placement}</td>
                <td className="p-3 text-muted-foreground">
                  {banner.startsAt || banner.endsAt
                    ? `${banner.startsAt ? new Intl.DateTimeFormat("en-IN").format(banner.startsAt) : "…"} – ${
                        banner.endsAt ? new Intl.DateTimeFormat("en-IN").format(banner.endsAt) : "…"
                      }`
                    : "Always"}
                </td>
                <td className="p-3">
                  <Badge variant={banner.isActive ? "default" : "secondary"}>
                    {banner.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/admin/banners/${banner.id}/edit`} />}
                    >
                      Edit
                    </Button>
                    <DeleteButton
                      onDelete={deleteBanner.bind(null, banner.id)}
                      confirmMessage={`Delete banner "${banner.title}"?`}
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
