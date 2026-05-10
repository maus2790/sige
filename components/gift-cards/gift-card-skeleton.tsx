import { Gift } from 'lucide-react';

export function GiftCardSkeleton() {
  return (
    <div className="aspect-[1.9/1] lg:aspect-[1.8/1] w-full max-w-[420px] mx-auto rounded-2xl lg:rounded-3xl p-4 lg:p-5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 relative overflow-hidden animate-pulse">
      {/* Decorative Icon Background */}
      <div className="absolute top-0 right-0 p-4 lg:p-6 opacity-5 pointer-events-none">
        <Gift size={120} className="text-zinc-400" />
      </div>

      <div className="relative z-10 h-full flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="space-y-1 lg:space-y-3 flex-1 min-w-0">
            <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-lg lg:rounded-xl bg-zinc-200 dark:bg-zinc-800" />
            
            <div className="space-y-1 lg:space-y-2">
              <div className="h-2 w-12 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-4 w-24 lg:w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
            </div>
          </div>

          <div className="text-right space-y-2">
            <div className="h-2 w-16 bg-zinc-200 dark:bg-zinc-800 rounded ml-auto" />
            <div className="h-4 w-12 bg-zinc-200 dark:bg-zinc-800 rounded ml-auto" />
          </div>
        </div>

        {/* Central Code Pill Skeleton */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="h-1.5 w-8 bg-zinc-200 dark:bg-zinc-800 rounded mb-1" />
          <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
        </div>

        <div className="flex justify-between items-end border-t border-zinc-200 dark:border-zinc-800 pt-2 lg:pt-3 mt-auto">
          <div className="space-y-1.5">
            <div className="h-2 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="flex items-baseline gap-1">
              <div className="h-3 w-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-8 w-16 lg:w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1.5">
            <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-2 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function GiftCardListSkeleton() {
  return (
    <div className="space-y-4 px-4 max-w-2xl mx-auto">
      {[1, 2, 3].map((i) => (
        <GiftCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function GiftCardWalletSkeleton() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Hero Skeleton */}
      <div className="bg-zinc-200 dark:bg-zinc-800 h-[280px] w-full relative">
        <div className="max-w-2xl mx-auto px-4 pt-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-zinc-300 dark:bg-zinc-700" />
            <div className="space-y-1.5">
              <div className="h-4 w-24 bg-zinc-300 dark:bg-zinc-700 rounded" />
              <div className="h-3 w-32 bg-zinc-300 dark:bg-zinc-700 rounded" />
            </div>
          </div>
          <div className="flex flex-col items-center mb-6">
            <div className="h-3 w-32 bg-zinc-300 dark:bg-zinc-700 rounded mb-2" />
            <div className="h-12 w-48 bg-zinc-300 dark:bg-zinc-700 rounded-xl" />
            <div className="h-3 w-40 bg-zinc-300 dark:bg-zinc-700 rounded mt-2" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-12 bg-zinc-300 dark:bg-zinc-700 rounded-2xl" />
            <div className="h-12 bg-zinc-300 dark:bg-zinc-700 rounded-2xl" />
          </div>
        </div>
      </div>

      {/* Stats Row Skeleton */}
      <div className="max-w-2xl mx-auto px-4 -mt-3 mb-6 relative z-10">
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-2xl p-2.5 border h-20 flex flex-col items-center justify-center gap-1.5">
              <div className="w-4 h-4 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
              <div className="h-4 w-6 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-2 w-10 bg-zinc-200 dark:bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="max-w-2xl mx-auto px-4">
        <div className="h-11 w-full bg-zinc-200 dark:bg-zinc-800 rounded-2xl mb-5" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <GiftCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function GiftCardFormSkeleton() {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 lg:space-y-8 animate-pulse">
      {/* Steps Skeleton */}
      <div className="flex justify-between items-center mb-8 max-w-md mx-auto px-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            {s < 3 && <div className="w-12 h-1 bg-zinc-200 dark:bg-zinc-800 mx-2 rounded" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Form Area Skeleton */}
        <div className="space-y-6 px-4">
          <div className="bg-zinc-100 dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 h-[500px]" />
        </div>

        {/* Preview Area Skeleton */}
        <div className="space-y-4 px-4 sticky top-24">
          <div className="hidden lg:flex justify-between mb-4">
            <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-6 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
          </div>
          <GiftCardSkeleton />
        </div>
      </div>
    </div>
  );
}

