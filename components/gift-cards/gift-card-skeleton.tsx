export function GiftCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 rounded-xl p-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 rounded w-24"></div>
            <div className="h-6 bg-gray-300 rounded w-32"></div>
          </div>
          <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="h-3 bg-gray-300 rounded w-20"></div>
          <div className="h-4 bg-gray-300 rounded w-28 mt-1"></div>
        </div>
      </div>
    </div>
  );
}

export function GiftCardListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <GiftCardSkeleton key={i} />
      ))}
    </div>
  );
}