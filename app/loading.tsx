import { Skeleton } from "@/components/ui/skeleton";
import { ProductGridSkeleton } from "@/components/productos/product-card-skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-linear-to-b from-white to-slate-50">
      {/* Skeleton for Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Skeleton className="flex-1 h-10 rounded-full" />
            <Skeleton className="w-10 h-10 rounded-full" />
          </div>
        </div>
      </div>

      {/* Skeleton for Categories */}
      <div className="sticky top-[57px] z-10 bg-white border-b overflow-x-auto">
        <div className="container mx-auto px-4 py-2 flex gap-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full shrink-0" />
          ))}
        </div>
      </div>

      {/* Grid of Product Skeletons */}
      <div className="container mx-auto px-4 py-6">
        <ProductGridSkeleton count={8} />
      </div>
    </div>
  );
}
