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
  Gift,
  Package
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getPendingPayments, verifyPayment } from "@/app/actions/orders";
import { getPendingGiftCards, verifyGiftCardPayment } from "@/app/actions/gift-cards";

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

interface PendingGiftCard {
  id: string;
  amount: number;
  balance: number;
  senderName: string;
  senderEmail: string;
  recipientEmail: string | null;
  recipientName: string | null;
  createdAt: Date;
  receiptUrl: string | null;
  status: string;
}

export default function PagosPendientesPage() {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PendingPayment[]>([]);
  
  const [giftCards, setGiftCards] = useState<PendingGiftCard[]>([]);
  const [filteredGiftCards, setFilteredGiftCards] = useState<PendingGiftCard[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  async function loadData() {
    setIsLoading(true);
    const [ordersData, giftCardsData] = await Promise.all([
      getPendingPayments(),
      getPendingGiftCards()
    ]);
    
    setPayments(ordersData as PendingPayment[]);
    setGiftCards(giftCardsData as unknown as PendingGiftCard[]);
    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Filtrar Compras Directas
    let fPayments = [...payments];
    if (searchTerm) {
      fPayments = fPayments.filter(
        (p) =>
          p.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredPayments(fPayments);
    
    // Filtrar Gift Cards
    let fGiftCards = [...giftCards];
    if (searchTerm) {
      fGiftCards = fGiftCards.filter(
        (g) =>
          g.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (g.recipientName && g.recipientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          g.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredGiftCards(fGiftCards);
  }, [payments, giftCards, searchTerm]);

  async function handleOrderVerification(orderId: string, action: "approve" | "reject") {
    setProcessingId(orderId);
    const formData = new FormData();
    formData.append("action", action);
    if (action === "reject" && rejectReason) {
      formData.append("notes", rejectReason);
    }

    const result = await verifyPayment(orderId, formData);

    if (result.error) toast.error(result.error);
    else {
      toast.success(result.message);
      await loadData();
      setRejectReason("");
    }
    setProcessingId(null);
  }

  async function handleGiftCardVerification(giftCardId: string, action: "approve" | "reject") {
    setProcessingId(giftCardId);
    const result = await verifyGiftCardPayment(giftCardId, action, rejectReason);

    if (result.error) toast.error(result.error);
    else {
      toast.success(result.message);
      await loadData();
      setRejectReason("");
    }
    setProcessingId(null);
  }

  const getTotalPendingOrders = payments.reduce((sum, p) => sum + p.totalAmount, 0);
  const getTotalPendingGiftCards = giftCards.reduce((sum, g) => sum + g.amount, 0);
  const totalPendingAmount = getTotalPendingOrders + getTotalPendingGiftCards;
  const totalPendingCount = payments.length + giftCards.length;
  
  const uniqueClients = new Set([
    ...payments.map(p => p.buyerName),
    ...giftCards.map(g => g.senderName)
  ]).size;

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
                <p className="text-sm text-amber-600 font-medium">Pagos pendientes (Total)</p>
                <p className="text-3xl font-bold text-amber-600">{totalPendingCount}</p>
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
                <p className="text-3xl font-bold text-primary">Bs. {totalPendingAmount.toFixed(2)}</p>
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
                <p className="text-3xl font-bold text-green-600">{uniqueClients}</p>
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

      <Tabs defaultValue="directas" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
          <TabsTrigger value="directas" className="h-full gap-2">
            <Package className="w-4 h-4" />
            Compras Directas
            {payments.length > 0 && (
              <Badge variant="destructive" className="ml-2 rounded-full h-5 px-1.5">{payments.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="gift-cards" className="h-full gap-2">
            <Gift className="w-4 h-4" />
            Tarjetas Gift
            {giftCards.length > 0 && (
              <Badge variant="destructive" className="ml-2 rounded-full h-5 px-1.5">{giftCards.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="directas" className="space-y-4">
          {filteredPayments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">¡No hay compras directas pendientes!</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "No se encontraron resultados." : "Todos los pagos han sido procesados."}
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
                                Comprobante
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Comprobante de Pago</DialogTitle>
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
                                  <p>No se ha subido ningún comprobante.</p>
                                </div>
                              )}
                              <DialogFooter className="gap-2">
                                <Button
                                  variant="destructive"
                                  onClick={() => handleOrderVerification(payment.id, "reject")}
                                  disabled={processingId === payment.id}
                                >
                                  {processingId === payment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                                  Rechazar
                                </Button>
                                <Button
                                  onClick={() => handleOrderVerification(payment.id, "approve")}
                                  disabled={processingId === payment.id}
                                >
                                  {processingId === payment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                  Aprobar
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="gift-cards" className="space-y-4">
          {filteredGiftCards.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">¡No hay tarjetas Gift pendientes!</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "No se encontraron resultados." : "Todos los pagos han sido procesados."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredGiftCards.map((card) => (
                <Card key={card.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row justify-between gap-4">
                      {/* Información de la Tarjeta */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Gift className="w-5 h-5 text-primary" /> Tarjeta de Regalo
                          </h3>
                          <Badge variant="destructive" className="text-xs">Pendiente</Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">De:</span>
                            <strong>{card.senderName}</strong>
                          </div>
                          {card.senderEmail && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              <strong>{card.senderEmail}</strong>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Para:</span>
                            <strong>{card.recipientName || "Sin especificar"}</strong>
                          </div>
                          {card.recipientEmail && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              <strong>{card.recipientEmail}</strong>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>Comprada el {new Date(card.createdAt).toLocaleString("es-BO")}</span>
                        </div>
                      </div>

                      {/* Monto y acciones */}
                      <div className="flex flex-col items-end justify-between">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Valor de la tarjeta</p>
                          <p className="text-2xl font-bold text-primary">
                            Bs. {card.amount.toFixed(2)}
                          </p>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-2" />
                                Comprobante
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Comprobante de Pago (Gift Card)</DialogTitle>
                              </DialogHeader>
                              {card.receiptUrl ? (
                                <div className="relative w-full h-[400px] border rounded-lg overflow-hidden">
                                  <Image
                                    src={card.receiptUrl}
                                    alt="Comprobante de pago Gift Card"
                                    fill
                                    className="object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                  <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                                  <p>Esta tarjeta no tiene un comprobante subido.</p>
                                </div>
                              )}
                              <DialogFooter className="gap-2">
                                <Button
                                  variant="destructive"
                                  onClick={() => handleGiftCardVerification(card.id, "reject")}
                                  disabled={processingId === card.id}
                                >
                                  {processingId === card.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                                  Rechazar
                                </Button>
                                <Button
                                  onClick={() => handleGiftCardVerification(card.id, "approve")}
                                  disabled={processingId === card.id}
                                >
                                  {processingId === card.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                  Aprobar
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}