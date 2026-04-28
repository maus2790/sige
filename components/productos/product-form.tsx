"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProductFormProps {
  initialData?: {
    id?: string;
    name: string;
    description: string;
    price: number;
    stockActual: number;
    stockMinimo: number;
    ubicacion?: string;
    category: string;
  };
  onSubmit: (formData: FormData) => Promise<void>;
  isLoading: boolean;
}

const categorias = [
  { value: "Electrónicos", label: "Electrónicos" },
  { value: "Ropa", label: "Ropa" },
  { value: "Hogar", label: "Hogar" },
  { value: "Deportes", label: "Deportes" },
  { value: "Libros", label: "Libros" },
  { value: "Juguetes", label: "Juguetes" },
];

export function ProductForm({ initialData, onSubmit, isLoading }: ProductFormProps) {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    await onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nombre del producto *</Label>
        <Input
          id="name"
          name="name"
          placeholder="Ej: Smartphone XYZ"
          defaultValue={initialData?.name}
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
          defaultValue={initialData?.description}
          required
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Precio (Bs.) *</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            placeholder="99.99"
            defaultValue={initialData?.price}
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stockActual">Stock Actual *</Label>
          <Input
            id="stockActual"
            name="stockActual"
            type="number"
            placeholder="10"
            defaultValue={initialData?.stockActual}
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="stockMinimo">Stock Mínimo *</Label>
          <Input
            id="stockMinimo"
            name="stockMinimo"
            type="number"
            placeholder="5"
            defaultValue={initialData?.stockMinimo ?? 5}
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ubicacion">Ubicación</Label>
          <Input
            id="ubicacion"
            name="ubicacion"
            placeholder="Pasillo A, Estante 3"
            defaultValue={initialData?.ubicacion}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Categoría *</Label>
        <Select name="category" required defaultValue={initialData?.category}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una categoría" />
          </SelectTrigger>
          <SelectContent>
            {categorias.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={isLoading}>
          {initialData?.id ? "Actualizar" : "Crear Producto"}
        </Button>
      </div>
    </form>
  );
}