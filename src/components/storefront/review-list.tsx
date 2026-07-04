import { Star } from "lucide-react";

interface ReviewData {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  adminReply: string | null;
  createdAt: Date;
  user: { name: string | null };
}

export function ReviewList({ reviews }: { reviews: ReviewData[] }) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No reviews yet. Be the first to share your experience.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review.id} className="border-b border-border pb-6 last:border-0">
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`size-4 ${
                    i < review.rating
                      ? "fill-primary text-primary"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            {review.title ? (
              <span className="font-semibold">{review.title}</span>
            ) : null}
          </div>
          <p className="mt-2 text-sm">{review.body}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {review.user.name ?? "Verified buyer"} ·{" "}
            {new Intl.DateTimeFormat("en-IN", {
              dateStyle: "medium",
            }).format(review.createdAt)}
          </p>
          {review.adminReply ? (
            <div className="mt-3 rounded-md bg-muted p-3 text-sm">
              <span className="font-semibold">Toy Company: </span>
              {review.adminReply}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
