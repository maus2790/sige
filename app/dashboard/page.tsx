import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  DollarSign,
  ShoppingBag,
  Package,
  TrendingUp,
  Eye,
  Clock,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSellerStats, getLowStockProducts } from "@/app/actions/analytics";
import { getSellerOrders } from "@/app/actions/orders";
import { StatsCard } from "@/components/analytics/stats-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { CriticalStock } from "@/components/dashboard/critical-stock";
import { cn } from "@/lib/utils";

// Helper para formato de moneda
function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: "BOB",
    minimumFractionDigits: 2,
  }).format(amount);
}

// Helper para formato de fecha relativa
function getRelativeTime(date: Date | null) {
  if (!date) return "Fecha desconocida";
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) return "Hace unos minutos";
  if (diffInHours < 24) return `Hace ${diffInHours} horas`;
  if (diffInHours < 48) return "Ayer";
  return `Hace ${Math.floor(diffInHours / 24)} días`;
}

export default async function DashboardPage() {
  const stats = await getSellerStats();
  const lowStockProducts = await getLowStockProducts();
  const ordersData = await getSellerOrders(1, 10);

  // Preparar actividades recientes
  const recentActivities = ordersData.orders.slice(0, 5).map((order) => ({
    id: order.id,
    type: "order" as const,
    title: `Nuevo pedido de ${order.buyerName}`,
    description: `${order.productName} - Cantidad: ${order.quantity} - ${formatCurrency(order.totalAmount)}`,
    time: getRelativeTime(order.createdAt),
    status: order.status ?? undefined,
    productImage: order.productImage ?? undefined,
  }));

  // Calcular tendencias (simuladas por ahora)
  const revenueTrend = stats.totalRevenue > 0 ? 12.5 : 0;
  const salesTrend = stats.totalSales > 0 ? 8.3 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Resumen</h1>
        <p className="text-muted-foreground mt-1">
          Bienvenido a tu panel de control. Aquí puedes ver el rendimiento de tu tienda.
        </p>
      </div>

      {/* Tarjetas de estadísticas principales */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Ingresos totales"
          value={formatCurrency(stats.totalRevenue)}
          icon={<DollarSign className="w-4 h-4 text-primary" />}
          description="Ventas realizadas"
          trend={revenueTrend > 0 ? { value: revenueTrend, isPositive: true } : undefined}
        />
        <StatsCard
          title="Ventas"
          value={stats.totalSales}
          icon={<ShoppingBag className="w-4 h-4 text-primary" />}
          description="Órdenes completadas"
          trend={salesTrend > 0 ? { value: salesTrend, isPositive: true } : undefined}
        />
        <StatsCard
          title="Productos"
          value={stats.totalProducts}
          icon={<Package className="w-4 h-4 text-primary" />}
          description="En tu tienda"
        />
        <StatsCard
          title="Ticket promedio"
          value={formatCurrency(stats.averageOrderValue)}
          icon={<TrendingUp className="w-4 h-4 text-primary" />}
          description="Por orden"
        />
      </div>

      {/* Segunda fila de métricas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendientes
            </CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Por verificar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stock bajo
            </CardTitle>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              stats.lowStockProducts > 0 ? "text-amber-500" : ""
            )}>
              {stats.lowStockProducts}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Productos con &lt;5 unidades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Visitas
            </CardTitle>
            <Eye className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.topProducts.reduce((acc, p) => acc + (p.sales * 50), 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Estimado (próximamente)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversión
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalProducts > 0
                ? ((stats.totalSales / stats.totalProducts) * 10).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tasa de conversión
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Productos más vendidos (mini versión) */}
      {stats.topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Productos más vendidos</CardTitle>
            <CardDescription>Los productos que generan más ingresos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.topProducts.slice(0, 4).map((product) => (
                <div key={product.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{product.sales} vendidos</span>
                      <span className="text-primary font-medium">
                        {formatCurrency(product.revenue)}
                      </span>
                    </div>
                  </div>
                  <Link href={`/dashboard/productos/${product.id}/editar`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
            {stats.topProducts.length > 4 && (
              <div className="mt-4 pt-4 border-t text-center">
                <Link href="/dashboard/analytics">
                  <Button variant="link" size="sm">
                    Ver todos los productos
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Grid de actividades y stock crítico */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Suspense fallback={<div className="h-96 animate-pulse bg-muted rounded-lg" />}>
          <RecentActivity activities={recentActivities} />
        </Suspense>
        <Suspense fallback={<div className="h-96 animate-pulse bg-muted rounded-lg" />}>
          <CriticalStock products={lowStockProducts as any} />
        </Suspense>
      </div>

      {/* Acciones rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones rápidas</CardTitle>
          <CardDescription>Agiliza tus tareas diarias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/dashboard/productos/nuevo">
              <Button variant="outline" className="w-full gap-2">
                <Package className="w-4 h-4" />
                Nuevo producto
              </Button>
            </Link>
            <Link href="/dashboard/inventario">
              <Button variant="outline" className="w-full gap-2">
                <TrendingUp className="w-4 h-4" />
                Actualizar stock
              </Button>
            </Link>
            <Link href="/dashboard/pedidos">
              <Button variant="outline" className="w-full gap-2">
                <ShoppingBag className="w-4 h-4" />
                Ver pedidos
              </Button>
            </Link>
            <Link href="/dashboard/analytics">
              <Button variant="outline" className="w-full gap-2">
                <TrendingUp className="w-4 h-4" />
                Ver reportes
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}