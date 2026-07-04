"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateOrderStatus, refundOrder } from "@/server/actions/admin/orders";

const STATUSES = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];
const REFUNDABLE = new Set(["PAID", "PROCESSING", "SHIPPED", "DELIVERED"]);

export function OrderStatusPanel({
  orderId,
  currentStatus,
  canRefundOrder,
}: {
  orderId: string;
  currentStatus: string;
  canRefundOrder: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);

  async function handleStatusChange(value: string | null) {
    if (!value || value === status) return;
    setIsUpdating(true);
    const result = await updateOrderStatus(orderId, value);
    setIsUpdating(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setStatus(value);
    toast.success("Order status updated");
    router.refresh();
  }

  async function handleRefund() {
    if (!window.confirm("Refund this order in full? This cannot be undone.")) return;
    setIsRefunding(true);
    const result = await refundOrder(orderId);
    setIsRefunding(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setStatus("REFUNDED");
    toast.success("Order refunded");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <Select value={status} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-full" disabled={isUpdating}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {canRefundOrder && REFUNDABLE.has(status) && (
        <Button variant="destructive" className="w-full" onClick={handleRefund} disabled={isRefunding}>
          {isRefunding ? "Refunding…" : "Refund order"}
        </Button>
      )}
    </div>
  );
}
