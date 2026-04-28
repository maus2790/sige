"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Store, Phone, MapPin, Mail, Calendar, DollarSign, Package, ShoppingBag, CheckCircle, XCircle } from "lucide-react";
import { getStoreById, verifyStore } from "@/app/actions/admin/stores";

export default function StoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.id as string;

  const [store, setStore] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    async function loadStore() {
      const data = await getStoreById(storeId);
      if (!data) {
        toast.error("Tienda no encontrada");
        router.push("/admin/tiendas");
        return;
      }
      setStore(data);
      setIsLoading(false);
    }
    loadStore();
  }, [storeId, router]);

  async function handleVerify(verified: boolean) {
    setIsVerifying(true);
    const result = await verifyStore(storeId, verified);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.message);
      // Recargar datos
      const updated = await getStoreById(storeId);
      setStore(updated);
    }
    setIsVerifying(false);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!store) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/tiendas">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{store.name}</h1>
          <p className="text-muted-foreground mt-1">
            Información detallada de la tienda
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Información de la tienda */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Información de la tienda</CardTitle>
                {store.verified ? (
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verificada
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="w-3 h-3 mr-1" />
                    Pendiente
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                  {store.logoUrl ? (
                    <Image
                      src={store.logoUrl}
                      alt={store.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{store.name}</h3>
                  {store.rating && store.rating > 0 && (
                    <div className="flex items-center gap-1 text-yellow-500 mt-1">
                      <span>★</span>
                      <span>{store.rating}</span>
                    </div>
                  )}
                </div>
              </div>

              {store.description && (
                <div>
                  <h4 className="font-semibold mb-2">Descripción</h4>
                  <p className="text-muted-foreground">{store.description}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                {store.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{store.phone}</span>
                  </div>
                )}
                {store.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{store.address}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                <Calendar className="w-4 h-4" />
                <span>Registrada el {new Date(store.createdAt).toLocaleDateString("es-BO")}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estadísticas</CardTitle>
              <CardDescription>Métricas de rendimiento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Productos</p>
                  <p className="text-2xl font-bold">{store.productsCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Órdenes</p>
                  <p className="text-2xl font-bold">{store.totalOrders}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ingresos</p>
                  <p className="text-2xl font-bold text-primary">Bs. {store.totalRevenue.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-600">{store.pendingOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {store.recentProducts && store.recentProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Productos recientes</CardTitle>
                <CardDescription>Últimos productos publicados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {store.recentProducts.map((product: any) => (
                    <div key={product.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">Bs. {product.price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Columna derecha - Acciones */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
              <CardDescription>Gestionar el estado de la tienda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!store.verified ? (
                <Button
                  className="w-full gap-2"
                  onClick={() => handleVerify(true)}
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Verificar tienda
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  className="w-full gap-2"
                  onClick={() => handleVerify(false)}
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  Cancelar verificación
                </Button>
              )}

              <Link href={`/tiendas/${store.id}`} target="_blank">
                <Button variant="outline" className="w-full gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Ver tienda pública
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vendedor</CardTitle>
              <CardDescription>Propietario de la tienda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold">{store.user?.name || "—"}</p>
                <p className="text-sm text-muted-foreground">{store.user?.email || "—"}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-3.5 h-3.5" />
                <span>{store.user?.email || "—"}</span>
              </div>
              {store.user?.createdAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Registrado: {new Date(store.user.createdAt).toLocaleDateString("es-BO")}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}