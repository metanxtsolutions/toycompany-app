import Link from "next/link";
import { Zap } from "lucide-react";

export function PromoStrip() {
  return (
    <Link
      href="/search?q="
      className="block bg-primary text-center text-xs font-bold tracking-wide text-primary-foreground sm:text-sm"
    >
      <span className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2">
        <Zap className="size-3.5 shrink-0 fill-current" />
        FLASH SALE — up to 20% off top gear · Free shipping over ₹1,999
      </span>
    </Link>
  );
}
