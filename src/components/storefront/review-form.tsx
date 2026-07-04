"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitReview } from "@/server/actions/reviews";

export function ReviewForm({
  productId,
  productSlug,
}: {
  productId: string;
  productSlug: string;
}) {
  const { data: session, status } = useSession();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (status === "loading") return null;

  if (!session) {
    return (
      <p className="text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary">
          Sign in
        </Link>{" "}
        to leave a review.
      </p>
    );
  }

  if (submitted) {
    return (
      <p className="text-sm text-muted-foreground">
        Thanks! Your review is awaiting moderation and will appear once approved.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating.");
      return;
    }
    setIsSubmitting(true);
    const result = await submitReview({
      productId,
      productSlug,
      rating,
      title: title || undefined,
      body,
    });
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setSubmitted(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Your rating</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoverRating(value)}
              onMouseLeave={() => setHoverRating(0)}
              aria-label={`${value} stars`}
            >
              <Star
                className={`size-6 ${
                  value <= (hoverRating || rating)
                    ? "fill-primary text-primary"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="review-title">Title (optional)</Label>
        <Input
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="review-body">Your review</Label>
        <Textarea
          id="review-body"
          required
          minLength={10}
          maxLength={2000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
        />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting…" : "Submit review"}
      </Button>
    </form>
  );
}
