import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BlogForm } from "@/components/admin/blog-form";
import { requireAdminPermission } from "@/lib/require-admin-page";
import { canManageContent } from "@/lib/admin-permissions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBlogPostPage({ params }: PageProps) {
  await requireAdminPermission(canManageContent);
  const { id } = await params;

  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Edit post</h1>
      <div className="mt-6">
        <BlogForm initialData={post} />
      </div>
    </div>
  );
}
