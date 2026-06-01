"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { refreshMarketFeed } from "@/app/actions/products";
import { cn } from "@/lib/utils";

interface RefreshButtonProps {
  onRefresh?: () => void;
  refreshAction?: () => Promise<any>;
  className?: string;
  iconClassName?: string;
  labelClassName?: string;
}

export function RefreshButton({ onRefresh, refreshAction, className, iconClassName, labelClassName }: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (refreshAction) {
        await refreshAction();
      } else {
        await refreshMarketFeed();
      }
      if (onRefresh) onRefresh();
      toast.success("Feed actualizado.");
    } catch (error) {
      toast.error("Error al actualizar el feed");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={cn("refresh-button gap-2 rounded-full h-10 px-4 shrink-0", className)}
    >
      <RefreshCw className={cn("refresh-button-icon w-4 h-4", isRefreshing ? "animate-spin text-primary" : "text-muted-foreground", iconClassName)} />
      <span className={cn("hidden sm:inline font-medium", labelClassName)}>Actualizar</span>
    </Button>
  );
}
