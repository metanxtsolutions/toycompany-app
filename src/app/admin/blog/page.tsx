import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteBlogPost } from "@/server/actions/admin/blog";
import { requireAdminPermission } from "@/lib/require-admin-page";
import { canManageContent } from "@/lib/admin-permissions";

export default async function AdminBlogPage() {
  await requireAdminPermission(canManageContent);

  const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } });
  const now = new Date();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Blog</h1>
        <Button nativeButton={false} render={<Link href="/admin/blog/new" />}>
          Add post
        </Button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Title</th>
              <th className="p-3 font-medium">Category</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Updated</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => {
              const isPublished = post.publishedAt && post.publishedAt <= now;
              return (
                <tr key={post.id} className="border-t border-border">
                  <td className="p-3 font-medium">{post.title}</td>
                  <td className="p-3 text-muted-foreground">{post.categoryTag ?? "—"}</td>
                  <td className="p-3">
                    <Badge variant={isPublished ? "default" : "secondary"}>
                      {isPublished ? "Published" : "Draft"}
                    </Badge>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(post.updatedAt)}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        nativeButton={false}
                        render={<Link href={`/admin/blog/${post.id}/edit`} />}
                      >
                        Edit
                      </Button>
                      <DeleteButton
                        onDelete={deleteBlogPost.bind(null, post.id)}
                        confirmMessage={`Delete "${post.title}"?`}
                      />
                    </div>
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
