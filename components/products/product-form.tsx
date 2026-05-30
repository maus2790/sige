// components/products/product-form.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createProduct, getSellerStoreSku } from "@/app/actions/products";
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
}

export function ProductForm({ categories, onSuccess, onCancel }: ProductFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [storeSku, setStoreSku] = useState<string>("");
  const [fields, setFields] = useState({
    name: "",
    description: "",
    category: "",
    status: "Nuevo",
  });

  useEffect(() => {
    getSellerStoreSku().then((sku) => setStoreSku(sku || "")).catch(console.error);
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
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
      return;
    }

    toast.success("Producto creado con éxito.");
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
                maxLength={4}
                pattern="[A-Za-z0-9]{4}"
                placeholder="Auto"
                disabled={isLoading}
                className="rounded-l-none font-mono uppercase"
                onInput={(event) => {
                  event.currentTarget.value = event.currentTarget.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 4);
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">Dejalo vacio para generarlo automaticamente.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre del producto *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Ej: Smartphone XYZ"
              defaultValue={fields.name}
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
            placeholder="Describe tu producto..."
            rows={5}
            defaultValue={fields.description}
            required
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="space-y-2 w-4/5">
            <Label htmlFor="category">Categoría *</Label>
            <Select name="category" required defaultValue={fields.category}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona categoría" />
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
            <Select name="status" required defaultValue={fields.status}>
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
        </div>

        <div className="pt-4">
          <ImageUpload
            onImagesChange={setImageUrls}
            maxImages={5}
          />
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
              {isLoading ? "Creando..." : "Crear Producto"}
            </Button>
          </div>
        </form>
  );
}
