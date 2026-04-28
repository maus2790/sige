"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Package, Trash2, AlertTriangle } from "lucide-react";
import { getCategoryById, updateCategory, deleteCategory } from "@/app/actions/admin/categories";

export default function EditarCategoriaPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [category, setCategory] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    async function loadCategory() {
      const data = await getCategoryById(categoryId);
      if (!data) {
        toast.error("Categoría no encontrada");
        router.push("/admin/categorias");
        return;
      }
      setCategory(data);
      setIsLoading(false);
    }
    loadCategory();
  }, [categoryId, router]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await updateCategory(categoryId, formData);

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
    } else {
      toast.success(result.message);
      // Recargar datos
      const updated = await getCategoryById(categoryId);
      setCategory(updated);
    }

    setIsSaving(false);
  }

  async function handleDelete() {
    setIsDeleting(true);
    const result = await deleteCategory(categoryId);
    
    if (result.error) {
      toast.error(result.error);
      setIsDeleting(false);
      setShowDeleteDialog(false);
    } else {
      toast.success("Categoría eliminada correctamente");
      router.push("/admin/categorias");
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!category) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/categorias">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Editar Categoría</h1>
            <p className="text-muted-foreground mt-1">
              Modifica la información de la categoría
            </p>
          </div>
        </div>
        
        {category.productsCount === 0 && (
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
            className="gap-2"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Eliminar categoría
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Formulario de edición */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Información de la Categoría</CardTitle>
              <CardDescription>Actualiza los datos de la categoría</CardDescription>
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
                        defaultValue={category.name}
                        required
                        disabled={isSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug</Label>
                      <Input
                        id="slug"
                        name="slug"
                        defaultValue={category.slug}
                        disabled={isSaving}
                      />
                      <p className="text-xs text-muted-foreground">
                        URL amigable para la categoría
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="icon">Icono (emoji)</Label>
                      <Input
                        id="icon"
                        name="icon"
                        defaultValue={category.icon || ""}
                        maxLength={2}
                        disabled={isSaving}
                        className="text-2xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Vista previa</Label>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className="text-4xl">{category.icon || "📁"}</div>
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Slug: {category.slug}
                          </p>
                        </div>
                        <Badge variant="secondary" className="ml-auto">
                          {category.productsCount} productos
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t">
                  <Link href="/admin/categorias">
                    <Button type="button" variant="outline" disabled={isSaving}>
                      Cancelar
                    </Button>
                  </Link>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Productos asociados */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Productos asociados</CardTitle>
              <CardDescription>
                {category.productsCount} producto{category.productsCount !== 1 ? "s" : ""} en esta categoría
              </CardDescription>
            </CardHeader>
            <CardContent>
              {category.sampleProducts && category.sampleProducts.length > 0 ? (
                <div className="space-y-3">
                  {category.sampleProducts.map((product: any) => (
                    <div key={product.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">Bs. {product.price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                  {category.productsCount > 5 && (
                    <p className="text-center text-sm text-muted-foreground pt-2">
                      y {category.productsCount - 5} más...
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay productos en esta categoría</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Diálogo de confirmación de eliminación */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Eliminar categoría
              </CardTitle>
              <CardDescription>
                ¿Estás seguro de que deseas eliminar la categoría "{category.name}"?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Esta acción no se puede deshacer. Los productos no se eliminarán, 
                solo quedarán sin categoría asignada.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Eliminar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}