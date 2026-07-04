"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { upsertCoupon } from "@/server/actions/admin/coupons";

interface CouponInitialData {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrderValue: number | null;
  usageLimit: number | null;
  expiresAt: Date | null;
  isActive: boolean;
}

export function CouponForm({ initialData }: { initialData?: CouponInitialData }) {
  const router = useRouter();
  const [code, setCode] = useState(initialData?.code ?? "");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED">(initialData?.type ?? "PERCENTAGE");
  const [value, setValue] = useState(
    initialData ? String(initialData.type === "PERCENTAGE" ? initialData.value : initialData.value / 100) : "",
  );
  const [minOrderValue, setMinOrderValue] = useState(
    initialData?.minOrderValue ? String(initialData.minOrderValue / 100) : "",
  );
  const [usageLimit, setUsageLimit] = useState(initialData?.usageLimit ? String(initialData.usageLimit) : "");
  const [expiresAt, setExpiresAt] = useState(
    initialData?.expiresAt ? initialData.expiresAt.toISOString().slice(0, 10) : "",
  );
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await upsertCoupon(initialData?.id ?? null, {
      code,
      type,
      value: Number(value),
      minOrderValue: minOrderValue ? Number(minOrderValue) : undefined,
      usageLimit: usageLimit ? Number(usageLimit) : undefined,
      expiresAt: expiresAt || undefined,
      isActive,
    });

    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(initialData ? "Coupon updated" : "Coupon created");
    router.push("/admin/coupons");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="coupon-code">Code</Label>
        <Input
          id="coupon-code"
          required
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select
            items={{ PERCENTAGE: "Percentage off", FIXED: "Fixed amount off" }}
            value={type}
            onValueChange={(v) => v && setType(v as typeof type)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERCENTAGE">Percentage off</SelectItem>
              <SelectItem value="FIXED">Fixed amount off</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="coupon-value">
            Value {type === "PERCENTAGE" ? "(%)" : "(₹)"}
          </Label>
          <Input
            id="coupon-value"
            type="number"
            required
            min="0"
            step={type === "PERCENTAGE" ? "1" : "0.01"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="coupon-minOrder">Minimum order value (₹, optional)</Label>
          <Input
            id="coupon-minOrder"
            type="number"
            min="0"
            step="0.01"
            value={minOrderValue}
            onChange={(e) => setMinOrderValue(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="coupon-usageLimit">Usage limit (optional)</Label>
          <Input
            id="coupon-usageLimit"
            type="number"
            min="1"
            value={usageLimit}
            onChange={(e) => setUsageLimit(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="coupon-expires">Expires on (optional)</Label>
        <Input
          id="coupon-expires"
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={isActive} onCheckedChange={(c) => setIsActive(c === true)} />
        Active
      </label>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : initialData ? "Save changes" : "Create coupon"}
      </Button>
    </form>
  );
}
