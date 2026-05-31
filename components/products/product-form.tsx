// components/products/product-form.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createProduct } from "@/app/actions/products";
import { ImageUpload } from "@/components/upload/image-upload";

interface Category {
  id: string;
  name: string;
  slug: string;
}

const estados = [
  { value: "Nuevo", label: "Nuevo" },
  { value: "Usado", label: "Usado" },
  { value: "Refabricado", label: "Refabricado" },
];

interface ProductFormProps {
  categories: Category[];
  onSuccess?: () => void;
  onCancel?: () => void;
  formId?: string;
  onLoadingChange?: (loading: boolean) => void;
}

export function ProductForm({ categories, onSuccess, onCancel, formId, onLoadingChange }: ProductFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [fields, setFields] = useState({
    name: "",
    description: "",
    category: "",
    status: "Nuevo",
  });
  const [showExtras, setShowExtras] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    onLoadingChange?.(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.append("imageUrls", JSON.stringify(imageUrls));

    const result = await createProduct(formData);

    if (result?.error) {
      setError(result.error);
      toast.error(result.error);
      if (result.fields) {
        setFields((prev) => ({ ...prev, ...result.fields }));
      }
      setIsLoading(false);
      onLoadingChange?.(false);
      return;
    }

    toast.success("Producto creado con éxito.");
    router.refresh();
    setIsLoading(false);
    onLoadingChange?.(false);
    if (onSuccess) {
      onSuccess();
    }
  }

  return (
    <form id={formId} onSubmit={onSubmit} className="space-y-6">
      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="space-y-2 w-full">
            <Label htmlFor="name">Nombre del producto *</Label>
            <Input
              id="name"
              name="name"
              className="w-full"
              placeholder="Ej: Smartphone XYZ"
              defaultValue={fields.name}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2 w-full">
            <Label htmlFor="status">Estado del producto *</Label>
            <Select name="status" required defaultValue={fields.status}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona el estado" />
              </SelectTrigger>
              <SelectContent className="w-full">
                {estados.map((est) => (
                  <SelectItem key={est.value} value={est.value}>
                    {est.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción (opcional)</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Describe tu producto..."
            rows={5}
            defaultValue={fields.description}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2 w-full">
          <Label htmlFor="category">Categoría *</Label>
          <Select name="category" required defaultValue={fields.category}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona categoría" />
            </SelectTrigger>
            <SelectContent className="w-full">
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-sm text-muted-foreground">
                  No hay categorías disponibles
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 w-full">
          <Label>Imágenes</Label>
          <ImageUpload
            label=""
            onImagesChange={setImageUrls}
            maxImages={5}
          />
        </div>
        

        <div className="pt-3">
          <button
            type="button"
            className="text-sm text-primary underline underline-offset-2"
            onClick={() => setShowExtras((s: boolean) => !s)}
          >
            Configuraciones extras
          </button>

          {showExtras && (
            <div className="mt-3 space-y-2">
              <Label htmlFor="sku">Identificador / SKU</Label>
              <Input
                id="sku"
                name="sku"
                placeholder="Se generará automáticamente si se deja vacío"
                disabled={isLoading}
              />
            </div>
          )}
        </div>
      </div>

      {!formId && (
        <div className="flex justify-end gap-4 pt-4 border-t">
          {onCancel ? (
            <Button type="button" variant="outline" disabled={isLoading} onClick={onCancel}>
              Cancelar
            </Button>
          ) : (
            <Link href="/dashboard/productos">
              <Button type="button" variant="outline" disabled={isLoading}>
                Cancelar
              </Button>
            </Link>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : "Crear producto"}
          </Button>
        </div>
      )}
    </form>
  );
}
 
