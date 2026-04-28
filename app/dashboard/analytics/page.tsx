import {
  DollarSign,
  ShoppingBag,
  Package,
  Clock,
  TrendingUp,
  AlertCircle,
  Download,
} from "lucide-react";
import {
  getSellerStats,
  getSalesByMonth,
  getLowStockProducts,
} from "@/app/actions/analytics";
import { StatsCard } from "@/components/analytics/stats-card";
import { SalesChart, CategoryPieChart } from "@/components/analytics/sales-chart";
import { TopProducts } from "@/components/analytics/top-products";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function AnalyticsPage() {
  const stats = await getSellerStats();
  const monthlySales = await getSalesByMonth();
  const lowStockProducts = await getLowStockProducts();

  // Preparar datos para gráficos
  const salesData = stats.salesByDay.map((day) => ({
    date: day.date,
    total: day.total,
  }));

  const categoryData = stats.salesByCategory
    .filter((c) => c.revenue > 0)
    .map((c) => ({
      category: c.category,
      revenue: c.revenue,
    }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Análisis detallado de tu negocio
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Exportar reporte
        </Button>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Ingresos totales"
          value={`Bs. ${stats.totalRevenue.toFixed(2)}`}
          icon={<DollarSign className="w-4 h-4 text-primary" />}
          description="Ventas realizadas"
        />
        <StatsCard
          title="Ventas"
          value={stats.totalSales}
          icon={<ShoppingBag className="w-4 h-4 text-primary" />}
          description="Órdenes completadas"
        />
        <StatsCard
          title="Productos"
          value={stats.totalProducts}
          icon={<Package className="w-4 h-4 text-primary" />}
          description="En tu tienda"
        />
        <StatsCard
          title="Ticket promedio"
          value={`Bs. ${stats.averageOrderValue.toFixed(2)}`}
          icon={<TrendingUp className="w-4 h-4 text-primary" />}
          description="Por orden"
        />
        <StatsCard
          title="Pendientes"
          value={stats.pendingOrders}
          icon={<Clock className="w-4 h-4 text-primary" />}
          description="Por verificar"
          className={stats.pendingOrders > 0 ? "border-yellow-500" : ""}
        />
      </div>

      {/* Alerta de stock bajo */}
      {stats.lowStockProducts > 0 && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="w-5 h-5" />
              <div>
                <span className="font-semibold">¡Atención!</span>
                <span className="ml-2">
                  Tienes {stats.lowStockProducts} producto(s) con stock bajo.
                  {lowStockProducts.length > 0 && (
                    <ul className="mt-2 text-sm">
                      {lowStockProducts.slice(0, 3).map((product) => (
                        <li key={product.id}>• {product.name} (Stock: {product.stockActual})</li>
                      ))}
                      {lowStockProducts.length > 3 && (
                        <li>• y {lowStockProducts.length - 3} más...</li>
                      )}
                    </ul>
                  )}
                </span>
              </div>
              <Link href="/dashboard/inventario" className="ml-auto">
                <Button size="sm" variant="outline">
                  Ver inventario
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de ventas diarias */}
      <SalesChart
        data={salesData}
        title="Ventas diarias"
        description="Últimos 7 días"
        type="area"
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Ventas mensuales */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas mensuales</CardTitle>
            <CardDescription>Resumen de ventas por mes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlySales
                .filter((m) => m.total > 0)
                .map((month) => (
                  <div key={month.month} className="flex items-center gap-4">
                    <div className="w-12 text-sm font-medium">{month.month}</div>
                    <div className="flex-1 bg-slate-100 rounded-full h-8 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full flex items-center justify-end px-2 text-xs text-white"
                        style={{
                          width: `${Math.min(
                            100,
                            (month.total / Math.max(...monthlySales.map((m) => m.total), 1)) * 100
                          )}%`,
                        }}
                      >
                        {month.total > 0 && `Bs. ${month.total.toFixed(0)}`}
                      </div>
                    </div>
                    <div className="w-16 text-right text-sm">
                      {month.count} ventas
                    </div>
                  </div>
                ))}
              {monthlySales.every((m) => m.total === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Aún no hay ventas este año</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top productos */}
        <TopProducts products={stats.topProducts} />
      </div>

      {/* Gráfico de categorías */}
      {categoryData.length > 0 && <CategoryPieChart data={categoryData} />}

      {/* Métricas adicionales */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Métricas de productividad</CardTitle>
            <CardDescription>Rendimiento de tu tienda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Conversión de productos</span>
                  <span className="font-medium">
                    {stats.totalProducts > 0
                      ? ((stats.topProducts[0]?.sales || 0) / stats.totalProducts).toFixed(1)
                      : 0}{" "}
                    ventas/producto
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-primary rounded-full h-2"
                    style={{
                      width: `${Math.min(
                        100,
                        ((stats.topProducts[0]?.sales || 0) / stats.totalProducts) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Productividad de inventario</span>
                  <span className="font-medium">
                    {stats.totalProducts > 0
                      ? (stats.totalSales / stats.totalProducts).toFixed(1)
                      : 0}{" "}
                    ventas/producto
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-primary rounded-full h-2"
                    style={{
                      width: `${Math.min(
                        100,
                        ((stats.totalSales / stats.totalProducts) / 10) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado de la tienda</CardTitle>
            <CardDescription>Resumen rápido</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span>Productos publicados</span>
              <Badge variant="default">{stats.totalProducts}</Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span>Productos con stock bajo</span>
              <Badge variant={stats.lowStockProducts > 0 ? "destructive" : "secondary"}>
                {stats.lowStockProducts}
              </Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span>Órdenes pendientes</span>
              <Badge variant={stats.pendingOrders > 0 ? "destructive" : "default"}>
                {stats.pendingOrders}
              </Badge>
            </div>
            <div className="flex justify-between items-center py-2">
              <span>Total de clientes únicos</span>
              <Badge variant="outline">
                {/* Aquí podrías agregar el conteo de clientes únicos */}
                Próximamente
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}