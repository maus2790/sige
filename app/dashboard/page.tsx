//app/dashboard/page.tsx

import { requireRole, handleLogout } from "@/app/actions/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default async function DashboardPage() {
  // Esta función bloquea el acceso si no hay sesión o el rol no es 'seller'
  const user = await requireRole("seller");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Panel del Vendedor</h1>

        <form action={handleLogout}>
          <Button variant="outline" type="submit" className="gap-2">
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Bienvenido, {user.name}</CardTitle>
            <CardDescription>
              Gestión de tienda para {user.email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Email: {user?.email}</p>
            <p>Rol: {user?.role}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productos</CardTitle>
            <CardDescription>Gestiona tus productos</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Próximamente: Listado de productos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pedidos</CardTitle>
            <CardDescription>Revisa tus pedidos</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Próximamente: Listado de pedidos</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}