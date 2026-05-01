// app/dashboard/inventario/page.tsx

import { getSellerProductsPaginated } from "@/app/actions/products";
import { getCategories } from "@/app/actions/categories";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InventoryTableClient } from "@/components/inventory/inventory-table-client";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, Warehouse } from "lucide-react";

interface InventarioPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    category?: string;
    lowStock?: string;
  }>;
}

export default async function InventarioPage({ searchParams }: InventarioPageProps) {
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

  // Estadísticas rápidas
  const lowStockCount = products.filter(p => 
    p.inventory && p.inventory.stockActual <= p.inventory.stockMinimo && p.inventory.stockActual > 0
  ).length;

  const outOfStockCount = products.filter(p => 
    p.inventory && p.inventory.stockActual === 0
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Warehouse className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            Gestión de Disponibilidad
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Supervisa tus existencias, controla el stock mínimo y gestiona las ubicaciones de tus productos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="w-4 h-4" />
              Total Productos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>

        <Card className="bg-destructive/10 border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Stock Bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockCount}</div>
            <p className="text-xs text-destructive/80 mt-1">Productos por debajo del mínimo</p>
          </CardContent>
        </Card>

        <Card className="bg-muted/50 border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="w-4 h-4" />
              Agotados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{outOfStockCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Sin unidades disponibles</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estado de Inventario</CardTitle>
          <CardDescription>
            Usa los filtros para encontrar productos con poco stock o buscar por ubicación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InventoryTableClient
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
