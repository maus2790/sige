import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, UserCheck, UserCog, UserPlus, Store } from "lucide-react";
import { getAllUsers, getUserStats } from "@/app/actions/admin/users";
import { UserTableClient } from "@/components/admin/user-table-client";
import { requireRole } from "@/app/actions/auth";

interface UsuariosPageProps {
  searchParams: {
    page?: string;
    search?: string;
    role?: string;
  };
}

const roles = [
  { value: "todos", label: "Todos los roles" },
  { value: "seller", label: "Vendedores" },
  { value: "assistant", label: "Asistentes" },
  { value: "superadmin", label: "Super Administradores" },
];

export default async function UsuariosPage({ searchParams }: UsuariosPageProps) {
  // Verificar que el usuario es superadmin
  await requireRole("superadmin");

  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const search = params.search || "";
  const role = params.role || "todos";

  const { users, total, pageCount } = await getAllUsers(page, 10, search, role);
  const stats = await getUserStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-1">
            Administra todos los usuarios de la plataforma
          </p>
        </div>
        <Link href="/admin/usuarios/nuevo">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Usuario
          </Button>
        </Link>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total usuarios</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vendedores</p>
                <p className="text-2xl font-bold text-green-500">{stats.sellers}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Asistentes</p>
                <p className="text-2xl font-bold text-amber-500">{stats.assistants}</p>
              </div>
              <UserCog className="w-8 h-8 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Super Admins</p>
                <p className="text-2xl font-bold text-purple-500">{stats.superadmins}</p>
              </div>
              <UserPlus className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tiendas verificadas</p>
                <p className="text-2xl font-bold text-primary">{stats.verifiedSellers}</p>
              </div>
              <Store className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Usuarios</CardTitle>
          <CardDescription>
            Mostrando {users.length} de {total} usuarios en total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-96 animate-pulse bg-muted rounded-lg" />}>
            <UserTableClient
              initialData={users}
              total={total}
              pageCount={pageCount}
              initialPage={page}
              initialSearch={search}
              initialRole={role}
              roles={roles.map(r => r.label)}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}