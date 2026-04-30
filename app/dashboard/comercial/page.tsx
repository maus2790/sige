// app/dashboard/comercial/page.tsx

import { getSellerProductsPaginated } from "@/app/actions/products";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ComercialTableClient } from "@/components/comercial/comercial-table-client";
import { Banknote, Package, TrendingUp } from "lucide-react";

interface ComercialPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    category?: string;
  }>;
}

export default async function ComercialPage({ searchParams }: ComercialPageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const search = params.search || "";
  const category = params.category || "todos";

  const { products, total, pageCount } = await getSellerProductsPaginated({
    page,
    limit: 10,
    search,
    category,
  });

  const categories = [
    "Electrónicos",
    "Ropa",
    "Hogar",
    "Deportes",
    "Libros",
    "Juguetes",
  ];

  // Estadísticas rápidas comerciales
  const totalValue = products.reduce((acc, p) => acc + ((p as any).price * (p as any).stock), 0);
  const productsInOffer = products.filter(p => (p as any).oferta > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Banknote className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            Gestión Comercial
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Controla tus precios, ofertas, costos de adquisición y visibilidad de productos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="w-4 h-4" />
              Productos Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Valor de Inventario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">Bs. {totalValue.toLocaleString()}</div>
            <p className="text-xs text-primary/70 mt-1">Precio de venta estimado</p>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600 flex items-center gap-2">
              <Package className="w-4 h-4" />
              En Oferta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{productsInOffer}</div>
            <p className="text-xs text-amber-600/80 mt-1">Productos con descuento activo</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado Comercial</CardTitle>
          <CardDescription>
            Gestiona los valores económicos de tus productos. Los precios de adquisición son privados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ComercialTableClient
            initialData={products}
            total={total}
            pageCount={pageCount}
            initialPage={page}
            initialSearch={search}
            initialCategory={category}
            categories={categories}
          />
        </CardContent>
      </Card>
    </div>
  );
}
