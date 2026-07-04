import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canModerateReviews } from "@/lib/admin-permissions";
import { ReviewRowActions } from "@/components/admin/review-row-actions";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
};

export default async function AdminReviewsPage({ searchParams }: PageProps) {
  const { status } = await searchParams;
  const session = await auth();
  const canModerate = canModerateReviews(session?.user?.role);

  const reviews = await prisma.review.findMany({
    where: status ? { status: status as "PENDING" | "APPROVED" | "REJECTED" } : undefined,
    orderBy: { createdAt: "desc" },
    include: { product: { select: { name: true, slug: true } }, user: { select: { name: true } } },
  });

  const tabs = [
    { label: "All", value: "" },
    { label: "Pending", value: "PENDING" },
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Reviews</h1>

      <div className="mt-4 flex gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value ? `/admin/reviews?status=${tab.value}` : "/admin/reviews"}
            className={`rounded-md px-3 py-1.5 text-sm ${
              (status ?? "") === tab.value ? "bg-primary text-primary-foreground" : "hover:bg-accent"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {reviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews found.</p>}
        {reviews.map((review) => (
          <div key={review.id} className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`size-4 ${
                        i < review.rating ? "fill-primary text-primary" : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                <Link href={`/products/${review.product.slug}`} className="text-sm font-medium hover:underline">
                  {review.product.name}
                </Link>
              </div>
              <Badge variant={STATUS_VARIANT[review.status]}>{review.status}</Badge>
            </div>
            {review.title && <p className="mt-2 font-medium">{review.title}</p>}
            <p className="mt-1 text-sm text-muted-foreground">{review.body}</p>
            <p className="mt-1 text-xs text-muted-foreground">{review.user.name ?? "Verified buyer"}</p>
            {review.adminReply && (
              <div className="mt-2 rounded-md bg-muted p-2 text-sm">
                <span className="font-semibold">Toy Company: </span>
                {review.adminReply}
              </div>
            )}
            <div className="mt-3">
              <ReviewRowActions
                reviewId={review.id}
                status={review.status}
                adminReply={review.adminReply}
                canModerate={canModerate}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
