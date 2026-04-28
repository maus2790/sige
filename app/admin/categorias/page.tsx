import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Tag, Package, TrendingUp } from "lucide-react";
import { getAllCategories, getCategoriesStats } from "@/app/actions/admin/categories";
import { CategoryTableClient } from "@/components/admin/category-table-client";
import { requireRole } from "@/app/actions/auth";

interface CategoriasPageProps {
  searchParams: {
    page?: string;
    search?: string;
  };
}

export default async function CategoriasPage({ searchParams }: CategoriasPageProps) {
  await requireRole("superadmin");

  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const search = params.search || "";

  const { categories, total, pageCount } = await getAllCategories(page, 10, search);
  const stats = await getCategoriesStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Categorías</h1>
          <p className="text-muted-foreground mt-1">
            Administra las categorías de productos de la plataforma
          </p>
        </div>
        <Link href="/admin/categorias/nuevo">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nueva Categoría
          </Button>
        </Link>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total categorías</p>
                <p className="text-2xl font-bold">{stats.totalCategories}</p>
              </div>
              <Tag className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Productos categorizados</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalProductsInCategories}</p>
              </div>
              <Package className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top categoría</p>
                <p className="text-2xl font-bold text-primary truncate max-w-[150px]">
                  {stats.topCategories[0]?.name || "—"}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top categorías (mini lista) */}
      {stats.topCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Categorías más populares</CardTitle>
            <CardDescription>Las categorías con más productos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topCategories.slice(0, 5).map((cat, index) => {
                const total = stats.topCategories.reduce((acc, c) => acc + c.count, 0);
                const percentage = total > 0 ? (cat.count / total) * 100 : 0;
                return (
                  <div key={cat.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>
                        {index + 1}. {cat.name}
                      </span>
                      <span className="font-medium">{cat.count} productos</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla de categorías */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Categorías</CardTitle>
          <CardDescription>
            Mostrando {categories.length} de {total} categorías en total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-96 animate-pulse bg-slate-100 rounded-lg" />}>
            <CategoryTableClient
              initialData={categories}
              total={total}
              pageCount={pageCount}
              initialPage={page}
              initialSearch={search}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}