"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { refreshMarketFeed } from "@/app/actions/products";

interface RefreshButtonProps {
  onRefresh?: () => void;
  refreshAction?: () => Promise<any>;
}

export function RefreshButton({ onRefresh, refreshAction }: RefreshButtonProps) {
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
      className="gap-2 rounded-full h-10 px-4 shrink-0"
    >
      <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-primary" : "text-muted-foreground"}`} />
      <span className="hidden sm:inline font-medium">Actualizar</span>
    </Button>
  );
}
