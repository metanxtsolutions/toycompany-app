"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function DeleteButton({
  onDelete,
  confirmMessage = "Are you sure you want to delete this?",
}: {
  onDelete: () => Promise<{ success: boolean; error?: string }>;
  confirmMessage?: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleClick() {
    if (!window.confirm(confirmMessage)) return;
    setIsDeleting(true);
    const result = await onDelete();
    setIsDeleting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Deleted");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleClick} disabled={isDeleting}>
      {isDeleting ? "Deleting…" : "Delete"}
    </Button>
  );
}
