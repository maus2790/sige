// components/products/edit-product-form.tsx

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
import { updateProduct } from "@/app/actions/products";
import { ImageUpload } from "@/components/upload/image-upload";
import { getProductSkuSegment, getStoreSkuSegment } from "@/lib/sku";

type ProductData = Record<string, unknown> & {
  id: string;
  name?: string;
  imageUrls?: string[];
  category?: string;
  status?: string;
  description?: string;
  sku?: string;
};

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

interface EditProductFormProps {
  product: ProductData;
  categories: Category[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EditProductForm({ product, categories, onSuccess, onCancel }: EditProductFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>(product.imageUrls || []);
  const storeSku = getStoreSkuSegment(product.sku);
  const productSku = getProductSkuSegment(product.sku);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.append("imageUrls", JSON.stringify(imageUrls));

    const result = await updateProduct(product.id, formData);

    if (result?.error) {
      setError(result.error);
      toast.error(result.error);
      setIsLoading(false);
      return;
    }

    toast.success("Producto actualizado con éxito.");
    router.refresh();
    setIsLoading(false);
    if (onSuccess) {
      onSuccess();
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="sku">SKU del producto</Label>
            <div className="flex">
              <div className="flex h-9 items-center rounded-l-md border border-r-0 bg-muted px-3 font-mono text-sm text-muted-foreground">
                {storeSku || "----"}-
              </div>
              <Input
                id="sku"
                name="sku"
                defaultValue={productSku}
                maxLength={4}
                pattern="[A-Za-z0-9]{4}"
                placeholder="Ej: 21FG"
                disabled={isLoading}
                className="rounded-l-none font-mono uppercase"
                onInput={(event) => {
                  event.currentTarget.value = event.currentTarget.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 4);
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre del producto *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={product.name}
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción *</Label>
          <Textarea
            id="description"
            name="description"
            rows={5}
            defaultValue={product.description}
            required
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="space-y-2 w-4/5">
            <Label htmlFor="category">Categoría *</Label>
            <Select name="category" required defaultValue={product.category}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
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

          <div className="space-y-2 justify-self-start w-full">
            <Label htmlFor="status">Estado del producto *</Label>
            <Select name="status" required defaultValue={product.status || "Nuevo"}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el estado" />
              </SelectTrigger>
              <SelectContent>
                {estados.map((est) => (
                  <SelectItem key={est.value} value={est.value}>
                    {est.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4">
            <ImageUpload
              onImagesChange={setImageUrls}
              initialImages={imageUrls}
              maxImages={5}
            />
          </div>
        </div>
      </div>

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
          {isLoading ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  );
}
