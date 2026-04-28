"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { createCategory } from "@/app/actions/admin/categories";

export default function NuevaCategoriaPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState({
    name: "",
    slug: "",
    icon: "",
  });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await createCategory(formData);

    if (result?.error) {
      setError(result.error);
      toast.error(result.error);
      if (result.fields) {
        setFields(result.fields);
      }
      setIsLoading(false);
    }
  }

  // Iconos sugeridos
  const suggestedIcons = ["📱", "👕", "🏠", "⚽", "📚", "🧸", "💻", "🎮", "👟", "💍", "🛋️", "🍳", "🐶", "🌱", "🎵"];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/categorias">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nueva Categoría</h1>
          <p className="text-muted-foreground mt-1">
            Crea una nueva categoría para organizar los productos
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Categoría</CardTitle>
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
                  <Label htmlFor="name">Nombre de la categoría *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Ej: Electrónicos"
                    defaultValue={fields.name}
                    required
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    El slug se generará automáticamente a partir del nombre
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug personalizado (opcional)</Label>
                  <Input
                    id="slug"
                    name="slug"
                    placeholder="electronicos"
                    defaultValue={fields.slug}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Dejar vacío para generar automáticamente. Solo letras minúsculas, números y guiones.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="icon">Icono (emoji)</Label>
                  <Input
                    id="icon"
                    name="icon"
                    placeholder="📱"
                    defaultValue={fields.icon}
                    maxLength={2}
                    disabled={isLoading}
                    className="text-2xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Iconos sugeridos</Label>
                  <div className="flex flex-wrap gap-2">
                    {suggestedIcons.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => {
                          const iconInput = document.getElementById("icon") as HTMLInputElement;
                          if (iconInput) iconInput.value = icon;
                        }}
                        className="w-10 h-10 text-2xl flex items-center justify-center bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Link href="/admin/categorias">
                <Button type="button" variant="outline" disabled={isLoading}>
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creando..." : "Crear Categoría"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}