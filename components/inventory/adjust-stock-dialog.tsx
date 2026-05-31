// components/inventory/adjust-stock-dialog.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateInventoryItem } from "@/app/actions/inventory";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

interface AdjustStockDialogProps {
  productId: string;
  productName: string;
  currentStock: number;
  currentMinStock: number;
  currentLocation: string;
  className?: string;
}

export function AdjustStockDialog({
  productId,
  productName,
  currentStock,
  currentMinStock,
  currentLocation,
  className,
}: AdjustStockDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stock, setStock] = useState(currentStock);
  const [minStock, setMinStock] = useState(currentMinStock);
  const [location, setLocation] = useState(currentLocation);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  async function handleUpdate() {
    setIsLoading(true);
    try {
      const result = await updateInventoryItem(productId, {
        stockActual: stock,
        stockMinimo: minStock,
        ubicacion: location,
      });
      if (result.success) {
        toast.success("Inventario actualizado correctamente");
        router.refresh();
        setOpen(false);
      }
    } catch (error) {
      toast.error("Error al actualizar el inventario");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {isDesktop ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className={cn("gap-2", className)}>
              <Edit2 className="h-4 w-4" />
              Editar Valores
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-106.25 p-6 max-h-[calc(100vh-4rem)] overflow-hidden rounded-xl">
            <DialogHeader>
              <DialogTitle>Editar Inventario</DialogTitle>
              <DialogDescription>
                Actualiza los parámetros de existencias para <strong>{productName}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4 overflow-y-auto max-h-[calc(100vh-22rem)]">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stock" className="text-right">
                  Stock Actual
                </Label>
                <Input
                  id="stock"
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                  className="col-span-3"
                  disabled={isLoading}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="minStock" className="text-right">
                  Mínimo
                </Label>
                <Input
                  id="minStock"
                  type="number"
                  value={minStock}
                  onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
                  className="col-span-3"
                  disabled={isLoading}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">
                  Ubicación
                </Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ej: Estante B, Nivel 2"
                  className="col-span-3"
                  disabled={isLoading}
                />
              </div>
            </div>
            <DialogFooter className="sticky bottom-0 bg-background p-4 border-t">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button onClick={handleUpdate} disabled={isLoading} className="gap-2">
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className={cn("gap-2", className)}>
              <Edit2 className="h-4 w-4" />
              Editar Valores
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="rounded-t-[2.5rem] p-6 overflow-hidden border-none shadow-premium bg-background max-h-[90vh] h-auto"
          >
            <DialogHeader>
              <DialogTitle>Editar Inventario</DialogTitle>
              <DialogDescription>
                Actualiza los parámetros de existencias para <strong>{productName}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4 overflow-y-auto max-h-[calc(100vh-22rem)]">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stock" className="text-right">
                  Stock Actual
                </Label>
                <Input
                  id="stock"
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                  className="col-span-3"
                  disabled={isLoading}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="minStock" className="text-right">
                  Mínimo
                </Label>
                <Input
                  id="minStock"
                  type="number"
                  value={minStock}
                  onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
                  className="col-span-3"
                  disabled={isLoading}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">
                  Ubicación
                </Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ej: Estante B, Nivel 2"
                  className="col-span-3"
                  disabled={isLoading}
                />
              </div>
            </div>
            <DialogFooter className="sticky bottom-0 bg-background p-4 border-t">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button onClick={handleUpdate} disabled={isLoading} className="gap-2">
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
