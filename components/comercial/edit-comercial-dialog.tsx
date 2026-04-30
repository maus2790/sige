// components/comercial/edit-comercial-dialog.tsx

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Banknote, Loader2, TrendingDown, Eye, EyeOff, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateComercialConfig } from "@/app/actions/comercial";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

interface EditComercialDialogProps {
  product: any;
}

export function EditComercialDialog({ product }: EditComercialDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [precioAdquisicion, setPrecioAdquisicion] = useState(product.comercialConfig?.precioAdquisicion || 0);
  const [precioVenta, setPrecioVenta] = useState(product.comercialConfig?.precioVenta || 0);
  const [precioOferta, setPrecioOferta] = useState(product.comercialConfig?.precioOferta || 0);
  const [ofertaPorcentaje, setOfertaPorcentaje] = useState(product.comercialConfig?.ofertaPorcentaje || 0);
  const [limiteCompra, setLimiteCompra] = useState<number | "">(product.comercialConfig?.limiteCompra || "");
  const [isPublished, setIsPublished] = useState(product.comercialConfig?.isPublished ?? true);
  const [esDestacado, setEsDestacado] = useState(product.comercialConfig?.esDestacado ?? false);

  // Inicializar días en promoción
  const [diasPromocion, setDiasPromocion] = useState<number>(() => {
    if (product.comercialConfig?.fechaFinOferta) {
      const diff = new Date(product.comercialConfig.fechaFinOferta).getTime() - Date.now();
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
    return 7; // Por defecto 7 días
  });

  async function handleUpdate() {
    setIsLoading(true);
    try {
      // Calcular fecha fin de oferta si hay oferta activa
      let fechaFinOferta: Date | null = null;
      if (precioOferta > 0) {
        fechaFinOferta = new Date();
        fechaFinOferta.setDate(fechaFinOferta.getDate() + diasPromocion);
      }

      const result = await updateComercialConfig(product.id, {
        precioAdquisicion,
        precioVenta,
        precioOferta: precioOferta > 0 ? precioOferta : null,
        ofertaPorcentaje: ofertaPorcentaje > 0 ? ofertaPorcentaje : 0,
        limiteCompra: limiteCompra !== "" && limiteCompra > 0 ? Number(limiteCompra) : null,
        fechaFinOferta,
        isPublished,
        esDestacado,
      });

      if (result.success) {
        toast.success("Configuración comercial actualizada");
        router.refresh();
        setOpen(false);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar la configuración");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Banknote className="h-4 w-4" />
          Editar Valores
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gestión Comercial</DialogTitle>
          <DialogDescription>
            Configura los precios y visibilidad de <strong>{product.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="p_adquisicion" className="text-muted-foreground flex items-center gap-1">
                P. Adquisición (Costo)
              </Label>
              <Input
                id="p_adquisicion"
                type="number"
                step="0.01"
                value={precioAdquisicion}
                onChange={(e) => setPrecioAdquisicion(parseFloat(e.target.value) || 0)}
                className="bg-muted/30"
              />
              <p className="text-[10px] text-muted-foreground italic">* Privado, no visible para clientes.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p_venta">Precio de Venta</Label>
              <Input
                id="p_venta"
                type="number"
                step="0.01"
                value={precioVenta}
                onChange={(e) => setPrecioVenta(parseFloat(e.target.value) || 0)}
                className="font-bold border-primary/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="p_oferta" className="flex items-center gap-2 text-green-600 font-bold">
                <TrendingDown className="h-4 w-4" /> Precio de Oferta
              </Label>
              <Input
                id="p_oferta"
                type="number"
                step="0.01"
                value={precioOferta || ""}
                placeholder="Ej: 99.90"
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setPrecioOferta(val);
                  if (val > 0 && precioVenta > 0) {
                    setOfertaPorcentaje(Math.round(((precioVenta - val) / precioVenta) * 100));
                  } else {
                    setOfertaPorcentaje(0);
                  }
                }}
                className="border-green-300 focus-visible:ring-green-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="p_porcentaje" className="flex items-center gap-2 text-green-600 font-bold">
                % Descuento
              </Label>
              <Input
                id="p_porcentaje"
                type="number"
                step="1"
                min="0"
                max="100"
                value={ofertaPorcentaje || ""}
                placeholder="Ej: 20"
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setOfertaPorcentaje(val);
                  if (val > 0 && precioVenta > 0) {
                    setPrecioOferta(Math.round((precioVenta - (precioVenta * (val / 100))) * 100) / 100);
                  } else {
                    setPrecioOferta(0);
                  }
                }}
                className="border-green-300 focus-visible:ring-green-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dias_promo" className="text-muted-foreground">
                Días en Promoción
              </Label>
              <Input
                id="dias_promo"
                type="number"
                min="1"
                value={diasPromocion}
                onChange={(e) => setDiasPromocion(parseInt(e.target.value) || 7)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="limite_compra" className="text-muted-foreground">
                Límite de Compra
              </Label>
              <Input
                id="limite_compra"
                type="number"
                min="1"
                placeholder="Sin límite"
                value={limiteCompra}
                onChange={(e) => setLimiteCompra(e.target.value === "" ? "" : parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="grid gap-4 pt-2">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center gap-2">
                  {isPublished ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-amber-600" />}
                  Publicar Producto
                </Label>
                <p className="text-xs text-muted-foreground">
                  Controla si el producto es visible en el marketplace.
                </p>
              </div>
              <Switch
                checked={isPublished}
                onCheckedChange={setIsPublished}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center gap-2">
                  <Star className={`h-4 w-4 ${esDestacado ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} />
                  Producto Destacado
                </Label>
                <p className="text-xs text-muted-foreground">
                  Aparecerá en las secciones especiales del Home.
                </p>
              </div>
              <Switch
                checked={esDestacado}
                onCheckedChange={setEsDestacado}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
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
  );
}
