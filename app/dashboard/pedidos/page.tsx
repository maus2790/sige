"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Loader2,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  Send,
} from "lucide-react";
import { getSellerOrders, updateOrderStatus } from "@/app/actions/orders";

interface Order {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string | null;
  buyerCi: string | null;
  quantity: number;
  unitPrice: number;
  discountApplied: number;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paymentProofUrl: string | null;
  shippingAddress: string;
  createdAt: Date;
  deliveredAt: Date | null;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any; nextStatus?: string; nextAction?: string }> = {
  pending_payment: {
    label: "Pendiente de pago",
    variant: "destructive",
    icon: Clock,
    nextStatus: "payment_verified",
    nextAction: "Esperando pago",
  },
  payment_verified: {
    label: "Pago verificado",
    variant: "default",
    icon: CheckCircle,
    nextStatus: "processing",
    nextAction: "Procesar pedido",
  },
  processing: {
    label: "Procesando",
    variant: "secondary",
    icon: Package,
    nextStatus: "shipped",
    nextAction: "Marcar como enviado",
  },
  shipped: {
    label: "Enviado",
    variant: "secondary",
    icon: Truck,
    nextStatus: "delivered",
    nextAction: "Marcar como entregado",
  },
  delivered: {
    label: "Entregado",
    variant: "default",
    icon: CheckCircle,
    nextStatus: undefined,
    nextAction: undefined,
  },
  cancelled: {
    label: "Cancelado",
    variant: "destructive",
    icon: XCircle,
    nextStatus: undefined,
    nextAction: undefined,
  },
};

export default function PedidosPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "todos");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingCode, setTrackingCode] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  async function loadOrders() {
    setIsLoading(true);
    const data = await getSellerOrders(page, 10, statusFilter);
    setOrders(data.orders as Order[]);
    setPageCount(data.pageCount);
    setIsLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter]);

  async function handleStatusUpdate(orderId: string, newStatus: string) {
    setIsUpdating(true);
    const result = await updateOrderStatus(orderId, newStatus);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Orden actualizada a ${statusConfig[newStatus]?.label || newStatus}`);
      await loadOrders();
      setSelectedOrder(null);
    }
    
    setIsUpdating(false);
  }

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || { label: status, variant: "outline", icon: Package };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getStatusCount = (status: string) => {
    return orders.filter((o) => o.status === status).length;
  };

  const tabs = [
    { value: "todos", label: "Todos", count: orders.length },
    { value: "pending_payment", label: "Pendientes", count: getStatusCount("pending_payment") },
    { value: "payment_verified", label: "Verificados", count: getStatusCount("payment_verified") },
    { value: "processing", label: "Procesando", count: getStatusCount("processing") },
    { value: "shipped", label: "Enviados", count: getStatusCount("shipped") },
    { value: "delivered", label: "Entregados", count: getStatusCount("delivered") },
    { value: "cancelled", label: "Cancelados", count: getStatusCount("cancelled") },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card className="col-span-2 md:col-span-1">
            <CardContent className="p-4 flex flex-col justify-center h-full">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 flex flex-col justify-center h-full">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex gap-4 flex-1 items-center">
                    <Skeleton className="w-16 h-16 rounded-lg shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-6 w-24 rounded-full mt-1" />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full md:w-auto">
                    <div className="space-y-2 hidden sm:block text-right">
                      <Skeleton className="h-5 w-32 ml-auto" />
                      <Skeleton className="h-4 w-24 ml-auto" />
                    </div>
                    <div className="space-y-2 p-3 sm:p-0 border sm:border-none rounded-lg w-full sm:w-auto">
                      <Skeleton className="h-4 w-12 ml-auto" />
                      <Skeleton className="h-7 w-24 ml-auto" />
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t flex gap-2 justify-end">
                  <Skeleton className="h-9 w-28" />
                  <Skeleton className="h-9 w-32" />
                </div>
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
        <h1 className="text-3xl font-bold">Pedidos</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona los pedidos de tus clientes
        </p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="col-span-2 md:col-span-1 bg-primary/10 border-primary/20">
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <p className="text-sm text-muted-foreground font-medium">Total pedidos</p>
            <p className="text-3xl font-bold text-primary">{orders.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <p className="text-sm text-muted-foreground font-medium">Pendientes</p>
            <p className="text-3xl font-bold text-amber-500">{getStatusCount("pending_payment")}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <p className="text-sm text-muted-foreground font-medium">Verificados</p>
            <p className="text-3xl font-bold text-green-500">{getStatusCount("payment_verified")}</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-500/10 border-purple-500/20">
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <p className="text-sm text-muted-foreground font-medium">Enviados</p>
            <p className="text-3xl font-bold text-purple-500">{getStatusCount("shipped")}</p>
          </CardContent>
        </Card>
        <Card className="bg-teal-500/10 border-teal-500/20">
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <p className="text-sm text-muted-foreground font-medium">Entregados</p>
            <p className="text-3xl font-bold text-teal-500">{getStatusCount("delivered")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de filtros */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="data-[state=active]:bg-primary data-[state=active]:text-white">
              {tab.label}
              <span className="ml-1 text-xs opacity-70">({tab.count})</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={statusFilter} className="mt-6">
          {orders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No hay pedidos</h3>
                <p className="text-muted-foreground">
                  {statusFilter === "todos" 
                    ? "Aún no has recibido ningún pedido." 
                    : `No hay pedidos con estado "${tabs.find(t => t.value === statusFilter)?.label || statusFilter}".`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const config = statusConfig[order.status] || { label: order.status, variant: "outline", icon: Package };
                const StatusIcon = config.icon;
                
                return (
                  <Card key={order.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        {/* Producto */}
                        <div className="flex gap-4 flex-1 items-center">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                            {order.productImage ? (
                              <Image
                                src={order.productImage}
                                alt={order.productName}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl">
                                📦
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold">{order.productName}</h3>
                            <p className="text-sm text-muted-foreground">
                              Cantidad: {order.quantity} unidad(es)
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
                                <StatusIcon className="w-3 h-3" />
                                {config.label}
                              </Badge>
                              {order.discountApplied > 0 && (
                                <Badge className="bg-yellow-400 text-black hover:bg-yellow-500 border-none font-bold">
                                  {order.discountApplied}% OFF
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Detalles Comprador y Monto */}
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center sm:text-right w-full md:w-auto">
                          <div className="text-left sm:text-right hidden sm:block">
                            <p className="text-sm font-medium">{order.buyerName}</p>
                            <p className="text-xs text-muted-foreground">{order.buyerPhone}</p>
                          </div>
                          <div className="text-left sm:text-right w-full sm:w-auto p-3 sm:p-0 bg-muted/30 sm:bg-transparent rounded-lg border sm:border-none border-border">
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="text-xl font-bold text-primary">
                            Bs. {order.totalAmount.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(order.createdAt).toLocaleDateString("es-BO")}
                          </p>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="mt-4 pt-4 border-t flex flex-wrap gap-2 justify-end">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Ver detalles
                              </Button>
                            </DialogTrigger>
                          </Dialog>

                          {config.nextStatus && config.nextAction && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" className="gap-2">
                                  <Send className="w-4 h-4" />
                                  {config.nextAction}
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Actualizar estado del pedido</DialogTitle>
                                  <DialogDescription>
                                    {order.status === "shipped" 
                                      ? "Ingresa el código de seguimiento para el cliente."
                                      : `¿Estás seguro de que deseas marcar este pedido como "${config.nextAction?.toLowerCase()}"?`}
                                  </DialogDescription>
                                </DialogHeader>
                                {order.status === "shipped" && (
                                  <div className="space-y-2">
                                    <Label htmlFor="tracking">Código de seguimiento</Label>
                                    <Input
                                      id="tracking"
                                      placeholder="Ej: SIGE-123456"
                                      value={trackingCode}
                                      onChange={(e) => setTrackingCode(e.target.value)}
                                    />
                                  </div>
                                )}
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                                    Cancelar
                                  </Button>
                                  <Button onClick={() => handleStatusUpdate(order.id, config.nextStatus!)}>
                                    Confirmar
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

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

      {/* Modal de detalles del pedido */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Pedido</DialogTitle>
            <DialogDescription>
              Información completa del pedido #{selectedOrder?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Producto */}
              <div className="flex gap-4 p-4 bg-muted/50 rounded-lg border border-border">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                  {selectedOrder.productImage ? (
                    <Image
                      src={selectedOrder.productImage}
                      alt={selectedOrder.productName}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                      📦
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedOrder.productName}</h3>
                  <p className="text-sm text-muted-foreground">
                    Cantidad: {selectedOrder.quantity} unidad(es)
                  </p>
                  <p className="text-sm font-medium mt-1">
                    Precio unitario: Bs. {(selectedOrder.unitPrice || selectedOrder.totalAmount / selectedOrder.quantity).toFixed(2)}
                  </p>
                  {selectedOrder.discountApplied > 0 && (
                    <p className="text-xs text-green-600 font-bold mt-0.5">
                      Oferta aplicada: {selectedOrder.discountApplied}% de descuento
                    </p>
                  )}
                </div>
              </div>

              {/* Estado actual */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm font-medium mb-2">Estado actual</p>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedOrder.status)}
                </div>
              </div>

              {/* Datos del comprador */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Datos del comprador
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nombre</p>
                    <p className="font-medium">{selectedOrder.buyerName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Teléfono</p>
                    <p className="font-medium flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {selectedOrder.buyerPhone}
                    </p>
                  </div>
                  {selectedOrder.buyerEmail && (
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {selectedOrder.buyerEmail}
                      </p>
                    </div>
                  )}
                  {selectedOrder.buyerCi && (
                    <div>
                      <p className="text-muted-foreground">CI / NIT</p>
                      <p className="font-medium">{selectedOrder.buyerCi}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Dirección de envío */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Dirección de envío
                </h4>
                <p className="text-sm p-3 bg-muted/50 rounded-lg border border-border">
                  {selectedOrder.shippingAddress}
                </p>
              </div>

              {/* Método de pago */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Información de pago
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Método</p>
                    <p className="font-medium capitalize">{selectedOrder.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total pagado</p>
                    <p className="font-medium text-primary">Bs. {selectedOrder.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Fechas */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Fechas importantes
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Fecha del pedido</p>
                    <p className="font-medium">
                      {new Date(selectedOrder.createdAt).toLocaleString("es-BO")}
                    </p>
                  </div>
                  {selectedOrder.deliveredAt && (
                    <div>
                      <p className="text-muted-foreground">Fecha de entrega</p>
                      <p className="font-medium">
                        {new Date(selectedOrder.deliveredAt).toLocaleString("es-BO")}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                  Cerrar
                </Button>
                {statusConfig[selectedOrder.status]?.nextStatus && (
                  <Button onClick={() => handleStatusUpdate(selectedOrder.id, statusConfig[selectedOrder.status].nextStatus!)}>
                    {statusConfig[selectedOrder.status].nextAction}
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}