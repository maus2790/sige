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
import { createProduct } from "@/app/actions/products";
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
}

export function QuickPublishModal({ categories, open, onOpenChange }: QuickPublishModalProps) {
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
  });

  const isDesktop = useMediaQuery("(min-width: 768px)");
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleNext = () => setStep((s) => s + 1);
  const handlePrev = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    setIsLoading(true);
    const result = await createProduct(formData);

    if (result?.error) {
      toast.error(result.error);
      setIsLoading(false);
    } else {
      toast.success("¡Producto publicado con éxito!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["store-products"] });
      
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
      });
      router.refresh();
    }
  };

  const handleImagesChange = React.useCallback((urls: string[]) => {
    setFormData(prev => ({ ...prev, imageUrls: urls }));
  }, []);

  const formContentNode = (
    <div className="flex flex-col max-h-[90vh] md:max-h-[85vh] w-full">
      <div className="flex-none bg-brand-gradient p-6 md:p-8 text-white">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white leading-none">
            Publicación Rápida
          </h2>
          <p className="text-blue-100 font-medium text-xs md:text-sm">
            Vende tu producto en segundos. Paso {step} de 2.
          </p>
        </div>
      </div>

      <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar">
        {step === 1 ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <Label className="font-bold">¿Qué estás vendiendo?</Label>
              <Input 
                placeholder="Ej: iPhone 15 Pro Max" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Categoría</Label>
              <Select 
                value={formData.category} 
                onValueChange={(v) => setFormData({...formData, category: v})}
              >
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent className="z-100">
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        ) : (
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
                onImagesChange={handleImagesChange}
                maxImages={3}
                label="Fotos del producto"
              />
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

      <div className="flex-none p-6 md:p-8 pt-4 flex gap-3 justify-between items-center bg-background/50 backdrop-blur-sm border-t border-border/50">
        {step === 2 && (
          <Button variant="ghost" onClick={handlePrev} disabled={isLoading} className="rounded-xl">
            Atrás
          </Button>
        )}
        <div className="flex-1" />
        {step === 1 ? (
          <Button 
            className="rounded-full px-8 h-12 font-bold" 
            onClick={handleNext}
            disabled={!formData.name || !formData.category || !formData.description}
          >
            Siguiente
          </Button>
        ) : (
          <Button 
            className="rounded-full px-10 h-12 font-black bg-brand-gradient text-white border-0 shadow-lg hover:shadow-xl transition-all" 
            onClick={handleSubmit}
            disabled={isLoading || !formData.price}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="w-5 h-5 mr-2" />
            )}
            Publicar Ahora
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
