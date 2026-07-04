import { Skeleton } from "@/components/ui/skeleton";
import { ProductGridSkeleton } from "@/components/storefront/product-grid-skeleton";

export default function CategoryLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-4 h-8 w-56" />
      <Skeleton className="mt-2 h-4 w-96 max-w-full" />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <div className="space-y-3">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
        <div>
          <Skeleton className="mb-4 h-5 w-32" />
          <ProductGridSkeleton className="sm:grid-cols-2 xl:grid-cols-3" />
        </div>
      </div>
    </div>
  );
}
