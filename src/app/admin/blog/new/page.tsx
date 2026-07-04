import { BlogForm } from "@/components/admin/blog-form";
import { requireAdminPermission } from "@/lib/require-admin-page";
import { canManageContent } from "@/lib/admin-permissions";

export default async function NewBlogPostPage() {
  await requireAdminPermission(canManageContent);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Add post</h1>
      <div className="mt-6">
        <BlogForm />
      </div>
    </div>
  );
}
