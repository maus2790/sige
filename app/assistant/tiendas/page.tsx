"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Store, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2,
  Eye,
  Search,
  Users,
  Building2,
  Star,
  Phone,
  MapPin,
  Mail
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllStores, getStoresStats, verifyStore } from "@/app/actions/stores";

interface StoreWithUser {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  logoUrl: string | null;
  verified: boolean;
  rating: number | null;
  createdAt: Date;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function TiendasPage() {
  const [stores, setStores] = useState<StoreWithUser[]>([]);
  const [stats, setStats] = useState({
    totalStores: 0,
    verifiedStores: 0,
    pendingStores: 0,
    activeSellers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function loadStores() {
    setIsLoading(true);
    const verifiedFilter = statusFilter === "verified" ? true : statusFilter === "pending" ? false : undefined;
    const data = await getAllStores(page, 10, searchTerm, verifiedFilter);
    setStores(data.stores as StoreWithUser[]);
    setPageCount(data.pageCount);
    setIsLoading(false);
  }

  async function loadStats() {
    const data = await getStoresStats();
    setStats(data);
  }

  useEffect(() => {
    loadStores();
    loadStats();
  }, [page, searchTerm, statusFilter]);

  async function handleVerify(storeId: string, verified: boolean) {
    setProcessingId(storeId);
    const result = await verifyStore(storeId, verified);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.message);
      await loadStores();
      await loadStats();
    }
    
    setProcessingId(null);
  }

  const getStatusBadge = (verified: boolean) => {
    if (verified) {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Verificada</Badge>;
    }
    return <Badge variant="destructive">Pendiente</Badge>;
  };

  if (isLoading && page === 1) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex flex-col md:flex-row gap-4 mt-6">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-full md:w-64" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Tiendas</h1>
        <p className="text-muted-foreground mt-1">
          Administra y verifica las tiendas registradas en la plataforma
        </p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <AlertCircle className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vendedores activos</p>
                <p className="text-2xl font-bold">{stats.activeSellers}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre de tienda, vendedor o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="verified">Verificadas</TabsTrigger>
            <TabsTrigger value="pending">Pendientes</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Lista de tiendas */}
      {stores.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Store className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hay tiendas</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "No se encontraron tiendas con esos criterios." : "Aún no hay tiendas registradas en la plataforma."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {stores.map((store) => (
            <Card key={store.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Logo de la tienda */}
                  <div className="shrink-0">
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-linear-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      {store.logoUrl ? (
                        <Image
                          src={store.logoUrl}
                          alt={store.name}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Store className="w-12 h-12 text-primary/50" />
                      )}
                    </div>
                  </div>

                  {/* Información de la tienda */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-xl font-semibold">{store.name}</h3>
                      {getStatusBadge(store.verified)}
                      {store.rating && store.rating > 0 && (
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-medium">{store.rating}</span>
                        </div>
                      )}
                    </div>

                    {store.description && (
                      <p className="text-muted-foreground line-clamp-2">{store.description}</p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      {store.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{store.phone}</span>
                        </div>
                      )}
                      {store.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="truncate">{store.address}</span>
                        </div>
                      )}
                      {store.user.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{store.user.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Vendedor: {store.user.name}</span>
                      <span>Registrado: {new Date(store.createdAt).toLocaleDateString("es-BO")}</span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-row lg:flex-col gap-2">
                    <Link href={`/assistant/tiendas/${store.id}`}>
                      <Button variant="outline" size="sm" className="w-full lg:w-auto gap-2">
                        <Eye className="w-4 h-4" />
                        Ver detalles
                      </Button>
                    </Link>
                    
                    {!store.verified && (
                      <Button
                        size="sm"
                        className="gap-2"
                        onClick={() => handleVerify(store.id, true)}
                        disabled={processingId === store.id}
                      >
                        {processingId === store.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        Verificar tienda
                      </Button>
                    )}
                    
                    {store.verified && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                        onClick={() => handleVerify(store.id, false)}
                        disabled={processingId === store.id}
                      >
                        {processingId === store.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        Cancelar verificación
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Paginación */}
      {pageCount > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <span className="flex items-center px-4 text-sm">
            Página {page} de {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page === pageCount}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}