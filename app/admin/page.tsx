// app/admin/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Store, Tags, ShieldAlert, CheckCircle } from "lucide-react";
import { db } from "@/db";
import { users, stores } from "@/db/schema";
import { sql } from "drizzle-orm";

export default async function AdminDashboardPage() {
  const userCount = await db.select({ count: sql<number>`count(*)` }).from(users).get();
  const storeCount = await db.select({ count: sql<number>`count(*)` }).from(stores).get();

  const stats = [
    {
      title: "Total Usuarios",
      value: userCount?.count || 0,
      description: "Usuarios registrados en la plataforma",
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Total Tiendas",
      value: storeCount?.count || 0,
      description: "Tiendas creadas",
      icon: Store,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Verificaciones Pendientes",
      value: 0,
      description: "Tiendas esperando aprobación",
      icon: ShieldAlert,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <p className="text-muted-foreground mt-1">
          Bienvenido al centro de control de SIGE.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`${stat.bg} p-2 rounded-lg`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimos eventos globales del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground py-8 text-center">
              No hay actividad reciente para mostrar.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado del Sistema</CardTitle>
            <CardDescription>Salud de los servicios y base de datos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                "Base de Datos (Turso)",
                "Servicio de Autenticación",
                "Almacenamiento de Imágenes",
              ].map((service) => (
                <div key={service} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{service}</span>
                  <span className="flex items-center gap-1 text-xs bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-0.5 rounded-full font-semibold">
                    <CheckCircle className="w-3 h-3" />
                    Operacional
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
