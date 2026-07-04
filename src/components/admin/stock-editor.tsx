"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateVariantStock } from "@/server/actions/admin/products";

export function StockEditor({ variantId, initialQuantity }: { variantId: string; initialQuantity: number }) {
  const router = useRouter();
  const [value, setValue] = useState(String(initialQuantity));
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    const result = await updateVariantStock(variantId, Number(value));
    setIsSaving(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Stock updated");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min="0"
        className="w-20"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={handleSave}
        disabled={isSaving || Number(value) === initialQuantity}
      >
        {isSaving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
