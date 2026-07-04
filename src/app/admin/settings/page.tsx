import { prisma } from "@/lib/prisma";
import { ROBOTS_TXT_KEY, DEFAULT_ROBOTS_TXT } from "@/lib/site-settings";
import { RobotsEditor } from "@/components/admin/robots-editor";
import { requireAdminPermission } from "@/lib/require-admin-page";
import { canManageContent } from "@/lib/admin-permissions";

export default async function AdminSettingsPage() {
  await requireAdminPermission(canManageContent);

  const setting = await prisma.siteSetting.findUnique({ where: { key: ROBOTS_TXT_KEY } });

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Settings</h1>
      <div className="mt-6">
        <h2 className="font-heading mb-3 font-semibold">robots.txt</h2>
        <RobotsEditor initialValue={setting?.value ?? DEFAULT_ROBOTS_TXT} />
      </div>
    </div>
  );
}
