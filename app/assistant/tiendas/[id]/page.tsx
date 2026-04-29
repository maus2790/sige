"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Store,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  Phone,
  MapPin,
  Mail,
  Calendar,
  Star,
  Package,
  ShoppingBag,
  Users
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getStoreById, verifyStore } from "@/app/actions/stores";
import { getProductsByStore } from "@/app/actions/products";

interface StoreDetail {
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
  productsCount: number;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
  };
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrls: string[] | null;
  views: number;
  sales: number;
}

export default function StoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.id as string;
  
  const [store, setStore] = useState<StoreDetail | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    loadData();
  }, [storeId]);

  async function loadData() {
    setIsLoading(true);
    const storeData = await getStoreById(storeId);
    setStore(storeData as StoreDetail);
    
    if (storeData) {
      const productsData = await getProductsByStore(storeData.id, 5);
      setProducts(productsData.products as Product[]);
    }
    
    setIsLoading(false);
  }

  async function handleVerify(verified: boolean) {
    setIsVerifying(true);
    const result = await verifyStore(storeId, verified);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.message);
      await loadData();
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

  if (!store) {
    return (
      <div className="text-center py-12">
        <Store className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Tienda no encontrada</h3>
        <p className="text-muted-foreground">La tienda que buscas no existe o fue eliminada.</p>
        <Link href="/assistant/tiendas">
          <Button className="mt-4">Volver a tiendas</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con botón volver */}
      <div className="flex items-center gap-4">
        <Link href="/assistant/tiendas">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{store.name}</h1>
          <p className="text-muted-foreground mt-1">
            Información detallada de la tienda y su vendedor
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Información de la tienda */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tarjeta principal de la tienda */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Información de la tienda</CardTitle>
                {store.verified ? (
                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Verificada</Badge>
                ) : (
                  <Badge variant="destructive">Pendiente de verificación</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 rounded-xl overflow-hidden bg-linear-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  {store.logoUrl ? (
                    <Image
                      src={store.logoUrl}
                      alt={store.name}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store className="w-16 h-16 text-primary/50" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold">{store.name}</h3>
                  {store.rating && store.rating > 0 && (
                    <div className="flex items-center gap-1 text-yellow-500 mt-1">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-medium">{store.rating}</span>
                      <span className="text-muted-foreground">(5 estrellas)</span>
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

              <div className="grid md:grid-cols-2 gap-4 pt-2">
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

          {/* Productos de la tienda */}
          <Card>
            <CardHeader>
              <CardTitle>Productos destacados</CardTitle>
              <CardDescription>Últimos productos publicados por esta tienda</CardDescription>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Esta tienda aún no tiene productos publicados.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                        {product.imageUrls?.[0] ? (
                          <Image
                            src={product.imageUrls[0]}
                            alt={product.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{product.name}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>Bs. {product.price.toFixed(2)}</span>
                          <span>Stock: {product.stock}</span>
                          <span>{product.views} vistas</span>
                          <span>{product.sales} ventas</span>
                        </div>
                      </div>
                      <Link href={`/dashboard/productos/${product.id}/editar`}>
                        <Button variant="ghost" size="sm">
                          Ver
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha - Información del vendedor y acciones */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vendedor</CardTitle>
              <CardDescription>Propietario de la tienda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{store.user.name}</p>
                  <p className="text-sm text-muted-foreground">{store.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>Registrado el {new Date(store.user.createdAt).toLocaleDateString("es-BO")}</span>
              </div>
              <div className="pt-2">
                <Badge variant="outline">{store.user.role === "seller" ? "Vendedor" : store.user.role}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estadísticas</CardTitle>
              <CardDescription>Métricas de la tienda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Productos publicados</span>
                <span className="font-semibold">{store.productsCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Ventas totales</span>
                <span className="font-semibold">
                  {products.reduce((acc, p) => acc + (p.sales || 0), 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Vistas totales</span>
                <span className="font-semibold">
                  {products.reduce((acc, p) => acc + (p.views || 0), 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
              <CardDescription>Gestionar el estado de la tienda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!store.verified && (
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
              )}
              
              {store.verified && (
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
                  Ver tienda en público
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}