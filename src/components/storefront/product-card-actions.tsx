"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, ShoppingCart, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/server/actions/cart";
import { QuickViewDialog } from "@/components/storefront/quick-view-dialog";

export function ProductCardActions({
  productId,
  defaultVariantId,
  inStock,
}: {
  productId: string;
  defaultVariantId: string | null;
  inStock: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<"add" | "buy" | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  function guard(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  async function handleAdd(e: React.MouseEvent) {
    guard(e);
    if (!defaultVariantId) return;
    setPending("add");
    const result = await addToCart({ variantId: defaultVariantId, quantity: 1 });
    setPending(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Added to cart");
    queryClient.invalidateQueries({ queryKey: ["cart"] });
  }

  async function handleBuyNow(e: React.MouseEvent) {
    guard(e);
    if (!defaultVariantId) return;
    setPending("buy");
    const result = await addToCart({ variantId: defaultVariantId, quantity: 1 });
    if (!result.success) {
      setPending(null);
      toast.error(result.error);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["cart"] });
    router.push("/checkout");
  }

  function handleQuickView(e: React.MouseEvent) {
    guard(e);
    setQuickViewOpen(true);
  }

  return (
    <div className="space-y-1.5 pt-2">
      <div className="flex gap-1.5">
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={handleQuickView}
          aria-label="Quick view"
        >
          <Eye className="size-3.5" /> Quick View
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="flex-1"
          disabled={!inStock || pending !== null}
          onClick={handleAdd}
          aria-label="Add to cart"
        >
          <ShoppingCart className="size-3.5" />
          {pending === "add" ? "Adding…" : "Add"}
        </Button>
      </div>
      <Button
        size="sm"
        className="w-full"
        disabled={!inStock || pending !== null}
        onClick={handleBuyNow}
      >
        <Zap className="size-3.5" />
        {pending === "buy" ? "Heading to checkout…" : "Buy Now"}
      </Button>
      <QuickViewDialog
        productId={productId}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
      />
    </div>
  );
}
