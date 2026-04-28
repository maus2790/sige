import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export default function AuthLoading() {
  return (
    <Card className="w-full">
      <CardHeader className="space-y-2">
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-5/6 mx-auto" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <Skeleton className="h-11 w-full" />
        <div className="flex items-center w-full gap-2 py-2">
          <Skeleton className="h-px flex-1" />
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-px flex-1" />
        </div>
        <Skeleton className="h-11 w-full" />
        <div className="space-y-2 w-full">
          <Skeleton className="h-4 w-1/2 mx-auto" />
          <Skeleton className="h-4 w-2/3 mx-auto" />
        </div>
      </CardFooter>
    </Card>
  );
}
