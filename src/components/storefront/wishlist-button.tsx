"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleWishlist } from "@/server/actions/wishlist";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId,
  initialInWishlist = false,
  className,
}: {
  productId: string;
  initialInWishlist?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [inWishlist, setInWishlist] = useState(initialInWishlist);
  const [isPending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      const result = await toggleWishlist(productId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setInWishlist(result.inWishlist);
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
      disabled={isPending}
      onClick={handleClick}
      className={cn("bg-background/80 backdrop-blur-sm hover:bg-background", className)}
    >
      <Heart className={cn("size-4", inWishlist && "fill-destructive text-destructive")} />
    </Button>
  );
}
