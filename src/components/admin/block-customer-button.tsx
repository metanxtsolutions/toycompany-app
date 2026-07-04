"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleBlockCustomer } from "@/server/actions/admin/customers";

export function BlockCustomerButton({ userId, isBlocked }: { userId: string; isBlocked: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    const confirmMessage = isBlocked
      ? "Unblock this customer? They will be able to sign in again."
      : "Block this customer? They will be unable to sign in.";
    if (!window.confirm(confirmMessage)) return;

    setPending(true);
    const result = await toggleBlockCustomer(userId);
    setPending(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(result.isBlocked ? "Customer blocked" : "Customer unblocked");
    router.refresh();
  }

  return (
    <Button variant={isBlocked ? "outline" : "destructive"} onClick={handleClick} disabled={pending}>
      {pending ? "Saving…" : isBlocked ? "Unblock customer" : "Block customer"}
    </Button>
  );
}
