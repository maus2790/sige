"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  Eye, 
  CreditCard,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Package
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getPendingPayments, verifyPayment } from "@/app/actions/orders";

interface PendingPayment {
  id: string;
  productId: string;
  productName: string;
  storeName: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string | null;
  buyerCi: string | null;
  quantity: number;
  totalAmount: number;
  paymentProofUrl: string | null;
  paymentMethod: string;
  shippingAddress: string;
  createdAt: Date;
  status: string;
}

export default function PagosPendientesPage() {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PendingPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PendingPayment | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [activeTab, setActiveTab] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");

  async function loadPayments() {
    setIsLoading(true);
    const data = await getPendingPayments();
    setPayments(data as PendingPayment[]);
    setIsLoading(false);
  }

  useEffect(() => {
    loadPayments();
  }, []);

  useEffect(() => {
    let filtered = [...payments];
    
    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredPayments(filtered);
  }, [payments, searchTerm]);

  async function handleVerification(orderId: string, action: "approve" | "reject") {
    setProcessingId(orderId);
    
    const formData = new FormData();
    formData.append("action", action);
    if (action === "reject" && rejectReason) {
      formData.append("notes", rejectReason);
    }

    const result = await verifyPayment(orderId, formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.message);
      await loadPayments();
      setSelectedOrder(null);
      setRejectReason("");
    }

    setProcessingId(null);
  }

  const getTotalPending = payments.reduce((sum, p) => sum + p.totalAmount, 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
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
        <h1 className="text-3xl font-bold">Pagos Pendientes</h1>
        <p className="text-muted-foreground mt-1">
          Revisa y verifica los comprobantes de pago subidos por los compradores
        </p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Pagos pendientes</p>
                <p className="text-3xl font-bold text-amber-600">{payments.length}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary font-medium">Monto total pendiente</p>
                <p className="text-3xl font-bold text-primary">Bs. {getTotalPending.toFixed(2)}</p>
              </div>
              <CreditCard className="w-10 h-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Clientes únicos</p>
                <p className="text-3xl font-bold text-green-600">
                  {new Set(payments.map(p => p.buyerName)).size}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar por comprador, producto o ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-muted/50 focus:outline-none focus:border-primary transition-colors"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Lista de pagos pendientes */}
      {filteredPayments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">¡No hay pagos pendientes!</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "No se encontraron resultados para tu búsqueda." : "Todos los pagos han sido procesados correctamente."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPayments.map((payment) => (
            <Card key={payment.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  {/* Información del producto/comprador */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{payment.productName}</h3>
                      <Badge variant="outline" className="text-xs">
                        {payment.storeName}
                      </Badge>
                      <Badge variant="destructive" className="text-xs">
                        Pendiente
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Comprador:</span>
                        <strong>{payment.buyerName}</strong>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        <strong>{payment.buyerPhone}</strong>
                      </div>
                      {payment.buyerEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <strong>{payment.buyerEmail}</strong>
                        </div>
                      )}
                      {payment.buyerCi && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">CI/NIT:</span>
                          <strong>{payment.buyerCi}</strong>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Cantidad:</span>
                        <strong>{payment.quantity} unidades</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>Solicitado el {new Date(payment.createdAt).toLocaleString("es-BO")}</span>
                    </div>
                  </div>

                  {/* Monto y acciones */}
                  <div className="flex flex-col items-end justify-between">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total a pagar</p>
                      <p className="text-2xl font-bold text-primary">
                        Bs. {payment.totalAmount.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex gap-2 mt-4">
                      {/* Dialog para ver comprobante */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            Ver comprobante
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Comprobante de Pago</DialogTitle>
                            <DialogDescription>
                              Verifica que el comprobante coincida con los datos de la orden.
                            </DialogDescription>
                          </DialogHeader>
                          {payment.paymentProofUrl ? (
                            <div className="relative w-full h-[400px] border rounded-lg overflow-hidden">
                              <Image
                                src={payment.paymentProofUrl}
                                alt="Comprobante de pago"
                                fill
                                className="object-contain"
                              />
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                              <p>No se ha subido ningún comprobante todavía.</p>
                            </div>
                          )}
                          <DialogFooter className="gap-2">
                            <Button
                              variant="destructive"
                              onClick={() => {
                                handleVerification(payment.id, "reject");
                                setSelectedOrder(null);
                              }}
                              disabled={processingId === payment.id}
                            >
                              {processingId === payment.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <XCircle className="w-4 h-4 mr-2" />
                              )}
                              Rechazar
                            </Button>
                            <Button
                              onClick={() => {
                                handleVerification(payment.id, "approve");
                                setSelectedOrder(null);
                              }}
                              disabled={processingId === payment.id}
                            >
                              {processingId === payment.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-2" />
                              )}
                              Verificar
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {/* Dialog para verificar rápido */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" className="gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Verificar rápido
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Verificar Pago</DialogTitle>
                            <DialogDescription>
                              Confirma la verificación del pago de {payment.buyerName}.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4 space-y-4">
                            <div className="bg-muted/50 p-4 rounded-lg border border-border">
                              <p className="text-sm font-medium">Detalles de la orden</p>
                              <p className="text-sm text-muted-foreground mt-2">
                                Producto: {payment.productName}<br />
                                Monto: Bs. {payment.totalAmount.toFixed(2)}<br />
                                Comprador: {payment.buyerName}<br />
                                Cantidad: {payment.quantity} unidades
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="reason">Motivo de rechazo (opcional)</Label>
                              <Textarea
                                id="reason"
                                placeholder="Ej: El comprobante no coincide con el monto..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter className="gap-2">
                            <Button
                              variant="destructive"
                              onClick={() => handleVerification(payment.id, "reject")}
                              disabled={processingId === payment.id}
                            >
                              {processingId === payment.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <XCircle className="w-4 h-4 mr-2" />
                              )}
                              Rechazar
                            </Button>
                            <Button
                              onClick={() => handleVerification(payment.id, "approve")}
                              disabled={processingId === payment.id}
                            >
                              {processingId === payment.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-2" />
                              )}
                              Verificar
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>

                {/* Dirección de envío (si existe) */}
                {payment.shippingAddress && (
                  <div className="mt-4 pt-4 border-t flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="text-muted-foreground">Dirección de envío:</span>
                      <span className="ml-2">{payment.shippingAddress}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resumen adicional */}
      {filteredPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen de pagos pendientes</CardTitle>
            <CardDescription>Distribución de los pagos por monto</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(() => {
                const ranges = [
                  { min: 0, max: 100, label: "Menos de Bs. 100" },
                  { min: 100, max: 500, label: "Bs. 100 - Bs. 500" },
                  { min: 500, max: 1000, label: "Bs. 500 - Bs. 1000" },
                  { min: 1000, max: Infinity, label: "Más de Bs. 1000" },
                ];
                
                return ranges.map((range) => {
                  const count = filteredPayments.filter(
                    (p) => p.totalAmount >= range.min && p.totalAmount < range.max
                  ).length;
                  const percentage = (count / filteredPayments.length) * 100;
                  
                  return (
                    <div key={range.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{range.label}</span>
                        <span className="font-medium">{count} pagos ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}