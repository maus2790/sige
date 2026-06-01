"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  CreditCard,
  Eye,
  Loader2,
  Mail,
  Package,
  Phone,
  XCircle,
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
  quantity: number;
  totalAmount: number;
  paymentProofUrl: string | null;
  paymentMethod: string;
  createdAt: Date;
}

export default function PagosPendientesPage() {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PendingPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  async function loadData() {
    setIsLoading(true);
    const ordersData = await getPendingPayments();
    setPayments(ordersData as PendingPayment[]);
    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = [...payments];
    if (searchTerm) {
      filtered = filtered.filter(
        (payment) =>
          payment.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredPayments(filtered);
  }, [payments, searchTerm]);

  async function handleOrderVerification(orderId: string, action: "approve" | "reject") {
    setProcessingId(orderId);
    const formData = new FormData();
    formData.append("action", action);
    const result = await verifyPayment(orderId, formData);

    if (result.error) toast.error(result.error);
    else {
      toast.success(result.message);
      await loadData();
    }
    setProcessingId(null);
  }

  const totalPendingAmount = payments.reduce((sum, payment) => sum + payment.totalAmount, 0);
  const uniqueClients = new Set(payments.map((payment) => payment.buyerName)).size;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pagos Pendientes</h1>
        <p className="text-muted-foreground mt-1">Revisa y verifica comprobantes de compras directas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-600 font-medium">Pagos pendientes</p>
              <p className="text-3xl font-bold text-amber-600">{payments.length}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-amber-500" />
          </CardContent>
        </Card>
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-primary font-medium">Monto pendiente</p>
              <p className="text-3xl font-bold text-primary">Bs. {totalPendingAmount.toFixed(2)}</p>
            </div>
            <CreditCard className="w-10 h-10 text-primary" />
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Clientes unicos</p>
              <p className="text-3xl font-bold text-green-600">{uniqueClients}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </CardContent>
        </Card>
      </div>

      <input
        type="text"
        placeholder="Buscar por comprador, producto o ID..."
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        className="w-full h-10 px-4 rounded-lg border border-border bg-muted/50 focus:outline-none focus:border-primary transition-colors"
      />

      {filteredPayments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hay compras pendientes</h3>
            <p className="text-muted-foreground">{searchTerm ? "No se encontraron resultados." : "Todos los pagos han sido procesados."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPayments.map((payment) => (
            <Card key={payment.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    {payment.productName}
                  </CardTitle>
                  <Badge variant="outline">{payment.storeName}</Badge>
                  <Badge variant="destructive">Pendiente</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Comprador:</span> <strong>{payment.buyerName}</strong></p>
                    <p className="flex items-center gap-2"><Phone className="w-3 h-3" /> {payment.buyerPhone}</p>
                    {payment.buyerEmail && <p className="flex items-center gap-2"><Mail className="w-3 h-3" /> {payment.buyerEmail}</p>}
                    <p>Cantidad: <strong>{payment.quantity}</strong></p>
                    <p className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-3 h-3" /> {new Date(payment.createdAt).toLocaleString("es-BO")}</p>
                  </div>
                  <div className="flex flex-col items-end justify-between gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold text-primary">Bs. {payment.totalAmount.toFixed(2)}</p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm"><Eye className="w-4 h-4 mr-2" />Comprobante</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Comprobante de Pago</DialogTitle>
                        </DialogHeader>
                        {payment.paymentProofUrl ? (
                          <div className="relative w-full h-[400px] border rounded-lg overflow-hidden">
                            <Image src={payment.paymentProofUrl} alt="Comprobante de pago" fill sizes="672px" className="object-contain" />
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                            <p>No se ha subido ningun comprobante.</p>
                          </div>
                        )}
                        <DialogFooter className="gap-2">
                          <Button variant="destructive" onClick={() => handleOrderVerification(payment.id, "reject")} disabled={processingId === payment.id}>
                            {processingId === payment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                            Rechazar
                          </Button>
                          <Button onClick={() => handleOrderVerification(payment.id, "approve")} disabled={processingId === payment.id}>
                            {processingId === payment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                            Aprobar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
