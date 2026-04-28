import { Skeleton } from "@/components/ui/skeleton";

export default function AssistantLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4 max-w-4xl mx-auto space-y-4">
      <div className="flex justify-center py-4">
        <Skeleton className="h-6 w-48" />
      </div>
      
      <div className="flex-1 space-y-6 overflow-hidden pt-4">
        <div className="flex gap-3">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="space-y-2 max-w-[80%]">
            <Skeleton className="h-4 w-32" />
            <div className="p-4 bg-white border rounded-2xl space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <div className="space-y-2 max-w-[80%] flex flex-col items-end">
            <Skeleton className="h-4 w-20" />
            <div className="p-4 bg-primary/10 rounded-2xl space-y-2">
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        </div>

        <div className="flex gap-3">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="space-y-2 max-w-[80%]">
            <Skeleton className="h-4 w-32" />
            <div className="p-4 bg-white border rounded-2xl space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border bg-white rounded-2xl flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
    </div>
  );
}
