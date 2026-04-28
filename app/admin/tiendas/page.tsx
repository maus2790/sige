import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Store, CheckCircle, Clock, Building2, TrendingUp } from "lucide-react";
import { getAllStores, getStoresStats } from "@/app/actions/admin/stores";
import { StoreTableClient } from "@/components/admin/store-table-client";
import { requireRole } from "@/app/actions/auth";

interface TiendasPageProps {
  searchParams: {
    page?: string;
    search?: string;
    verified?: string;
  };
}

export default async function TiendasPage({ searchParams }: TiendasPageProps) {
  // Verificar que el usuario es superadmin
  await requireRole("superadmin");

  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const search = params.search || "";
  const verifiedParam = params.verified || "todos";

  let verifiedFilter: boolean | undefined = undefined;
  if (verifiedParam === "verified") verifiedFilter = true;
  if (verifiedParam === "pending") verifiedFilter = false;

  const { stores, total, pageCount } = await getAllStores(page, 10, search, verifiedFilter);
  const stats = await getStoresStats();

  // Calcular porcentaje de verificación
  const verificationRate = stats.totalStores > 0 
    ? ((stats.verifiedStores / stats.totalStores) * 100).toFixed(1) 
    : "0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Tiendas</h1>
        <p className="text-muted-foreground mt-1">
          Administra y verifica las tiendas registradas en la plataforma
        </p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total tiendas</p>
                <p className="text-2xl font-bold">{stats.totalStores}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Verificadas</p>
                <p className="text-2xl font-bold text-green-600">{stats.verifiedStores}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingStores}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasa verificación</p>
                <p className="text-2xl font-bold text-primary">{verificationRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Verificadas hoy</p>
                <p className="text-2xl font-bold">{stats.verifiedToday}</p>
              </div>
              <Store className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de tiendas */}
      <Card>
        <CardContent className="p-6">
          <Suspense fallback={<div className="h-96 animate-pulse bg-slate-100 rounded-lg" />}>
            <StoreTableClient
              initialData={stores}
              total={total}
              pageCount={pageCount}
              initialPage={page}
              initialSearch={search}
              initialVerified={verifiedParam}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}