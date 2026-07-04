"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { moderateReview, replyToReview } from "@/server/actions/admin/reviews";

export function ReviewRowActions({
  reviewId,
  status,
  adminReply,
  canModerate,
}: {
  reviewId: string;
  status: string;
  adminReply: string | null;
  canModerate: boolean;
}) {
  const router = useRouter();
  const [replyDraft, setReplyDraft] = useState(adminReply ?? "");
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleModerate(next: "APPROVED" | "REJECTED") {
    setIsPending(true);
    const result = await moderateReview(reviewId, next);
    setIsPending(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(next === "APPROVED" ? "Review approved" : "Review rejected");
    router.refresh();
  }

  async function handleReply() {
    setIsPending(true);
    const result = await replyToReview(reviewId, replyDraft);
    setIsPending(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Reply saved");
    setShowReplyBox(false);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {canModerate && status !== "APPROVED" && (
          <Button size="sm" onClick={() => handleModerate("APPROVED")} disabled={isPending}>
            Approve
          </Button>
        )}
        {canModerate && status !== "REJECTED" && (
          <Button size="sm" variant="outline" onClick={() => handleModerate("REJECTED")} disabled={isPending}>
            Reject
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => setShowReplyBox((v) => !v)}>
          {adminReply ? "Edit reply" : "Reply"}
        </Button>
      </div>
      {showReplyBox && (
        <div className="space-y-2">
          <Textarea
            rows={2}
            value={replyDraft}
            onChange={(e) => setReplyDraft(e.target.value)}
            placeholder="Write a reply visible to customers…"
          />
          <Button size="sm" onClick={handleReply} disabled={isPending}>
            {isPending ? "Saving…" : "Save reply"}
          </Button>
        </div>
      )}
    </div>
  );
}
