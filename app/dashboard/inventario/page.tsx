// app/dashboard/inventario/page.tsx

import { getSellerProductsPaginated } from "@/app/actions/products";
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

  const categories = [
    "Electrónicos",
    "Ropa",
    "Hogar",
    "Deportes",
    "Libros",
    "Juguetes",
  ];

  // Estadísticas rápidas
  const lowStockCount = products.filter(p => 
    p.inventory && p.inventory.stockActual <= p.inventory.stockMinimo && p.inventory.stockActual > 0
  ).length;

  const outOfStockCount = products.filter(p => 
    p.inventory && p.inventory.stockActual === 0
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Warehouse className="w-8 h-8 text-primary" />
            Gestión de Inventario
          </h1>
          <p className="text-muted-foreground mt-1">
            Supervisa tus existencias, controla el stock mínimo y gestiona las ubicaciones de tus productos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white">
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

        <Card className="bg-red-50/50 border-red-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Stock Bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{lowStockCount}</div>
            <p className="text-xs text-red-600 mt-1">Productos por debajo del mínimo</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Agotados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{outOfStockCount}</div>
            <p className="text-xs text-slate-500 mt-1">Sin unidades disponibles</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Control de Existencias</CardTitle>
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
            categories={categories}
          />
        </CardContent>
      </Card>
    </div>
  );
}
