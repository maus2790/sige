// app/dashboard/productos/page.tsx

import { getSellerProductsPaginated } from "@/app/actions/products";
import { getCategories } from "@/app/actions/categories";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { ProductToastHandler } from "@/components/products/product-toast-handler";
import { ProductsTableClient } from "@/components/products/products-table-client";

interface ProductosPageProps {
  searchParams: {
    page?: string;
    search?: string;
    category?: string;
    lowStock?: string;
  };
}

export default async function ProductosPage({ searchParams }: ProductosPageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const search = params.search || "";
  const category = params.category || "todos";
  const lowStock = params.lowStock === "true";

  const { products, total, pageCount } = await getSellerProductsPaginated({
    page,
    limit: 10,
    search,
    category,
    lowStock,
  });

  const dbCategories = await getCategories();
  const categoriesList = dbCategories.map(c => c.name);

  return (
    <div className="space-y-6">
      <ProductToastHandler />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Productos</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona el inventario y visibilidad de tus productos
          </p>
        </div>
        <Link href="/dashboard/productos/nuevo">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Productos</CardTitle>
          <CardDescription>
            Mostrando {products.length} de {total} productos en total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductsTableClient
            initialData={products}
            total={total}
            pageCount={pageCount}
            initialPage={page}
            initialSearch={search}
            initialCategory={category}
            initialLowStock={lowStock}
            categories={categoriesList}
          />
        </CardContent>
      </Card>
    </div>
  );
}