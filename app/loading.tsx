import { Skeleton } from "@/components/ui/skeleton";
import { ProductGridSkeleton } from "@/components/productos/product-card-skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Section Skeleton */}
      <div className="relative overflow-hidden bg-muted/20 pb-16 pt-12 px-4 sm:px-6 lg:px-8 shadow-sm rounded-b-[2.5rem] md:rounded-b-[4rem] mb-0 border-b">
        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
          <Skeleton className="w-20 h-20 rounded-3xl mb-6" />
          <Skeleton className="h-12 md:h-16 lg:h-20 w-3/4 max-w-2xl mb-4 rounded-xl" />
          <Skeleton className="h-6 md:h-8 w-2/4 max-w-md mb-2 rounded-lg" />
          <Skeleton className="h-4 md:h-5 w-3/4 max-w-lg mb-6 rounded-md" />
        </div>
      </div>

      {/* Sticky Action Bar Skeleton */}
      <div className="sticky top-16 z-40 transition-all duration-300 px-4 w-full max-w-6xl mx-auto -mt-6 mb-8">
        <div className="flex items-center gap-3">
          <Skeleton className="hidden md:flex h-12 w-32 rounded-2xl shrink-0" />
          <Skeleton className="flex-1 h-12 rounded-2xl" />
          <Skeleton className="hidden md:flex h-12 w-36 rounded-2xl shrink-0" />
        </div>
      </div>

      {/* Grid of Product Skeletons */}
      <div className="container mx-auto px-4">
        <ProductGridSkeleton count={10} />
      </div>
    </div>
  );
}
