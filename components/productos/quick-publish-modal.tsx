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
import { Package, Image as ImageIcon, Plus, Loader2, CheckCircle2 } from "lucide-react";
import { createProduct } from "@/app/actions/products";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ImageUpload } from "../upload/image-upload";

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
  });

  const router = useRouter();

  const handleNext = () => setStep((s) => s + 1);
  const handlePrev = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    setIsLoading(true);
    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description);
    data.append("category", formData.category);
    data.append("price", formData.price);
    data.append("stock", formData.stock);
    data.append("imageUrls", JSON.stringify(formData.imageUrls));

    const result = await createProduct(data);

    if (result?.error) {
      toast.error(result.error);
      setIsLoading(false);
    } else {
      toast.success("¡Producto publicado con éxito!");
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
      });
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-4xl p-0 overflow-hidden border-none shadow-premium">
        <div className="bg-brand-gradient p-8 text-white">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black tracking-tight text-white">
              Publicación Rápida
            </DialogTitle>
            <DialogDescription className="text-blue-100 font-medium">
              Vende tu producto en segundos. Paso {step} de 2.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-6">
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
                  <SelectContent>
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
                  onImagesChange={(urls) => setFormData({...formData, imageUrls: urls})}
                  maxImages={3}
                  label="Fotos del producto"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-8 pt-0 flex gap-3 sm:justify-between items-center">
          {step === 2 && (
            <Button variant="ghost" onClick={handlePrev} disabled={isLoading}>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
