// components/products/product-form.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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

export function ProductForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(true);
  const [fields, setFields] = useState({
    name: "",
    description: "",
    category: "",
    status: "Nuevo",
  });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.append("imageUrls", JSON.stringify(imageUrls));
    formData.append("isPublished", isPublished.toString());

    const result = await createProduct(formData);

    if (result?.error) {
      setError(result.error);
      toast.error(result.error);
      if (result.fields) {
        setFields(prev => ({ ...prev, ...result.fields }));
      }
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información del Producto</CardTitle>
        <CardDescription>
          Los campos marcados con * son obligatorios
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          {error && (
            <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sku">Identificador / SKU</Label>
                <Input
                  id="sku"
                  name="sku"
                  placeholder="Ej: PROD-001"
                  disabled={isLoading}
                />
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

              <div className="space-y-2">
                <Label htmlFor="price">Precio (Bs.) *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoría *</Label>
                <Select name="category" required defaultValue={fields.category}>
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

              <div className="space-y-2">
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

              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                <div className="space-y-0.5">
                  <Label className="text-base">Publicar producto</Label>
                  <p className="text-sm text-muted-foreground">
                    El producto será visible para todos los usuarios.
                  </p>
                </div>
                <Switch
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
              </div>

              <div className="pt-4">
                <ImageUpload
                  onImagesChange={setImageUrls}
                  maxImages={5}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <Link href="/dashboard/productos">
              <Button type="button" variant="outline" disabled={isLoading}>
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creando..." : "Crear Producto"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
