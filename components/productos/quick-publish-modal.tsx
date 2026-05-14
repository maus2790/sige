"use client";

import * as React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Package, Image as ImageIcon, Plus, Loader2, CheckCircle2, Globe, Lock } from "lucide-react";
import { createProduct, updateProduct } from "@/app/actions/products";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ImageUpload } from "../upload/image-upload";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useQueryClient } from "@tanstack/react-query";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface QuickPublishModalProps {
  categories: Category[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productToEdit?: any;
}

export function QuickPublishModal({ categories, open, onOpenChange, productToEdit }: QuickPublishModalProps) {
  const [step, setStep] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    category: "",
    price: "",
    stock: "1",
    imageUrls: [] as string[],
    isPublished: true,
    precioOferta: "",
    oferta: "",
    diasPromocion: "7",
  });
  const [showPromo, setShowPromo] = React.useState(false);

  const isEdit = !!productToEdit;

  React.useEffect(() => {
    if (productToEdit && open) {
      setFormData({
        name: productToEdit.name || "",
        description: productToEdit.description || "",
        category: productToEdit.category || "",
        price: (productToEdit.comercialConfig?.precioVenta || productToEdit.price || "").toString(),
        stock: (productToEdit.inventory?.stockActual || productToEdit.stock || "1").toString(),
        imageUrls: productToEdit.imageUrls || [],
        isPublished: productToEdit.comercialConfig?.isPublished !== undefined ? productToEdit.comercialConfig.isPublished : true,
        precioOferta: (productToEdit.comercialConfig?.precioOferta || "").toString(),
        oferta: (productToEdit.comercialConfig?.ofertaPorcentaje || "").toString(),
        diasPromocion: "7",
      });
      setShowPromo(!!productToEdit.comercialConfig?.precioOferta);
      setStep(1);
    } else if (!open) {
      // Reset when closed
      setStep(1);
      setFormData({
        name: "",
        description: "",
        category: "",
        price: "",
        stock: "1",
        imageUrls: [],
        isPublished: true,
        precioOferta: "",
        oferta: "",
        diasPromocion: "7",
      });
      setShowPromo(false);
    }
  }, [productToEdit, open]);

  const isDesktop = useMediaQuery("(min-width: 768px)");
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleNext = () => setStep((s) => s + 1);
  const handlePrev = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Prepare form data
      const dataToSubmit = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'imageUrls') {
          dataToSubmit.append(key, JSON.stringify(value));
        } else if (key === 'precioOferta' || key === 'oferta' || key === 'diasPromocion') {
          if (showPromo && value !== "") {
            dataToSubmit.append(key, value.toString());
          }
        } else {
          dataToSubmit.append(key, value.toString());
        }
      });

      const result = isEdit 
        ? await updateProduct(productToEdit.id, dataToSubmit)
        : await createProduct(dataToSubmit);

      if (result?.error) {
        toast.error(result.error);
        setIsLoading(false);
      } else {
        toast.success(isEdit ? "¡Producto actualizado con éxito!" : "¡Producto publicado con éxito!");
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["store-products"] });
        window.dispatchEvent(new CustomEvent('product-status-changed'));
        
        setIsLoading(false);
        onOpenChange(false);
        setStep(1);
        setFormData({
          name: "",
          description: "",
          category: "",
          price: "",
          stock: "1",
          imageUrls: [],
          isPublished: true,
          precioOferta: "",
          oferta: "",
          diasPromocion: "7",
        });
        setShowPromo(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Error submitting product:", error);
      toast.error("Ocurrió un error inesperado. Por favor, inténtalo de nuevo.");
      setIsLoading(false);
    }
  };

  const handleImagesChange = React.useCallback((urls: string[]) => {
    setFormData(prev => ({ ...prev, imageUrls: urls }));
  }, []);

  const formContentNode = (
    <div className="flex flex-col max-h-[90vh] md:max-h-[85vh] w-full">
      <div className="flex-none bg-brand-gradient p-4 md:p-6 text-white">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-white leading-none">
            {isEdit ? "Edición de Producto" : "Publicación Rápida"}
          </h2>
          <p className="text-blue-100 font-medium text-[10px] md:text-xs">
            Vende tu producto en segundos. Paso {step} de 3.
          </p>
        </div>
      </div>

      <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar">
        {step === 1 ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2 md:col-span-3">
                <Label className="font-bold">¿Qué estás vendiendo?</Label>
                <Input 
                  placeholder="Ej: iPhone 15 Pro Max" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="h-12! rounded-xl w-full"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="font-bold">Categoría</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => setFormData({...formData, category: v})}
                >
                  <SelectTrigger className="h-12! rounded-xl w-full">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent className="z-100">
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Descripción corta</Label>
              <Textarea 
                placeholder="Cuéntanos un poco más..." 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>
          </div>
        ) : step === 2 ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold text-primary">Precio (Bs.)</Label>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="h-12 rounded-xl border-primary/20 focus:ring-primary/20 text-lg font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Stock disponible</Label>
                <Input 
                  type="number" 
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  className="h-12 rounded-xl"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <ImageUpload 
                key={productToEdit?.id || 'new'}
                onImagesChange={handleImagesChange}
                initialImages={formData.imageUrls}
                maxImages={3}
                label="Fotos del producto"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="rounded-xl border border-border/50 bg-muted/20 overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() => setShowPromo(!showPromo)}
              >
                <div className="flex flex-col gap-1">
                  <Label className="font-bold cursor-pointer text-green-600 dark:text-green-500">Configuración Comercial</Label>
                  <p className="text-[10px] text-muted-foreground leading-tight">Añade precio de oferta y promoción.</p>
                </div>
                <Switch checked={showPromo} onCheckedChange={setShowPromo} />
              </div>
              
              {showPromo && (
                <div className="p-4 pt-0 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-green-600">Precio Oferta (Bs.)</Label>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        value={formData.precioOferta}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const price = parseFloat(formData.price) || 0;
                          let newOferta = formData.oferta;
                          if (val > 0 && price > 0) {
                            newOferta = Math.round(((price - val) / price) * 100).toString();
                          } else if (e.target.value === "") {
                            newOferta = "";
                          }
                          setFormData({...formData, precioOferta: e.target.value, oferta: newOferta});
                        }}
                        className="h-10 border-green-200 focus:ring-green-500 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-green-600">% Descuento</Label>
                      <Input 
                        type="number" 
                        min="0" max="100"
                        placeholder="Ej: 20" 
                        value={formData.oferta}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const price = parseFloat(formData.price) || 0;
                          let newPrecioOferta = formData.precioOferta;
                          if (val > 0 && price > 0) {
                            newPrecioOferta = (Math.round((price - (price * (val / 100))) * 100) / 100).toString();
                          } else if (e.target.value === "") {
                            newPrecioOferta = "";
                          }
                          setFormData({...formData, oferta: e.target.value, precioOferta: newPrecioOferta});
                        }}
                        className="h-10 border-green-200 focus:ring-green-500 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Días en Promoción</Label>
                    <Input 
                      type="number" 
                      min="1"
                      value={formData.diasPromocion}
                      onChange={(e) => setFormData({...formData, diasPromocion: e.target.value})}
                      className="h-10 rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-primary/10 bg-primary/5">
              <div className="flex flex-col gap-1">
                <Label className="font-bold flex items-center gap-2">
                  {formData.isPublished ? <Globe className="w-4 h-4 text-primary" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                  Publicar en Market Shop
                </Label>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {formData.isPublished 
                    ? "Visible para todos en el mercado." 
                    : "Solo visible en tu tienda (Borrador)."}
                </p>
              </div>
              <Switch 
                checked={formData.isPublished}
                onCheckedChange={(checked) => setFormData({...formData, isPublished: checked})}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex-none py-2 px-4 md:py-3 md:px-6 flex gap-3 justify-between items-center bg-background/50 backdrop-blur-sm border-t border-border/50">
        {step > 1 && (
          <Button variant="ghost" onClick={handlePrev} disabled={isLoading} className="rounded-xl h-10 text-xs">
            Atrás
          </Button>
        )}
        <div className="flex-1" />
        {step < 3 ? (
          <Button 
            className="rounded-full px-8 h-10 font-bold text-xs" 
            onClick={handleNext}
            disabled={step === 1 ? (!formData.name || !formData.category || !formData.description) : !formData.price}
          >
            Siguiente
          </Button>
        ) : (
          <Button 
            className="rounded-full px-10 h-10 font-black bg-brand-gradient text-white border-0 shadow-lg hover:shadow-xl transition-all text-xs" 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            {isEdit ? "Guardar" : "Publicar"}
          </Button>
        )}
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-premium bg-background">
          <DialogTitle className="sr-only">Publicación Rápida</DialogTitle>
          <DialogDescription className="sr-only">Completa los datos para vender tu producto.</DialogDescription>
          {formContentNode}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="p-0 overflow-hidden border-none rounded-t-[2.5rem] h-auto max-h-[90vh]">
        <SheetTitle className="sr-only">Publicación Rápida</SheetTitle>
        <SheetDescription className="sr-only">Completa los datos para vender tu producto.</SheetDescription>
        {formContentNode}
      </SheetContent>
    </Sheet>
  );
}
